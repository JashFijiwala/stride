'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2, WifiOff } from 'lucide-react'
import { RatingSlider } from './RatingSlider'
import { MoodSelector } from './MoodSelector'
import { WeightInput } from './WeightInput'
import { useJournal } from '@/hooks/useJournal'
import type { DailyLog } from '@/lib/types'

const OFFLINE_KEY = 'stride_pending_entry'

interface PendingEntry {
  raw_text: string
  self_rating: number | null
  mood_emoji: string | null
  weight_kg: number | null
  log_date: string
  saved_at: string
}

interface JournalInputProps {
  logDate: string
  existingLog?: DailyLog | null
  onSaved: (log: DailyLog) => void
}

export function JournalInput({ logDate, existingLog, onSaved }: JournalInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { saving, error, saveEntry } = useJournal()

  const [text, setText] = useState(existingLog?.raw_text ?? '')
  const [rating, setRating] = useState<number | null>(existingLog?.self_rating ?? null)
  const [mood, setMood] = useState<string | null>(existingLog?.mood_emoji ?? null)
  const [weight, setWeight] = useState(
    existingLog?.weight_kg ? String(existingLog.weight_kg) : ''
  )
  const [saved, setSaved] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [offlineSaved, setOfflineSaved] = useState(false)
  const [pendingRestored, setPendingRestored] = useState(false)

  // Detect online/offline status
  useEffect(() => {
    setIsOffline(!navigator.onLine)
    const onOnline = () => setIsOffline(false)
    const onOffline = () => setIsOffline(true)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  // Restore a pending offline entry if none exists for today
  useEffect(() => {
    if (existingLog || pendingRestored) return
    try {
      const raw = localStorage.getItem(OFFLINE_KEY)
      if (!raw) return
      const pending: PendingEntry = JSON.parse(raw)
      if (pending.log_date === logDate) {
        setText(pending.raw_text)
        setRating(pending.self_rating)
        setMood(pending.mood_emoji)
        setWeight(pending.weight_kg ? String(pending.weight_kg) : '')
        setPendingRestored(true)
      }
    } catch {
      // malformed storage — ignore
    }
  }, [existingLog, logDate, pendingRestored])

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = `${ta.scrollHeight}px`
  }, [])

  const handleSave = useCallback(async () => {
    if (!text.trim()) return

    const entryData = {
      raw_text: text.trim(),
      self_rating: rating,
      mood_emoji: mood,
      weight_kg: weight ? parseFloat(weight) : null,
      log_date: logDate,
    }

    // Always write to localStorage first as a safety net
    localStorage.setItem(
      OFFLINE_KEY,
      JSON.stringify({ ...entryData, saved_at: new Date().toISOString() })
    )

    if (!navigator.onLine) {
      setOfflineSaved(true)
      return
    }

    const log = await saveEntry(entryData)
    if (!log) return

    localStorage.removeItem(OFFLINE_KEY)

    setSaved(true)
    await new Promise((r) => setTimeout(r, 600))
    onSaved(log)
  }, [text, rating, mood, weight, logDate, saveEntry, onSaved])

  return (
    <div className="space-y-5">
      {/* Offline banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2.5 text-sm text-amber-400"
          >
            <WifiOff size={14} />
            You&apos;re offline. Your entry will be saved locally.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending restore notice */}
      <AnimatePresence>
        {pendingRestored && !existingLog && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-[var(--accent)]/10 px-4 py-2.5 text-xs text-[var(--accent)]"
          >
            ↩ Restored your unsaved draft from earlier.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline saved notice */}
      <AnimatePresence>
        {offlineSaved && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 rounded-xl bg-[var(--positive)]/10 px-4 py-3 text-sm text-[var(--positive)]"
          >
            <Check size={14} />
            Saved locally. Will sync automatically when you&apos;re back online.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text area */}
      <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--card)] transition-colors focus-within:border-[var(--accent)]/50">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          placeholder={`How was your day? Write anything…\n\nThere's no right way to do this. Just write like you're texting yourself.`}
          rows={8}
          className="w-full resize-none rounded-2xl bg-transparent px-5 py-4 text-base leading-relaxed text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
          style={{ minHeight: 200 }}
        />
      </div>

      {/* Rating */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <RatingSlider value={rating} onChange={setRating} />
      </div>

      {/* Mood */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <MoodSelector value={mood} onChange={setMood} />
      </div>

      {/* Weight */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
        <WeightInput value={weight} onChange={setWeight} />
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-xl bg-[var(--negative)]/10 px-4 py-2 text-sm text-[var(--negative)]">
          {error}
        </p>
      )}

      {/* Save button — hidden if already saved offline */}
      {!offlineSaved && (
        <motion.button
          onClick={handleSave}
          disabled={!text.trim() || saving}
          whileTap={{ scale: 0.97 }}
          className="relative w-full overflow-hidden rounded-2xl bg-[var(--accent)] py-4 text-base font-semibold text-white transition-opacity disabled:opacity-40"
        >
          <AnimatePresence mode="wait">
            {saved ? (
              <motion.span
                key="check"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center gap-2"
              >
                <Check size={18} strokeWidth={2.5} />
                Saved!
              </motion.span>
            ) : saving ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-2"
              >
                <Loader2 size={18} className="animate-spin" />
                Saving…
              </motion.span>
            ) : (
              <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {isOffline ? 'Save Offline ✓' : 'Save Entry ✓'}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      )}
    </div>
  )
}
