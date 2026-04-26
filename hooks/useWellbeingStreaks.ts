'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface WellbeingStreakItem {
  id: string
  label: string
  count: number
  countLabel: string
  emoji: string
  sublabel?: string
}

function computeCheckinStreak(logDates: string[]): number {
  if (logDates.length === 0) return 0

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const dateSet = new Set(logDates)

  // Allow streak to start from today or yesterday (don't penalise for no entry yet today)
  const startStr = dateSet.has(todayStr)
    ? todayStr
    : dateSet.has(yesterdayStr)
      ? yesterdayStr
      : null

  if (!startStr) return 0

  let streak = 0
  const cursor = new Date(startStr)

  while (dateSet.has(cursor.toISOString().split('T')[0])) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export function useWellbeingStreaks(userId: string) {
  const [streaks, setStreaks] = useState<WellbeingStreakItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    async function load() {
      setLoading(true)
      const supabase = createClient()

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const [
        { data: logs },
        { count: copingCount },
        { count: screeningCount },
      ] = await Promise.all([
        supabase
          .from('daily_logs')
          .select('log_date')
          .eq('user_id', userId)
          .order('log_date', { ascending: false }),
        supabase
          .from('coping_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('completed', true)
          .gte('created_at', sevenDaysAgo.toISOString()),
        supabase
          .from('screening_results')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
      ])

      const logDates = (logs ?? []).map((l: { log_date: string }) => l.log_date)
      const checkinStreak = computeCheckinStreak(logDates)

      setStreaks([
        {
          id: 'checkin',
          label: 'Check-in streak',
          count: checkinStreak,
          countLabel: 'day streak',
          emoji: '📅',
        },
        {
          id: 'exercises',
          label: 'Exercises this week',
          count: copingCount ?? 0,
          countLabel: 'coping sessions',
          emoji: '💚',
        },
        {
          id: 'screenings',
          label: 'Screenings taken',
          count: screeningCount ?? 0,
          countLabel: 'total screenings',
          emoji: '📋',
        },
      ])
      setLoading(false)
    }

    load().catch(() => setLoading(false))
  }, [userId])

  return { streaks, loading }
}
