import { PageWrapper } from '@/components/layout/PageWrapper'
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'

export default function TodayLoading() {
  return (
    <PageWrapper>
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
        {/* Header */}
        <div className="mb-6 space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-7 w-48" />
        </div>

        {/* Textarea */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <Skeleton className="h-[200px] w-full" />
        </div>

        {/* Rating */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-6 w-full" />
        </div>

        {/* Mood */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <Skeleton className="h-4 w-16 mb-3" />
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-10 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Weight */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
          <Skeleton className="h-9 w-full" />
        </div>

        {/* Button */}
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
    </PageWrapper>
  )
}
