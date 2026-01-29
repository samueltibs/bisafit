-- Create push_devices table for storing device tokens
CREATE TABLE public.push_devices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_token text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create unique constraint on user_id + device_token to prevent duplicates
CREATE UNIQUE INDEX idx_push_devices_user_token ON public.push_devices(user_id, device_token);

-- Create index for active devices lookup
CREATE INDEX idx_push_devices_active ON public.push_devices(user_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;

-- RLS policies for push_devices
CREATE POLICY "Users can view own devices"
  ON public.push_devices FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can register own devices"
  ON public.push_devices FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own devices"
  ON public.push_devices FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own devices"
  ON public.push_devices FOR DELETE
  USING (user_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_push_devices_updated_at
  BEFORE UPDATE ON public.push_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create notifications_log table for tracking sent notifications
CREATE TABLE public.notifications_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  scheduled_for timestamp with time zone,
  sent_at timestamp with time zone,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed')),
  failure_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for notifications_log
CREATE INDEX idx_notifications_log_user ON public.notifications_log(user_id);
CREATE INDEX idx_notifications_log_status ON public.notifications_log(status) WHERE status = 'scheduled';
CREATE INDEX idx_notifications_log_scheduled ON public.notifications_log(scheduled_for) WHERE status = 'scheduled';

-- Enable RLS
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications_log (users can only view their own notifications)
CREATE POLICY "Users can view own notifications"
  ON public.notifications_log FOR SELECT
  USING (user_id = auth.uid());