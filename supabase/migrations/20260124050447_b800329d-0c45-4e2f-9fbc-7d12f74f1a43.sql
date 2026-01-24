-- Create email_log table to track all transactional emails
CREATE TABLE public.email_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email_type text NOT NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  resend_id text,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  sent_at timestamp with time zone
);

-- Create index for efficient querying
CREATE INDEX idx_email_log_user_id ON public.email_log(user_id);
CREATE INDEX idx_email_log_email_type ON public.email_log(email_type);
CREATE INDEX idx_email_log_status ON public.email_log(status);

-- Enable Row Level Security
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own email logs
CREATE POLICY "Users can view own email logs"
  ON public.email_log
  FOR SELECT
  USING (user_id = auth.uid());

-- Add email_consent column to users_profile for unsubscribe tracking
ALTER TABLE public.users_profile
ADD COLUMN email_consent boolean DEFAULT true;

-- Add last_email_sent tracking
ALTER TABLE public.users_profile
ADD COLUMN welcome_email_sent boolean DEFAULT false;