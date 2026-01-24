-- Add program_start_date column to users_profile
-- This is the canonical anchor for the user's training timeline
ALTER TABLE public.users_profile 
ADD COLUMN IF NOT EXISTS program_start_date date;

-- Add a comment explaining the purpose
COMMENT ON COLUMN public.users_profile.program_start_date IS 'The date the user completed onboarding. Block 1 Day 1 starts on this date.';