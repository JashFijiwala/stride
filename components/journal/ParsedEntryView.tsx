'use client'

import { motion } from 'framer-motion'
import { Pencil } from 'lucide-react'
import { DailyMicroInsight } from './DailyMicroInsight'
import type { DailyLog, ParsedEntry, MentalState } from '@/lib/types'

interface ParsedEntryViewProps {
  log: DailyLog
  entries: ParsedEntry[]
  mentalState: MentalState | null
  microInsight: string | null
  onEdit: () => void
}

const SENTIMENT_STYLES = {
  positive: {
    dot: 'bg-[var(--positive)]',
    text: 'text-[var(--text-primary)]',
    bg: 'bg-[var(--positive)]/8',
  },
  negative: {
    dot: 'bg-[var(--negative)]',
    text: 'text-[var(--text-secondary)]',
    bg: 'bg-[var(--negative)]/8',
  },
  neutral: {
    dot: 'bg-[var(--text-muted)]',
    text: 'text-[var(--text-secondary)]',
    bg: '',
  },
}

const ENERGY_LABELS: Record<string, string> = {
  very_low: 'very low',
  low: 'low',
  moderate: 'moderate',
  high: 'high',
  very_high: 'very high',
}

function getRatingColor(v: number): string {
  if (v <= 3) return '#F87171'
  if (v <= 6) return '#FBBF24'
  return '#4ADE80'
}

export function ParsedEntryView({
  log,
  entries,
  mentalState,
  microInsight,
  onEdit,
}: ParsedEntryViewProps) {
  const positiveEntries = entries.filter((e) => e.sentiment === 'positive')
  const negativeEntries = entries.filter((e) => e.sentiment === 'negative')
  const neutralEntries = entries.filter((e) => e.sentiment === 'neutral')

  return (
    <div className="space-y-5">
      {/* Header row */}
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
          onClick={onEdit}
          className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          <Pencil size={13} />
          Edit
        </button>
      </div>

      {/* Mental state card */}
      {mentalState && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
        >
          <p className="text-sm text-[var(--text-secondary)]">
            You seemed{' '}
            <span className="font-semibold text-[var(--text-primary)]">
              {mentalState.primary_mood}
            </span>{' '}
            today with{' '}
            <span className="font-semibold text-[var(--text-primary)]">
              {ENERGY_LABELS[mentalState.energy_level] ?? mentalState.energy_level}
            </span>{' '}
            energy.
          </p>
          {mentalState.summary && (
            <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
              {mentalState.summary}
            </p>
          )}
          {mentalState.emotional_tags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {mentalState.emotional_tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[var(--accent)]/10 px-2.5 py-0.5 text-[10px] font-medium text-[var(--accent)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* AI micro insight */}
      {microInsight && <DailyMicroInsight insight={microInsight} />}

      {/* Parsed entries */}
      {entries.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="p-4 pb-2">
            <div className="mb-1 flex items-center gap-4 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[var(--positive)]" />
                {positiveEntries.length} positive
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[var(--negative)]" />
                {negativeEntries.length} negative
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[var(--text-muted)]" />
                {neutralEntries.length} neutral
              </span>
            </div>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {entries.map((entry, i) => {
              const styles = SENTIMENT_STYLES[entry.sentiment]
              return (
                <motion.div
                  key={entry.id ?? i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-start gap-3 px-4 py-3 ${styles.bg}`}
                >
                  <span
                    className={`mt-[6px] h-2 w-2 shrink-0 rounded-full ${styles.dot}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${styles.text}`}>
                      {entry.original_text}
                    </p>
                    {entry.duration_mins && (
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {entry.duration_mins >= 60
                          ? `${Math.floor(entry.duration_mins / 60)}h ${entry.duration_mins % 60 ? `${entry.duration_mins % 60}m` : ''}`
                          : `${entry.duration_mins}m`}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-[var(--card-elevated)] px-2 py-0.5 text-[9px] font-medium text-[var(--text-muted)]">
                    {entry.category}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
