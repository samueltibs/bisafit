-- Add lifecycle columns to plans table
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS block_number integer,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'queued', 'completed')),
ADD COLUMN IF NOT EXISTS started_at timestamptz,
ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Add current_plan_id to users_profile
ALTER TABLE public.users_profile
ADD COLUMN IF NOT EXISTS current_plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_plans_user_status ON public.plans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_plans_block_number ON public.plans(user_id, block_number);

-- Backfill existing plans with block_number from plan_json if available
UPDATE public.plans 
SET block_number = COALESCE((plan_json->>'block_number')::integer, 1)
WHERE block_number IS NULL;

-- Set started_at for existing plans
UPDATE public.plans 
SET started_at = created_at
WHERE started_at IS NULL;