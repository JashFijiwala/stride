'use client'

import { StreakCard } from './StreakCard'
import { useWellbeingStreaks } from '@/hooks/useWellbeingStreaks'

interface StreakSectionProps {
  userId: string
}

export function StreakSection({ userId }: StreakSectionProps) {
  const { streaks, loading } = useWellbeingStreaks(userId)

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card)]"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {streaks.map((s, i) => (
        <StreakCard key={s.id} streak={s} index={i} />
      ))}
    </div>
  )
}
