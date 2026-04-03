'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WeeklyInsight, MentalState, DailyLog } from '@/lib/types'

export interface MoodPoint {
  date: string       // 'MMM d' label
  dateStr: string    // 'yyyy-MM-dd' for sorting
  mood_score: number
  self_rating: number | null
}

export interface InsightsData {
  moodPoints: MoodPoint[]
  weeklyInsight: WeeklyInsight | null
  totalDaysLogged: number
}

export function useInsights(userId: string) {
  const [data, setData] = useState<InsightsData>({
    moodPoints: [],
    weeklyInsight: null,
    totalDaysLogged: 0,
  })
  const [loading, setLoading] = useState(true)
  const [generatingWeekly, setGeneratingWeekly] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    async function load() {
      setLoading(true)
      const supabase = createClient()

      const [
        { data: logs },
        { data: mentalStates },
        { data: weeklyInsights },
        { count: totalDays },
      ] = await Promise.all([
        // Last 30 days of logs for rating trend
        supabase
          .from('daily_logs')
          .select('log_date, self_rating')
          .eq('user_id', userId)
          .order('log_date', { ascending: false })
          .limit(30),

        // Last 30 days of mental states for mood timeline
        supabase
          .from('mental_states')
          .select('daily_log_id, mood_score, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(30),

        // Most recent weekly insight
        supabase
          .from('weekly_insights')
          .select('*')
          .eq('user_id', userId)
          .order('week_start', { ascending: false })
          .limit(1),

        // Total days logged
        supabase
          .from('daily_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
      ])

      // Build a date→log map for joining
      const logMap = new Map<string, { log_date: string; self_rating: number | null }>(
        (logs ?? []).map((l) => [l.log_date, l])
      )

      // Build date→mental_state map via daily_log_id→date
      // We need log dates for the mental states — fetch them
      const logIds = (mentalStates ?? []).map((ms) => ms.daily_log_id)
      let logDateMap = new Map<string, string>()

      if (logIds.length > 0) {
        const { data: logRows } = await supabase
          .from('daily_logs')
          .select('id, log_date')
          .in('id', logIds)
        for (const row of logRows ?? []) {
          logDateMap.set(row.id, row.log_date)
        }
      }

      // Combine into MoodPoints
      const moodMap = new Map<string, MoodPoint>()

      for (const ms of mentalStates ?? []) {
        const dateStr = logDateMap.get(ms.daily_log_id)
        if (!dateStr) continue
        const log = logMap.get(dateStr)
        if (!moodMap.has(dateStr)) {
          moodMap.set(dateStr, {
            dateStr,
            date: formatShort(dateStr),
            mood_score: ms.mood_score,
            self_rating: log?.self_rating ?? null,
          })
        }
      }

      // Also include logs that have a self_rating but no mental state
      for (const [dateStr, log] of logMap.entries()) {
        if (!moodMap.has(dateStr) && log.self_rating !== null) {
          moodMap.set(dateStr, {
            dateStr,
            date: formatShort(dateStr),
            mood_score: log.self_rating, // fallback: use rating as proxy
            self_rating: log.self_rating,
          })
        }
      }

      const moodPoints = Array.from(moodMap.values()).sort((a, b) =>
        a.dateStr.localeCompare(b.dateStr)
      )

      setData({
        moodPoints,
        weeklyInsight: (weeklyInsights?.[0] as WeeklyInsight) ?? null,
        totalDaysLogged: totalDays ?? 0,
      })
      setLoading(false)
    }

    load().catch((e) => {
      setError(String(e))
      setLoading(false)
    })
  }, [userId])

  const generateWeeklyInsight = useCallback(async () => {
    setGeneratingWeekly(true)
    setError(null)
    try {
      const res = await fetch('/api/weekly-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to generate weekly insight')
      }
      const insight = await res.json() as WeeklyInsight
      setData((prev) => ({ ...prev, weeklyInsight: insight }))
    } catch (e) {
      setError(String(e))
    } finally {
      setGeneratingWeekly(false)
    }
  }, [userId])

  return { data, loading, error, generatingWeekly, generateWeeklyInsight }
}

function formatShort(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`
}
