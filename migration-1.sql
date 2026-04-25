-- Migration 1: Modify existing tables for MindLens mental health features
-- Run this in the Supabase SQL editor

ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS sleep_hours DECIMAL;

ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS energy_level TEXT
  CHECK (energy_level IN ('very_low', 'low', 'moderate', 'high', 'very_high'));

ALTER TABLE mental_states ADD COLUMN IF NOT EXISTS phq9_signals JSONB DEFAULT '{}';

ALTER TABLE mental_states ADD COLUMN IF NOT EXISTS gad7_signals JSONB DEFAULT '{}';

ALTER TABLE mental_states ADD COLUMN IF NOT EXISTS phq9_estimate INTEGER;

ALTER TABLE mental_states ADD COLUMN IF NOT EXISTS gad7_estimate INTEGER;

ALTER TABLE mental_states ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT FALSE;

ALTER TABLE user_summaries ADD COLUMN IF NOT EXISTS avg_stress_level TEXT;

ALTER TABLE user_summaries ADD COLUMN IF NOT EXISTS avg_phq9_estimate DECIMAL;

ALTER TABLE user_summaries ADD COLUMN IF NOT EXISTS avg_gad7_estimate DECIMAL;
