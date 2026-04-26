'use client'

import { motion } from 'framer-motion'
import { Loader2, RefreshCw } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { WeeklyInsight } from '@/lib/types'

interface WeeklySummaryCardProps {
  insight: WeeklyInsight | null
  totalDaysLogged: number
  generating: boolean
  onGenerate: () => void
}

export function WeeklySummaryCard({
  insight,
  totalDaysLogged,
  generating,
  onGenerate,
}: WeeklySummaryCardProps) {
  if (!insight) {
    const daysNeeded = Math.max(0, 3 - totalDaysLogged)
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Weekly Wellbeing Report</p>
        {totalDaysLogged < 3 ? (
          <>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Log {daysNeeded} more {daysNeeded === 1 ? 'day' : 'days'} to unlock your
              first weekly wellbeing report.
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--card-elevated)]">
              <div
                className="h-full rounded-full bg-[var(--accent)]"
                style={{ width: `${(totalDaysLogged / 3) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-right text-[10px] text-[var(--text-muted)]">
              {totalDaysLogged}/3 days
            </p>
          </>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-[var(--text-muted)]">
              You have enough data. Generate your first weekly wellbeing report!
            </p>
            <button
              onClick={onGenerate}
              disabled={generating}
              className="mt-3 flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {generating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              {generating ? 'Generating…' : 'Generate Weekly Report'}
            </button>
          </div>
        )}
      </div>
    )
  }

  const weekLabel =
    insight.week_start && insight.week_end
      ? `${format(parseISO(insight.week_start), 'MMM d')} – ${format(parseISO(insight.week_end), 'MMM d')}`
      : 'This Week'

  const total =
    (insight.positive_count ?? 0) +
    (insight.negative_count ?? 0) +
    (insight.neutral_count ?? 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Weekly Wellbeing Report · {weekLabel}
          </p>
          <div className="mt-1 flex items-baseline gap-3">
            {insight.avg_rating !== null && (
              <span className="text-2xl font-bold text-[var(--accent)]">
                {insight.avg_rating.toFixed(1)}
                <span className="text-xs font-normal text-[var(--text-muted)]">/10</span>
              </span>
            )}
            {insight.avg_mood_score !== null && (
              <span className="text-sm text-[var(--text-secondary)]">
                mood {insight.avg_mood_score.toFixed(1)}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onGenerate}
          disabled={generating}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--card-elevated)]"
          title="Regenerate"
        >
          {generating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
        </button>
      </div>

      {/* Sentiment bars */}
      {total > 0 && (
        <div className="space-y-1.5">
          {[
            { label: 'Positive', count: insight.positive_count ?? 0, color: 'bg-[var(--positive)]' },
            { label: 'Negative', count: insight.negative_count ?? 0, color: 'bg-[var(--negative)]' },
            { label: 'Neutral', count: insight.neutral_count ?? 0, color: 'bg-[var(--text-muted)]' },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-14 text-right text-[10px] text-[var(--text-muted)]">
                {label}
              </span>
              <div className="flex-1 overflow-hidden rounded-full bg-[var(--card-elevated)] h-1.5">
                <div
                  className={`h-full rounded-full ${color} transition-all`}
                  style={{ width: `${(count / total) * 100}%` }}
                />
              </div>
              <span className="w-6 text-[10px] text-[var(--text-muted)]">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* What went well */}
      {insight.top_wins?.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">What went well 💚</p>
          <ul className="space-y-1">
            {insight.top_wins.slice(0, 3).map((win, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                <span className="mt-0.5 text-[var(--positive)]">✓</span>
                {win}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Watch out for */}
      {insight.areas_to_watch?.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">Watch out for 🟡</p>
          <ul className="space-y-1">
            {insight.areas_to_watch.slice(0, 2).map((area, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                <span className="mt-0.5">⚠️</span>
                {area}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Patterns noticed */}
      {insight.correlations?.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">Patterns noticed 🔍</p>
          <ul className="space-y-1">
            {insight.correlations.slice(0, 3).map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                <span className="mt-0.5 text-[var(--accent)]">◈</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* This week, try… */}
      {insight.suggestion && (
        <div className="rounded-xl bg-[var(--card-elevated)] p-3">
          <p className="mb-1 text-xs font-medium text-[var(--text-muted)]">This week, try… 💡</p>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            {insight.suggestion}
          </p>
        </div>
      )}

      {/* Summary */}
      {insight.summary && (
        <p className="border-t border-[var(--border)] pt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
          {insight.summary}
        </p>
      )}

      {/* Encouragement (if API returns it) */}
      {insight.encouragement && (
        <div className="flex items-start gap-3 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/6 p-3">
          <span className="text-base">💙</span>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)] italic">
            {insight.encouragement}
          </p>
        </div>
      )}
    </motion.div>
  )
}
