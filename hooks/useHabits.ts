'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { filterCorrelations, type CorrelationResult } from '@/lib/utils/correlations'
import type { Habit } from '@/lib/types'

export interface HabitsData {
  habits: Habit[]
  correlations: CorrelationResult[]
}

export function useHabits(userId: string) {
  const [data, setData] = useState<HabitsData>({ habits: [], correlations: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    async function load() {
      setLoading(true)
      const supabase = createClient()

      // Fetch habits sorted by streak desc
      const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .order('current_streak', { ascending: false })
        .limit(50)

      const habitList = (habits as Habit[]) ?? []

      // Compute avg_rating_without for habits that don't have it yet
      const habitsNeedingUpdate = habitList.filter(
        (h) => h.total_occurrences >= 5 && h.avg_rating_without === null
      )

      if (habitsNeedingUpdate.length > 0) {
        // Fetch all daily logs for this user (date + rating only)
        const { data: allLogs } = await supabase
          .from('daily_logs')
          .select('log_date, self_rating')
          .eq('user_id', userId)

        const logList = allLogs ?? []

        // For each habit that needs it, compute avg_rating_without
        // We need to know which dates the habit appeared. Use parsed_entries.
        for (const habit of habitsNeedingUpdate) {
          const { data: habitEntries } = await supabase
            .from('parsed_entries')
            .select('daily_log_id')
            .eq('user_id', userId)
            .contains('tags', [habit.habit_name.toLowerCase()])

          if (!habitEntries || habitEntries.length === 0) continue

          // Get the dates for these log IDs
          const logIds = habitEntries.map((e: { daily_log_id: string }) => e.daily_log_id)
          const { data: habitLogDates } = await supabase
            .from('daily_logs')
            .select('log_date')
            .in('id', logIds)

          const habitDateSet = new Set((habitLogDates ?? []).map((r: { log_date: string }) => r.log_date))

          const daysWithout = logList.filter(
            (l) => l.self_rating !== null && !habitDateSet.has(l.log_date)
          )
          if (daysWithout.length === 0) continue

          const avg =
            daysWithout.reduce((sum, l) => sum + (l.self_rating ?? 0), 0) /
            daysWithout.length

          const rounded = Math.round(avg * 10) / 10

          // Update in DB
          await supabase
            .from('habits')
            .update({ avg_rating_without: rounded })
            .eq('id', habit.id)

          // Update local
          const idx = habitList.findIndex((h) => h.id === habit.id)
          if (idx !== -1) habitList[idx] = { ...habitList[idx], avg_rating_without: rounded }
        }
      }

      const correlations = filterCorrelations(habitList)

      setData({ habits: habitList, correlations })
      setLoading(false)
    }

    load().catch(() => setLoading(false))
  }, [userId])

  return { data, loading }
}
