'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { useInsights } from '@/hooks/useInsights'
import { useWellbeingCorrelations } from '@/hooks/useWellbeingCorrelations'
import { SuggestionCard } from '@/components/insights/SuggestionCard'
import { StreakSection } from '@/components/insights/StreakSection'
import { WeeklySummaryCard } from '@/components/insights/WeeklySummaryCard'
import { CorrelationCard } from '@/components/insights/CorrelationCard'
import { WellbeingScoreCard } from '@/components/insights/WellbeingScoreCard'
import { PatternCard } from '@/components/insights/PatternCard'
import { FutureHabitsSection } from '@/components/insights/FutureHabitsSection'
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
const ScreeningHistory = dynamic(
  () => import('@/components/insights/ScreeningHistory').then((m) => m.ScreeningHistory),
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

interface FutureHabit {
  id: string
  habit_name: string
  status: string
  total_attempts: number
  current_streak: number
  longest_streak: number
  first_detected: string | null
  last_detected: string | null
}

interface InsightsClientProps {
  userId: string
}

export function InsightsClient({ userId }: InsightsClientProps) {
  const { data: insights, loading, generatingWeekly, generateWeeklyInsight } = useInsights(userId)
  const { moodPoints, weeklyInsight, totalDaysLogged } = insights

  const { correlations: wellbeingCorrelations } = useWellbeingCorrelations(userId, totalDaysLogged)

  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [patternsLoading, setPatternsLoading] = useState(false)

  const [futureHabits, setFutureHabits] = useState<FutureHabit[]>([])

  useEffect(() => {
    fetch('/api/future-habits/list')
      .then((r) => r.json())
      .then((data) => setFutureHabits(data.habits ?? []))
      .catch(console.error)
  }, [userId])

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

  const showCorrelations = totalDaysLogged >= 14 && wellbeingCorrelations.length > 0
  const showTeaser14 = totalDaysLogged >= 7 && totalDaysLogged < 14

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">

      {/* Page heading */}
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Wellbeing Dashboard</h1>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Your mental health journey, at a glance
        </p>
      </div>

      {/* 1 — Wellbeing Score (shows once phq9_estimate is available) */}
      {totalDaysLogged >= 3 && (
        <WellbeingScoreCard userId={userId} totalDaysLogged={totalDaysLogged} />
      )}

      {/* 2 — This Week's Nudge */}
      <SuggestionCard insight={weeklyInsight} totalDaysLogged={totalDaysLogged} />

      {/* 3 — Streaks */}
      <section className="space-y-3">
        <SectionHeading>Streaks</SectionHeading>
        <StreakSection userId={userId} />
      </section>

      {/* 4 — Mood timeline */}
      <section className="space-y-3">
        <SectionHeading>Mood Timeline</SectionHeading>
        {loading ? (
          <ChartSkeleton />
        ) : (
          <MoodTimeline data={moodPoints} />
        )}
      </section>

      {/* 5 — Wellbeing Trend (was Day Rating Trend) */}
      <section className="space-y-3">
        <SectionHeading>Wellbeing Trend</SectionHeading>
        {loading ? (
          <ChartSkeleton />
        ) : (
          <RatingTrend data={moodPoints} />
        )}
      </section>

      {/* 6 — Screening Score History (unlocks at 2+ screenings) */}
      <section className="space-y-3">
        <SectionHeading>Screening History</SectionHeading>
        <ScreeningHistory userId={userId} />
      </section>

      {/* 7 — Patterns (unlocks at 14 days) */}
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

      {/* 8 — Future habits */}
      <section className="space-y-3">
        <SectionHeading>Habits I&apos;m Building</SectionHeading>
        <FutureHabitsSection
          userId={userId}
          habits={futureHabits}
          onHabitAdded={(habit) => setFutureHabits((prev) => [...prev, habit])}
        />
      </section>

      {/* 9 — Weekly Wellbeing Report */}
      <section className="space-y-3">
        <SectionHeading>Weekly Wellbeing Report</SectionHeading>
        <WeeklySummaryCard
          insight={weeklyInsight}
          totalDaysLogged={totalDaysLogged}
          generating={generatingWeekly}
          onGenerate={generateWeeklyInsight}
        />
      </section>

      {/* 10 — Stress Patterns (wellbeing correlations, unlocks at 14 days) */}
      {showCorrelations && (
        <section className="space-y-3">
          <SectionHeading>Stress Patterns</SectionHeading>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {wellbeingCorrelations.map((c, i) => (
              <CorrelationCard key={c.habit_name} correlation={c} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Teaser: unlocks at 14 days */}
      {showTeaser14 && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-center">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            🔍 Stress pattern analysis unlocks at 14 days
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
            Your wellbeing map starts here
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Write your first entry and MindLens will begin tracking your mental health patterns automatically. No setup needed.
          </p>
        </div>
      )}
    </div>
  )
}
