-- Migration 2: Create new tables for MindLens mental health features
-- Run this in the Supabase SQL editor AFTER migration-1.sql

CREATE TABLE screening_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  test_type TEXT NOT NULL CHECK (test_type IN ('phq9', 'gad7')),
  question_scores JSONB NOT NULL,
  total_score INTEGER NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('minimal', 'mild', 'moderate', 'moderately_severe', 'severe')),
  flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE coping_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN (
    'breathing', 'cbt_reframe', 'grounding_54321',
    'muscle_relaxation', 'journaling', 'mindfulness'
  )),
  completed BOOLEAN DEFAULT FALSE,
  duration_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE screening_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE coping_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own screening results" ON screening_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own screening results" ON screening_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own coping sessions" ON coping_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coping sessions" ON coping_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own coping sessions" ON coping_sessions
  FOR UPDATE USING (auth.uid() = user_id);
