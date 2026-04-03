import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { TodayClient } from './TodayClient'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function TodayPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const name = profile?.name ?? user.email?.split('@')[0] ?? 'there'
  const greeting = `${getGreeting()}, ${name}`

  return (
    <PageWrapper>
      <TodayClient greeting={greeting} userId={user.id} />
    </PageWrapper>
  )
}
