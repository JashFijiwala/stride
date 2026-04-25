'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ─── Constants ────────────────────────────────────────────────────────────────

const INSTRUCTIONS = [
  'Focus on your breath',
  'Notice each inhale and exhale',
  'If your mind wanders, gently return to your breath',
  'You are here. You are present.',
  'There is nowhere else you need to be right now.',
]

const DURATION_OPTIONS = [
  { label: '3 min', seconds: 180 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
]

type AppView = 'selector' | 'active' | 'stop_confirm' | 'completion'

// SVG ring dimensions
const RADIUS = 90
const CIRCUMFERENCE = 2 * Math.PI * RADIUS // ≈ 565.49

// ─── Component ────────────────────────────────────────────────────────────────

interface MindfulnessClientProps {
  userId: string
}

export function MindfulnessClient({ userId }: MindfulnessClientProps) {
  const router = useRouter()
  const [view, setView] = useState<AppView>('selector')
  const [selectedDuration, setSelectedDuration] = useState(300)
  const [totalDuration, setTotalDuration] = useState(300)
  const [elapsed, setElapsed] = useState(0)
  const [textIndex, setTextIndex] = useState(0)
  const [saving, setSaving] = useState(false)

  const elapsedRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (view !== 'active') return

    elapsedRef.current = 0
    setElapsed(0)
    setTextIndex(0)

    intervalRef.current = setInterval(() => {
      elapsedRef.current += 1
      const e = elapsedRef.current
      setElapsed(e)

      // Rotate instruction every 30 seconds
      if (e % 30 === 0) {
        setTextIndex((i) => (i + 1) % INSTRUCTIONS.length)
      }

      if (e >= totalDuration) {
        stopInterval()
        setView('completion')
      }
    }, 1000)

    return () => stopInterval()
  }, [view, totalDuration, stopInterval])

  function handleBegin() {
    setTotalDuration(selectedDuration)
    setView('active')
  }

  function handleStopPress() {
    stopInterval()
    setView('stop_confirm')
  }

  async function saveSession(completed: boolean, durationSeconds: number) {
    setSaving(true)
    try {
      const supabase = createClient()
      await supabase.from('coping_sessions').insert({
        user_id: userId,
        exercise_type: 'mindfulness',
        completed,
        duration_seconds: durationSeconds,
        notes: null,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  async function handleMarkComplete(complete: boolean) {
    await saveSession(complete, elapsedRef.current)
    router.push('/coping')
  }

  async function handleDone() {
    await saveSession(true, totalDuration)
    router.push('/coping')
  }

  const remaining = totalDuration - elapsed
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  // Ring depletes clockwise: dashOffset grows from 0 → CIRCUMFERENCE
  const dashOffset = CIRCUMFERENCE * (elapsed / Math.max(totalDuration, 1))

  // ── VIEW: Selector ──────────────────────────────────────────────────────────
  if (view === 'selector') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.push('/coping')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Mindfulness Moment
            </h1>
            <p className="text-sm text-[var(--text-muted)]">Sit comfortably. Focus on your breath.</p>
          </div>
        </div>

        {/* About this exercise */}
        <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--card-elevated)] p-5">
          <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">What is Mindfulness Meditation?</h2>
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">
            Mindfulness means paying attention to the present moment without judgment. Even 3–5 minutes
            of daily mindfulness has been shown to reduce stress hormones, improve emotional regulation,
            and decrease symptoms of anxiety and depression. You don&apos;t need to empty your mind — just
            notice your breath and gently return to it whenever your mind wanders.
          </p>

          {/* How it works */}
          <p className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">How it works</p>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {(['Sit comfortably', 'Focus on breath', 'Notice & return'] as const).map((step, i) => (
              <div key={step} className="flex items-center gap-1 shrink-0">
                <span className="rounded-full bg-[#FCD34D]/15 px-3 py-1 text-xs font-medium text-[#CA8A04]">
                  {step}
                </span>
                {i < 2 && <span className="text-[var(--text-muted)] text-xs">→</span>}
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="mt-4 flex flex-wrap gap-2">
            {['Lowers stress', 'Emotional regulation', 'Better sleep', 'Just 3 mins a day'].map((b) => (
              <span key={b} className="rounded-full bg-[#FCD34D]/10 px-2.5 py-0.5 text-xs text-[#CA8A04]">
                {b}
              </span>
            ))}
          </div>

          {/* Learn more */}
          <a
            href="https://www.youtube.com/watch?v=inpok4MKVLM"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#818CF8] hover:underline"
          >
            <ExternalLink size={12} />
            Watch a 5-min guided session
          </a>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <p className="mb-6 text-sm leading-relaxed text-[var(--text-secondary)]">
            Find a comfortable position, close your eyes if you like, and simply focus on your
            breathing.
          </p>
          <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">Select duration</p>
          <div className="flex gap-3">
            {DURATION_OPTIONS.map(({ label, seconds }) => (
              <button
                key={seconds}
                onClick={() => setSelectedDuration(seconds)}
                className="flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors"
                style={
                  selectedDuration === seconds
                    ? { borderColor: '#FCD34D', backgroundColor: '#FCD34D18', color: '#CA8A04' }
                    : {
                        borderColor: 'var(--border)',
                        backgroundColor: 'var(--card-elevated)',
                        color: 'var(--text-secondary)',
                      }
                }
              >
                {label}
              </button>
            ))}
          </div>
          <motion.button
            onClick={handleBegin}
            whileTap={{ scale: 0.97 }}
            className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-[#0A0A0A]"
            style={{ backgroundColor: '#FCD34D' }}
          >
            Begin
          </motion.button>
        </div>
      </div>
    )
  }

  // ── VIEW: Active (+ stop confirm modal) ────────────────────────────────────
  if (view === 'active' || view === 'stop_confirm') {
    return (
      <>
        <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-6">
          {/* Stop button */}
          <div className="mb-8 flex w-full justify-end">
            <button
              onClick={handleStopPress}
              className="rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              Stop
            </button>
          </div>

          {/* SVG ring + time display */}
          <div className="relative mb-6 flex items-center justify-center">
            <svg width="220" height="220" viewBox="0 0 220 220" aria-hidden="true">
              {/* Background track */}
              <circle
                cx="110"
                cy="110"
                r={RADIUS}
                fill="none"
                stroke="var(--border)"
                strokeWidth="5"
              />
              {/* Progress ring — depletes clockwise */}
              <circle
                cx="110"
                cy="110"
                r={RADIUS}
                fill="none"
                stroke="#FCD34D"
                strokeWidth="5"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform="rotate(-90 110 110)"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            {/* Time in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-3xl font-bold tabular-nums text-[var(--text-primary)]">
                {mins}:{secs.toString().padStart(2, '0')}
              </p>
            </div>
          </div>

          {/* Pulsing dot */}
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="mb-8 h-3 w-3 rounded-full"
            style={{ backgroundColor: '#FCD34D' }}
          />

          {/* Rotating instruction text */}
          <div className="min-h-[40px] w-full max-w-xs text-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={textIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="text-sm text-[var(--text-muted)]"
              >
                {INSTRUCTIONS[textIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Stop confirm modal */}
        <AnimatePresence>
          {view === 'stop_confirm' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6"
              >
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  Mark as complete?
                </h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  You stopped after {Math.floor(elapsedRef.current / 60)}m{' '}
                  {elapsedRef.current % 60}s.
                </p>
                <div className="mt-5 flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleMarkComplete(false)}
                    disabled={saving}
                    className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] py-2.5 text-sm font-medium text-[var(--text-secondary)] disabled:opacity-40"
                  >
                    No, incomplete
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleMarkComplete(true)}
                    disabled={saving}
                    className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-[#0A0A0A] disabled:opacity-40"
                    style={{ backgroundColor: '#FCD34D' }}
                  >
                    Yes, complete
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  // ── VIEW: Completion ────────────────────────────────────────────────────────
  if (view === 'completion') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center"
        >
          <p className="mb-3 text-4xl">✨</p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Session complete</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            You took {Math.round(totalDuration / 60)} minutes for yourself today.
          </p>
          <motion.button
            onClick={handleDone}
            whileTap={{ scale: 0.97 }}
            disabled={saving}
            className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-[#0A0A0A] disabled:opacity-60"
            style={{ backgroundColor: '#FCD34D' }}
          >
            Done
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return null
}
