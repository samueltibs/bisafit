-- Add workout_days jsonb column for storing selected workout days
ALTER TABLE public.users_profile 
ADD COLUMN IF NOT EXISTS workout_days jsonb DEFAULT '["Monday","Wednesday","Thursday","Friday"]'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN public.users_profile.workout_days IS 'Array of day names when user wants to workout (e.g., ["Monday", "Wednesday", "Friday"])';