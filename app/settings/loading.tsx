import { PageWrapper } from '@/components/layout/PageWrapper'
import { Skeleton } from '@/components/ui/Skeleton'

export default function SettingsLoading() {
  return (
    <PageWrapper>
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {/* Profile */}
        <div className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>

        {/* Appearance */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <Skeleton className="h-3 w-20 mb-3" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <Skeleton className="h-3 w-24 mb-3" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center space-y-1.5">
                <Skeleton className="h-6 w-10 mx-auto" />
                <Skeleton className="h-2.5 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </PageWrapper>
  )
}
