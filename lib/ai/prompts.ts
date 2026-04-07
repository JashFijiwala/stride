import type { LocalParserResult } from '@/lib/types'

export function buildDailyParsePrompt(
  rawText: string,
  parsed: LocalParserResult,
  futureHabitNames?: string[],
  goalsContext?: string
): string {
  // Compact pre-extracted: skip pretty-printing to save tokens
  const meta = `wake:${parsed.wake_time ?? '?'} sleep:${parsed.sleep_time ?? '?'} weight:${parsed.weight_kg ?? '?'} rating:${parsed.self_rating ?? '?'}`
  const lines = parsed.lines.join('\n')

  let prompt = goalsContext ? `${goalsContext}\n\n` : ''
  prompt += `Stride journal parser. Return ONE valid JSON object. No markdown, no trailing commas, no comments, no extra text.

CRITICAL: Valid JSON only. No trailing commas. Complete the full response.

Meta (already extracted, correct only if wrong): ${meta}

Activity lines to classify:
${lines}

JSON schema:
{"entries":[{"original_text":"exact line","category":"sleep|nutrition|exercise|personal-growth|work|entertainment|digital-wellness|discipline|health|social|other","sentiment":"positive|negative|neutral","duration_mins":null,"tags":["tag"]}],"mental_state":{"primary_mood":"word","energy_level":"very_low|low|moderate|high|very_high","stress_level":"very_low|low|moderate|high|very_high","mood_score":5,"emotional_tags":["tag"],"summary":"sentence"},"micro_insight":"sentence","corrections":{"wake_time":null,"sleep_time":null,"weight_kg":null}}

Rules: positive=making bed/bathing/reading/cooking/exercise. negative=very late sleep/excessive screens/skipping meals. entertainment=neutral. micro_insight under 25 words.`

  if (futureHabitNames && futureHabitNames.length > 0) {
    prompt += `

Additionally, the user is trying to build these habits:
${futureHabitNames.join('\n')}

Scan the journal entry for any mention of these habits.
Use LOOSE semantic matching — if the user writes "mindfulness" and the habit is "meditate", that counts.
If they write "finished a chapter" and the habit is "read before bed", that counts.
Match on intent and meaning, not just keywords.

Add one extra field to your JSON response:
"detected_habits": ["habit name 1", "habit name 2"]
Only include habits that were genuinely detected.
Empty array if none were found.`
  }

  return prompt
}

export function buildWeeklyInsightPrompt(
  weekData: string
): string {
  return `Generate a weekly insight for Stride app user. Return a single valid JSON object. No markdown, no backticks, no trailing commas, no comments.

CRITICAL: Return only a single valid JSON object. No trailing commas. No comments. No extra text.

Required JSON structure:
{"summary":"3-5 sentences","top_wins":["win1","win2","win3"],"areas_to_watch":["area1","area2"],"correlations":["observation1","observation2","observation3"],"suggestion":"ONE specific suggestion with numbers","avg_mood_trend":"improving|declining|stable","encouragement":"one closing line"}

Rules:
- Reference actual activities and data only, never generic advice.
- suggestion is ONE thing with concrete numbers.
- If rough week, acknowledge honestly without pity.
- No medical advice. Philosophy: small improvements, stride by stride.

Week data:
${weekData}`
}
