-- Add workout time scheduling and calendar sync fields to users_profile
ALTER TABLE public.users_profile
ADD COLUMN IF NOT EXISTS workout_time_preferences_json jsonb DEFAULT '{"default_time": "06:00", "fallback_duration_minutes": 60, "buffer_minutes": 5}'::jsonb,
ADD COLUMN IF NOT EXISTS calendar_sync_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS calendar_provider text DEFAULT NULL;

-- Add calendar_event_id to workouts table
ALTER TABLE public.workouts
ADD COLUMN IF NOT EXISTS calendar_event_id text DEFAULT NULL;