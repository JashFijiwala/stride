'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDisplayDate } from '@/lib/utils/dates'
import type { DailyLog, ParsedEntry, MentalState } from '@/lib/types'

interface DayDetailProps {
  log: DailyLog
  onClose: () => void
}

const SENTIMENT_DOT: Record<string, string> = {
  positive: 'bg-[var(--positive)]',
  negative: 'bg-[var(--negative)]',
  neutral: 'bg-[var(--text-muted)]',
}

const SENTIMENT_BG: Record<string, string> = {
  positive: 'bg-[var(--positive)]/8',
  negative: 'bg-[var(--negative)]/8',
  neutral: '',
}

function getRatingColor(v: number): string {
  if (v <= 3) return '#F87171'
  if (v <= 6) return '#FBBF24'
  return '#4ADE80'
}

const ENERGY_LABELS: Record<string, string> = {
  very_low: 'very low',
  low: 'low',
  moderate: 'moderate',
  high: 'high',
  very_high: 'very high',
}

export function DayDetail({ log, onClose }: DayDetailProps) {
  const [entries, setEntries] = useState<ParsedEntry[]>([])
  const [mentalState, setMentalState] = useState<MentalState | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRaw, setShowRaw] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      setEntries([])
      setMentalState(null)
      setShowRaw(false)

      if (log.ai_parsed) {
        const supabase = createClient()
        const [{ data: e }, { data: ms }] = await Promise.all([
          supabase
            .from('parsed_entries')
            .select('*')
            .eq('daily_log_id', log.id)
            .order('created_at', { ascending: true }),
          supabase
            .from('mental_states')
            .select('*')
            .eq('daily_log_id', log.id)
            .single(),
        ])
        if (!cancelled) {
          setEntries((e as ParsedEntry[]) ?? [])
          setMentalState(ms as MentalState | null)
        }
      }

      if (!cancelled) setLoading(false)
    }

    fetchData()
    return () => { cancelled = true }
  }, [log.id, log.ai_parsed])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="mt-2 rounded-2xl border border-[var(--border)] bg-[var(--card)]"
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[var(--border)] px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {formatDisplayDate(log.log_date)}
          </p>
          <div className="mt-1 flex items-center gap-3">
            {log.self_rating && (
              <span
                className="text-xl font-bold"
                style={{ color: getRatingColor(log.self_rating) }}
              >
                {log.self_rating}
                <span className="text-xs font-normal text-[var(--text-muted)]">/10</span>
              </span>
            )}
            {log.mood_emoji && (
              <span className="text-xl">{log.mood_emoji}</span>
            )}
            {log.weight_kg && (
              <span className="text-xs text-[var(--text-muted)]">{log.weight_kg} kg</span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--card-elevated)] hover:text-[var(--text-primary)]"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded-lg bg-[var(--card-elevated)]" />
            ))}
          </div>
        ) : (
          <>
            {/* Mental state */}
            {mentalState && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] p-3">
                <p className="text-sm text-[var(--text-secondary)]">
                  Felt{' '}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {mentalState.primary_mood}
                  </span>{' '}
                  · {ENERGY_LABELS[mentalState.energy_level] ?? mentalState.energy_level} energy
                  · mood {mentalState.mood_score}/10
                </p>
                {mentalState.summary && (
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]">
                    {mentalState.summary}
                  </p>
                )}
                {mentalState.emotional_tags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {mentalState.emotional_tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[9px] font-medium text-[var(--accent)]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Parsed entries */}
            {entries.length > 0 && (
              <div className="divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)]">
                {entries.map((entry, i) => (
                  <div
                    key={entry.id ?? i}
                    className={`flex items-start gap-2.5 px-3 py-2.5 ${SENTIMENT_BG[entry.sentiment] ?? ''}`}
                  >
                    <span
                      className={`mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full ${SENTIMENT_DOT[entry.sentiment]}`}
                    />
                    <p className="flex-1 text-sm text-[var(--text-secondary)]">
                      {entry.original_text}
                    </p>
                    <span className="shrink-0 rounded-full bg-[var(--card-elevated)] px-2 py-0.5 text-[9px] text-[var(--text-muted)]">
                      {entry.category}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* No AI parsed */}
            {!log.ai_parsed && (
              <p className="text-xs text-[var(--text-muted)]">
                AI analysis not available for this entry.
              </p>
            )}

            {/* Raw text toggle */}
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="flex w-full items-center justify-center gap-1.5 py-1 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
            >
              {showRaw ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showRaw ? 'Hide' : 'View'} original entry
            </button>

            {showRaw && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] p-3">
                <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-[var(--text-secondary)]">
                  {log.raw_text}
                </pre>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}
