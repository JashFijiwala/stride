'use client'

import { getCalendarDays } from '@/lib/utils/dates'
import type { DailyLog } from '@/lib/types'

interface CalendarViewProps {
  year: number
  month: number
  logs: Record<string, DailyLog>
  selectedDate: string | null
  onSelectDate: (dateStr: string) => void
  loading: boolean
}

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarView({
  year,
  month,
  logs,
  selectedDate,
  onSelectDate,
  loading,
}: CalendarViewProps) {
  const days = getCalendarDays(year, month)

  if (loading) {
    return (
      <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        {/* DOW headers */}
        <div className="mb-2 grid grid-cols-7 text-center">
          {DOW_LABELS.map((d) => (
            <span key={d} className="text-[10px] font-medium text-[var(--text-muted)]">
              {d}
            </span>
          ))}
        </div>
        {/* Skeleton cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-[var(--card-elevated)]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      {/* Day-of-week headers */}
      <div className="mb-2 grid grid-cols-7 text-center">
        {DOW_LABELS.map((d) => (
          <span key={d} className="text-[10px] font-medium text-[var(--text-muted)]">
            {d}
          </span>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map(({ dateStr, isCurrentMonth, isToday, isPadding }) => {
          const log = logs[dateStr]
          const hasEntry = Boolean(log)
          const isSelected = dateStr === selectedDate
          const isFuture = dateStr > new Date().toISOString().slice(0, 10)

          return (
            <button
              key={dateStr}
              onClick={() => !isPadding && !isFuture && hasEntry && onSelectDate(dateStr)}
              disabled={!hasEntry || isFuture}
              className={`
                relative flex h-12 flex-col items-center justify-center rounded-lg
                transition-colors
                ${isSelected ? 'bg-[var(--accent)]/15 ring-1 ring-[var(--accent)]' : ''}
                ${isToday && !isSelected ? 'bg-[var(--card-elevated)]' : ''}
                ${hasEntry && !isSelected ? 'hover:bg-[var(--card-elevated)] cursor-pointer' : ''}
                ${!hasEntry || isFuture ? 'cursor-default' : ''}
              `}
            >
              {/* Day number */}
              <span
                className={`text-xs font-medium leading-none ${
                  isToday
                    ? 'text-[var(--accent)]'
                    : isCurrentMonth
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-muted)]/40'
                }`}
              >
                {new Date(dateStr + 'T00:00:00').getDate()}
              </span>

              {/* Mood emoji indicator */}
              {hasEntry && log.mood_emoji && (
                <span className="mt-0.5 text-[9px] leading-none">{log.mood_emoji}</span>
              )}
            </button>
          )
        })}
      </div>

    </div>
  )
}
