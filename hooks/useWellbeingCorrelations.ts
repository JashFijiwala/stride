'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CorrelationResult } from '@/lib/utils/correlations'

export interface WellbeingCorrelation extends CorrelationResult {
  with_label: string
  without_label: string
}

export function useWellbeingCorrelations(userId: string, totalDaysLogged: number) {
  const [correlations, setCorrelations] = useState<WellbeingCorrelation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || totalDaysLogged < 14) {
      setLoading(false)
      return
    }

    async function load() {
      setLoading(true)
      const supabase = createClient()

      const [
        { data: logs },
        { data: mentalStates },
        { data: copingSessions },
      ] = await Promise.all([
        supabase
          .from('daily_logs')
          .select('id, log_date, sleep_hours, energy_level')
          .eq('user_id', userId),
        supabase
          .from('mental_states')
          .select('daily_log_id, mood_score')
          .eq('user_id', userId),
        supabase
          .from('coping_sessions')
          .select('created_at')
          .eq('user_id', userId)
          .eq('completed', true),
      ])

      // Build log_id → mood_score map
      const moodByLogId = new Map<string, number>()
      for (const ms of mentalStates ?? []) {
        moodByLogId.set(ms.daily_log_id, ms.mood_score)
      }

      // Build log_date → mood_score map
      const moodByDate = new Map<string, number>()
      for (const log of logs ?? []) {
        const mood = moodByLogId.get(log.id)
        if (mood !== undefined) {
          moodByDate.set(log.log_date, mood)
        }
      }

      const results: WellbeingCorrelation[] = []

      // ── 1. Sleep vs Mood ──────────────────────────────────────────────
      const sleepLogs = (logs ?? []).filter(
        (l) => l.sleep_hours !== null && moodByDate.has(l.log_date)
      )
      if (sleepLogs.length >= 5) {
        const with7h = sleepLogs.filter((l) => (l.sleep_hours ?? 0) >= 7)
        const under7h = sleepLogs.filter((l) => (l.sleep_hours ?? 0) < 7)
        if (with7h.length > 0 && under7h.length > 0) {
          const avgWith =
            with7h.reduce((s, l) => s + (moodByDate.get(l.log_date) ?? 0), 0) / with7h.length
          const avgWithout =
            under7h.reduce((s, l) => s + (moodByDate.get(l.log_date) ?? 0), 0) / under7h.length
          const diff = Math.round((avgWith - avgWithout) * 10) / 10
          if (Math.abs(diff) > 0.5) {
            results.push({
              habit_name: 'Sleep & your mood',
              avg_with: Math.round(avgWith * 10) / 10,
              avg_without: Math.round(avgWithout * 10) / 10,
              diff,
              occurrences: sleepLogs.length,
              with_label: '7h+ sleep',
              without_label: '<7h sleep',
            })
          }
        }
      }

      // ── 2. Energy vs Mood ─────────────────────────────────────────────
      const energyLogs = (logs ?? []).filter(
        (l) => l.energy_level !== null && moodByDate.has(l.log_date)
      )
      if (energyLogs.length >= 5) {
        const highEnergy = energyLogs.filter(
          (l) => l.energy_level === 'high' || l.energy_level === 'very_high'
        )
        const lowEnergy = energyLogs.filter(
          (l) => l.energy_level === 'low' || l.energy_level === 'very_low'
        )
        if (highEnergy.length > 0 && lowEnergy.length > 0) {
          const avgWith =
            highEnergy.reduce((s, l) => s + (moodByDate.get(l.log_date) ?? 0), 0) /
            highEnergy.length
          const avgWithout =
            lowEnergy.reduce((s, l) => s + (moodByDate.get(l.log_date) ?? 0), 0) /
            lowEnergy.length
          const diff = Math.round((avgWith - avgWithout) * 10) / 10
          if (Math.abs(diff) > 0.5) {
            results.push({
              habit_name: 'Energy & your mood',
              avg_with: Math.round(avgWith * 10) / 10,
              avg_without: Math.round(avgWithout * 10) / 10,
              diff,
              occurrences: energyLogs.length,
              with_label: 'High energy',
              without_label: 'Low energy',
            })
          }
        }
      }

      // ── 3. Coping exercises vs Mood ───────────────────────────────────
      const completed = copingSessions ?? []
      if (completed.length >= 3) {
        const copingDates = new Set(
          completed.map((s: { created_at: string }) => s.created_at.split('T')[0])
        )
        const withCoping = Array.from(moodByDate.entries()).filter(([date]) =>
          copingDates.has(date)
        )
        const withoutCoping = Array.from(moodByDate.entries()).filter(
          ([date]) => !copingDates.has(date)
        )
        if (withCoping.length > 0 && withoutCoping.length > 0) {
          const avgWith =
            withCoping.reduce((s, [, mood]) => s + mood, 0) / withCoping.length
          const avgWithout =
            withoutCoping.reduce((s, [, mood]) => s + mood, 0) / withoutCoping.length
          const diff = Math.round((avgWith - avgWithout) * 10) / 10
          if (Math.abs(diff) > 0.5) {
            results.push({
              habit_name: 'Coping exercises & your mood',
              avg_with: Math.round(avgWith * 10) / 10,
              avg_without: Math.round(avgWithout * 10) / 10,
              diff,
              occurrences: withCoping.length,
              with_label: 'with exercises',
              without_label: 'without',
            })
          }
        }
      }

      // Sort by largest absolute impact first (reusing correlations.ts convention)
      results.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))

      setCorrelations(results)
      setLoading(false)
    }

    load().catch(() => setLoading(false))
  }, [userId, totalDaysLogged])

  return { correlations, loading }
}
