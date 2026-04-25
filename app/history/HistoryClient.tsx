'use client'

import { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { addMonths, subMonths, format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { monthStartStr, monthEndStr } from '@/lib/utils/dates'
import { calculateCurrentStreak } from '@/lib/utils/streaks'
import { MonthNavigator } from '@/components/history/MonthNavigator'
import { CalendarView } from '@/components/history/CalendarView'
import { DayDetail } from '@/components/history/DayDetail'
import type { DailyLog } from '@/lib/types'

interface HistoryClientProps {
  initialLogs: DailyLog[]
  allLogDates: string[]
  userId: string
}

export function HistoryClient({ initialLogs, allLogDates, userId }: HistoryClientProps) {
  const today = new Date()

  const [currentDate, setCurrentDate] = useState(today)
  const [monthLogs, setMonthLogs] = useState<Record<string, DailyLog>>(() =>
    Object.fromEntries(initialLogs.map((l) => [l.log_date, l]))
  )
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loadingMonth, setLoadingMonth] = useState(false)

  const streak = calculateCurrentStreak(allLogDates)
  const isCurrentMonth =
    currentDate.getFullYear() === today.getFullYear() &&
    currentDate.getMonth() === today.getMonth()

  const fetchMonthLogs = useCallback(
    async (date: Date) => {
      setLoadingMonth(true)
      const supabase = createClient()
      const year = date.getFullYear()
      const month = date.getMonth()

      const { data } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('log_date', monthStartStr(year, month))
        .lte('log_date', monthEndStr(year, month))

      const map: Record<string, DailyLog> = {}
      for (const log of (data as DailyLog[]) ?? []) {
        map[log.log_date] = log
      }
      setMonthLogs(map)
      setLoadingMonth(false)
    },
    [userId]
  )

  function handlePrev() {
    const prev = subMonths(currentDate, 1)
    setCurrentDate(prev)
    setSelectedDate(null)
    fetchMonthLogs(prev)
  }

  function handleNext() {
    // Don't navigate past the current month
    if (isCurrentMonth) return
    const next = addMonths(currentDate, 1)
    setCurrentDate(next)
    setSelectedDate(null)
    fetchMonthLogs(next)
  }

  function handleToday() {
    const now = new Date()
    setCurrentDate(now)
    setSelectedDate(format(now, 'yyyy-MM-dd'))
    fetchMonthLogs(now)
  }

  function handleSelectDate(dateStr: string) {
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr))
  }

  const totalEntries = allLogDates.length

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Stats row */}
      <div className="mb-5 flex items-center gap-5">
        {streak > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-base">🔥</span>
            <div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {streak}
              </span>
              <span className="ml-1 text-xs text-[var(--text-muted)]">day streak</span>
            </div>
          </div>
        )}
        {totalEntries > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-base">📓</span>
            <div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {totalEntries}
              </span>
              <span className="ml-1 text-xs text-[var(--text-muted)]">
                {totalEntries === 1 ? 'entry' : 'entries'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Month navigator */}
      <MonthNavigator
        date={currentDate}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        isCurrentMonth={isCurrentMonth}
      />

      {/* Calendar */}
      <CalendarView
        year={currentDate.getFullYear()}
        month={currentDate.getMonth()}
        logs={monthLogs}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        loading={loadingMonth}
      />

      {/* Day detail */}
      <AnimatePresence mode="wait">
        {selectedDate && monthLogs[selectedDate] && (
          <DayDetail
            key={selectedDate}
            log={monthLogs[selectedDate]}
            onClose={() => setSelectedDate(null)}
          />
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!loadingMonth && Object.keys(monthLogs).length === 0 && (
        <div className="mt-8 flex flex-col items-center gap-2 text-center">
          <span className="text-3xl">📭</span>
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            {totalEntries === 0 ? 'Nothing logged yet' : 'No entries this month'}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {totalEntries === 0
              ? 'Start journaling today — even a few lines is enough. MindLens will handle the rest.'
              : 'Navigate to a month where you have entries.'}
          </p>
        </div>
      )}
    </div>
  )
}
