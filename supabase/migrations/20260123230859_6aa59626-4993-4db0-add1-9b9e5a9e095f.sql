-- Create analytics_events table for tracking product funnels
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  platform TEXT NOT NULL DEFAULT 'web',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for querying by user and time
CREATE INDEX idx_analytics_events_user_time ON public.analytics_events (user_id, created_at DESC);

-- Create index for querying by event name
CREATE INDEX idx_analytics_events_name ON public.analytics_events (event_name);

-- Enable Row Level Security
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own events
CREATE POLICY "Users can insert own analytics events"
ON public.analytics_events
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can view their own events (for debug panel)
CREATE POLICY "Users can view own analytics events"
ON public.analytics_events
FOR SELECT
USING (user_id = auth.uid());