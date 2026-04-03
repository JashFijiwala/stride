'use client'

import { motion } from 'framer-motion'
import type { Habit } from '@/lib/types'

const CATEGORY_EMOJI: Record<string, string> = {
  sleep: '😴',
  nutrition: '🥗',
  exercise: '🏃',
  'personal-growth': '📖',
  work: '💻',
  entertainment: '🎬',
  'digital-wellness': '📵',
  discipline: '🧘',
  health: '💊',
  social: '👥',
  other: '✨',
}

interface StreakCardProps {
  habit: Habit
  index: number
}

export function StreakCard({ habit, index }: StreakCardProps) {
  const isPositive = habit.habit_type === 'positive'
  const isNegative = habit.habit_type === 'negative'
  const emoji = CATEGORY_EMOJI[habit.category] ?? '✨'
  const streakColor = isPositive
    ? 'text-[var(--positive)]'
    : isNegative
      ? 'text-[var(--negative)]'
      : 'text-[var(--accent)]'
  const borderColor = isPositive
    ? 'border-[var(--positive)]/20'
    : isNegative
      ? 'border-[var(--negative)]/20'
      : 'border-[var(--border)]'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-2xl border bg-[var(--card)] p-4 ${borderColor}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{emoji}</span>
          <div>
            <p className="text-sm font-medium capitalize text-[var(--text-primary)]">
              {habit.habit_name}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              longest: {habit.longest_streak} days
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl">🔥</span>
            <span className={`text-2xl font-bold ${streakColor}`}>
              {habit.current_streak}
            </span>
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">day streak</p>
        </div>
      </div>

      {habit.avg_rating_with !== null && (
        <div className="mt-3 flex items-center gap-1.5">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--card-elevated)]">
            <div
              className="h-full rounded-full bg-[var(--positive)]"
              style={{ width: `${((habit.avg_rating_with ?? 0) / 10) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-[var(--text-muted)]">
            avg {habit.avg_rating_with.toFixed(1)}/10 on days with this
          </span>
        </div>
      )}
    </motion.div>
  )
}
