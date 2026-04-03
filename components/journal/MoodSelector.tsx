'use client'

import { motion } from 'framer-motion'

const MOODS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😤', label: 'Angry' },
  { emoji: '😰', label: 'Anxious' },
  { emoji: '🔥', label: 'Motivated' },
  { emoji: '😌', label: 'Calm' },
]

interface MoodSelectorProps {
  value: string | null
  onChange: (emoji: string | null) => void
}

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-[var(--text-secondary)]">
        How are you feeling?
      </p>
      <div className="flex items-center justify-between gap-1">
        {MOODS.map(({ emoji, label }) => {
          const isSelected = value === emoji
          return (
            <motion.button
              key={emoji}
              type="button"
              onClick={() => onChange(isSelected ? null : emoji)}
              whileTap={{ scale: 0.85 }}
              animate={{ scale: isSelected ? 1.2 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-xl p-1 transition-colors ${
                isSelected
                  ? 'bg-[var(--accent)]/15'
                  : 'hover:bg-[var(--card-elevated)]'
              }`}
            >
              <span className="text-2xl leading-none">{emoji}</span>
              <span
                className={`mt-1 text-[9px] font-medium ${
                  isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                }`}
              >
                {label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
