-- Add coach_voice column to users_profile
-- Options: 'male', 'female' (default: 'female')
ALTER TABLE public.users_profile 
ADD COLUMN coach_voice text DEFAULT 'female'::text;

-- Add check constraint for valid values
ALTER TABLE public.users_profile
ADD CONSTRAINT valid_coach_voice CHECK (coach_voice IN ('male', 'female'));