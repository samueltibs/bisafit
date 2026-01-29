-- Add email preferences column to users_profile
ALTER TABLE public.users_profile 
ADD COLUMN email_preferences_json jsonb DEFAULT '["product_updates", "store_launch"]'::jsonb;

-- Add column comment for documentation
COMMENT ON COLUMN public.users_profile.email_preferences_json IS 'User preferences for optional emails: product_updates, store_launch, feature_announcements';

-- Create email preference change log table for compliance
CREATE TABLE public.email_preference_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  previous_email_consent boolean,
  new_email_consent boolean,
  previous_preferences jsonb,
  new_preferences jsonb,
  change_source text DEFAULT 'app'::text -- 'app', 'unsubscribe_link', 'admin'
);

-- Enable RLS on the log table
ALTER TABLE public.email_preference_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own preference change history
CREATE POLICY "Users can view own email preference log"
ON public.email_preference_log
FOR SELECT
USING (user_id = auth.uid());

-- Only system (service role) can insert logs - users cannot directly insert
-- This ensures logs are created through proper channels