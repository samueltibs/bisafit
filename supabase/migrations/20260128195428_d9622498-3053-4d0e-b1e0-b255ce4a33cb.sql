-- Create weekly_summaries table for storing generated progress stories
CREATE TABLE public.weekly_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  headline TEXT NOT NULL,
  bullets JSONB NOT NULL DEFAULT '[]'::jsonb,
  badge_line TEXT,
  next_suggestion TEXT,
  stats_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, week_start_date)
);

-- Enable RLS
ALTER TABLE public.weekly_summaries ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own weekly summaries"
  ON public.weekly_summaries FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own weekly summaries"
  ON public.weekly_summaries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own weekly summaries"
  ON public.weekly_summaries FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own weekly summaries"
  ON public.weekly_summaries FOR DELETE
  USING (user_id = auth.uid());

-- Add updated_at trigger
CREATE TRIGGER update_weekly_summaries_updated_at
  BEFORE UPDATE ON public.weekly_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();