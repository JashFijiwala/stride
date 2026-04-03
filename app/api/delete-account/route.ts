import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Delete user data in dependency order
    // (daily_logs CASCADE → parsed_entries, mental_states)
    await Promise.all([
      supabase.from('habits').delete().eq('user_id', user.id),
      supabase.from('weekly_insights').delete().eq('user_id', user.id),
      supabase.from('monthly_insights').delete().eq('user_id', user.id),
      supabase.from('user_summaries').delete().eq('user_id', user.id),
    ])
    await supabase.from('daily_logs').delete().eq('user_id', user.id)
    await supabase.from('profiles').delete().eq('id', user.id)

    // Delete the auth user via admin client
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('delete-account error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
