import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('future_habits')
      .select('id, habit_name, status, total_attempts, current_streak, longest_streak, first_detected, last_detected')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ habits: data ?? [] })
  } catch (error) {
    console.error('future-habits/list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch habits', details: String(error) },
      { status: 500 }
    )
  }
}
