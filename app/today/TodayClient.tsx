'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { JournalInput } from '@/components/journal/JournalInput'
import { ParsedEntryView } from '@/components/journal/ParsedEntryView'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'
import type { DailyLog, ParsedEntry, MentalState } from '@/lib/types'

interface TodayClientProps {
  greeting: string
  dateLabel: string
  logDate: string
  initialLog: DailyLog | null
  initialEntries: ParsedEntry[]
  initialMentalState: MentalState | null
}

export function TodayClient({
  greeting,
  dateLabel,
  logDate,
  initialLog,
  initialEntries,
  initialMentalState,
}: TodayClientProps) {
  const [log, setLog] = useState<DailyLog | null>(initialLog)
  const [entries, setEntries] = useState<ParsedEntry[]>(initialEntries)
  const [mentalState, setMentalState] = useState<MentalState | null>(initialMentalState)
  const [microInsight, setMicroInsight] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('stride_onboarding_complete')) {
      setShowOnboarding(true)
    }
  }, [])

  const showInput = !log || editing

  function handleSaved(result: {
    log: DailyLog
    entries: ParsedEntry[]
    mental_state: MentalState | null
    micro_insight: string | null
  }) {
    setLog(result.log)
    setEntries(result.entries)
    setMentalState(result.mental_state)
    setMicroInsight(result.micro_insight)
    setEditing(false)
  }

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

      {/* Content */}
      <AnimatePresence mode="wait">
        {showInput ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <JournalInput
              logDate={logDate}
              existingLog={editing ? log : null}
              onSaved={handleSaved}
            />
          </motion.div>
        ) : (
          <motion.div
            key="parsed"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <ParsedEntryView
              log={log!}
              entries={entries}
              mentalState={mentalState}
              microInsight={microInsight}
              onEdit={() => setEditing(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  )
}
