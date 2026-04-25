import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ScreeningClient } from './ScreeningClient'

export default async function ScreeningPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  return (
    <PageWrapper>
      <ScreeningClient userId={user.id} />
    </PageWrapper>
  )
}
