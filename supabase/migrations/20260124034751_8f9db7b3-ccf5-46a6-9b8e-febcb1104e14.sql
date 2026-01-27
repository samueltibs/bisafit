-- Add notification preferences columns to users_profile
ALTER TABLE public.users_profile 
ADD COLUMN IF NOT EXISTS notifications_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_types_json jsonb DEFAULT '["workout_reminders","meal_reminders","trial_reminders","general_updates"]'::jsonb;