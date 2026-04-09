import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callGemini, extractJSON } from '@/lib/ai/gemini'
import { buildWeeklyInsightPrompt } from '@/lib/ai/prompts'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProcessResult {
  userId: string
  status: 'success' | 'skipped' | 'failed'
  reason?: string
}

type AdminClient = ReturnType<typeof createAdminClient>

// ── GET handler (Vercel cron calls GET) ───────────────────────────────────────

export async function GET(request: Request) {
  // Verify Vercel cron secret — prevents unauthorized triggers
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Step 1 — Fetch all user IDs from profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id')

  if (profilesError || !profiles) {
    console.error('[cron/weekly-insights] Failed to fetch profiles:', profilesError)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  console.log(`[cron/weekly-insights] Processing ${profiles.length} users`)

  // Step 2 — Process all users in parallel; one failure never blocks others
  const settled = await Promise.allSettled(
    profiles.map((p: { id: string }) => processUser(supabase, p.id))
  )

  // Step 4 — Collect and return summary
  const results: ProcessResult[] = settled.map((r) =>
    r.status === 'fulfilled'
      ? r.value
      : { userId: 'unknown', status: 'failed', reason: String(r.reason) }
  )

  const succeeded = results.filter((r) => r.status === 'success').length
  const skipped = results.filter((r) => r.status === 'skipped').length
  const failed = results.filter((r) => r.status === 'failed').length

  console.log(`[cron/weekly-insights] Done — succeeded: ${succeeded}, skipped: ${skipped}, failed: ${failed}`)

  return NextResponse.json({
    processed: profiles.length,
    succeeded,
    skipped,
    failed,
    results,
  })
}

// ── processUser ───────────────────────────────────────────────────────────────

async function processUser(supabase: AdminClient, userId: string): Promise<ProcessResult> {
  // CHECK 1 — Minimum data: at least 7 ai_parsed logs
  const { count } = await supabase
    .from('daily_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('ai_parsed', true)

  if ((count ?? 0) < 7) {
    return { userId, status: 'skipped', reason: 'insufficient data' }
  }

  // CHECK 2 — Already generated this week
  const today = new Date()
  const weekStartMonday = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const { data: existing } = await supabase
    .from('weekly_insights')
    .select('id')
    .eq('user_id', userId)
    .eq('week_start', weekStartMonday)
    .single()

  if (existing) {
    return { userId, status: 'skipped', reason: 'already generated this week' }
  }

  // FETCH DATA — last 7 days of logs + parsed entries + mental states
  const weekEnd = format(today, 'yyyy-MM-dd')
  const weekStart = format(subDays(today, 6), 'yyyy-MM-dd')

  const { data: logs } = await supabase
    .from('daily_logs')
    .select('id, log_date, self_rating, mood_emoji, weight_kg')
    .eq('user_id', userId)
    .gte('log_date', weekStart)
    .lte('log_date', weekEnd)
    .order('log_date', { ascending: true })

  if (!logs || logs.length < 3) {
    return { userId, status: 'skipped', reason: 'insufficient recent data' }
  }

  const logIds = logs.map((l: { id: string }) => l.id)

  const [{ data: parsedEntries }, { data: mentalStates }] = await Promise.all([
    supabase
      .from('parsed_entries')
      .select('daily_log_id, original_text, category, sentiment, tags')
      .in('daily_log_id', logIds),
    supabase
      .from('mental_states')
      .select('daily_log_id, primary_mood, energy_level, mood_score, summary')
      .in('daily_log_id', logIds),
  ])

  // Build compact week summary (same structure as weekly-insights/route.ts)
  const entriesByLog = new Map<string, typeof parsedEntries>()
  for (const e of parsedEntries ?? []) {
    if (!entriesByLog.has(e.daily_log_id)) entriesByLog.set(e.daily_log_id, [])
    entriesByLog.get(e.daily_log_id)!.push(e)
  }

  type MsRow = {
    daily_log_id: string
    primary_mood: string
    energy_level: string
    mood_score: number
    summary: string
  }
  const msMap = new Map<string, MsRow>(
    (mentalStates ?? []).map((ms) => [ms.daily_log_id, ms as MsRow])
  )

  const weekSummary = logs.map(
    (log: {
      id: string
      log_date: string
      self_rating: number | null
      mood_emoji: string | null
    }) => {
      const entries = entriesByLog.get(log.id) ?? []
      const ms = msMap.get(log.id)
      return {
        date: log.log_date,
        rating: log.self_rating,
        self_rating: log.self_rating,
        mood: ms?.primary_mood ?? log.mood_emoji,
        energy: ms?.energy_level,
        mood_score: ms?.mood_score,
        activities: entries.map(
          (e: { original_text: string; sentiment: string; category: string }) => ({
            text: e.original_text,
            sentiment: e.sentiment,
            category: e.category,
          })
        ),
      }
    }
  )

  const ratedLogs = logs.filter(
    (l: { self_rating: number | null }) => l.self_rating !== null
  )
  const avgRating =
    ratedLogs.length > 0
      ? ratedLogs.reduce(
          (sum: number, l: { self_rating: number | null }) => sum + (l.self_rating ?? 0),
          0
        ) / ratedLogs.length
      : 0

  const avgMoodScore =
    (mentalStates ?? []).reduce(
      (sum: number, ms: { mood_score: number }) => sum + ms.mood_score,
      0
    ) / Math.max((mentalStates ?? []).length, 1)

  const posCount = (parsedEntries ?? []).filter(
    (e: { sentiment: string }) => e.sentiment === 'positive'
  ).length
  const negCount = (parsedEntries ?? []).filter(
    (e: { sentiment: string }) => e.sentiment === 'negative'
  ).length
  const neutCount = (parsedEntries ?? []).filter(
    (e: { sentiment: string }) => e.sentiment === 'neutral'
  ).length

  // CALL GEMINI — isolated try/catch so one user's failure doesn't affect others
  let aiResult: {
    summary: string
    top_wins: string[]
    areas_to_watch: string[]
    correlations: string[]
    suggestion: string
    avg_mood_trend: string
    encouragement: string
  }

  try {
    const prompt = buildWeeklyInsightPrompt(JSON.stringify(weekSummary, null, 2))
    const rawResponse = await callGemini(prompt)
    aiResult = extractJSON(rawResponse) as typeof aiResult
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    console.error(`[cron/weekly-insights] Gemini failed for user ${userId}:`, reason)
    return { userId, status: 'failed', reason }
  }

  // SAVE TO DB — upsert with (user_id, week_start) as conflict key
  const { error: upsertError } = await supabase
    .from('weekly_insights')
    .upsert(
      {
        user_id: userId,
        week_start: weekStartMonday,
        week_end: format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        avg_rating: Math.round(avgRating * 10) / 10,
        avg_mood_score: Math.round(avgMoodScore * 10) / 10,
        positive_count: posCount,
        negative_count: negCount,
        neutral_count: neutCount,
        top_wins: aiResult.top_wins ?? [],
        areas_to_watch: aiResult.areas_to_watch ?? [],
        correlations: aiResult.correlations ?? [],
        suggestion: aiResult.suggestion ?? null,
        summary: aiResult.summary ?? null,
      },
      { onConflict: 'user_id,week_start' }
    )

  if (upsertError) {
    console.error(`[cron/weekly-insights] DB upsert failed for user ${userId}:`, upsertError)
    return { userId, status: 'failed', reason: upsertError.message }
  }

  return { userId, status: 'success' }
}
