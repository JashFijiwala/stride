'use client'

import { motion } from 'framer-motion'

interface PatternCardProps {
  pattern: {
    title: string
    description: string
    suggestion: string | null
    confidence: 'medium' | 'high'
    is_positive: boolean
  }
  index?: number
}

export function PatternCard({ pattern, index = 0 }: PatternCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
    >
      {/* Badge */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            pattern.is_positive
              ? 'bg-[var(--positive)]/15 text-[var(--positive)]'
              : 'bg-amber-500/15 text-amber-400'
          }`}
        >
          {pattern.is_positive ? 'Pattern ✓' : 'Pattern'}
        </span>
        {pattern.confidence === 'high' && (
          <span className="text-[10px] text-[var(--text-muted)]">Strong pattern</span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-semibold leading-snug text-[var(--text-primary)]">
        {pattern.title}
      </p>

      {/* Description */}
      <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]">
        {pattern.description}
      </p>

      {/* Suggestion */}
      {pattern.suggestion && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--card-elevated)] px-3 py-2.5">
          <span className="mt-0.5 shrink-0 text-xs">💡</span>
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            {pattern.suggestion}
          </p>
        </div>
      )}
    </motion.div>
  )
}
