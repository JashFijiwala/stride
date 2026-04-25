import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ReframeClient } from './ReframeClient'

export default async function ReframePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  return (
    <PageWrapper>
      <ReframeClient userId={user.id} />
    </PageWrapper>
  )
}
