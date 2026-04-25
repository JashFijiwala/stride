'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface DailyMicroInsightProps {
  insight: string
}

export function DailyMicroInsight({ insight }: DailyMicroInsightProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/8 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/20">
          <Sparkles size={14} className="text-[var(--accent)]" />
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-[var(--accent)]">
            Your Wellbeing Insight
          </p>
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">
            {insight}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
