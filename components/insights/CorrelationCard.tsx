'use client'

import { motion } from 'framer-motion'
import type { CorrelationResult } from '@/lib/utils/correlations'

const NAME_EMOJI: Record<string, string> = {
  'Sleep & your mood': '😴',
  'Energy & your mood': '⚡',
  'Coping exercises & your mood': '💚',
}

interface CorrelationCardProps {
  correlation: CorrelationResult & {
    with_label?: string
    without_label?: string
  }
  index: number
}

export function CorrelationCard({ correlation, index }: CorrelationCardProps) {
  const isPositive = correlation.diff > 0
  const diffLabel = `${isPositive ? '+' : ''}${correlation.diff.toFixed(1)}`
  const diffColor = isPositive ? 'text-[var(--positive)]' : 'text-[var(--negative)]'
  const emoji = NAME_EMOJI[correlation.habit_name] ?? '✨'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium capitalize text-[var(--text-primary)]">
            {correlation.habit_name}
          </p>
          <div className="mt-2 flex items-center gap-4 text-xs">
            <div className="text-center">
              <p className="font-semibold text-[var(--positive)]">
                {correlation.avg_with.toFixed(1)}
              </p>
              <p className="text-[var(--text-muted)]">
                {correlation.with_label ?? 'with'}
              </p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-[var(--negative)]">
                {correlation.avg_without.toFixed(1)}
              </p>
              <p className="text-[var(--text-muted)]">
                {correlation.without_label ?? 'without'}
              </p>
            </div>
            <div className="text-center">
              <p className={`font-bold text-sm ${diffColor}`}>{diffLabel}</p>
              <p className="text-[var(--text-muted)]">impact</p>
            </div>
          </div>
        </div>
        <span className="text-2xl">{emoji}</span>
      </div>
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        Based on {correlation.occurrences} logged days
      </p>
    </motion.div>
  )
}
