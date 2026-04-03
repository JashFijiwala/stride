'use client'

import { StreakCard } from './StreakCard'
import type { Habit } from '@/lib/types'

interface StreakSectionProps {
  habits: Habit[]
}

export function StreakSection({ habits }: StreakSectionProps) {
  const active = habits
    .filter((h) => (h.current_streak ?? 0) > 0)
    .slice(0, 6)

  const declining = habits.filter(
    (h) => h.habit_type === 'negative' && (h.total_occurrences ?? 0) > 3
  )

  if (habits.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
        <p className="text-sm text-[var(--text-muted)]">
          Save a few journal entries to see your habit streaks here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {active.length > 0 && (
        <>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Active Streaks
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {active.map((h, i) => (
              <StreakCard key={h.id} habit={h} index={i} />
            ))}
          </div>
        </>
      )}

      {declining.length > 0 && (
        <>
          <h3 className="mt-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Worth Watching
          </h3>
          <div className="space-y-2">
            {declining.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-xl border border-[var(--negative)]/20 bg-[var(--card)] px-4 py-3"
              >
                <span className="text-sm capitalize text-[var(--text-secondary)]">
                  📉 {h.habit_name}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {h.total_occurrences}× logged
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
