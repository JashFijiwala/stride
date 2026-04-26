import type { LocalParserResult } from '@/lib/types'

export function buildDailyParsePrompt(
  rawText: string,
  parsed: LocalParserResult,
  futureHabitNames?: string[],
  goalsContext?: string
): string {
  const meta = `wake:${parsed.wake_time ?? '?'} sleep:${parsed.sleep_time ?? '?'} weight:${parsed.weight_kg ?? '?'} rating:${parsed.self_rating ?? '?'}`
  const lines = parsed.lines.join('\n')

  // Include pre-detected signals so Gemini has local-parser context
  const preDetected: string[] = []
  if (parsed.stress_detected)
    preDetected.push(`stress signals: ${parsed.stress_keywords_found.join(', ')}`)
  if (parsed.positive_coping_detected)
    preDetected.push(`positive coping: ${parsed.positive_coping_found.join(', ')}`)
  if (parsed.isolation_detected)
    preDetected.push(`isolation signals: ${parsed.isolation_signals_found.join(', ')}`)
  const signalsLine =
    preDetected.length > 0
      ? `\nPre-detected signals (use as context): ${preDetected.join(' | ')}`
      : ''

  let prompt = goalsContext ? `${goalsContext}\n\n` : ''

  prompt += `LANGUAGE HANDLING — CRITICAL:
The journal entry may be written in any of these forms:
- Pure English (standard or broken/informal)
- Pure Hindi (Devanagari: बहुत थका हुआ था)
- Hinglish (mixed Hindi-English: 'feeling bahut low hai aaj')
- Roman Hindi (Hindi written in English letters: 'bahut stressed tha aaj, neend nahi aayi')

You must understand ALL of these naturally. Here are common Indian expressions and their meanings — recognize these even in broken or mixed form:

Stress/Distress signals:
- 'bahut stressed/tired/bored tha/thi' = very stressed/tired/bored
- 'kuch acha nahi lag raha' = nothing feels good, feeling low
- 'mann nahi kar raha kuch bhi' = don't feel like doing anything
- 'dil bhaari hai' = heart feels heavy, feeling sad
- 'bahut rona aaya' = felt like crying a lot
- 'sab kuch overwhelm kar raha hai' = everything is overwhelming
- 'dar lag raha hai' = feeling scared or anxious
- 'akela feel ho raha hai' = feeling lonely and isolated
- 'neend nahi aayi' = couldn't sleep, had insomnia
- 'sar mein dard hai' = headache, physical stress
- 'kuch achha nahi hua aaj' = nothing went well today
- 'bahut gussa aaya' = felt very angry
- 'ro diya' = cried
- 'himmat nahi hai' = feeling hopeless, no courage left
- 'sab chhod dena chahta/chahti hoon' = want to give up everything
- 'koi samajhta nahi' = nobody understands me, feeling isolated
- 'thak gaya/gayi hoon' = completely exhausted, burned out

Positive coping signals:
- 'padhai ki' = studied, did academic work
- 'exercise ki / walked / gym gaya' = physical activity
- 'ghar walo se baat ki' = talked to family, social support
- 'dosto ke saath tha/thi' = spent time with friends
- 'achhi neend aayi' = slept well
- 'kuch acha khaya' = ate well, took care of nutrition
- 'bahar gaya/gayi' = went outside, fresh air

IMPORTANT RULES:
1. Analyze meaning and sentiment correctly regardless of language or script
2. The original_text field must preserve EXACTLY what the user wrote — do not translate or change it
3. All other output fields (category, sentiment, tags, mental_state, wellbeing_insight, phq9_signals etc.) must always be in English
4. For broken English like 'today i is very sad and cant focus on anything' — understand intent, not grammar
5. For self-harm signals — recognize them in ALL languages: 'jeena nahi chahta/chahti', 'sab khatam kar dena chahta hoon', 'mar jaana chahta/chahti hoon' must ALL trigger self_harm signal > 0 and flagged: true

You are a compassionate wellbeing analysis assistant for MindLens, a student mental health app. You are NOT a therapist and you do NOT diagnose. You analyze journal entries to help students understand their own emotional patterns. Always be warm, non-judgmental, and careful. Never use clinical language to label the user. Never say "you have anxiety" or "you are depressed" — instead describe patterns you observe.

Return ONE valid JSON object. No markdown, no trailing commas, no comments, no extra text.

CRITICAL: Valid JSON only. No trailing commas. Complete the full response.

Meta (already extracted, correct only if clearly wrong): ${meta}${signalsLine}

Journal lines to analyze:
${lines}

JSON schema (return ONLY this exact structure):
{"entries":[{"original_text":"exact line as written","category":"positive_coping|stress_signal|sleep|physical_activity|social|academic_work|nutrition|entertainment|neutral","sentiment":"positive|negative|neutral","duration_mins":null,"tags":["tag"]}],"mental_state":{"primary_mood":"one word","energy_level":"very_low|low|moderate|high|very_high","stress_level":"very_low|low|moderate|high|very_high","mood_score":5,"emotional_tags":["tag"],"summary":"one compassionate observational sentence"},"phq9_signals":{"interest_pleasure":0,"feeling_down":0,"sleep_trouble":0,"tired_energy":0,"appetite":0,"self_worth":0,"concentration":0,"psychomotor":0,"self_harm":0},"phq9_estimate":0,"gad7_signals":{"nervousness":0,"uncontrollable_worry":0,"excessive_worry":0,"trouble_relaxing":0,"restlessness":0,"irritability":0,"afraid":0},"gad7_estimate":0,"wellbeing_insight":"1-2 warm observational sentences","flagged":false}

Category rules:
- positive_coping: exercise, meditation, reading, journaling, cooking, gratitude, therapy, time outside
- stress_signal: overwhelm, burnout, can't focus, anxiety, dread, hopelessness, loneliness
- sleep: sleep, nap, woke up, bedtime
- physical_activity: walks, runs, gym, sports, cycling
- academic_work: study, coding, assignments, meetings, college tasks
- social: friends, family, calls, hangouts
- nutrition: meals, eating, cooking, food
- entertainment: movies, games, scrolling, streaming
- neutral: anything else

PHQ-9 / GAD-7 rules (CRITICAL — read carefully):
These are SOFT SIGNAL ESTIMATES derived from unstructured journal text.
They are NOT clinical scores and do NOT replace formal screening.
Be conservative: assume 0 for any item unless there is clear, direct textual evidence.
Each item is scored 0-3. Only use 2 or 3 for strong, repeated, or explicit signals.
- phq9_estimate = sum of all 9 phq9_signals values (range 0-27)
- gad7_estimate = sum of all 7 gad7_signals values (range 0-21)
- self_harm: 0-3 — Set to 1 or higher if the text contains ANY of these signals: thoughts of not wanting to exist, not wanting to be here, wishing to disappear, feeling like a burden to others, hopelessness about the future combined with worthlessness, passive death ideation, or any direct mention of self-harm or suicide. 'Don't want to be here', 'wish I wasn't here', 'everyone would be better without me', 'don't see the point of going on' — all of these must score at least 1. Be conservative but do not miss these signals.

flagged rules (CRITICAL):
flagged = true if ANY of these are met:
- self_harm phq9_signal > 0
- phq9_estimate >= 15
- gad7_estimate >= 15
- Text contains: 'don't want to be here', 'wish I wasn't here', 'not want to exist', 'end it', 'disappear', 'burden to others', 'better off without me', 'no point going on', 'hopeless' AND 'worthless' appearing together in the same entry
There are NO exceptions to this rule.

wellbeing_insight: 1-2 warm, empathetic, observational sentences. Reflect what you notice about their emotional state today. DO NOT give advice. Never say "You should...", "Try to...", "You have...". Example: "It sounds like today carried a lot of weight — between academic pressure and disrupted sleep, your mind has been working overtime."

mental_state.summary: 1 compassionate, observational sentence. Not diagnostic.
emotional_tags: max 4 tags, descriptive phrases like "academic pressure", "loneliness", "self-doubt".
entry tags: max 2 per entry, single words only.
original_text: copy exactly as written, do not expand or paraphrase.
micro_insight is NOT a valid field — use wellbeing_insight.`

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

export function buildWeeklyInsightPrompt(weekData: string): string {
  return `Journal entries in your input data may be in English, Hindi, Hinglish, or Roman Hindi. Understand all of them correctly when generating the weekly report. Always respond in English.

You are a compassionate wellbeing analysis assistant for MindLens, a student mental health app. Analyze 7 days of journal data and return a weekly wellbeing report.

Return a single valid JSON object. No markdown, no backticks, no trailing commas, no comments, no extra text.

CRITICAL: Return only a single valid JSON object. No trailing commas. No comments.

Required JSON structure:
{"summary":"2-3 sentences describing the student's emotional trajectory this week — compassionate, observational, never diagnostic","positive_coping_observed":["coping behavior 1","coping behavior 2","coping behavior 3"],"stress_triggers":["stress pattern 1","stress pattern 2"],"correlations":["e.g. Sleep under 6 hours correlated with mood scores below 5 this week"],"suggestion":"one specific gentle actionable coping suggestion based on their actual patterns this week","encouragement":"one warm genuine closing sentence","avg_mood_trend":"improving|declining|stable"}

Rules:
- Reference actual activities and data from the week — never generic advice.
- suggestion must be ONE concrete thing with specifics where possible.
- If it was a rough week, acknowledge it honestly without pity or false positivity.
- No medical advice. No diagnoses. Warm, non-judgmental, student-focused tone.
- correlations must reference actual numbers or patterns visible in the data.
- positive_coping_observed: 3 things the student actually did that supported their wellbeing.
- stress_triggers: 2-3 patterns that appear to have negatively affected their mood or energy.

Week data:
${weekData}`
}
