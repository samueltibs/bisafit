-- Create store_interest table for waitlist signups
CREATE TABLE public.store_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  interests_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_interest ENABLE ROW LEVEL SECURITY;

-- Users can insert their own interest
CREATE POLICY "Users can insert own interest"
ON public.store_interest
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can view their own interest
CREATE POLICY "Users can view own interest"
ON public.store_interest
FOR SELECT
USING (user_id = auth.uid());

-- Users can update their own interest
CREATE POLICY "Users can update own interest"
ON public.store_interest
FOR UPDATE
USING (user_id = auth.uid());

-- Prevent duplicate signups per user
CREATE UNIQUE INDEX idx_store_interest_user ON public.store_interest(user_id);