import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { MindfulnessClient } from './MindfulnessClient'

export default async function MindfulnessPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  return (
    <PageWrapper>
      <MindfulnessClient userId={user.id} />
    </PageWrapper>
  )
}
