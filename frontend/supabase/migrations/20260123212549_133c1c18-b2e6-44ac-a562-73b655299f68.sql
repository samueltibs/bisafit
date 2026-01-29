-- Add last_plan_mode to nutrition_profiles to track which type of plan was last generated
ALTER TABLE public.nutrition_profiles 
ADD COLUMN IF NOT EXISTS last_plan_mode text DEFAULT 'generic'::text;

-- Add comment explaining the column
COMMENT ON COLUMN public.nutrition_profiles.last_plan_mode IS 'Tracks the last plan generation mode: generic or ingredients';