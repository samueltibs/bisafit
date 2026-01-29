-- Add coach_tone column to users_profile
-- Options: 'gentle', 'balanced', 'direct' (default: 'balanced')
ALTER TABLE public.users_profile 
ADD COLUMN coach_tone text DEFAULT 'balanced'::text;

-- Add check constraint for valid values
ALTER TABLE public.users_profile
ADD CONSTRAINT valid_coach_tone CHECK (coach_tone IN ('gentle', 'balanced', 'direct'));