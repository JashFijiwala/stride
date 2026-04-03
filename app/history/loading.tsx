import { PageWrapper } from '@/components/layout/PageWrapper'
import { Skeleton } from '@/components/ui/Skeleton'

export default function HistoryLoading() {
  return (
    <PageWrapper>
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        {/* Month header */}
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-xl" />
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-1">
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        {/* Calendar grid */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          {/* Day labels */}
          <div className="grid grid-cols-7 mb-2">
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <div key={i} className="flex justify-center">
                <Skeleton className="h-3 w-4" />
              </div>
            ))}
          </div>
          {/* 6 weeks */}
          {Array.from({ length: 6 }).map((_, row) => (
            <div key={row} className="grid grid-cols-7 gap-1 mb-1">
              {Array.from({ length: 7 }).map((_, col) => (
                <Skeleton key={col} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  )
}
