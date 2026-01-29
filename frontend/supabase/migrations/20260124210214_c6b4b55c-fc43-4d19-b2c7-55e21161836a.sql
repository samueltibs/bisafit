-- Add has_seen_intro_tour column to users_profile
ALTER TABLE public.users_profile
ADD COLUMN has_seen_intro_tour boolean DEFAULT false;