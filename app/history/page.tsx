import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { HistoryClient } from './HistoryClient'
import { monthStartStr, monthEndStr } from '@/lib/utils/dates'
import type { DailyLog } from '@/lib/types'

export default async function HistoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  // Fetch this month's full logs for the initial calendar render
  const { data: monthLogs } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('log_date', monthStartStr(year, month))
    .lte('log_date', monthEndStr(year, month))
    .order('log_date', { ascending: true })

  // Fetch all log dates (lightweight) for streak calculation
  const { data: allLogsRaw } = await supabase
    .from('daily_logs')
    .select('log_date')
    .eq('user_id', user.id)
    .order('log_date', { ascending: false })

  const allLogDates = (allLogsRaw ?? []).map((r: { log_date: string }) => r.log_date)

  return (
    <PageWrapper>
      <HistoryClient
        initialLogs={(monthLogs as DailyLog[]) ?? []}
        allLogDates={allLogDates}
        userId={user.id}
      />
    </PageWrapper>
  )
}
