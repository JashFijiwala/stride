'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DailyLog, ParsedEntry, MentalState, AIParseResult } from '@/lib/types'

export interface SaveEntryInput {
  raw_text: string
  self_rating: number | null
  mood_emoji: string | null
  weight_kg: number | null
  log_date: string
}

export interface SaveEntryResult {
  log: DailyLog
  entries: ParsedEntry[]
  mental_state: MentalState | null
  micro_insight: string | null
}

export function useJournal() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveEntry = useCallback(
    async (input: SaveEntryInput): Promise<SaveEntryResult | null> => {
      setSaving(true)
      setError(null)

      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        // Step 1: Check if a log already exists for this date (upsert)
        const { data: existing } = await supabase
          .from('daily_logs')
          .select('id')
          .eq('user_id', user.id)
          .eq('log_date', input.log_date)
          .single()

        let log: DailyLog

        if (existing) {
          // Update existing log
          const { data, error: updateErr } = await supabase
            .from('daily_logs')
            .update({
              raw_text: input.raw_text,
              self_rating: input.self_rating,
              mood_emoji: input.mood_emoji,
              weight_kg: input.weight_kg,
              ai_parsed: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
            .select()
            .single()

          if (updateErr) throw updateErr
          log = data

          // Delete old parsed data (will be regenerated)
          await supabase
            .from('parsed_entries')
            .delete()
            .eq('daily_log_id', existing.id)
          await supabase
            .from('mental_states')
            .delete()
            .eq('daily_log_id', existing.id)
        } else {
          // Insert new log
          const { data, error: insertErr } = await supabase
            .from('daily_logs')
            .insert({
              user_id: user.id,
              log_date: input.log_date,
              raw_text: input.raw_text,
              self_rating: input.self_rating,
              mood_emoji: input.mood_emoji,
              weight_kg: input.weight_kg,
              ai_parsed: false,
            })
            .select()
            .single()

          if (insertErr) throw insertErr
          log = data
        }

        // Step 2: Call AI parse API
        const parseRes = await fetch('/api/parse-entry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            daily_log_id: log.id,
            raw_text: input.raw_text,
            log_date: input.log_date,
          }),
        })

        if (!parseRes.ok) {
          // Graceful degradation: return raw log without parsed data
          return { log, entries: [], mental_state: null, micro_insight: null }
        }

        const parseData = await parseRes.json()

        return {
          log: { ...log, ai_parsed: true },
          entries: parseData.entries ?? [],
          mental_state: parseData.mental_state ?? null,
          micro_insight: parseData.micro_insight ?? null,
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to save entry'
        setError(msg)
        return null
      } finally {
        setSaving(false)
      }
    },
    []
  )

  const getTodayLog = useCallback(async (logDate: string) => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('log_date', logDate)
      .single()

    return data as DailyLog | null
  }, [])

  const getParsedData = useCallback(
    async (
      daily_log_id: string
    ): Promise<{ entries: ParsedEntry[]; mental_state: MentalState | null }> => {
      const supabase = createClient()

      const [{ data: entries }, { data: ms }] = await Promise.all([
        supabase
          .from('parsed_entries')
          .select('*')
          .eq('daily_log_id', daily_log_id)
          .order('created_at', { ascending: true }),
        supabase
          .from('mental_states')
          .select('*')
          .eq('daily_log_id', daily_log_id)
          .single(),
      ])

      return {
        entries: (entries as ParsedEntry[]) ?? [],
        mental_state: ms as MentalState | null,
      }
    },
    []
  )

  return { saving, error, saveEntry, getTodayLog, getParsedData }
}
