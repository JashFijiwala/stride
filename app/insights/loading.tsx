import { PageWrapper } from '@/components/layout/PageWrapper'
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'

export default function InsightsLoading() {
  return (
    <PageWrapper>
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        {/* Page title */}
        <Skeleton className="h-7 w-32 mb-2" />

        {/* Streak card */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-12 w-12 rounded-2xl" />
          </div>
        </div>

        {/* Chart card */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-[160px] w-full rounded-xl" />
        </div>

        {/* Weekly summary */}
        <SkeletonCard />

        {/* Suggestion */}
        <div className="rounded-2xl border border-[var(--accent)]/20 bg-[var(--card)] p-5 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>

        {/* Habits */}
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </PageWrapper>
  )
}
