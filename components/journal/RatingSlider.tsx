'use client'

import { motion } from 'framer-motion'

interface RatingSliderProps {
  value: number | null
  onChange: (v: number) => void
}

function getRatingColor(v: number): string {
  if (v <= 3) return '#F87171'    // red
  if (v <= 6) return '#FBBF24'    // amber
  return '#4ADE80'                 // green
}

export function RatingSlider({ value, onChange }: RatingSliderProps) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-[var(--text-secondary)]">
        How would you rate today?
      </p>
      <div className="flex items-center justify-between gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const isSelected = value === n
          const color = getRatingColor(n)
          return (
            <motion.button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              whileTap={{ scale: 0.85 }}
              className="relative flex flex-1 flex-col items-center"
            >
              <motion.div
                animate={{
                  width: isSelected ? 32 : 24,
                  height: isSelected ? 32 : 24,
                  backgroundColor: isSelected ? color : '#262626',
                  borderColor: isSelected ? color : '#3F3F46',
                  borderWidth: 2,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                style={{ borderRadius: '50%' }}
                className="flex items-center justify-center border-2"
              >
                {isSelected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-[10px] font-bold text-white"
                  >
                    {n}
                  </motion.span>
                )}
              </motion.div>
              {!isSelected && (
                <span className="mt-1 text-[9px] text-[var(--text-muted)]">{n}</span>
              )}
            </motion.button>
          )
        })}
      </div>
      {value && (
        <motion.p
          key={value}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-center text-sm font-medium"
          style={{ color: getRatingColor(value) }}
        >
          {value <= 3 ? 'Rough day' : value <= 5 ? 'Average day' : value <= 7 ? 'Good day' : 'Great day'}
        </motion.p>
      )}
    </div>
  )
}
