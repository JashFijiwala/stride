'use client'

import { AnimatePresence, motion } from 'framer-motion'

export function getMoodEmojiFromRating(rating: number): string {
  if (rating <= 4.0) return '😔'
  if (rating <= 6.0) return '😐'
  if (rating <= 8.0) return '🙂'
  return '😄'
}

function getRatingColor(v: number): string {
  if (v <= 4) return '#F87171'
  if (v <= 6) return '#FBBF24'
  return '#4ADE80'
}

interface RatingSliderProps {
  value: number
  onChange: (value: number) => void
}

export function RatingSlider({ value, onChange }: RatingSliderProps) {
  const emoji = getMoodEmojiFromRating(value)
  const color = getRatingColor(value)
  const displayValue = value % 1 === 0 ? String(value) : value.toFixed(1)

  return (
    <div>
      <p className="mb-4 text-sm font-medium text-[var(--text-secondary)]">
        How are you feeling overall?
      </p>
      <div className="flex items-center gap-4">
        {/* Emoji — key is the bracket emoji, so AnimatePresence only fires on bracket change */}
        <div className="flex w-8 shrink-0 items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={emoji}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                transition: { type: 'spring', stiffness: 300, damping: 20 },
              }}
              exit={{
                scale: 0.5,
                opacity: 0,
                transition: { duration: 0.15 },
              }}
              className="select-none text-2xl"
            >
              {emoji}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Range slider */}
        <input
          type="range"
          min={1}
          max={10}
          step={0.5}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 cursor-pointer"
          style={{ accentColor: color }}
        />

        {/* Large colored number */}
        <motion.span
          animate={{ color }}
          transition={{ duration: 0.2 }}
          className="w-10 shrink-0 text-right text-2xl font-bold tabular-nums"
        >
          {displayValue}
        </motion.span>
      </div>
    </div>
  )
}
