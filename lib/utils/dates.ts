import { format, subDays, getDay, isToday, parseISO } from 'date-fns'

export interface CalendarDay {
  date: Date
  dateStr: string      // 'yyyy-MM-dd'
  isCurrentMonth: boolean
  isToday: boolean
  isPadding: boolean   // belongs to prev/next month
}

/**
 * Returns a 42-cell (6 × 7) grid for the given year/month (0-indexed month).
 * Weeks start on Sunday.
 */
export function getCalendarDays(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = getDay(firstDay) // 0 = Sunday

  const days: CalendarDay[] = []

  // Padding from previous month
  for (let i = startDow - 1; i >= 0; i--) {
    const date = subDays(firstDay, i + 1)
    days.push({
      date,
      dateStr: format(date, 'yyyy-MM-dd'),
      isCurrentMonth: false,
      isToday: isToday(date),
      isPadding: true,
    })
  }

  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d)
    days.push({
      date,
      dateStr: format(date, 'yyyy-MM-dd'),
      isCurrentMonth: true,
      isToday: isToday(date),
      isPadding: false,
    })
  }

  // Trailing padding to fill 42 cells
  const trailing = 42 - days.length
  for (let d = 1; d <= trailing; d++) {
    const date = new Date(year, month + 1, d)
    days.push({
      date,
      dateStr: format(date, 'yyyy-MM-dd'),
      isCurrentMonth: false,
      isToday: isToday(date),
      isPadding: true,
    })
  }

  return days
}

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function monthStartStr(year: number, month: number): string {
  return format(new Date(year, month, 1), 'yyyy-MM-dd')
}

export function monthEndStr(year: number, month: number): string {
  return format(new Date(year, month + 1, 0), 'yyyy-MM-dd')
}

export function formatDisplayDate(dateStr: string): string {
  return format(parseISO(dateStr), 'EEEE, MMMM d, yyyy')
}

export function formatShortDate(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d')
}
