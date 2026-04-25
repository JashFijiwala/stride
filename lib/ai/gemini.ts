import Groq from 'groq-sdk'

const MODEL = 'llama-3.3-70b-versatile'

let _groq: Groq | null = null

function getGroq(): Groq {
  if (!_groq) {
    const key = process.env.GROQ_API_KEY
    if (!key) throw new Error('GROQ_API_KEY is not set')
    _groq = new Groq({ apiKey: key })
  }
  return _groq
}

export async function callGemini(prompt: string): Promise<string> {
  const groq = getGroq()

  // Split role preamble into system message; pass the rest as user content.
  // If the prompt starts with "You are", extract that paragraph as the system prompt.
  let systemPrompt = 'You are a JSON-only response assistant. Return only valid JSON. No markdown. No extra text.'
  let userPrompt = prompt

  const roleMatch = prompt.match(/^(You are[\s\S]+?\n\n)/)
  if (roleMatch) {
    systemPrompt = roleMatch[1].trim()
    userPrompt = prompt.slice(roleMatch[1].length)
  }

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.1,
    max_tokens: 8192,
    response_format: { type: 'json_object' },
  })

  return completion.choices[0].message.content ?? ''
}

export function extractJSON(text: string): unknown {
  console.log('[Groq raw response]:', text)

  // With response_format: json_object, Groq guarantees valid JSON.
  // These fallbacks remain as a safety net for edge cases.

  // Strip markdown code fences (shouldn't appear, but just in case)
  const stripped = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()

  // Attempt 1: direct parse
  try {
    return JSON.parse(stripped)
  } catch {
    // fall through
  }

  // Attempt 2: remove control chars + trailing commas, then parse
  const cleaned = stripped
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/,(\s*[}\]])/g, '$1')

  try {
    return JSON.parse(cleaned)
  } catch {
    // fall through
  }

  // Attempt 3: extract outermost { ... } block
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start !== -1 && end !== -1) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1))
    } catch {
      // fall through to truncation recovery
    }
  }

  // Attempt 4: truncation recovery — multiple strategies, most to least conservative
  console.warn('[Groq] JSON appears truncated, attempting partial recovery')
  const jsonStart = cleaned.indexOf('{')
  if (jsonStart === -1) {
    throw new Error(`No JSON found in Groq response. Raw: ${text.slice(0, 300)}`)
  }

  const partial = cleaned.slice(jsonStart)

  const TAIL = `],"mental_state":{"primary_mood":"unknown","energy_level":"moderate","stress_level":"moderate","mood_score":5,"emotional_tags":[],"summary":"Analysis was incomplete due to response length."},"phq9_signals":{"interest_pleasure":0,"feeling_down":0,"sleep_trouble":0,"tired_energy":0,"appetite":0,"self_worth":0,"concentration":0,"psychomotor":0,"self_harm":0},"phq9_estimate":0,"gad7_signals":{"nervousness":0,"uncontrollable_worry":0,"excessive_worry":0,"trouble_relaxing":0,"restlessness":0,"irritability":0,"afraid":0},"gad7_estimate":0,"wellbeing_insight":"Entry saved. Full analysis was unavailable.","flagged":false}`

  // Strategy A: cut after last `"}`
  const cutA = partial.lastIndexOf('"}')

  // Strategy B: cut after last `}` anywhere
  let cutB = -1
  for (let i = partial.length - 1; i >= 0; i--) {
    if (partial[i] === '}') { cutB = i; break }
  }

  // Strategy C: auto-close by counting unmatched brackets
  function autoClose(s: string): string {
    const stack: string[] = []
    let inStr = false
    let esc = false
    for (const ch of s) {
      if (esc) { esc = false; continue }
      if (ch === '\\' && inStr) { esc = true; continue }
      if (ch === '"') { inStr = !inStr; continue }
      if (inStr) continue
      if (ch === '{' || ch === '[') stack.push(ch)
      else if ((ch === '}' || ch === ']') && stack.length > 0) stack.pop()
    }
    return s + stack.map((c) => (c === '{' ? '}' : ']')).reverse().join('')
  }

  const candidates: Array<[string, string]> = [
    ['A (last string-terminated entry)', cutA !== -1 ? partial.slice(0, cutA + 2) + TAIL : ''],
    ['B (last any-entry close)', cutB !== -1 ? partial.slice(0, cutB + 1) + TAIL : ''],
    ['C (auto-close brackets)', autoClose(partial)],
  ]

  for (const [label, candidate] of candidates) {
    if (!candidate) continue
    const normalized = candidate.replace(/,(\s*[}\]])/g, '$1')
    try {
      const result = JSON.parse(normalized)
      console.warn(`[Groq] Partial recovery succeeded via strategy ${label} with`, result.entries?.length ?? 0, 'entries')
      return result
    } catch {
      // try next strategy
    }
  }

  throw new Error(`Truncation recovery failed after all strategies. Raw: ${text.slice(0, 300)}`)
}
