'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addDays, parseISO } from 'date-fns'
import { Pencil, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useJournal } from '@/hooks/useJournal'
import { JournalInput } from '@/components/journal/JournalInput'
import { ParsedEntryView } from '@/components/journal/ParsedEntryView'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'
import type { DailyLog, ParsedEntry, MentalState } from '@/lib/types'

interface TodayClientProps {
  greeting: string
  userId: string
  currentLogDate: string
}

function getRatingColor(v: number): string {
  if (v <= 3) return '#F87171'
  if (v <= 6) return '#FBBF24'
  return '#4ADE80'
}

export function TodayClient({ greeting, userId, currentLogDate }: TodayClientProps) {
  const router = useRouter()
  const { analyseEntry, analysing, error: analyseError } = useJournal()

  const [log, setLog] = useState<DailyLog | null>(null)
  const [entries, setEntries] = useState<ParsedEntry[]>([])
  const [mentalState, setMentalState] = useState<MentalState | null>(null)
  const [microInsight, setMicroInsight] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showNewDayModal, setShowNewDayModal] = useState(false)
  const [startingNewDay, setStartingNewDay] = useState(false)

  // Friendly date label derived from the authoritative DB date, not the system clock
  const dateLabel = currentLogDate
    ? format(parseISO(currentLogDate), 'EEEE, MMMM d')
    : ''

  useEffect(() => {
    if (!localStorage.getItem('stride_onboarding_complete')) {
      setShowOnboarding(true)
    }
  }, [])

  // Re-run whenever the authoritative log date changes (e.g. after "Start New Day")
  useEffect(() => {
    setIsLoading(true)
    setLog(null)
    setEntries([])
    setMentalState(null)
    setMicroInsight(null)
    setEditing(false)

    async function fetchTodayLog() {
      const supabase = createClient()

      const { data: todayLog } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', currentLogDate)
        .single()

      if (todayLog?.ai_parsed) {
        const [{ data: parsedEntries }, { data: ms }] = await Promise.all([
          supabase
            .from('parsed_entries')
            .select('*')
            .eq('daily_log_id', todayLog.id)
            .order('created_at', { ascending: true }),
          supabase
            .from('mental_states')
            .select('*')
            .eq('daily_log_id', todayLog.id)
            .single(),
        ])
        setEntries((parsedEntries as ParsedEntry[]) ?? [])
        setMentalState(ms as MentalState | null)
      }

      setLog((todayLog as DailyLog) ?? null)
      setIsLoading(false)
    }

    fetchTodayLog()
  }, [userId, currentLogDate])

  const handleSaved = useCallback((savedLog: DailyLog) => {
    setLog(savedLog)
    setEntries([])
    setMentalState(null)
    setMicroInsight(null)
    setEditing(false)
  }, [])

  const handleAnalyse = useCallback(async () => {
    if (!log) return
    const result = await analyseEntry(log.id, log.raw_text, currentLogDate)
    if (!result) return
    setEntries(result.entries)
    setMentalState(result.mental_state)
    setMicroInsight(result.micro_insight)
    setLog((prev) => (prev ? { ...prev, ai_parsed: true } : prev))
  }, [log, currentLogDate, analyseEntry])

  const handleConfirmNewDay = useCallback(async () => {
    setStartingNewDay(true)
    try {
      const supabase = createClient()
      // Increment the stored date by exactly 1 day — no system clock involved
      const nextDate = format(addDays(parseISO(currentLogDate), 1), 'yyyy-MM-dd')
      await supabase
        .from('profiles')
        .update({ current_log_date: nextDate })
        .eq('id', userId)
      setShowNewDayModal(false)
      // Re-run the server component so it passes the new currentLogDate prop down
      router.refresh()
    } finally {
      setStartingNewDay(false)
    }
  }, [currentLogDate, userId, router])

  // Which view to render
  const view = isLoading
    ? 'loading'
    : !log || editing
    ? 'input'
    : log.ai_parsed
    ? 'analysed'
    : 'saved'

  const hasEntry = !!log && !editing

  return (
    <>
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <p className="text-sm text-[var(--text-muted)]">{greeting}</p>
          <h1 className="mt-0.5 text-2xl font-semibold text-[var(--text-primary)]">
            {dateLabel}
          </h1>
        </div>

        <AnimatePresence mode="wait">
          {/* ── Loading ────────────────────────────────────────────────────── */}
          {view === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                <div className="h-[200px] animate-pulse rounded-xl bg-[var(--card-elevated)]" />
              </div>
              <div className="h-14 animate-pulse rounded-2xl bg-[var(--card-elevated)]" />
            </motion.div>
          )}

          {/* ── State 1: No entry / editing ──────────────────────────────── */}
          {view === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <JournalInput
                logDate={currentLogDate}
                existingLog={editing ? log : null}
                onSaved={handleSaved}
              />
            </motion.div>
          )}

          {/* ── State 2: Saved, not yet analysed ─────────────────────────── */}
          {view === 'saved' && log && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {/* Header: rating / mood / weight + edit button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {log.mood_emoji && (
                    <span className="text-3xl">{log.mood_emoji}</span>
                  )}
                  <div>
                    {log.self_rating && (
                      <span
                        className="text-2xl font-bold"
                        style={{ color: getRatingColor(log.self_rating) }}
                      >
                        {log.self_rating}
                        <span className="text-sm font-normal text-[var(--text-muted)]">
                          /10
                        </span>
                      </span>
                    )}
                    {log.weight_kg && (
                      <p className="text-xs text-[var(--text-muted)]">
                        {log.weight_kg} kg
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                >
                  <Pencil size={13} />
                  Edit
                </button>
              </div>

              {/* Raw entry text */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--text-secondary)]">
                  {log.raw_text}
                </pre>
              </div>

              {analyseError && (
                <p className="rounded-xl bg-[var(--negative)]/10 px-4 py-2 text-sm text-[var(--negative)]">
                  {analyseError}
                </p>
              )}

              {/* Analyse My Day button */}
              <motion.button
                onClick={handleAnalyse}
                disabled={analysing}
                whileTap={{ scale: 0.97 }}
                className="w-full overflow-hidden rounded-2xl bg-[var(--accent)] py-4 text-base font-semibold text-white transition-opacity disabled:opacity-60"
              >
                {analysing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Stride is reading your day…
                  </span>
                ) : (
                  '✨ Analyse My Day'
                )}
              </motion.button>

              {!analysing && (
                <p className="text-center text-xs text-[var(--text-muted)]">
                  Get AI insights about your day
                </p>
              )}
            </motion.div>
          )}

          {/* ── State 3: Saved + analysed ─────────────────────────────────── */}
          {view === 'analysed' && log && (
            <motion.div
              key="analysed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <ParsedEntryView
                log={log}
                entries={entries}
                mentalState={mentalState}
                microInsight={microInsight}
                onEdit={() => setEditing(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Start New Day — subtle, only when an entry exists ─────────── */}
        {hasEntry && !isLoading && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setShowNewDayModal(true)}
              className="text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
            >
              Start New Day →
            </button>
          </div>
        )}
      </div>

      {/* ── Start New Day confirmation modal ──────────────────────────────── */}
      <AnimatePresence>
        {showNewDayModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowNewDayModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6"
            >
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Start a new day?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                Starting a new day will close today&apos;s log. You won&apos;t
                be able to edit it after this. Ready to start fresh?
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setShowNewDayModal(false)}
                  className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] py-2.5 text-sm font-medium text-[var(--text-secondary)]"
                >
                  Not yet
                </button>
                <motion.button
                  onClick={handleConfirmNewDay}
                  disabled={startingNewDay}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {startingNewDay ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Starting…
                    </span>
                  ) : (
                    'Start New Day'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
