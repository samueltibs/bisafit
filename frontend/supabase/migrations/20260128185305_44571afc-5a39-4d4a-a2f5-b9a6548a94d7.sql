-- Create workout_logs table for imported workouts from external sources
CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('bisafit', 'apple_health', 'google_fit')),
  external_id TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER NOT NULL,
  workout_type TEXT NOT NULL,
  calories_burned INTEGER,
  heart_rate_avg INTEGER,
  steps INTEGER,
  distance_meters NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_notes TEXT,
  linked_workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint for de-duplication (userId + source + externalId)
CREATE UNIQUE INDEX idx_workout_logs_dedup 
ON public.workout_logs (user_id, source, external_id) 
WHERE external_id IS NOT NULL;

-- Create index for querying by user and date
CREATE INDEX idx_workout_logs_user_date ON public.workout_logs (user_id, start_time DESC);

-- Enable RLS
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own workout logs"
ON public.workout_logs FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own workout logs"
ON public.workout_logs FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own workout logs"
ON public.workout_logs FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own workout logs"
ON public.workout_logs FOR DELETE
USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_workout_logs_updated_at
BEFORE UPDATE ON public.workout_logs
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add columns to users_profile for health platform connection status
ALTER TABLE public.users_profile 
ADD COLUMN IF NOT EXISTS apple_health_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_fit_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_health_sync_at TIMESTAMP WITH TIME ZONE;