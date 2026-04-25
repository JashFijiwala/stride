import type { LocalParserResult, EntryCategory } from '@/lib/types'

// ─── Time helpers ─────────────────────────────────────────────────────────────

function parseTimeString(raw: string, isWake = true): string | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, '')

  let hours = -1
  let mins = 0
  let isPm: boolean | null = null

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
    hours = Number(digits[0])
    mins = Number(digits.slice(1))
  } else if (digits.length === 4) {
    hours = Number(digits.slice(0, 2))
    mins = Number(digits.slice(2))
  }

  if (hours < 0 || hours > 23 || mins < 0 || mins > 59) return null

  if (isPm === true && hours < 12) hours += 12
  if (isPm === false && hours === 12) hours = 0

  if (isPm === null) {
    if (isWake) {
      if (hours >= 1 && hours <= 11) { /* keep as-is */ }
    } else {
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
  { re: /\b(?:read|reading|book|books|meditat|yoga|journal|gratitude|therapy|counselor|deep breath)\b/i, cat: 'positive_coping' },
  { re: /\b(?:walk|walking|walked|run|running|ran|jog|gym|exercise|workout|cycling|swim)\b/i, cat: 'physical_activity' },
  { re: /\b(?:breakfast|lunch|dinner|ate|eat|eating|food|snack|meal|cook|cooked|cooking)\b/i, cat: 'nutrition' },
  { re: /\b(?:sleep|slept|nap|napped|woke|woken|waking|bed|bedtime)\b/i, cat: 'sleep' },
  { re: /\b(?:stressed|overwhelmed|anxious|anxiety|panic|burnout|burned out|exhausted|hopeless|helpless|worthless)\b/i, cat: 'stress_signal' },
  { re: /\b(?:study|studying|dsa|coding|code|work|project|meeting|office|task|assignment|class|college)\b/i, cat: 'academic_work' },
  { re: /\b(?:movie|film|show|series|watched|cricket|poker|gaming|game|played|stream)\b/i, cat: 'entertainment' },
  { re: /\b(?:friend|family|call|chat|met|hangout|party|social)\b/i, cat: 'social' },
]

export function categoriseLine(line: string): EntryCategory {
  for (const { re, cat } of CATEGORY_KEYWORDS) {
    if (re.test(line)) return cat
  }
  return 'neutral'
}

// ─── Meta-line filter ─────────────────────────────────────────────────────────

const META_LINE_RE = /^\s*(?:(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+)?(?:\d{6,8}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d+\s*(?:\/|\\)\s*\d+\s*(?:\/|\\)\s*\d+)?\s*$|rating\s*[-:–]|weight\s*(?:at\s*start)?\s*[-:–]|^\s*$/i

export function isMetaLine(line: string): boolean {
  if (META_LINE_RE.test(line)) return true
  if (/^\d{1,2}\s*\/\s*10\s*$/.test(line.trim())) return true
  if (/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(line.trim()) && line.trim().length < 20) return true
  return false
}

// ─── Wellbeing keyword lists ──────────────────────────────────────────────────

const STRESS_KEYWORDS = [
  'stressed', 'overwhelmed', 'anxious', 'anxiety', "can't sleep",
  "can't focus", 'worried', 'worrying', 'exhausted', 'burned out',
  'burnout', 'lonely', 'hopeless', 'helpless', 'crying', 'cried',
  'panic', 'panicking', 'pressure', 'dread', 'dreading',
  'too much', 'breaking down', 'falling apart', 'giving up',
  'numb', 'empty', 'pointless', 'worthless', 'hate myself',
]

const POSITIVE_COPING_KEYWORDS = [
  'exercised', 'worked out', 'walked', 'ran', 'jogged',
  'meditated', 'meditation', 'journaled', 'read', 'reading',
  'talked to friend', 'called family', 'cooked', 'slept well',
  'good sleep', 'deep sleep', 'cleaned', 'organized',
  'helped someone', 'volunteered', 'gratitude', 'grateful',
  'therapy', 'counselor', 'deep breath', 'breathed',
  'spent time outside', 'sunlight', 'fresh air',
]

const ISOLATION_KEYWORDS = [
  'alone all day', "didn't talk to anyone", 'no one to talk to',
  'stayed in room', "didn't go out", 'avoided people',
  'cancelled plans', 'skipped class', 'skipped college',
  "didn't leave", 'nobody', 'no friends', 'isolated',
]

function detectKeywords(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase()
  return keywords.filter((kw) => lower.includes(kw))
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function runLocalParser(rawText: string): LocalParserResult {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const durations: Record<string, number> = {}
  for (const line of lines) {
    const d = parseDuration(line)
    if (d) durations[line] = d
  }

  const stress_keywords_found = detectKeywords(rawText, STRESS_KEYWORDS)
  const positive_coping_found = detectKeywords(rawText, POSITIVE_COPING_KEYWORDS)
  const isolation_signals_found = detectKeywords(rawText, ISOLATION_KEYWORDS)

  return {
    wake_time: extractWakeTime(rawText),
    sleep_time: extractSleepTime(rawText),
    weight_kg: extractWeight(rawText),
    self_rating: extractRating(rawText),
    lines: lines.filter((l) => !isMetaLine(l)),
    durations,
    stress_keywords_found,
    positive_coping_found,
    isolation_signals_found,
    stress_detected: stress_keywords_found.length > 0,
    positive_coping_detected: positive_coping_found.length > 0,
    isolation_detected: isolation_signals_found.length > 0,
  }
}
