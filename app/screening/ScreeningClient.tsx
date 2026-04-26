'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/lib/store/useStore'
import type { ScreeningResult } from '@/lib/types'

// ─── Data ────────────────────────────────────────────────────────────────────

const PHQ9_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
  'Trouble concentrating on things, such as reading the newspaper or watching television',
  'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
  'Thoughts that you would be better off dead, or of hurting yourself in some way',
]

const GAD7_QUESTIONS = [
  'Feeling nervous, anxious, or on edge',
  'Not being able to stop or control worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  'Being so restless that it is hard to sit still',
  'Becoming easily annoyed or irritable',
  'Feeling afraid as if something awful might happen',
]

const ANSWER_OPTIONS = [
  { label: 'Not at all', value: 0 },
  { label: 'A few days', value: 1 },
  { label: 'More days than not', value: 2 },
  { label: 'Almost every day', value: 3 },
]

// ─── Scoring helpers ──────────────────────────────────────────────────────────

type Severity = 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe'

interface SeverityInfo {
  label: string
  color: string
  description: string
}

function getPHQ9Severity(score: number): SeverityInfo {
  if (score <= 4)
    return {
      label: 'Minimal',
      color: '#4ADE80',
      description:
        'Your responses suggest minimal symptoms. Keep maintaining your wellbeing habits!',
    }
  if (score <= 9)
    return {
      label: 'Mild',
      color: '#FCD34D',
      description:
        'Your responses suggest mild symptoms. Consider exploring some coping exercises.',
    }
  if (score <= 14)
    return {
      label: 'Moderate',
      color: '#FB923C',
      description:
        'Your responses suggest moderate symptoms. We recommend speaking with a counselor.',
    }
  if (score <= 19)
    return {
      label: 'Moderately Severe',
      color: '#F87171',
      description:
        'Your responses suggest significant symptoms. Please consider reaching out to a mental health professional.',
    }
  return {
    label: 'Severe',
    color: '#F87171',
    description:
      'Your responses suggest significant symptoms. Please consider reaching out to a mental health professional.',
  }
}

function getGAD7Severity(score: number): SeverityInfo {
  if (score <= 4)
    return {
      label: 'Minimal',
      color: '#4ADE80',
      description:
        'Your responses suggest minimal symptoms. Keep maintaining your wellbeing habits!',
    }
  if (score <= 9)
    return {
      label: 'Mild',
      color: '#FCD34D',
      description:
        'Your responses suggest mild symptoms. Consider exploring some coping exercises.',
    }
  if (score <= 14)
    return {
      label: 'Moderate',
      color: '#FB923C',
      description:
        'Your responses suggest moderate symptoms. We recommend speaking with a counselor.',
    }
  return {
    label: 'Severe',
    color: '#F87171',
    description:
      'Your responses suggest significant symptoms. Please consider reaching out to a mental health professional.',
  }
}

function getSeverityKey(label: string): Severity {
  const map: Record<string, Severity> = {
    Minimal: 'minimal',
    Mild: 'mild',
    Moderate: 'moderate',
    'Moderately Severe': 'moderately_severe',
    Severe: 'severe',
  }
  return map[label] ?? 'minimal'
}

function needsSupport(severityLabel: string): boolean {
  return ['Moderate', 'Moderately Severe', 'Severe'].includes(severityLabel)
}

// ─── Slide variants ───────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '60%' : '-60%',
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? '-60%' : '60%',
    opacity: 0,
  }),
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeverityBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-block rounded-full px-3 py-1 text-sm font-semibold"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {label}
    </span>
  )
}

function Helplines() {
  return (
    <div className="space-y-2">
      <a
        href="tel:14416"
        className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-4 py-3 text-sm transition-colors hover:border-[#818CF8]/40"
      >
        <span className="text-base">📞</span>
        <div>
          <p className="font-medium text-[var(--text-primary)]">Tele-MANAS: 14416</p>
          <p className="text-xs text-[var(--text-muted)]">Government helpline · 24/7 · Free</p>
        </div>
      </a>
      <a
        href="tel:9152987821"
        className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-4 py-3 text-sm transition-colors hover:border-[#818CF8]/40"
      >
        <span className="text-base">📞</span>
        <div>
          <p className="font-medium text-[var(--text-primary)]">iCall: 9152987821</p>
          <p className="text-xs text-[var(--text-muted)]">Psychologists & counselors</p>
        </div>
      </a>
      <a
        href="tel:18602662345"
        className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-4 py-3 text-sm transition-colors hover:border-[#818CF8]/40"
      >
        <span className="text-base">📞</span>
        <div>
          <p className="font-medium text-[var(--text-primary)]">Vandrevala Foundation: 1860-2662-345</p>
          <p className="text-xs text-[var(--text-muted)]">24/7 helpline</p>
        </div>
      </a>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type View = 'selector' | 'questionnaire' | 'results'

interface ScreeningClientProps {
  userId: string
}

export function ScreeningClient({ userId }: ScreeningClientProps) {
  const router = useRouter()
  const { showCrisis } = useStore()

  // View state
  const [view, setView] = useState<View>('selector')
  const [activeTest, setActiveTest] = useState<'phq9' | 'gad7' | null>(null)

  // Questionnaire state
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [direction, setDirection] = useState(1)
  const [selectedValue, setSelectedValue] = useState<number | null>(null)
  const [showCrisisModal, setShowCrisisModal] = useState(false)
  // Stores the answer that triggered the crisis modal so we can advance after dismiss
  const pendingAnswerRef = useRef<number | null>(null)

  // Results state
  const [resultsSaved, setResultsSaved] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [breakdownOpen, setBreakdownOpen] = useState(false)

  // History state
  const [history, setHistory] = useState<ScreeningResult[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const questions = activeTest === 'phq9' ? PHQ9_QUESTIONS : GAD7_QUESTIONS
  const maxScore = activeTest === 'phq9' ? 27 : 21

  // ── Fetch history on mount ──────────────────────────────────────────────────
  useEffect(() => {
    async function fetchHistory() {
      const supabase = createClient()
      const { data } = await supabase
        .from('screening_results')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)
      setHistory((data as ScreeningResult[]) ?? [])
      setHistoryLoading(false)
    }
    fetchHistory().catch(console.error)
  }, [userId])

  // ── Save results (once) ─────────────────────────────────────────────────────
  useEffect(() => {
    if (view !== 'results' || resultsSaved || !activeTest) return

    const total = Object.values(answers).reduce((a, b) => a + b, 0)
    const severityInfo =
      activeTest === 'phq9' ? getPHQ9Severity(total) : getGAD7Severity(total)
    const severityKey = getSeverityKey(severityInfo.label)

    const phq9Flagged =
      activeTest === 'phq9' && ((answers[8] ?? 0) > 0 || total >= 20)
    const gad7Flagged = activeTest === 'gad7' && total >= 15
    const flagged = phq9Flagged || gad7Flagged

    // Build question_scores: { q1: n, q2: n, ... }
    const question_scores: Record<string, number> = {}
    questions.forEach((_, i) => {
      question_scores[`q${i + 1}`] = answers[i] ?? 0
    })

    async function save() {
      const supabase = createClient()
      await supabase.from('screening_results').insert({
        user_id: userId,
        test_type: activeTest,
        question_scores,
        total_score: total,
        severity: severityKey,
        flagged,
      })
      setResultsSaved(true)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
      if (flagged) showCrisis()
    }

    save().catch(console.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  // ── Start a test ────────────────────────────────────────────────────────────
  function startTest(test: 'phq9' | 'gad7') {
    setActiveTest(test)
    setCurrentQ(0)
    setAnswers({})
    setDirection(1)
    setSelectedValue(null)
    setResultsSaved(false)
    setShowCrisisModal(false)
    pendingAnswerRef.current = null
    setView('questionnaire')
  }

  // ── Navigate back ───────────────────────────────────────────────────────────
  function goBack() {
    if (currentQ === 0) {
      setView('selector')
      return
    }
    setDirection(-1)
    setSelectedValue(answers[currentQ - 1] ?? null)
    setCurrentQ((q) => q - 1)
  }

  // ── Handle answer selection ─────────────────────────────────────────────────
  const advanceAfterAnswer = useCallback(
    (qIndex: number, answersSnapshot: Record<number, number>) => {
      const isLast = qIndex === questions.length - 1
      if (isLast) {
        setView('results')
      } else {
        setDirection(1)
        setSelectedValue(null)
        setCurrentQ(qIndex + 1)
      }
    },
    [questions.length]
  )

  function handleAnswer(value: number) {
    if (selectedValue !== null) return // already answered, waiting to advance

    const newAnswers = { ...answers, [currentQ]: value }
    setAnswers(newAnswers)
    setSelectedValue(value)

    // PHQ-9 Q9 (index 8) crisis check
    if (activeTest === 'phq9' && currentQ === 8 && value > 0) {
      pendingAnswerRef.current = value
      // Show crisis modal after brief highlight delay
      setTimeout(() => {
        setShowCrisisModal(true)
      }, 400)
      return
    }

    // Normal flow: auto-advance after 400ms
    setTimeout(() => {
      advanceAfterAnswer(currentQ, newAnswers)
    }, 400)
  }

  function handleCrisisModalContinue() {
    setShowCrisisModal(false)
    pendingAnswerRef.current = null
    // Q9 is always the last PHQ-9 question (index 8)
    setView('results')
  }

  // ── Computed results values (only when in results view) ─────────────────────
  const totalScore = Object.values(answers).reduce((a, b) => a + b, 0)
  const severityInfo =
    activeTest === 'phq9'
      ? getPHQ9Severity(totalScore)
      : activeTest === 'gad7'
      ? getGAD7Severity(totalScore)
      : null

  // ── Reset to selector ───────────────────────────────────────────────────────
  function resetToSelector() {
    setView('selector')
    setActiveTest(null)
    setAnswers({})
    setCurrentQ(0)
    setSelectedValue(null)
    setResultsSaved(false)
    setBreakdownOpen(false)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW A — SELECTOR
  // ─────────────────────────────────────────────────────────────────────────────
  if (view === 'selector') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1">
            <ClipboardList size={16} />
            <span className="text-sm">Mental Health Screening</span>
          </div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Validated Screenings
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Clinically validated tools used worldwide. Takes just a few minutes.
          </p>
        </div>

        {/* Test cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* PHQ-9 */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
          >
            <div
              className="mb-3 inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold"
              style={{ backgroundColor: '#818CF820', color: '#818CF8' }}
            >
              PHQ-9
            </div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Depression Screening
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              PHQ-9 · 9 questions · ~3 minutes
            </p>
            <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
              Measures symptoms of depression over the past 2 weeks
            </p>
            <button
              onClick={() => startTest('phq9')}
              className="mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#818CF8' }}
            >
              Start PHQ-9
            </button>
          </motion.div>

          {/* GAD-7 */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
          >
            <div
              className="mb-3 inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold"
              style={{ backgroundColor: '#A78BFA20', color: '#A78BFA' }}
            >
              GAD-7
            </div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Anxiety Screening
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              GAD-7 · 7 questions · ~2 minutes
            </p>
            <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
              Measures symptoms of anxiety over the past 2 weeks
            </p>
            <button
              onClick={() => startTest('gad7')}
              className="mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#A78BFA' }}
            >
              Start GAD-7
            </button>
          </motion.div>
        </div>

        {/* Screening history */}
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
            Your Screening History
          </h2>

          {historyLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-2xl bg-[var(--card-elevated)]"
                />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-8 text-center">
              <p className="text-sm text-[var(--text-muted)]">No screenings taken yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((result) => {
                const info =
                  result.test_type === 'phq9'
                    ? getPHQ9Severity(result.total_score)
                    : getGAD7Severity(result.total_score)
                return (
                  <div
                    key={result.id}
                    className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)] uppercase">
                        {result.test_type}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {format(parseISO(result.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[var(--text-secondary)]">
                        {result.total_score}
                      </span>
                      <SeverityBadge label={info.label} color={info.color} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p className="mt-8 text-center text-xs leading-relaxed text-[var(--text-muted)]">
          These are validated clinical screening tools used worldwide. They are not
          diagnostic — only a qualified mental health professional can provide a diagnosis.
        </p>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW B — QUESTIONNAIRE
  // ─────────────────────────────────────────────────────────────────────────────
  if (view === 'questionnaire') {
    const totalQuestions = questions.length
    const progress = ((currentQ + 1) / totalQuestions) * 100

    return (
      <>
        <div className="mx-auto max-w-2xl px-4 py-6">
          {/* Top bar */}
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={goBack}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              aria-label="Go back"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex-1">
              <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>
                  {activeTest === 'phq9' ? 'PHQ-9' : 'GAD-7'} · Question {currentQ + 1} of{' '}
                  {totalQuestions}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--card-elevated)]">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: activeTest === 'phq9' ? '#818CF8' : '#A78BFA',
                  }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>

          {/* Question area — slide transition */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentQ}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: 'easeInOut' }}
              >
                {/* Question text */}
                <div className="mb-8 min-h-[80px]">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] mb-2">
                    Over the past 2 weeks, how often have you been bothered by…
                  </p>
                  <p className="text-xl font-semibold leading-snug text-[var(--text-primary)]">
                    {questions[currentQ]}
                  </p>
                </div>

                {/* Answer options */}
                <div className="space-y-3">
                  {ANSWER_OPTIONS.map((opt) => {
                    const isSelected = selectedValue === opt.value
                    const accentColor = activeTest === 'phq9' ? '#818CF8' : '#A78BFA'
                    return (
                      <motion.button
                        key={opt.value}
                        onClick={() => handleAnswer(opt.value)}
                        disabled={selectedValue !== null}
                        whileTap={{ scale: 0.98 }}
                        className="w-full rounded-2xl border px-5 py-4 text-left text-sm font-medium transition-colors disabled:cursor-default"
                        style={
                          isSelected
                            ? {
                                borderColor: accentColor,
                                backgroundColor: `${accentColor}18`,
                                color: accentColor,
                              }
                            : {
                                borderColor: 'var(--border)',
                                backgroundColor: 'var(--card)',
                                color: 'var(--text-secondary)',
                              }
                        }
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold"
                            style={
                              isSelected
                                ? { borderColor: accentColor, color: accentColor }
                                : { borderColor: 'var(--border)', color: 'var(--text-muted)' }
                            }
                          >
                            {opt.value}
                          </span>
                          {opt.label}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Crisis modal — PHQ-9 Q9 score > 0 ───────────────────────────────── */}
        <AnimatePresence>
          {showCrisisModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
              // Non-dismissible: no onClick on backdrop
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="w-full max-w-sm rounded-2xl border border-[#818CF8]/30 bg-[var(--card)] p-6 shadow-2xl"
              >
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  You&apos;re not alone 💙
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  Thank you for being honest. If you&apos;re having thoughts of hurting yourself,
                  please reach out to someone right now:
                </p>

                <div className="mt-4 space-y-2">
                  <a
                    href="tel:14416"
                    className="flex items-center gap-3 rounded-xl border border-[#818CF8]/20 bg-[#818CF8]/10 px-4 py-3 text-sm text-[var(--text-primary)] transition-colors hover:bg-[#818CF8]/15"
                  >
                    <span>📞</span>
                    <div>
                      <p className="font-medium">Tele-MANAS: 14416</p>
                      <p className="text-xs text-[var(--text-muted)]">Government helpline · 24/7 · Free</p>
                    </div>
                  </a>
                  <a
                    href="tel:9152987821"
                    className="flex items-center gap-3 rounded-xl border border-[#818CF8]/20 bg-[#818CF8]/10 px-4 py-3 text-sm text-[var(--text-primary)] transition-colors hover:bg-[#818CF8]/15"
                  >
                    <span>📞</span>
                    <div>
                      <p className="font-medium">iCall: 9152987821</p>
                      <p className="text-xs text-[var(--text-muted)]">Psychologists & counselors</p>
                    </div>
                  </a>
                  <a
                    href="tel:18602662345"
                    className="flex items-center gap-3 rounded-xl border border-[#818CF8]/20 bg-[#818CF8]/10 px-4 py-3 text-sm text-[var(--text-primary)] transition-colors hover:bg-[#818CF8]/15"
                  >
                    <span>📞</span>
                    <div>
                      <p className="font-medium">Vandrevala Foundation: 1860-2662-345</p>
                      <p className="text-xs text-[var(--text-muted)]">24/7 helpline</p>
                    </div>
                  </a>
                  <a
                    href="tel:112"
                    className="flex items-center gap-3 rounded-xl border border-[#818CF8]/20 bg-[#818CF8]/10 px-4 py-3 text-sm text-[var(--text-primary)] transition-colors hover:bg-[#818CF8]/15"
                  >
                    <span>🚨</span>
                    <div>
                      <p className="font-medium">Emergency services: 112</p>
                      <p className="text-xs text-[var(--text-muted)]">For immediate danger</p>
                    </div>
                  </a>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">
                  Speaking to your college counselor is also a great first step.
                </p>

                <motion.button
                  onClick={handleCrisisModalContinue}
                  whileTap={{ scale: 0.97 }}
                  className="mt-5 w-full rounded-xl bg-[#818CF8] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  I understand, continue
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW C — RESULTS
  // ─────────────────────────────────────────────────────────────────────────────
  if (view === 'results' && activeTest && severityInfo) {
    const showSupport = needsSupport(severityInfo.label)

    return (
      <>
        <div className="mx-auto max-w-2xl px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <p className="text-sm text-[var(--text-muted)]">
              {activeTest === 'phq9' ? 'PHQ-9 · Depression Screening' : 'GAD-7 · Anxiety Screening'}
            </p>
            <h1 className="mt-0.5 text-2xl font-semibold text-[var(--text-primary)]">
              Your Results
            </h1>
          </div>

          {/* Score card */}
          <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Total score</p>
                <p className="text-5xl font-bold text-[var(--text-primary)]">
                  {totalScore}
                  <span className="text-xl font-normal text-[var(--text-muted)]">
                    {' '}/ {maxScore}
                  </span>
                </p>
              </div>
              <SeverityBadge label={severityInfo.label} color={severityInfo.color} />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
              {severityInfo.description}
            </p>
          </div>

          {/* Get support section */}
          {showSupport && (
            <div className="mb-4 rounded-2xl border border-[#818CF8]/20 bg-[#818CF8]/5 p-5">
              <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                Get Support
              </h2>
              <Helplines />
              <a
                href="https://www.google.com/maps/search/mental+health+counselor+near+me"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-sm font-medium text-[#818CF8] hover:underline"
              >
                Find counselors near you →
              </a>
            </div>
          )}

          {/* Question breakdown */}
          <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <button
              onClick={() => setBreakdownOpen((o) => !o)}
              className="flex w-full items-center justify-between px-5 py-4 text-sm font-semibold text-[var(--text-primary)]"
            >
              <span>Question breakdown</span>
              {breakdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <AnimatePresence>
              {breakdownOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
                    {questions.map((q, i) => {
                      const score = answers[i] ?? 0
                      const answerLabel = ANSWER_OPTIONS.find((o) => o.value === score)?.label ?? '—'
                      return (
                        <div key={i} className="px-5 py-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-xs text-[var(--text-muted)] mb-0.5">
                                Q{i + 1}
                              </p>
                              <p className="text-sm text-[var(--text-secondary)] leading-snug">
                                {q}
                              </p>
                              <p className="mt-1 text-xs text-[var(--text-muted)]">
                                {answerLabel}
                              </p>
                            </div>
                            <span className="shrink-0 text-sm font-semibold text-[var(--text-primary)]">
                              {score}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Disclaimer */}
          <p className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card-elevated)] px-4 py-4 text-xs leading-relaxed text-[var(--text-muted)]">
            This screening is not a diagnosis. These questionnaires are validated tools used
            worldwide, but only a qualified mental health professional can provide a clinical
            diagnosis. If you&apos;re concerned about your results, please speak with a counselor.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <motion.button
              onClick={resetToSelector}
              whileTap={{ scale: 0.97 }}
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] py-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              Take another screening
            </motion.button>
            <motion.button
              onClick={() => router.push('/insights')}
              whileTap={{ scale: 0.97 }}
              className="flex-1 rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              View my wellbeing trends
            </motion.button>
          </div>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.25 }}
              className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm font-medium text-[var(--text-primary)] shadow-xl lg:bottom-6"
            >
              ✓ Results saved
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  return null
}
