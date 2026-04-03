'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

interface MonthNavigatorProps {
  date: Date
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  isCurrentMonth: boolean
}

export function MonthNavigator({
  date,
  onPrev,
  onNext,
  onToday,
  isCurrentMonth,
}: MonthNavigatorProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        {format(date, 'MMMM yyyy')}
      </h2>

      <div className="flex items-center gap-1">
        {!isCurrentMonth && (
          <button
            onClick={onToday}
            className="mr-1 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10"
          >
            Today
          </button>
        )}
        <button
          onClick={onPrev}
          aria-label="Previous month"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--card-elevated)] hover:text-[var(--text-primary)]"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={onNext}
          aria-label="Next month"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--card-elevated)] hover:text-[var(--text-primary)]"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
