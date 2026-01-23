-- Add goal_secondary column to users_profile
ALTER TABLE public.users_profile 
ADD COLUMN IF NOT EXISTS goal_secondary text;

-- Add a comment describing allowed values
COMMENT ON COLUMN public.users_profile.goal_secondary IS 'Optional secondary fitness goal. Allowed values: fat_loss, muscle_gain, endurance, maintenance';