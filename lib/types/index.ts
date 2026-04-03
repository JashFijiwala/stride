// Database table interfaces

export interface Profile {
  id: string
  name: string | null
  email: string | null
  timezone: string
  created_at: string
  updated_at: string
}

export interface DailyLog {
  id: string
  user_id: string
  log_date: string
  raw_text: string
  self_rating: number | null
  weight_kg: number | null
  mood_emoji: string | null
  ai_parsed: boolean
  created_at: string
  updated_at: string
}

export type EntryCategory =
  | 'sleep'
  | 'nutrition'
  | 'exercise'
  | 'personal-growth'
  | 'work'
  | 'entertainment'
  | 'digital-wellness'
  | 'discipline'
  | 'health'
  | 'social'
  | 'other'

export type Sentiment = 'positive' | 'negative' | 'neutral'

export interface ParsedEntry {
  id: string
  daily_log_id: string
  user_id: string
  original_text: string
  category: EntryCategory
  sentiment: Sentiment
  duration_mins: number | null
  tags: string[]
  created_at: string
}

export type EnergyLevel = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high'
export type StressLevel = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high'

export interface MentalState {
  id: string
  daily_log_id: string
  user_id: string
  primary_mood: string
  energy_level: EnergyLevel
  stress_level: StressLevel
  mood_score: number
  emotional_tags: string[]
  summary: string
  created_at: string
}

export interface Habit {
  id: string
  user_id: string
  habit_name: string
  habit_type: Sentiment
  category: EntryCategory
  total_occurrences: number
  current_streak: number
  longest_streak: number
  last_logged: string | null
  avg_rating_with: number | null
  avg_rating_without: number | null
  created_at: string
  updated_at: string
}

export interface WeeklyInsight {
  id: string
  user_id: string
  week_start: string
  week_end: string
  avg_rating: number | null
  avg_mood_score: number | null
  positive_count: number
  negative_count: number
  neutral_count: number
  top_wins: string[]
  areas_to_watch: string[]
  correlations: string[]
  suggestion: string | null
  summary: string | null
  created_at: string
}

export interface MonthlyInsight {
  id: string
  user_id: string
  month_year: string
  avg_rating: number | null
  avg_mood_score: number | null
  total_entries: number
  best_day: string | null
  worst_day: string | null
  habits_formed: string[]
  habits_declining: string[]
  weight_trend: string | null
  sleep_trend: string | null
  mood_trend: string | null
  summary: string | null
  created_at: string
}

export interface UserSummary {
  user_id: string
  avg_wake_time: string | null
  avg_sleep_time: string | null
  avg_rating: number | null
  avg_mood_score: number | null
  rating_trend: 'improving' | 'declining' | 'stable' | null
  mood_trend: 'improving' | 'declining' | 'stable' | null
  top_positive_habits: string[]
  top_negative_habits: string[]
  consistency_score: number
  total_days_logged: number
  summary_text: string | null
  updated_at: string
}

// AI response types

export interface ParsedEntryAI {
  original_text: string
  category: EntryCategory
  sentiment: Sentiment
  duration_mins: number | null
  tags: string[]
}

export interface MentalStateAI {
  primary_mood: string
  energy_level: EnergyLevel
  stress_level: StressLevel
  mood_score: number
  emotional_tags: string[]
  summary: string
}

export interface AIParseResult {
  entries: ParsedEntryAI[]
  mental_state: MentalStateAI
  micro_insight: string
  corrections: {
    wake_time: string | null
    sleep_time: string | null
    weight_kg: number | null
  }
}

export interface LocalParserResult {
  wake_time: string | null
  sleep_time: string | null
  weight_kg: number | null
  self_rating: number | null
  lines: string[]
  durations: Record<string, number>
}

// Component prop types

export interface JournalInputProps {
  existingLog?: DailyLog | null
  onSaved: (log: DailyLog, parsed: AIParseResult) => void
}

export interface ParsedEntryViewProps {
  log: DailyLog
  entries: ParsedEntry[]
  mentalState: MentalState | null
  microInsight: string | null
  onEdit: () => void
}

export interface NavTab {
  href: string
  label: string
  icon: string
}

// Zustand store types

export interface AppState {
  user: Profile | null
  setUser: (user: Profile | null) => void
  todayLog: DailyLog | null
  setTodayLog: (log: DailyLog | null) => void
  todayParsed: ParsedEntry[]
  setTodayParsed: (entries: ParsedEntry[]) => void
  todayMentalState: MentalState | null
  setTodayMentalState: (state: MentalState | null) => void
}
