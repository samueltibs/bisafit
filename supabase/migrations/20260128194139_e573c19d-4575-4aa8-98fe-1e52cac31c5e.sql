-- Create daily_progress table for tracking non-scale progress metrics
CREATE TABLE public.daily_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Consistency metrics
  workouts_completed INTEGER NOT NULL DEFAULT 0,
  workouts_planned INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  
  -- Active time
  active_minutes INTEGER NOT NULL DEFAULT 0,
  
  -- Strength signals (JSON with exercise-level improvements)
  strength_signals JSONB DEFAULT '[]'::jsonb,
  
  -- Endurance signals (JSON with duration, rest, volume improvements)
  endurance_signals JSONB DEFAULT '{}'::jsonb,
  
  -- Energy level (1-5 scale, optional)
  energy_level INTEGER CHECK (energy_level IS NULL OR (energy_level >= 1 AND energy_level <= 5)),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure one entry per user per day
  UNIQUE (user_id, date)
);

-- Create index for efficient queries
CREATE INDEX idx_daily_progress_user_date ON public.daily_progress(user_id, date DESC);

-- Enable RLS
ALTER TABLE public.daily_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own daily progress"
  ON public.daily_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own daily progress"
  ON public.daily_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own daily progress"
  ON public.daily_progress FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own daily progress"
  ON public.daily_progress FOR DELETE
  USING (user_id = auth.uid());

-- Add personal_bests table for tracking exercise PRs
CREATE TABLE public.personal_bests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  
  -- Best metrics
  max_weight_kg NUMERIC,
  max_reps INTEGER,
  max_sets INTEGER,
  best_volume NUMERIC, -- sets * reps * weight
  
  -- When the PR was set
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  workout_session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- One record per user per exercise
  UNIQUE (user_id, exercise_name)
);

-- Create index for efficient queries
CREATE INDEX idx_personal_bests_user ON public.personal_bests(user_id);

-- Enable RLS
ALTER TABLE public.personal_bests ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own personal bests"
  ON public.personal_bests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own personal bests"
  ON public.personal_bests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own personal bests"
  ON public.personal_bests FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own personal bests"
  ON public.personal_bests FOR DELETE
  USING (user_id = auth.uid());

-- Add longest_streak column to users_profile
ALTER TABLE public.users_profile 
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;

-- Trigger to update updated_at
CREATE TRIGGER update_daily_progress_updated_at
  BEFORE UPDATE ON public.daily_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_personal_bests_updated_at
  BEFORE UPDATE ON public.personal_bests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();