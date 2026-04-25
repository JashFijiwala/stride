import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { CopingClient } from './CopingClient'

export default async function CopingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  return (
    <PageWrapper>
      <CopingClient userId={user.id} />
    </PageWrapper>
  )
}
