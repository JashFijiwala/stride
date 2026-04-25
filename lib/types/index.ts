// Database table interfaces

export interface Profile {
  id: string
  name: string | null
  email: string | null
  timezone: string
  current_log_date: string | null
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
  sleep_hours: number | null
  energy_level: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high' | null
  created_at: string
  updated_at: string
}

export type EntryCategory =
  | 'positive_coping'
  | 'stress_signal'
  | 'sleep'
  | 'physical_activity'
  | 'social'
  | 'academic_work'
  | 'nutrition'
  | 'entertainment'
  | 'neutral'

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

export interface PHQ9Signals {
  interest_pleasure: number
  feeling_down: number
  sleep_trouble: number
  tired_energy: number
  appetite: number
  self_worth: number
  concentration: number
  psychomotor: number
  self_harm: number
}

export interface GAD7Signals {
  nervousness: number
  uncontrollable_worry: number
  excessive_worry: number
  trouble_relaxing: number
  restlessness: number
  irritability: number
  afraid: number
}

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
  phq9_signals: PHQ9Signals
  gad7_signals: GAD7Signals
  phq9_estimate: number | null
  gad7_estimate: number | null
  flagged: boolean
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

export interface ScreeningResult {
  id: string
  user_id: string
  test_type: 'phq9' | 'gad7'
  question_scores: Record<string, number>
  total_score: number
  severity: 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe'
  flagged: boolean
  created_at: string
}

export interface CopingSession {
  id: string
  user_id: string
  exercise_type: 'breathing' | 'cbt_reframe' | 'grounding_54321' | 'muscle_relaxation' | 'journaling' | 'mindfulness'
  completed: boolean
  duration_seconds: number | null
  notes: string | null
  created_at: string
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
  wellbeing_insight: string
  corrections?: {
    wake_time: string | null
    sleep_time: string | null
    weight_kg: number | null
  }
  detected_habits?: string[]
  phq9_signals: PHQ9Signals
  phq9_estimate: number
  gad7_signals: GAD7Signals
  gad7_estimate: number
  flagged: boolean
}

export interface LocalParserResult {
  wake_time: string | null
  sleep_time: string | null
  weight_kg: number | null
  self_rating: number | null
  lines: string[]
  durations: Record<string, number>
  stress_keywords_found: string[]
  positive_coping_found: string[]
  isolation_signals_found: string[]
  stress_detected: boolean
  positive_coping_detected: boolean
  isolation_detected: boolean
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
  wellbeingInsight: string | null
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
  currentName: string | null
  setCurrentName: (name: string) => void
  todayLog: DailyLog | null
  setTodayLog: (log: DailyLog | null) => void
  todayParsed: ParsedEntry[]
  setTodayParsed: (entries: ParsedEntry[]) => void
  todayMentalState: MentalState | null
  setTodayMentalState: (state: MentalState | null) => void
}
