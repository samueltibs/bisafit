-- Add language preference to users_profile
-- Stores ISO 639-1 language code (e.g., 'en', 'lg', 'sw') or 'auto' for device language
ALTER TABLE public.users_profile 
ADD COLUMN IF NOT EXISTS language text DEFAULT 'auto';

-- Add comment for documentation
COMMENT ON COLUMN public.users_profile.language IS 'User preferred language: ISO 639-1 code (en, lg, sw) or auto for device language';