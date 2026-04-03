import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { TodayClient } from './TodayClient'
import { format } from 'date-fns'
import type { DailyLog, ParsedEntry, MentalState } from '@/lib/types'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getDateLabel(): string {
  return format(new Date(), 'EEEE, MMMM d')
}

function getTodayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export default async function TodayPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  // Fetch profile for personalised greeting
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const logDate = getTodayDateString()

  // Fetch today's log
  const { data: log } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('log_date', logDate)
    .single()

  let entries: ParsedEntry[] = []
  let mentalState: MentalState | null = null

  if (log?.ai_parsed) {
    const [{ data: parsedEntries }, { data: ms }] = await Promise.all([
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

    entries = (parsedEntries as ParsedEntry[]) ?? []
    mentalState = ms as MentalState | null
  }

  const name = profile?.name ?? user.email?.split('@')[0] ?? 'there'
  const greeting = `${getGreeting()}, ${name}`

  return (
    <PageWrapper>
      <TodayClient
        greeting={greeting}
        dateLabel={getDateLabel()}
        logDate={logDate}
        initialLog={(log as DailyLog) ?? null}
        initialEntries={entries}
        initialMentalState={mentalState}
      />
    </PageWrapper>
  )
}
