'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'

const FOCUS_AREAS = [
  { label: 'Better health & fitness', value: 'health' },
  { label: 'Productivity & deep work', value: 'productivity' },
  { label: 'Better sleep & recovery', value: 'sleep' },
  { label: 'Mental wellbeing', value: 'mental_health' },
  { label: 'Financial discipline', value: 'finance' },
  { label: 'Learning & growth', value: 'learning' },
]

interface GoalsSetupProps {
  userId: string
  onComplete: () => void
}

export function GoalsSetup({ userId, onComplete }: GoalsSetupProps) {
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [positiveHabits, setPositiveHabits] = useState(['', '', ''])
  const [negativeHabits, setNegativeHabits] = useState(['', ''])
  const [saving, setSaving] = useState(false)

  function toggleFocusArea(value: string) {
    setFocusAreas((prev) => {
      if (prev.includes(value)) return prev.filter((v) => v !== value)
      if (prev.length >= 3) return [...prev.slice(1), value]
      return [...prev, value]
    })
  }

  function setPositiveHabit(index: number, value: string) {
    setPositiveHabits((prev) => prev.map((h, i) => (i === index ? value : h)))
  }

  function setNegativeHabit(index: number, value: string) {
    setNegativeHabits((prev) => prev.map((h, i) => (i === index ? value : h)))
  }

  function handleSkip() {
    localStorage.setItem('stride_goals_set', 'skipped')
    onComplete()
  }

  async function handleSave() {
    const filteredPositive = positiveHabits.map((h) => h.trim()).filter(Boolean)
    const filteredNegative = negativeHabits.map((h) => h.trim()).filter(Boolean)

    // Nothing filled in — treat as skip
    if (focusAreas.length === 0 && filteredPositive.length === 0 && filteredNegative.length === 0) {
      handleSkip()
      return
    }

    setSaving(true)
    try {
      await fetch('/api/goals/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          focus_areas: focusAreas,
          positive_habits: filteredPositive,
          negative_habits: filteredNegative,
        }),
      })
      localStorage.setItem('stride_goals_set', 'true')
      onComplete()
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-[var(--background)]"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
        className="mx-auto max-w-sm px-6 py-10"
      >
        {/* Header */}
        <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)]/15">
          <span className="text-3xl">🎯</span>
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-[var(--text-primary)]">
          What are you working toward?
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Stride uses this to give you more relevant insights. You can change it anytime in Settings.
        </p>

        {/* Q1 — Focus areas */}
        <div className="mt-8">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Pick up to 3 focus areas
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {FOCUS_AREAS.map((area) => {
              const isSelected = focusAreas.includes(area.value)
              return (
                <motion.button
                  key={area.value}
                  type="button"
                  onClick={() => toggleFocusArea(area.value)}
                  animate={{
                    backgroundColor: isSelected ? '#818CF8' : 'transparent',
                    borderColor: isSelected ? '#818CF8' : 'var(--border)',
                    scale: isSelected ? 1.04 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="rounded-full border px-3.5 py-1.5 text-sm font-medium"
                  style={{ color: isSelected ? '#ffffff' : 'var(--text-muted)' }}
                >
                  {area.label}
                </motion.button>
              )
            })}
          </div>
          <AnimatePresence>
            {focusAreas.length === 3 && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2 text-xs text-[var(--text-muted)]"
              >
                Max 3 selected — tapping another will replace the oldest.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Q2 — Positive habits */}
        <div className="mt-8">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Habits you want to build or maintain
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            e.g. work on my project, read daily
          </p>
          <div className="mt-3 space-y-2.5">
            {[
              'e.g. work on my project',
              'e.g. read every day',
              'e.g. exercise',
            ].map((placeholder, i) => (
              <input
                key={i}
                type="text"
                value={positiveHabits[i]}
                onChange={(e) => setPositiveHabit(i, e.target.value)}
                placeholder={placeholder}
                maxLength={80}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)]/60"
              />
            ))}
          </div>
        </div>

        {/* Q3 — Negative habits */}
        <div className="mt-8">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Habits you want to reduce or quit
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            e.g. snacking, late night screen time
          </p>
          <div className="mt-3 space-y-2.5">
            {[
              'e.g. snacking',
              'e.g. late night screen time',
            ].map((placeholder, i) => (
              <input
                key={i}
                type="text"
                value={negativeHabits[i]}
                onChange={(e) => setNegativeHabit(i, e.target.value)}
                placeholder={placeholder}
                maxLength={80}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)]/60"
              />
            ))}
          </div>
        </div>

        {/* Buttons */}
        <motion.button
          onClick={handleSave}
          disabled={saving}
          whileTap={{ scale: 0.97 }}
          className="mt-10 w-full rounded-2xl bg-[var(--accent)] py-4 text-base font-semibold text-white transition-opacity disabled:opacity-60"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Saving…
            </span>
          ) : (
            'Save & Continue'
          )}
        </motion.button>

        <button
          onClick={handleSkip}
          className="mt-3 w-full py-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
        >
          Skip for now
        </button>
      </motion.div>
    </motion.div>
  )
}
