-- Add unit_preference column to users_profile
ALTER TABLE public.users_profile 
ADD COLUMN IF NOT EXISTS unit_preference text DEFAULT 'metric';