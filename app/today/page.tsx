import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { TodayClient } from './TodayClient'

export default async function TodayPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, current_log_date, name_set, goals_set, onboarding_complete')
    .eq('id', user.id)
    .single()

  const currentLogDate =
    profile?.current_log_date ??
    new Date().toLocaleDateString('en-CA')

  return (
    <PageWrapper>
      <TodayClient
        userId={user.id}
        currentLogDate={currentLogDate}
        profileName={profile?.name ?? null}
        email={user.email ?? ''}
        nameSet={profile?.name_set ?? false}
        goalsSet={profile?.goals_set ?? false}
        onboardingComplete={profile?.onboarding_complete ?? false}
      />
    </PageWrapper>
  )
}
