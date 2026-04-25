'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  {
    count: 5,
    emoji: '👁️',
    label: 'Name 5 things you can SEE',
    placeholder: 'Something you can see right now...',
    hint: null,
  },
  {
    count: 4,
    emoji: '🖐️',
    label: 'Name 4 things you can TOUCH or FEEL',
    placeholder: 'Something you can feel right now...',
    hint: null,
  },
  {
    count: 3,
    emoji: '👂',
    label: 'Name 3 things you can HEAR',
    placeholder: 'A sound you can hear right now...',
    hint: null,
  },
  {
    count: 2,
    emoji: '👃',
    label: 'Name 2 things you can SMELL',
    placeholder: 'A smell around you right now...',
    hint: "(If you can't smell anything right now, think of a smell you love)",
  },
  {
    count: 1,
    emoji: '👅',
    label: 'Name 1 thing you can TASTE',
    placeholder: 'A taste in your mouth right now...',
    hint: '(Even if it\'s just plain water or nothing)',
  },
]

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '60%' : '-60%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-60%' : '60%', opacity: 0 }),
}

type AppView = 'intro' | 'steps' | 'completion'

// ─── Component ────────────────────────────────────────────────────────────────

interface GroundingClientProps {
  userId: string
}

export function GroundingClient({ userId }: GroundingClientProps) {
  const router = useRouter()
  const [view, setView] = useState<AppView>('intro')
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  // answers[stepIndex][inputIndex]
  const [answers, setAnswers] = useState<string[][]>(
    STEPS.map((s) => Array<string>(s.count).fill(''))
  )
  const [saving, setSaving] = useState(false)

  function updateAnswer(stepIndex: number, inputIndex: number, value: string) {
    setAnswers((prev) => {
      const next = prev.map((arr) => [...arr])
      next[stepIndex][inputIndex] = value
      return next
    })
  }

  function goBack() {
    if (step === 0) {
      setView('intro')
      return
    }
    setDirection(-1)
    setStep((s) => s - 1)
  }

  function goNext() {
    if (step < STEPS.length - 1) {
      setDirection(1)
      setStep((s) => s + 1)
    } else {
      handleComplete()
    }
  }

  async function handleComplete() {
    setSaving(true)
    try {
      const supabase = createClient()
      await supabase.from('coping_sessions').insert({
        user_id: userId,
        exercise_type: 'grounding_54321',
        completed: true,
        duration_seconds: null,
        notes: null,
      })
      setView('completion')
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  // ── VIEW: Intro ─────────────────────────────────────────────────────────────
  if (view === 'intro') {
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
              5-4-3-2-1 Grounding
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Bring yourself back to the present moment.
            </p>
          </div>
        </div>

        {/* About this exercise */}
        <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--card-elevated)] p-5">
          <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">What is the 5-4-3-2-1 Technique?</h2>
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">
            Grounding exercises help shift your brain&apos;s focus from anxious thoughts to your immediate
            surroundings. The 5-4-3-2-1 technique engages all five senses to interrupt the anxiety response
            and activate your prefrontal cortex — the brain&apos;s rational thinking center. Studies show it
            produces measurable reductions in anxiety symptoms and is especially effective during panic or
            overwhelm.
          </p>

          {/* How it works */}
          <p className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">How it works</p>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {(['5 See 👁', '4 Touch 🖐', '3 Hear 👂', '2 Smell 👃', '1 Taste 👅'] as const).map((step, i) => (
              <div key={step} className="flex items-center gap-1 shrink-0">
                <span className="rounded-full bg-[#4ADE80]/15 px-3 py-1 text-xs font-medium text-[#4ADE80]">
                  {step}
                </span>
                {i < 4 && <span className="text-[var(--text-muted)] text-xs">→</span>}
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="mt-4 flex flex-wrap gap-2">
            {['Stops panic', 'Present-moment focus', 'Works anywhere', 'Instant relief'].map((b) => (
              <span key={b} className="rounded-full bg-[#4ADE80]/10 px-2.5 py-0.5 text-xs text-[#4ADE80]">
                {b}
              </span>
            ))}
          </div>

          {/* Learn more */}
          <a
            href="https://www.youtube.com/watch?v=30VMIEmA114"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#818CF8] hover:underline"
          >
            <ExternalLink size={12} />
            Watch a 3-min tutorial
          </a>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            This exercise helps you reconnect with the present by engaging your senses. Take your
            time with each step.
          </p>
          <motion.button
            onClick={() => setView('steps')}
            whileTap={{ scale: 0.97 }}
            className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-[#0A0A0A]"
            style={{ backgroundColor: '#4ADE80' }}
          >
            Begin
          </motion.button>
        </div>
      </div>
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
          <p className="mb-3 text-4xl">🌱</p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            You&apos;re here. You&apos;re present.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
            That&apos;s exactly where you need to be right now.
          </p>
          <motion.button
            onClick={() => router.push('/coping')}
            whileTap={{ scale: 0.97 }}
            className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-[#0A0A0A]"
            style={{ backgroundColor: '#4ADE80' }}
          >
            Done
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // ── VIEW: Steps ─────────────────────────────────────────────────────────────
  const currentStep = STEPS[step]

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Top bar */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={goBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          aria-label="Back"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Step {step + 1} of 5</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--card-elevated)]">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: '#4ADE80' }}
              animate={{ width: `${((step + 1) / 5) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Prominent countdown number */}
      <div className="mb-2 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="text-8xl font-bold leading-none"
            style={{ color: '#4ADE8030' }}
          >
            {5 - step}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Slide content */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: 'easeInOut' }}
          >
            <p className="mb-4 text-xl font-semibold text-[var(--text-primary)]">
              {currentStep.label} {currentStep.emoji}
            </p>

            <div className="space-y-3">
              {Array.from({ length: currentStep.count }).map((_, i) => (
                <input
                  key={i}
                  type="text"
                  value={answers[step][i]}
                  onChange={(e) => updateAnswer(step, i, e.target.value)}
                  placeholder={currentStep.placeholder}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#4ADE80] focus:outline-none"
                />
              ))}
            </div>

            {currentStep.hint && (
              <p className="mt-3 text-xs text-[var(--text-muted)]">{currentStep.hint}</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.button
        onClick={goNext}
        disabled={saving}
        whileTap={{ scale: 0.97 }}
        className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-[#0A0A0A] disabled:opacity-60"
        style={{ backgroundColor: '#4ADE80' }}
      >
        {step === STEPS.length - 1 ? 'Complete' : 'Next'}
      </motion.button>
    </div>
  )
}
