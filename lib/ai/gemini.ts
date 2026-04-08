import { GoogleGenerativeAI } from '@google/generative-ai'

const MODEL_NAME = 'gemini-2.5-flash-lite'

let _genAI: GoogleGenerativeAI | null = null

function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    const key = process.env.GEMINI_API_KEY
    if (!key) throw new Error('GEMINI_API_KEY is not set')
    _genAI = new GoogleGenerativeAI(key)
  }
  return _genAI
}

export async function callGemini(prompt: string): Promise<string> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      maxOutputTokens: 16384,
      temperature: 0.1,
    },
  })

  const result = await model.generateContent(prompt)
  return result.response.text()
}

export function extractJSON(text: string): unknown {
  console.log('[Gemini raw response]:', text)

  // Strip markdown code fences
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
  console.warn('[Gemini] JSON appears truncated, attempting partial recovery')
  const jsonStart = cleaned.indexOf('{')
  if (jsonStart === -1) {
    throw new Error(`No JSON found in Gemini response. Raw: ${text.slice(0, 300)}`)
  }

  const partial = cleaned.slice(jsonStart)

  // Defaults appended after the last complete entry to close the structure
  const TAIL = `],"mental_state":{"primary_mood":"unknown","energy_level":"moderate","stress_level":"moderate","mood_score":5,"emotional_tags":[],"summary":"Analysis was incomplete due to response length."},"micro_insight":"Entry saved. Full analysis was unavailable.","corrections":{"wake_time":null,"sleep_time":null,"weight_kg":null}}`

  // Strategy A: cut after last `"}` — handles entries ending with a string field
  const cutA = partial.lastIndexOf('"}')

  // Strategy B: cut after last `}` anywhere — handles entries ending with
  // number, null, or array values (e.g. "duration_mins":30} or "tags":["x"]})
  let cutB = -1
  for (let i = partial.length - 1; i >= 0; i--) {
    if (partial[i] === '}') { cutB = i; break }
  }

  // Strategy C: auto-close by counting unmatched brackets, then parse.
  // Walks the string tracking open braces/brackets outside of strings.
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
    // Remove trailing commas introduced by the cut before trying to parse
    const normalized = candidate.replace(/,(\s*[}\]])/g, '$1')
    try {
      const result = JSON.parse(normalized)
      console.warn(`[Gemini] Partial recovery succeeded via strategy ${label} with`, result.entries?.length ?? 0, 'entries')
      return result
    } catch {
      // try next strategy
    }
  }

  throw new Error(`Truncation recovery failed after all strategies. Raw: ${text.slice(0, 300)}`)
}
