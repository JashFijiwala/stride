import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_FLAGS = ['name_set', 'goals_set', 'onboarding_complete'] as const
type AllowedFlag = (typeof ALLOWED_FLAGS)[number]

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { flag, value } = await request.json()

    if (!ALLOWED_FLAGS.includes(flag as AllowedFlag)) {
      return NextResponse.json(
        { error: `Invalid flag. Must be one of: ${ALLOWED_FLAGS.join(', ')}` },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('profiles')
      .update({ [flag]: value })
      .eq('id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('onboarding/set-flag error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
