import { format, subDays, parseISO } from 'date-fns'

/**
 * Given an array of log date strings (any order), returns the current
 * consecutive-day streak ending today or yesterday.
 */
export function calculateCurrentStreak(dates: string[]): number {
  if (dates.length === 0) return 0

  const dateSet = new Set(dates)
  const today = format(new Date(), 'yyyy-MM-dd')
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')

  // Streak must end today or yesterday to be "active"
  const anchor = dateSet.has(today)
    ? today
    : dateSet.has(yesterday)
      ? yesterday
      : null

  if (!anchor) return 0

  let streak = 0
  let cursor = parseISO(anchor)

  while (dateSet.has(format(cursor, 'yyyy-MM-dd'))) {
    streak++
    cursor = subDays(cursor, 1)
  }

  return streak
}

/**
 * Returns the longest ever streak from a set of logged dates.
 */
export function calculateLongestStreak(dates: string[]): number {
  if (dates.length === 0) return 0

  const sorted = [...dates].sort()  // ascending
  let longest = 1
  let current = 1

  for (let i = 1; i < sorted.length; i++) {
    const prev = parseISO(sorted[i - 1])
    const curr = parseISO(sorted[i])
    const diff = (curr.getTime() - prev.getTime()) / 86400000

    if (diff === 1) {
      current++
      longest = Math.max(longest, current)
    } else if (diff > 1) {
      current = 1
    }
    // diff === 0 means duplicate date — skip
  }

  return longest
}
