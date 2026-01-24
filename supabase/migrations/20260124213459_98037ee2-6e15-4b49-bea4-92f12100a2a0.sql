-- Add country column to users_profile table
-- Stores ISO 3166-1 alpha-2 country code (e.g., 'US', 'GB', 'DE')
ALTER TABLE public.users_profile 
ADD COLUMN country text NULL;