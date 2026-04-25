'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ─── Constants ────────────────────────────────────────────────────────────────

type Phase = 0 | 1 | 2 | 3 // inhale | hold-big | exhale | hold-small

const PHASE_LABELS: Record<number, string> = {
  0: 'Inhale',
  1: 'Hold',
  2: 'Exhale',
  3: 'Hold',
}
// soft blue, soft indigo, soft purple, soft violet
const PHASE_COLORS: Record<number, string> = {
  0: '#93C5FD',
  1: '#818CF8',
  2: '#C4B5FD',
  3: '#A78BFA',
}

const PHASE_DURATION = 4
const CIRCLE_SMALL = 200
const CIRCLE_LARGE = 280

const DURATION_OPTIONS = [
  { label: '2 min', seconds: 120 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
]

type AppView = 'selector' | 'active' | 'stop_confirm' | 'completion'
type FeelingOption = 'better' | 'same' | 'anxious'

// ─── Component ────────────────────────────────────────────────────────────────

interface BreathingClientProps {
  userId: string
}

export function BreathingClient({ userId }: BreathingClientProps) {
  const router = useRouter()
  const [view, setView] = useState<AppView>('selector')
  const [selectedDuration, setSelectedDuration] = useState(300)
  const [totalDuration, setTotalDuration] = useState(300)
  const [phase, setPhase] = useState<Phase>(0)
  const [countdown, setCountdown] = useState(PHASE_DURATION)
  const [displayElapsed, setDisplayElapsed] = useState(0)
  const [feeling, setFeeling] = useState<FeelingOption | null>(null)
  const [saving, setSaving] = useState(false)

  const elapsedRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Tick every second when active
  useEffect(() => {
    if (view !== 'active') return

    elapsedRef.current = 0
    setPhase(0)
    setCountdown(PHASE_DURATION)
    setDisplayElapsed(0)

    intervalRef.current = setInterval(() => {
      elapsedRef.current += 1
      const e = elapsedRef.current

      if (e >= totalDuration) {
        stopInterval()
        setDisplayElapsed(e)
        setView('completion')
        return
      }

      // Derive phase and countdown from elapsed time
      const cyclePos = e % (PHASE_DURATION * 4)
      const newPhase = Math.floor(cyclePos / PHASE_DURATION) as Phase
      const newCountdown = PHASE_DURATION - (cyclePos % PHASE_DURATION)

      setDisplayElapsed(e)
      setPhase(newPhase)
      setCountdown(newCountdown)
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
        exercise_type: 'breathing',
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

  const remaining = totalDuration - displayElapsed
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  // Circle target size: LARGE during inhale(0) or hold-big(1), SMALL during exhale(2) or hold-small(3)
  const targetCircleSize = phase === 0 || phase === 1 ? CIRCLE_LARGE : CIRCLE_SMALL
  const circleColor = PHASE_COLORS[phase]

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
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Box Breathing</h1>
            <p className="text-sm text-[var(--text-muted)]">Follow the circle. Breathe with it.</p>
          </div>
        </div>

        {/* About this exercise */}
        <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--card-elevated)] p-5">
          <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">What is Box Breathing?</h2>
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">
            Box breathing (also called square breathing) is a technique used by Navy SEALs and first
            responders to stay calm under pressure. It works by slowing your breathing, which activates
            your parasympathetic nervous system — your body&apos;s natural &apos;rest and digest&apos; mode — reducing
            cortisol and heart rate within minutes.
          </p>

          {/* How it works */}
          <p className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">How it works</p>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {(['Inhale 4s', 'Hold 4s', 'Exhale 4s', 'Hold 4s'] as const).map((step, i) => (
              <div key={step} className="flex items-center gap-1 shrink-0">
                <span className="rounded-full bg-[#60A5FA]/15 px-3 py-1 text-xs font-medium text-[#60A5FA]">
                  {step}
                </span>
                {i < 3 && <span className="text-[var(--text-muted)] text-xs">→</span>}
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="mt-4 flex flex-wrap gap-2">
            {['Reduces cortisol', 'Calms panic', 'Improves focus', 'Helps with sleep'].map((b) => (
              <span key={b} className="rounded-full bg-[#60A5FA]/10 px-2.5 py-0.5 text-xs text-[#60A5FA]">
                {b}
              </span>
            ))}
          </div>

          {/* Learn more */}
          <a
            href="https://www.youtube.com/watch?v=tEmt1Znux58"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#818CF8] hover:underline"
          >
            <ExternalLink size={12} />
            Watch a 2-min tutorial
          </a>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <p className="mb-6 text-sm leading-relaxed text-[var(--text-secondary)]">
            Box breathing calms your nervous system. Inhale, hold, exhale, hold — each for 4 seconds.
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
                    ? { borderColor: '#60A5FA', backgroundColor: '#60A5FA18', color: '#60A5FA' }
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
            className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: '#60A5FA' }}
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
          {/* Top bar */}
          <div className="mb-8 flex w-full items-center justify-between">
            <p className="text-sm text-[var(--text-muted)]">
              {mins}:{secs.toString().padStart(2, '0')} remaining
            </p>
            <button
              onClick={handleStopPress}
              className="rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              Stop
            </button>
          </div>

          {/* Animated circle */}
          <div className="flex items-center justify-center" style={{ minHeight: 320 }}>
            <motion.div
              initial={{ width: CIRCLE_SMALL, height: CIRCLE_SMALL }}
              animate={{ width: targetCircleSize, height: targetCircleSize }}
              transition={{ duration: PHASE_DURATION, ease: 'easeInOut' }}
              style={{
                borderRadius: '50%',
                backgroundColor: `${circleColor}25`,
                border: `3px solid ${circleColor}`,
                display: 'flex',
                flexDirection: 'column' as const,
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={phase}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center gap-1 select-none"
                >
                  <p className="text-base font-semibold" style={{ color: circleColor }}>
                    {PHASE_LABELS[phase]}
                  </p>
                  <p className="text-4xl font-bold text-[var(--text-primary)]">{countdown}</p>
                </motion.div>
              </AnimatePresence>
            </motion.div>
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
                    className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                    style={{ backgroundColor: '#60A5FA' }}
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
          <p className="mb-3 text-4xl">🌿</p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Well done</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            You completed {Math.round(totalDuration / 60)} minutes of box breathing.
          </p>

          <div className="mt-6">
            <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">
              How do you feel now?
            </p>
            <div className="flex justify-center gap-2">
              {(
                [
                  ['better', 'Better 😌'],
                  ['same', 'Same 😐'],
                  ['anxious', 'Still anxious 😟'],
                ] as [FeelingOption, string][]
              ).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFeeling(val)}
                  className="rounded-xl border px-3 py-2 text-sm transition-colors"
                  style={
                    feeling === val
                      ? { borderColor: '#60A5FA', backgroundColor: '#60A5FA18', color: '#60A5FA' }
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
          </div>

          <motion.button
            onClick={handleDone}
            whileTap={{ scale: 0.97 }}
            disabled={saving}
            className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: '#60A5FA' }}
          >
            Done
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return null
}
