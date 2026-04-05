'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { useInsights } from '@/hooks/useInsights'
import { useHabits } from '@/hooks/useHabits'
import { SuggestionCard } from '@/components/insights/SuggestionCard'
import { StreakSection } from '@/components/insights/StreakSection'
import { WeeklySummaryCard } from '@/components/insights/WeeklySummaryCard'
import { CorrelationCard } from '@/components/insights/CorrelationCard'
import { PatternCard } from '@/components/insights/PatternCard'
import { SkeletonCard } from '@/components/ui/Skeleton'

// Lazy-load charts — they're heavy and not needed for initial paint
const MoodTimeline = dynamic(
  () => import('@/components/insights/MoodTimeline').then((m) => m.MoodTimeline),
  { ssr: false, loading: () => <ChartSkeleton /> }
)
const RatingTrend = dynamic(
  () => import('@/components/insights/RatingTrend').then((m) => m.RatingTrend),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

function ChartSkeleton() {
  return (
    <div className="h-48 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card)]" />
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
      {children}
    </h2>
  )
}

interface Pattern {
  title: string
  description: string
  suggestion: string | null
  confidence: 'medium' | 'high'
  is_positive: boolean
}

interface InsightsClientProps {
  userId: string
}

export function InsightsClient({ userId }: InsightsClientProps) {
  const { data: insights, loading, generatingWeekly, generateWeeklyInsight } = useInsights(userId)
  const { data: habitsData, loading: habitsLoading } = useHabits(userId)

  const { moodPoints, weeklyInsight, totalDaysLogged } = insights
  const { habits, correlations } = habitsData

  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [patternsLoading, setPatternsLoading] = useState(false)

  // Fetch patterns once insights data is loaded and we have enough days
  useEffect(() => {
    if (loading || totalDaysLogged < 14) return

    setPatternsLoading(true)
    fetch('/api/pattern-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.insufficientData) setPatterns(data.patterns ?? [])
      })
      .catch(console.error)
      .finally(() => setPatternsLoading(false))
  }, [loading, totalDaysLogged, userId])

  const showCorrelations = totalDaysLogged >= 14 && correlations.length > 0
  const showTeaser14 = totalDaysLogged >= 7 && totalDaysLogged < 14

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">

      {/* 1 — This Week's Nudge */}
      <SuggestionCard insight={weeklyInsight} totalDaysLogged={totalDaysLogged} />

      {/* 2 — Streaks */}
      <section className="space-y-3">
        <SectionHeading>Streaks</SectionHeading>
        {habitsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card)]" />
            ))}
          </div>
        ) : (
          <StreakSection habits={habits} />
        )}
      </section>

      {/* 3 — Mood timeline */}
      <section className="space-y-3">
        <SectionHeading>Mood Timeline</SectionHeading>
        {loading ? (
          <ChartSkeleton />
        ) : (
          <MoodTimeline data={moodPoints} />
        )}
      </section>

      {/* 4 — Rating trend */}
      <section className="space-y-3">
        <SectionHeading>Day Rating Trend</SectionHeading>
        {loading ? (
          <ChartSkeleton />
        ) : (
          <RatingTrend data={moodPoints} />
        )}
      </section>

      {/* 5 — Patterns (unlocks at 14 days) */}
      {totalDaysLogged >= 14 && (patternsLoading || patterns.length > 0) && (
        <section className="space-y-3">
          <SectionHeading>Your Patterns</SectionHeading>
          {patternsLoading ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <div className="space-y-3">
              {patterns.map((p, i) => (
                <PatternCard key={`${p.title}-${i}`} pattern={p} index={i} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 6 — Weekly summary */}
      <section className="space-y-3">
        <SectionHeading>Weekly Summary</SectionHeading>
        <WeeklySummaryCard
          insight={weeklyInsight}
          totalDaysLogged={totalDaysLogged}
          generating={generatingWeekly}
          onGenerate={generateWeeklyInsight}
        />
      </section>

      {/* 7 — Correlations */}
      {showCorrelations && (
        <section className="space-y-3">
          <SectionHeading>What&apos;s shaping your days</SectionHeading>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {correlations.map((c, i) => (
              <CorrelationCard key={c.habit_name} correlation={c} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Teaser: unlocks at 14 days */}
      {showTeaser14 && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-center">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            🔍 Habit correlations unlock at 14 days
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {14 - totalDaysLogged} more {14 - totalDaysLogged === 1 ? 'day' : 'days'} to go
          </p>
          <div className="mx-auto mt-3 h-1.5 max-w-48 overflow-hidden rounded-full bg-[var(--card-elevated)]">
            <div
              className="h-full rounded-full bg-[var(--accent)]"
              style={{ width: `${(totalDaysLogged / 14) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Encouraging empty state for new users */}
      {totalDaysLogged === 0 && !loading && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <p className="text-2xl mb-2">📊</p>
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Your habit map starts here
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Write your first entry and Stride will begin tracking your habits automatically. No setup needed.
          </p>
        </div>
      )}
    </div>
  )
}
