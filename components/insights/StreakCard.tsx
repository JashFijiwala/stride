'use client'

import { motion } from 'framer-motion'
import type { WellbeingStreakItem } from '@/hooks/useWellbeingStreaks'

interface StreakCardProps {
  streak: WellbeingStreakItem
  index: number
}

export function StreakCard({ streak, index }: StreakCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{streak.emoji}</span>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {streak.label}
            </p>
            {streak.sublabel && (
              <p className="text-xs text-[var(--text-muted)]">{streak.sublabel}</p>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className="text-2xl font-bold text-[var(--accent)]">
            {streak.count}
          </span>
          <p className="text-[10px] text-[var(--text-muted)]">{streak.countLabel}</p>
        </div>
      </div>
    </motion.div>
  )
}
