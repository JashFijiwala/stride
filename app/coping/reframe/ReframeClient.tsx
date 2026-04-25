'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Loader2, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ─── Constants ────────────────────────────────────────────────────────────────

const EMOTION_OPTIONS = [
  'Anxious',
  'Sad',
  'Angry',
  'Ashamed',
  'Scared',
  'Overwhelmed',
  'Hopeless',
  'Guilty',
  'Embarrassed',
  'Lonely',
]

const STEP_TITLES = [
  'What happened?',
  'What thought came up?',
  'How did it make you feel?',
  'Is this thought completely true?',
  'A more balanced thought',
]

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '60%' : '-60%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-60%' : '60%', opacity: 0 }),
}

type AppView = 'form' | 'completion'

// ─── Component ────────────────────────────────────────────────────────────────

interface ReframeClientProps {
  userId: string
}

export function ReframeClient({ userId }: ReframeClientProps) {
  const router = useRouter()
  const [view, setView] = useState<AppView>('form')
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)

  // Step form state
  const [situation, setSituation] = useState('')
  const [thought, setThought] = useState('')
  const [emotions, setEmotions] = useState<string[]>([])
  const [evidenceFor, setEvidenceFor] = useState('')
  const [evidenceAgainst, setEvidenceAgainst] = useState('')
  const [balancedThought, setBalancedThought] = useState('')

  // AI suggestion state
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const [saving, setSaving] = useState(false)

  function toggleEmotion(emotion: string) {
    setEmotions((prev) =>
      prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion]
    )
  }

  function canAdvance(): boolean {
    if (step === 0) return situation.trim().length > 0
    if (step === 1) return thought.trim().length > 0
    if (step === 2) return emotions.length > 0
    if (step === 3) return true // evidence is optional
    if (step === 4) return balancedThought.trim().length > 0
    return true
  }

  function goBack() {
    if (step === 0) {
      router.push('/coping')
      return
    }
    setDirection(-1)
    setStep((s) => s - 1)
  }

  function goNext() {
    if (!canAdvance()) return
    if (step === 4) {
      handleSubmit()
      return
    }
    setDirection(1)
    setStep((s) => s + 1)
  }

  async function fetchAiSuggestion() {
    setAiLoading(true)
    setAiSuggestion(null)
    try {
      const res = await fetch('/api/coping/reframe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation, automatic_thought: thought, emotions }),
      })
      const data = await res.json()
      setAiSuggestion((data.reframe as string) ?? null)
    } catch (e) {
      console.error(e)
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      const supabase = createClient()
      await supabase.from('coping_sessions').insert({
        user_id: userId,
        exercise_type: 'cbt_reframe',
        completed: true,
        duration_seconds: null,
        notes: JSON.stringify({
          situation,
          thought,
          emotions,
          evidence_for: evidenceFor,
          evidence_against: evidenceAgainst,
          balanced_thought: balancedThought,
        }),
      })
      setView('completion')
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
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
          <p className="mb-3 text-4xl">💜</p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Great work</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
            Challenging negative thoughts takes courage.
          </p>
          <motion.button
            onClick={() => router.push('/coping')}
            whileTap={{ scale: 0.97 }}
            className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: '#A78BFA' }}
          >
            Done
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // ── VIEW: Form ──────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={goBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          aria-label="Back"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Reframe a Thought</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Let&apos;s look at this thought from a new angle.
          </p>
        </div>
      </div>

      {/* About this exercise */}
      <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card-elevated)] p-5">
        <h2 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">What is CBT Thought Reframing?</h2>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          Cognitive Behavioural Therapy (CBT) is one of the most researched and effective approaches for
          anxiety and depression. Thought reframing teaches you to examine negative automatic thoughts —
          not to force positivity, but to find a more balanced and accurate perspective. A 2023
          meta-analysis found it significantly improves outcomes across anxiety and depression disorders.
        </p>

        {/* How it works */}
        <p className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">How it works</p>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {(['Situation', 'Thought', 'Emotions', 'Evidence', 'Reframe'] as const).map((step, i) => (
            <div key={step} className="flex items-center gap-1 shrink-0">
              <span className="rounded-full bg-[#A78BFA]/15 px-3 py-1 text-xs font-medium text-[#A78BFA]">
                {step}
              </span>
              {i < 4 && <span className="text-[var(--text-muted)] text-xs">→</span>}
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="mt-4 flex flex-wrap gap-2">
          {['Reduces anxiety', 'Breaks negative loops', 'Evidence-based', 'Builds resilience'].map((b) => (
            <span key={b} className="rounded-full bg-[#A78BFA]/10 px-2.5 py-0.5 text-xs text-[#A78BFA]">
              {b}
            </span>
          ))}
        </div>

        {/* Learn more */}
        <a
          href="https://www.youtube.com/watch?v=58RytIerkmc"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#818CF8] hover:underline"
        >
          <ExternalLink size={12} />
          Watch a 3-min tutorial
        </a>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>Step {step + 1} of 5</span>
          <span>{Math.round(((step + 1) / 5) * 100)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--card-elevated)]">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: '#A78BFA' }}
            animate={{ width: `${((step + 1) / 5) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
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
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {STEP_TITLES[step]}
            </p>

            {/* Step 0 — Situation */}
            {step === 0 && (
              <div>
                <p className="mb-3 text-sm text-[var(--text-secondary)]">Describe the situation</p>
                <textarea
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  rows={4}
                  placeholder="e.g. I failed my quiz, my friend didn't reply, I missed the deadline..."
                  className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#A78BFA] focus:outline-none"
                />
              </div>
            )}

            {/* Step 1 — Automatic thought */}
            {step === 1 && (
              <div>
                <p className="mb-3 text-sm text-[var(--text-secondary)]">
                  What did you tell yourself?
                </p>
                <textarea
                  value={thought}
                  onChange={(e) => setThought(e.target.value)}
                  rows={4}
                  placeholder="e.g. I'm so stupid. I always mess things up. Nobody cares about me..."
                  className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#A78BFA] focus:outline-none"
                />
              </div>
            )}

            {/* Step 2 — Emotion chips */}
            {step === 2 && (
              <div>
                <p className="mb-3 text-sm text-[var(--text-secondary)]">Select all that apply</p>
                <div className="flex flex-wrap gap-2">
                  {EMOTION_OPTIONS.map((emotion) => (
                    <button
                      key={emotion}
                      onClick={() => toggleEmotion(emotion)}
                      className="rounded-full border px-3 py-1.5 text-sm transition-colors"
                      style={
                        emotions.includes(emotion)
                          ? {
                              borderColor: '#A78BFA',
                              backgroundColor: '#A78BFA18',
                              color: '#A78BFA',
                            }
                          : {
                              borderColor: 'var(--border)',
                              backgroundColor: 'var(--card-elevated)',
                              color: 'var(--text-secondary)',
                            }
                      }
                    >
                      {emotion}
                    </button>
                  ))}
                </div>
                {emotions.length === 0 && (
                  <p className="mt-3 text-xs text-[var(--text-muted)]">
                    Select at least one to continue.
                  </p>
                )}
              </div>
            )}

            {/* Step 3 — Evidence */}
            {step === 3 && (
              <div>
                <p className="mb-3 text-sm text-[var(--text-secondary)]">Look at the evidence</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1">
                    <p className="mb-1.5 text-xs font-medium text-[var(--text-muted)]">
                      Evidence that supports this thought
                    </p>
                    <textarea
                      value={evidenceFor}
                      onChange={(e) => setEvidenceFor(e.target.value)}
                      rows={4}
                      placeholder="What facts back this up?"
                      className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#A78BFA] focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="mb-1.5 text-xs font-medium text-[var(--text-muted)]">
                      Evidence against this thought
                    </p>
                    <textarea
                      value={evidenceAgainst}
                      onChange={(e) => setEvidenceAgainst(e.target.value)}
                      rows={4}
                      placeholder="What facts challenge this?"
                      className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#A78BFA] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 — Balanced thought + AI */}
            {step === 4 && (
              <div>
                <p className="mb-3 text-sm text-[var(--text-secondary)]">Can you reframe it?</p>
                <textarea
                  value={balancedThought}
                  onChange={(e) => setBalancedThought(e.target.value)}
                  rows={4}
                  placeholder="e.g. I struggled with this quiz, but one result doesn't define my ability..."
                  className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#A78BFA] focus:outline-none"
                />

                <motion.button
                  onClick={fetchAiSuggestion}
                  disabled={aiLoading}
                  whileTap={{ scale: 0.97 }}
                  className="mt-3 flex items-center gap-2 rounded-xl border border-[#A78BFA]/30 bg-[#A78BFA]/10 px-4 py-2.5 text-sm font-medium text-[#A78BFA] disabled:opacity-60"
                >
                  {aiLoading && <Loader2 size={14} className="animate-spin" />}
                  Suggest a reframe with AI ✨
                </motion.button>

                <AnimatePresence>
                  {aiSuggestion && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-3 rounded-xl border border-[#A78BFA]/20 bg-[#A78BFA]/5 px-4 py-3"
                    >
                      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                        <span className="font-medium text-[#A78BFA]">💡 Suggestion: </span>
                        {aiSuggestion}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Next / Submit */}
      <div className="mt-6">
        <motion.button
          onClick={goNext}
          disabled={!canAdvance() || saving}
          whileTap={{ scale: 0.97 }}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-40"
          style={{ backgroundColor: '#A78BFA' }}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Saving…
            </span>
          ) : step === 4 ? (
            'Submit'
          ) : (
            'Next'
          )}
        </motion.button>
      </div>
    </div>
  )
}
