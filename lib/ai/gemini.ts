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
      maxOutputTokens: 8192,
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

  // Attempt 4: truncation recovery — find the last complete entry object
  // and close the JSON manually so partial results are returned
  console.warn('[Gemini] JSON appears truncated, attempting partial recovery')
  const jsonStart = cleaned.indexOf('{')
  if (jsonStart === -1) {
    throw new Error(`No JSON found in Gemini response. Raw: ${text.slice(0, 300)}`)
  }

  const partial = cleaned.slice(jsonStart)

  // Find the last complete entry: locate the last "}," or "}" that closes
  // an entries element before the truncation point
  const lastCompleteEntry = partial.lastIndexOf('"}')
  if (lastCompleteEntry === -1) {
    throw new Error(`Cannot recover truncated JSON. Raw: ${text.slice(0, 300)}`)
  }

  // Build a minimal valid JSON by closing off the entries array and
  // filling in empty defaults for the remaining required fields
  const recovered =
    partial.slice(0, lastCompleteEntry + 2) +
    `],"mental_state":{"primary_mood":"unknown","energy_level":"moderate","stress_level":"moderate","mood_score":5,"emotional_tags":[],"summary":"Analysis was incomplete due to response length."},"micro_insight":"Entry saved. Full analysis was unavailable.","corrections":{"wake_time":null,"sleep_time":null,"weight_kg":null}}`

  try {
    const result = JSON.parse(recovered)
    console.warn('[Gemini] Partial recovery succeeded with', result.entries?.length ?? 0, 'entries')
    return result
  } catch {
    throw new Error(`Truncation recovery failed. Raw: ${text.slice(0, 300)}`)
  }
}
