import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { InsightsClient } from './InsightsClient'

export default async function InsightsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  return (
    <PageWrapper>
      <InsightsClient userId={user.id} />
    </PageWrapper>
  )
}
