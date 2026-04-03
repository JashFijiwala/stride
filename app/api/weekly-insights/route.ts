import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini, extractJSON } from '@/lib/ai/gemini'
import { buildWeeklyInsightPrompt } from '@/lib/ai/prompts'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'

export async function POST() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Define the week (last 7 days ending today)
    const today = new Date()
    const weekEnd = format(today, 'yyyy-MM-dd')
    const weekStart = format(subDays(today, 6), 'yyyy-MM-dd')

    // Check if a weekly insight already exists for this week
    const weekStartMonday = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const { data: existing } = await supabase
      .from('weekly_insights')
      .select('id')
      .eq('user_id', user.id)
      .eq('week_start', weekStartMonday)
      .single()

    // Fetch last 7 days of logs + parsed entries + mental states
    const { data: logs } = await supabase
      .from('daily_logs')
      .select('id, log_date, self_rating, mood_emoji, weight_kg')
      .eq('user_id', user.id)
      .gte('log_date', weekStart)
      .lte('log_date', weekEnd)
      .order('log_date', { ascending: true })

    if (!logs || logs.length < 3) {
      return NextResponse.json(
        { error: 'Need at least 3 days of data to generate a weekly insight.' },
        { status: 400 }
      )
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

    // Build a compact week summary for Gemini (structured, not raw text — saves tokens)
    const entriesByLog = new Map<string, typeof parsedEntries>()
    for (const e of parsedEntries ?? []) {
      if (!entriesByLog.has(e.daily_log_id)) entriesByLog.set(e.daily_log_id, [])
      entriesByLog.get(e.daily_log_id)!.push(e)
    }
    type MsRow = { daily_log_id: string; primary_mood: string; energy_level: string; mood_score: number; summary: string }
    const msMap = new Map<string, MsRow>(
      (mentalStates ?? []).map((ms) => [ms.daily_log_id, ms as MsRow])
    )

    const weekSummary = logs.map((log: { id: string; log_date: string; self_rating: number | null; mood_emoji: string | null }) => {
      const entries = entriesByLog.get(log.id) ?? []
      const ms = msMap.get(log.id)
      return {
        date: log.log_date,
        rating: log.self_rating,
        self_rating: log.self_rating,
        mood: ms?.primary_mood ?? log.mood_emoji,
        energy: ms?.energy_level,
        mood_score: ms?.mood_score,
        activities: entries.map((e: { original_text: string; sentiment: string; category: string }) => ({
          text: e.original_text,
          sentiment: e.sentiment,
          category: e.category,
        })),
      }
    })

    const avgRating =
      logs.reduce((sum: number, l: { self_rating: number | null }) => sum + (l.self_rating ?? 0), 0) /
      logs.filter((l: { self_rating: number | null }) => l.self_rating !== null).length

    const avgMoodScore =
      (mentalStates ?? []).reduce((sum: number, ms: { mood_score: number }) => sum + ms.mood_score, 0) /
      Math.max((mentalStates ?? []).length, 1)

    const posCount = (parsedEntries ?? []).filter((e: { sentiment: string }) => e.sentiment === 'positive').length
    const negCount = (parsedEntries ?? []).filter((e: { sentiment: string }) => e.sentiment === 'negative').length
    const neutCount = (parsedEntries ?? []).filter((e: { sentiment: string }) => e.sentiment === 'neutral').length

    const prompt = buildWeeklyInsightPrompt(JSON.stringify(weekSummary, null, 2))
    const rawResponse = await callGemini(prompt)
    const aiResult = extractJSON(rawResponse) as {
      summary: string
      top_wins: string[]
      areas_to_watch: string[]
      correlations: string[]
      suggestion: string
      avg_mood_trend: string
      encouragement: string
    }

    // Upsert into weekly_insights
    const upsertData = {
      user_id: user.id,
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
    }

    let savedInsight
    if (existing) {
      const { data } = await supabase
        .from('weekly_insights')
        .update(upsertData)
        .eq('id', existing.id)
        .select()
        .single()
      savedInsight = data
    } else {
      const { data } = await supabase
        .from('weekly_insights')
        .insert(upsertData)
        .select()
        .single()
      savedInsight = data
    }

    return NextResponse.json(savedInsight)
  } catch (error) {
    console.error('weekly-insights error:', error)
    return NextResponse.json(
      { error: 'Failed to generate weekly insight', details: String(error) },
      { status: 500 }
    )
  }
}
