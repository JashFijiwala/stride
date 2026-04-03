'use client'

import { motion } from 'framer-motion'
import { Footprints } from 'lucide-react'
import type { WeeklyInsight } from '@/lib/types'

interface SuggestionCardProps {
  insight: WeeklyInsight | null
  totalDaysLogged: number
}

export function SuggestionCard({ insight, totalDaysLogged }: SuggestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[var(--accent)]/40 bg-[var(--accent)]/6 p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)]/20">
          <Footprints size={14} className="text-[var(--accent)]" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
          This week&apos;s stride
        </p>
      </div>

      {insight?.suggestion ? (
        <>
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">
            {insight.suggestion}
          </p>
          {insight.summary && (
            <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
              {insight.summary}
            </p>
          )}
        </>
      ) : (
        <div>
          <p className="text-sm text-[var(--text-secondary)]">
            {totalDaysLogged < 7
              ? `Log ${7 - totalDaysLogged} more ${7 - totalDaysLogged === 1 ? 'day' : 'days'} to unlock your first bit-by-bit suggestion.`
              : 'Generate your weekly report to get a personalised suggestion.'}
          </p>
          {totalDaysLogged < 7 && (
            <>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--accent)]/20">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${(totalDaysLogged / 7) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-right text-[10px] text-[var(--accent)]/70">
                {totalDaysLogged}/7 days
              </p>
            </>
          )}
        </div>
      )}
    </motion.div>
  )
}
