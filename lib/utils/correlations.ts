export interface CorrelationResult {
  habit_name: string
  avg_with: number
  avg_without: number
  diff: number
  occurrences: number
}

/**
 * Filters the habits table for meaningful correlations:
 * - At least 5 occurrences
 * - Difference between avg_with and avg_without > 1.0
 * - Both averages must be present
 * Sorted by impact (largest diff first).
 */
export function filterCorrelations(
  habits: Array<{
    habit_name: string
    total_occurrences: number | null
    avg_rating_with: number | null
    avg_rating_without: number | null
  }>
): CorrelationResult[] {
  return habits
    .filter(
      (h) =>
        (h.total_occurrences ?? 0) >= 5 &&
        h.avg_rating_with !== null &&
        h.avg_rating_without !== null &&
        Math.abs((h.avg_rating_with ?? 0) - (h.avg_rating_without ?? 0)) > 1.0
    )
    .map((h) => ({
      habit_name: h.habit_name,
      avg_with: Math.round((h.avg_rating_with ?? 0) * 10) / 10,
      avg_without: Math.round((h.avg_rating_without ?? 0) * 10) / 10,
      diff: Math.round(((h.avg_rating_with ?? 0) - (h.avg_rating_without ?? 0)) * 10) / 10,
      occurrences: h.total_occurrences ?? 0,
    }))
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 5)
}

/**
 * Recomputes avg_rating_without for each habit by looking at all daily logs
 * and finding days the habit was NOT logged, then averaging those ratings.
 * Returns a map of habit_id → avg_rating_without.
 */
export function computeAvgRatingWithout(
  allLogs: Array<{ log_date: string; self_rating: number | null }>,
  habitLastLoggedDates: Set<string>
): number | null {
  const daysWithout = allLogs.filter(
    (l) => l.self_rating !== null && !habitLastLoggedDates.has(l.log_date)
  )
  if (daysWithout.length === 0) return null
  const sum = daysWithout.reduce((acc, l) => acc + (l.self_rating ?? 0), 0)
  return Math.round((sum / daysWithout.length) * 10) / 10
}
