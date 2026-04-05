'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FutureHabit {
  id: string
  habit_name: string
  status: string
  total_attempts: number
  current_streak: number
  longest_streak: number
  first_detected: string | null
  last_detected: string | null
}

interface FutureHabitsSectionProps {
  userId: string
  habits: FutureHabit[]
  onHabitAdded: (habit: FutureHabit) => void
}

function progressLabel(attempts: number): string {
  if (attempts === 0) return 'Not detected yet'
  if (attempts < 7) return `${attempts} day${attempts === 1 ? '' : 's'} in`
  if (attempts < 21) return `${attempts} / 21 days`
  return 'Established habit'
}

function encouragingMessage(habit: FutureHabit): string {
  const { total_attempts, current_streak } = habit
  if (total_attempts === 0) return "Log it and Stride will track it automatically"
  if (current_streak >= 7) return `${current_streak}-day streak — you're on a roll`
  if (total_attempts >= 21) return "This is now part of who you are"
  if (total_attempts >= 14) return "Almost there — just a bit more consistency"
  if (total_attempts >= 7) return "Great progress — keep the momentum going"
  return "Every mention counts — keep it up"
}

export function FutureHabitsSection({ userId, habits, onHabitAdded }: FutureHabitsSectionProps) {
  const [inputValue, setInputValue] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showInput, setShowInput] = useState(false)

  async function handleAdd() {
    const trimmed = inputValue.trim()
    if (trimmed.length < 2) return

    setAdding(true)
    setError(null)

    try {
      const res = await fetch('/api/future-habits/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habit_name: trimmed, user_id: userId }),
      })

      if (res.status === 409) {
        setError('You already have this habit')
        return
      }

      if (!res.ok) throw new Error('Failed to add')

      const { habit } = await res.json()
      onHabitAdded(habit)
      setInputValue('')
      setShowInput(false)
    } catch {
      setError('Something went wrong — try again')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Habit list */}
      {habits.length > 0 && (
        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {habits.map((habit, i) => {
              const progress = Math.min((habit.total_attempts / 21) * 100, 100)
              const isEstablished = habit.status === 'established' || habit.total_attempts >= 21
              return (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium capitalize text-[var(--text-primary)]">
                      {habit.habit_name}
                    </p>
                    {isEstablished && (
                      <span className="inline-flex items-center rounded-full bg-[var(--positive)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--positive)]">
                        Established
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {encouragingMessage(habit)}
                  </p>

                  {/* Progress bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {progressLabel(habit.total_attempts)}
                      </span>
                      {habit.current_streak > 0 && (
                        <span className="text-[10px] text-[var(--text-muted)]">
                          🔥 {habit.current_streak} streak
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--card-elevated)]">
                      <motion.div
                        className="h-full rounded-full bg-[var(--accent)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 + 0.1 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      {habits.length === 0 && !showInput && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-center">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            What habit are you trying to build?
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Add a habit and Stride will detect it automatically in your journal entries — no tagging needed.
          </p>
        </div>
      )}

      {/* Add habit input */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
          >
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd()
                if (e.key === 'Escape') setShowInput(false)
              }}
              placeholder="e.g. meditate, read before bed, cold shower"
              maxLength={80}
              className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
            />
            {error && (
              <p className="mt-1.5 text-xs text-[var(--negative)]">{error}</p>
            )}
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => { setShowInput(false); setInputValue(''); setError(null) }}
                className="rounded-xl px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={inputValue.trim().length < 2 || adding}
                className="rounded-xl bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
              >
                {adding ? 'Adding…' : 'Add habit'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add button */}
      {!showInput && (
        <button
          onClick={() => setShowInput(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[var(--border)] py-2.5 text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          <span className="text-sm">+</span>
          Track a new habit
        </button>
      )}
    </div>
  )
}
