import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'

const SYSTEM_PROMPT =
  'The situation and thought may be written in English, Hindi, Hinglish, or Roman Hindi. Understand the meaning fully regardless of language. Always respond in simple, clear English.\n\nYou are a compassionate CBT coach. Given a situation, an automatic negative thought, and emotions, suggest ONE short balanced reframe (max 2 sentences). Be warm and realistic — not toxic positivity. Do not say "everything will be okay". Return only the reframe text, no preamble.'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const situation = (body.situation as string) ?? ''
    const automaticThought = (body.automatic_thought as string) ?? ''
    const emotions: string[] = Array.isArray(body.emotions) ? body.emotions : []

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Situation: ${situation}\nAutomatic thought: ${automaticThought}\nEmotions: ${emotions.join(', ')}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    })

    const reframe = completion.choices[0].message.content?.trim() ?? ''
    return NextResponse.json({ reframe })
  } catch (error) {
    console.error('[coping/reframe]', error)
    return NextResponse.json({ error: 'Failed to generate reframe' }, { status: 500 })
  }
}
