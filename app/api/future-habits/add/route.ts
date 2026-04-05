import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { habit_name } = await request.json()
    if (!habit_name || typeof habit_name !== 'string') {
      return NextResponse.json({ error: 'Missing habit_name' }, { status: 400 })
    }

    const trimmed = habit_name.trim().slice(0, 80)
    if (trimmed.length < 2) {
      return NextResponse.json({ error: 'Habit name too short' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('future_habits')
      .insert({
        user_id: user.id,
        habit_name: trimmed,
        status: 'building',
        total_attempts: 0,
        current_streak: 0,
        longest_streak: 0,
      })
      .select()
      .single()

    if (error) {
      // Unique constraint violation — habit already exists
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Habit already exists' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ habit: data })
  } catch (error) {
    console.error('future-habits/add error:', error)
    return NextResponse.json(
      { error: 'Failed to add habit', details: String(error) },
      { status: 500 }
    )
  }
}
