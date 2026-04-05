import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { subDays, format, differenceInDays, parseISO } from 'date-fns'

const SYSTEM_PROMPT = `You are a behavioral pattern analyst for a habit tracking app called Stride. You will receive structured data from a user's daily journal entries spanning multiple weeks.

Your job is to find GENUINE recurring behavioral patterns — sequences that repeat across multiple days, not single-day observations.

A pattern must:
→ Appear at least 3 times in the data to be mentioned
→ Be a SEQUENCE or recurring behavior, not just a single correlation
→ Be specific enough to be actionable
→ Never be preachy, judgmental, or alarming

Confidence levels:
→ high: pattern appears 5+ times clearly
→ medium: pattern appears 3-4 times
→ low: pattern appears 2 times or is unclear (save these but we will filter them from display)

Types of patterns to look for:
→ EOD bad habit pulling down otherwise good days
→ Day-of-week patterns (weekends vs weekdays)
→ Recovery patterns (good streak followed by dip)
→ Morning routine impact on overall day rating
→ Entertainment/screen time affecting sleep and next-day performance
→ Positive patterns worth celebrating and reinforcing

For POSITIVE patterns (is_positive: true):
→ Celebratory tone, no suggestion needed
→ Example: "Your best days almost always start with reading or learning something"

For NEGATIVE patterns (is_positive: false):
→ Honest but warm tone
→ Always include a specific, gentle suggestion
→ Never shame or lecture

The more data provided, the more specific your language should be. With 14 days be general. With 30 days be specific with numbers.

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "pattern_type": "short-slug-identifier",
    "title": "Short headline (max 8 words)",
    "description": "2-3 sentence explanation in plain English, specific to their data",
    "suggestion": "One gentle actionable sentence (null for positive patterns)",
    "confidence": "high|medium|low",
    "is_positive": true|false
  }
]

Be ruthless about quality. 2-3 genuine patterns is better than 6 weak ones. Only include a pattern if you are genuinely confident it is real and recurring in this specific user's data.`

function extractJSONArray(text: string): Record<string, unknown>[] {
  const stripped = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()

  // Attempt 1: direct parse
  try {
    const parsed = JSON.parse(stripped)
    if (Array.isArray(parsed)) return parsed as Record<string, unknown>[]
  } catch { /* fall through */ }

  // Attempt 2: remove control chars + trailing commas
  const cleaned = stripped
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/,(\s*[}\]])/g, '$1')
  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) return parsed as Record<string, unknown>[]
  } catch { /* fall through */ }

  // Attempt 3: find outermost [...] block
  const start = cleaned.indexOf('[')
  const end = cleaned.lastIndexOf(']')
  if (start !== -1 && end !== -1) {
    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1))
      if (Array.isArray(parsed)) return parsed as Record<string, unknown>[]
    } catch { /* fall through */ }
  }

  console.warn('[pattern-analysis] Could not parse Gemini response as JSON array')
  return []
}

export async function POST(request: Request) {
  try {
    const { user_id } = await request.json()
    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    const supabase = await createClient()

    // ── Step 1: Check if analysis is needed ───────────────────────────────
    const { data: existingPatterns } = await supabase
      .from('patterns')
      .select('*')
      .eq('user_id', user_id)
      .order('last_analyzed', { ascending: false })

    if (existingPatterns && existingPatterns.length > 0) {
      const lastAnalyzed = existingPatterns[0].last_analyzed as string
      const daysSince = differenceInDays(new Date(), parseISO(lastAnalyzed))
      if (daysSince < 7) {
        const filtered = existingPatterns.filter(
          (p) => p.confidence === 'medium' || p.confidence === 'high'
        )
        return NextResponse.json({ patterns: filtered, insufficientData: false })
      }
    }

    // ── Step 2: Check minimum data requirement ─────────────────────────────
    const { count } = await supabase
      .from('daily_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('ai_parsed', true)

    if ((count ?? 0) < 14) {
      return NextResponse.json({ patterns: [], insufficientData: true })
    }

    // ── Step 3: Fetch data for Gemini ──────────────────────────────────────
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')

    const [{ data: logs }, { data: mentalStates }, { data: entries }] = await Promise.all([
      supabase
        .from('daily_logs')
        .select('id, log_date, self_rating, mood_emoji, weight_kg')
        .eq('user_id', user_id)
        .gte('log_date', thirtyDaysAgo)
        .order('log_date', { ascending: true }),
      supabase
        .from('mental_states')
        .select('daily_log_id, primary_mood, energy_level, stress_level, mood_score')
        .eq('user_id', user_id),
      supabase
        .from('parsed_entries')
        .select('daily_log_id, category, sentiment, original_text, duration_mins')
        .eq('user_id', user_id),
    ])

    const dayObjects = (logs ?? []).map((log) => {
      const ms = (mentalStates ?? []).find((m) => m.daily_log_id === log.id)
      const dayEntries = (entries ?? [])
        .filter((e) => e.daily_log_id === log.id)
        .map((e) => ({
          text: e.original_text,
          category: e.category,
          sentiment: e.sentiment,
          ...(e.duration_mins != null ? { duration_mins: e.duration_mins } : {}),
        }))

      return {
        date: log.log_date,
        rating: log.self_rating,
        mood: log.mood_emoji,
        entries: dayEntries,
        mental_state: ms
          ? { energy: ms.energy_level, stress: ms.stress_level, score: ms.mood_score }
          : null,
      }
    })

    // ── Step 4: Call Gemini ────────────────────────────────────────────────
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set')

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.2,
      },
    })

    const result = await model.generateContent(JSON.stringify(dayObjects, null, 2))
    const raw = result.response.text()

    // ── Step 5: Parse and upsert ───────────────────────────────────────────
    const parsed = extractJSONArray(raw)
    const today = format(new Date(), 'yyyy-MM-dd')
    const daysAnalyzed = dayObjects.length

    for (const pattern of parsed) {
      await supabase
        .from('patterns')
        .upsert(
          {
            user_id,
            pattern_type: String(pattern.pattern_type ?? ''),
            title: String(pattern.title ?? ''),
            description: String(pattern.description ?? ''),
            suggestion: pattern.suggestion ? String(pattern.suggestion) : null,
            confidence: String(pattern.confidence ?? 'low'),
            is_positive: Boolean(pattern.is_positive),
            last_analyzed: today,
            days_analyzed: daysAnalyzed,
          },
          { onConflict: 'user_id,pattern_type,title' }
        )
    }

    // ── Step 6: Return medium + high confidence patterns ───────────────────
    const { data: finalPatterns } = await supabase
      .from('patterns')
      .select('*')
      .eq('user_id', user_id)
      .in('confidence', ['medium', 'high'])

    return NextResponse.json({ patterns: finalPatterns ?? [], insufficientData: false })
  } catch (err) {
    console.error('pattern-analysis error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
