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

    const { focus_areas, positive_habits, negative_habits } = await request.json()

    const { error } = await supabase
      .from('user_goals')
      .upsert(
        {
          user_id: user.id,
          focus_areas: focus_areas ?? [],
          positive_habits: positive_habits ?? [],
          negative_habits: negative_habits ?? [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('goals/save error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
