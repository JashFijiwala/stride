import type { LocalParserResult, EntryCategory } from '@/lib/types'

// ─── Time helpers ─────────────────────────────────────────────────────────────

function parseTimeString(raw: string, isWake = true): string | null {
  // Normalise spacing and case
  const s = raw.trim().toLowerCase().replace(/\s+/g, '')

  let hours = -1
  let mins = 0
  let isPm: boolean | null = null

  // Detect am/pm suffix
  if (s.endsWith('am')) isPm = false
  else if (s.endsWith('pm')) isPm = true

  const digits = s.replace(/[^0-9:]/g, '')

  if (digits.includes(':')) {
    const [h, m] = digits.split(':').map(Number)
    hours = h
    mins = m || 0
  } else if (digits.length <= 2) {
    hours = Number(digits)
    mins = 0
  } else if (digits.length === 3) {
    // e.g. "815" → 8:15, "130" → 1:30
    hours = Number(digits[0])
    mins = Number(digits.slice(1))
  } else if (digits.length === 4) {
    // e.g. "0815" → 8:15, "1130" → 11:30
    hours = Number(digits.slice(0, 2))
    mins = Number(digits.slice(2))
  }

  if (hours < 0 || hours > 23 || mins < 0 || mins > 59) return null

  // Resolve am/pm
  if (isPm === true && hours < 12) hours += 12
  if (isPm === false && hours === 12) hours = 0

  // Heuristic: if no am/pm given
  if (isPm === null) {
    if (isWake) {
      // Wake times: 1-11 likely AM, 12+ stays
      if (hours >= 1 && hours <= 11) {
        /* keep as-is (morning) */
      }
    } else {
      // Sleep times: 1-6 likely past midnight (next day)
      // hours 7-11 are unlikely sleep times → force PM
      // hours 12+ fine
      if (hours >= 7 && hours <= 11) hours += 12
    }
  }

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

// ─── Extractors ───────────────────────────────────────────────────────────────

export function extractWakeTime(text: string): string | null {
  const patterns = [
    /(?:woke|wake|woken|got up|gotten up|up)\s+(?:at|around|by|@)\s*([\d:amp]+)/i,
    /(?:woke|wake|gotten up|got up)\s+(?:up\s+)?(?:at|around|by|@)\s*([\d:amp]+)/i,
    /wake\s+up\s+time[:\-–]?\s*([\d:amp]+)/i,
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m) {
      const t = parseTimeString(m[1], true)
      if (t) return t
    }
  }
  return null
}

export function extractSleepTime(text: string): string | null {
  const patterns = [
    /(?:slept?|went to bed|sleep|bed)\s+(?:at|around|by|@|till|until)\s*([\d:amp]+)/i,
    /(?:went to sleep|fall asleep|fell asleep)\s+(?:at|around|by|@)\s*([\d:amp]+)/i,
    /(?:sleep|slept?)\s+at\s*([\d:amp]+)/i,
    /bed\s+(?:by|at|@)\s*([\d:amp]+)/i,
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m) {
      const t = parseTimeString(m[1], false)
      if (t) return t
    }
  }
  return null
}

export function extractWeight(text: string): number | null {
  const patterns = [
    /weight\s*(?:at\s*start)?\s*[-:–]?\s*([\d.]+)\s*kg/i,
    /([\d.]+)\s*kg/i,
    /weight\s*[-:–]?\s*([\d.]+)/i,
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m) {
      const val = parseFloat(m[1])
      if (!isNaN(val) && val > 20 && val < 300) return val
    }
  }
  return null
}

export function extractRating(text: string): number | null {
  const patterns = [
    /rating\s*[-:–]?\s*(\d{1,2})\s*\/\s*10/i,
    /(\d{1,2})\s*\/\s*10/,
    /rating\s*[-:–]?\s*(\d{1,2})\b/i,
    /day\s+rating\s*[-:–]?\s*(\d{1,2})/i,
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m) {
      const val = parseInt(m[1], 10)
      if (val >= 1 && val <= 10) return val
    }
  }
  return null
}

export function parseDuration(fragment: string): number | null {
  let total = 0
  const hourMatch = fragment.match(/([\d.]+)\s*(?:hours?|hrs?|h\b)/i)
  const minMatch = fragment.match(/([\d.]+)\s*(?:minutes?|mins?|m\b)/i)
  if (hourMatch) total += Math.round(parseFloat(hourMatch[1]) * 60)
  if (minMatch) total += Math.round(parseFloat(minMatch[1]))
  return total > 0 ? total : null
}

// ─── Line categoriser ─────────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Array<{ re: RegExp; cat: EntryCategory }> = [
  { re: /\b(?:read|reading|book|books)\b/i, cat: 'personal-growth' },
  { re: /\b(?:walk|walking|walked|run|running|ran|jog|gym|exercise|workout|cycling|swim)\b/i, cat: 'exercise' },
  { re: /\b(?:breakfast|lunch|dinner|ate|eat|eating|food|snack|meal|cook|cooked|cooking)\b/i, cat: 'nutrition' },
  { re: /\b(?:sleep|slept|nap|napped|woke|woken|waking|bed|bedtime)\b/i, cat: 'sleep' },
  { re: /\b(?:screen|phone|scroll|scrolling|social media|instagram|twitter|youtube|tiktok)\b/i, cat: 'digital-wellness' },
  { re: /\b(?:headache|sick|pain|medicine|migraine|fever|ill|nausea|doctor)\b/i, cat: 'health' },
  { re: /\b(?:study|studying|dsa|coding|code|work|project|meeting|office|task)\b/i, cat: 'work' },
  { re: /\b(?:movie|film|show|series|watched|cricket|poker|gaming|game|played|stream)\b/i, cat: 'entertainment' },
  { re: /\b(?:meditation|meditate|yoga|journal|pray|prayer|gratitude)\b/i, cat: 'discipline' },
  { re: /\b(?:friend|family|call|chat|met|hangout|party|social)\b/i, cat: 'social' },
]

export function categoriseLine(line: string): EntryCategory {
  for (const { re, cat } of CATEGORY_KEYWORDS) {
    if (re.test(line)) return cat
  }
  return 'other'
}

// ─── Meta-line filter ─────────────────────────────────────────────────────────

const META_LINE_RE = /^\s*(?:(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+)?(?:\d{6,8}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d+\s*(?:\/|\\)\s*\d+\s*(?:\/|\\)\s*\d+)?\s*$|rating\s*[-:–]|weight\s*(?:at\s*start)?\s*[-:–]|^\s*$/i

export function isMetaLine(line: string): boolean {
  if (META_LINE_RE.test(line)) return true
  if (/^\d{1,2}\s*\/\s*10\s*$/.test(line.trim())) return true
  if (/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(line.trim()) && line.trim().length < 20) return true
  return false
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function runLocalParser(rawText: string): LocalParserResult {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  // Durations per line
  const durations: Record<string, number> = {}
  for (const line of lines) {
    const d = parseDuration(line)
    if (d) durations[line] = d
  }

  return {
    wake_time: extractWakeTime(rawText),
    sleep_time: extractSleepTime(rawText),
    weight_kg: extractWeight(rawText),
    self_rating: extractRating(rawText),
    lines: lines.filter((l) => !isMetaLine(l)),
    durations,
  }
}
