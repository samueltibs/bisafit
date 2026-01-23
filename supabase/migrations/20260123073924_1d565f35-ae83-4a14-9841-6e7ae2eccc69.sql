-- Add new columns to nutrition_profiles for Nutrition AI v1
ALTER TABLE public.nutrition_profiles
ADD COLUMN IF NOT EXISTS nutrition_goal_style text DEFAULT 'simple',
ADD COLUMN IF NOT EXISTS cuisine_preferences_json jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS meals_per_day integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS snacks_per_day integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS budget_level text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS targets_json jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS meal_plan_json jsonb DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.nutrition_profiles.nutrition_goal_style IS 'simple or macros - determines display detail level';
COMMENT ON COLUMN public.nutrition_profiles.cuisine_preferences_json IS 'Array of cuisine preferences e.g. ["American", "Mediterranean", "Indian"]';
COMMENT ON COLUMN public.nutrition_profiles.targets_json IS 'AI-generated nutrition targets including calories_target, protein_g, etc.';
COMMENT ON COLUMN public.nutrition_profiles.meal_plan_json IS 'AI-generated 7-day meal plan with grocery list';