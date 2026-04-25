import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseJournalEntry } from '@/lib/ai/parse-entry'
import { runLocalParser } from '@/lib/ai/local-parser'
import { subDays, format, parseISO } from 'date-fns'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { daily_log_id, raw_text, log_date } = await request.json()
    if (!daily_log_id || !raw_text) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // ── Addition 1: Fetch future habits to pass to parser ──────────────────
    const { data: futureHabitsData } = await supabase
      .from('future_habits')
      .select('habit_name')
      .eq('user_id', user.id)
      .in('status', ['building', 'established'])

    const futureHabitNames = (futureHabitsData ?? []).map(
      (h: { habit_name: string }) => h.habit_name
    )

    // ── Goals context: prepend user goals to Gemini prompt if set ──────────
    let goalsContext: string | undefined
    const { data: userGoals } = await supabase
      .from('user_goals')
      .select('focus_areas, positive_habits, negative_habits')
      .eq('user_id', user.id)
      .single()

    if (userGoals) {
      const focusAreas: string[] = userGoals.focus_areas ?? []
      const positiveHabits: string[] = userGoals.positive_habits ?? []
      const negativeHabits: string[] = userGoals.negative_habits ?? []

      if (focusAreas.length > 0 || positiveHabits.length > 0 || negativeHabits.length > 0) {
        const parts: string[] = ['User context for classification:']
        if (focusAreas.length > 0) parts.push(`- They are focused on: ${focusAreas.join(', ')}`)
        if (positiveHabits.length > 0) parts.push(`- Habits they consider POSITIVE and want to build: ${positiveHabits.join(', ')}`)
        if (negativeHabits.length > 0) parts.push(`- Habits they want to REDUCE or quit: ${negativeHabits.join(', ')}`)
        parts.push('')
        parts.push('Use this context when determining sentiment.')
        parts.push('If an activity matches something in their positive habits list, classify it as positive even if it would normally be neutral.')
        parts.push('If an activity matches their negative habits list, classify it as negative even if it would normally be neutral.')
        parts.push('Semantic matching — "worked on my project" matches "work on my project".')
        goalsContext = parts.join('\n')
      }
    }

    console.log('[goals-context] prompt prefix:', goalsContext ?? 'none')

    // ── Layer 1 + 2: Parse with local parser + Gemini ──────────────────────
    const aiResult = await parseJournalEntry(
      raw_text,
      futureHabitNames.length > 0 ? futureHabitNames : undefined,
      goalsContext
    )
    const localResult = runLocalParser(raw_text)

    // Resolve final values (AI corrections take priority over local parser)
    const finalWakeTime =
      (aiResult.corrections?.wake_time ?? localResult.wake_time) || null
    const finalSleepTime =
      (aiResult.corrections?.sleep_time ?? localResult.sleep_time) || null
    const finalWeight =
      aiResult.corrections?.weight_kg !== undefined &&
      aiResult.corrections.weight_kg !== null
        ? aiResult.corrections.weight_kg
        : localResult.weight_kg

    // ── Step 7: Save parsed entries ─────────────────────────────────────────
    const entriesToInsert = aiResult.entries.map((e) => ({
      daily_log_id,
      user_id: user.id,
      original_text: e.original_text,
      category: e.category,
      sentiment: e.sentiment,
      duration_mins: e.duration_mins ?? null,
      tags: e.tags ?? [],
    }))

    const { data: savedEntries, error: entriesError } = await supabase
      .from('parsed_entries')
      .insert(entriesToInsert)
      .select()

    if (entriesError) {
      console.error('Error saving parsed entries:', entriesError)
    }

    // ── Step 8: Save mental state ───────────────────────────────────────────
    const ms = aiResult.mental_state

    // Double-check: flagged must be true if self_harm > 0 (safety net)
    const isFlagged =
      aiResult.flagged ||
      (aiResult.phq9_signals?.self_harm ?? 0) > 0 ||
      (aiResult.phq9_estimate ?? 0) >= 15 ||
      (aiResult.gad7_estimate ?? 0) >= 15

    const { data: savedMentalState, error: msError } = await supabase
      .from('mental_states')
      .insert({
        daily_log_id,
        user_id: user.id,
        primary_mood: ms.primary_mood,
        energy_level: ms.energy_level,
        stress_level: ms.stress_level,
        mood_score: ms.mood_score,
        emotional_tags: ms.emotional_tags ?? [],
        summary: ms.summary,
        phq9_signals: aiResult.phq9_signals ?? null,
        phq9_estimate: aiResult.phq9_estimate ?? null,
        gad7_signals: aiResult.gad7_signals ?? null,
        gad7_estimate: aiResult.gad7_estimate ?? null,
        flagged: isFlagged,
      })
      .select()
      .single()

    if (msError) {
      console.error('Error saving mental state:', msError)
    }

    // ── Step 9: Update habits ───────────────────────────────────────────────
    await updateHabits(supabase, user.id, log_date, aiResult, localResult)

    // ── Addition 3: Update future habit logs ────────────────────────────────
    if (aiResult.detected_habits && aiResult.detected_habits.length > 0 && log_date) {
      await updateFutureHabits(supabase, user.id, log_date, aiResult.detected_habits)
    }

    // ── Step 10: Update daily_log ───────────────────────────────────────────
    const updateData: Record<string, unknown> = {
      ai_parsed: true,
    }
    if (finalWeight) updateData.weight_kg = finalWeight

    await supabase
      .from('daily_logs')
      .update(updateData)
      .eq('id', daily_log_id)

    // ── Also update wake/sleep time fields if we have them ──────────────────
    // (These aren't in the schema spec but we store in log metadata via update)

    return NextResponse.json({
      entries: savedEntries ?? entriesToInsert,
      mental_state: savedMentalState ?? null,
      wellbeing_insight: aiResult.wellbeing_insight,
      wake_time: finalWakeTime,
      sleep_time: finalSleepTime,
      flagged: isFlagged,
    })
  } catch (error) {
    console.error('parse-entry error:', error)
    return NextResponse.json(
      { error: 'Failed to parse entry', details: String(error) },
      { status: 500 }
    )
  }
}

// ─── Habit update logic ───────────────────────────────────────────────────────

async function updateHabits(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  logDate: string,
  aiResult: Awaited<ReturnType<typeof parseJournalEntry>>,
  localResult: ReturnType<typeof runLocalParser>
) {
  const today = logDate
  const yesterday = format(subDays(parseISO(today), 1), 'yyyy-MM-dd')

  // Get today's log rating to update avg_rating_with
  const { data: logData } = await supabase
    .from('daily_logs')
    .select('self_rating')
    .eq('user_id', userId)
    .eq('log_date', today)
    .single()

  const todayRating: number | null = logData?.self_rating ?? null

  // Collect habit candidates: one per entry (use primary tag as habit name)
  const habitCandidates = aiResult.entries
    .filter((e) => e.tags && e.tags.length > 0)
    .map((e) => ({
      name: normaliseHabitName(e.tags[0]),
      type: e.sentiment,
      category: e.category,
    }))
    .filter((h) => h.name.length > 1)

  // Deduplicate by name
  const seen = new Set<string>()
  const uniqueCandidates = habitCandidates.filter((h) => {
    if (seen.has(h.name)) return false
    seen.add(h.name)
    return true
  })

  // Fetch all existing habits for this user
  const { data: existingHabits } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)

  const habits = (existingHabits as HabitRow[]) ?? []

  for (const candidate of uniqueCandidates) {
    const match = findHabitMatch(habits, candidate.name)

    if (match) {
      // Update existing habit
      const lastLogged = match.last_logged
      const alreadyToday = lastLogged === today
      if (alreadyToday) continue

      const wasYesterday = lastLogged === yesterday
      const newStreak = wasYesterday ? (match.current_streak ?? 0) + 1 : 1
      const newLongest = Math.max(match.longest_streak ?? 0, newStreak)
      const newOccurrences = (match.total_occurrences ?? 0) + 1

      // Update avg_rating_with (running average)
      let newAvgWith = match.avg_rating_with
      if (todayRating !== null) {
        const prevAvg = match.avg_rating_with ?? todayRating
        newAvgWith =
          (prevAvg * (newOccurrences - 1) + todayRating) / newOccurrences
      }

      await supabase
        .from('habits')
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          total_occurrences: newOccurrences,
          last_logged: today,
          avg_rating_with: newAvgWith,
          updated_at: new Date().toISOString(),
        })
        .eq('id', match.id)
    } else {
      // Create new habit
      await supabase.from('habits').insert({
        user_id: userId,
        habit_name: candidate.name,
        habit_type: candidate.type,
        category: candidate.category,
        total_occurrences: 1,
        current_streak: 1,
        longest_streak: 1,
        last_logged: today,
        avg_rating_with: todayRating,
        avg_rating_without: null,
      })
    }
  }
}

function normaliseHabitName(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40)
}

interface HabitRow {
  id: string
  habit_name: string
  current_streak: number | null
  longest_streak: number | null
  total_occurrences: number | null
  last_logged: string | null
  avg_rating_with: number | null
}

// ─── Future habit update logic ────────────────────────────────────────────────

interface FutureHabitRow {
  id: string
  habit_name: string
  current_streak: number
  longest_streak: number
  total_attempts: number
  last_detected: string | null
  status: string
}

async function updateFutureHabits(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  logDate: string,
  detectedHabitNames: string[]
) {
  const yesterday = format(subDays(parseISO(logDate), 1), 'yyyy-MM-dd')

  // Fetch all building/established future habits for this user
  const { data: futureHabits } = await supabase
    .from('future_habits')
    .select('id, habit_name, current_streak, longest_streak, total_attempts, last_detected, status')
    .eq('user_id', userId)
    .in('status', ['building', 'established'])

  const habits = (futureHabits as FutureHabitRow[]) ?? []

  for (const detectedName of detectedHabitNames) {
    const detectedLower = detectedName.toLowerCase()
    const match = habits.find((h) => {
      const storedLower = h.habit_name.toLowerCase()
      return storedLower.includes(detectedLower) || detectedLower.includes(storedLower)
    })

    if (!match) continue

    // Skip if already logged today
    if (match.last_detected === logDate) continue

    // Upsert into future_habit_logs
    await supabase
      .from('future_habit_logs')
      .upsert(
        { habit_id: match.id, user_id: userId, log_date: logDate, detected: true },
        { onConflict: 'habit_id,log_date' }
      )

    // Recalculate streak
    const wasYesterday = match.last_detected === yesterday
    const newStreak = wasYesterday ? match.current_streak + 1 : 1
    const newLongest = Math.max(match.longest_streak, newStreak)
    const newAttempts = match.total_attempts + 1
    const newStatus = newAttempts >= 21 ? 'established' : match.status

    const futureHabitUpdate: Record<string, unknown> = {
      total_attempts: newAttempts,
      last_detected: logDate,
      current_streak: newStreak,
      longest_streak: newLongest,
      status: newStatus,
      updated_at: new Date().toISOString(),
    }
    if (match.last_detected === null) {
      futureHabitUpdate.first_detected = logDate
    }

    await supabase
      .from('future_habits')
      .update(futureHabitUpdate)
      .eq('id', match.id)
  }
}

function findHabitMatch(habits: HabitRow[], candidateName: string): HabitRow | null {
  // Exact match first
  const exact = habits.find(
    (h) => h.habit_name.toLowerCase() === candidateName.toLowerCase()
  )
  if (exact) return exact

  // Substring overlap: candidate contains habit name or vice versa
  const candidateWords = new Set(candidateName.split(' ').filter((w) => w.length > 2))
  for (const habit of habits) {
    const habitWords = habit.habit_name.toLowerCase().split(' ').filter((w) => w.length > 2)
    const overlap = habitWords.filter((w) => candidateWords.has(w))
    // At least 1 meaningful word overlap and it covers most of the shorter name
    if (overlap.length >= 1 && overlap.length >= Math.min(habitWords.length, candidateWords.size) * 0.6) {
      return habit
    }
  }

  return null
}
