-- Add music settings fields to users_profile
ALTER TABLE public.users_profile
ADD COLUMN IF NOT EXISTS music_provider text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS music_playlist_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS music_playlist_name text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS music_autoplay boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS music_shuffle boolean DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN public.users_profile.music_provider IS 'Music streaming provider: spotify, apple_music, or none';
COMMENT ON COLUMN public.users_profile.music_playlist_id IS 'Default playlist ID for workout autoplay';
COMMENT ON COLUMN public.users_profile.music_playlist_name IS 'Display name of default playlist';
COMMENT ON COLUMN public.users_profile.music_autoplay IS 'Whether to auto-start music when workout begins';
COMMENT ON COLUMN public.users_profile.music_shuffle IS 'Whether to shuffle playlist on playback';