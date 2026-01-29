-- Add subscription fields to users_profile
-- NOTE: Stripe Checkout + webhooks will replace mock provider once LLC and Stripe account are live.

ALTER TABLE public.users_profile
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'preview',
ADD COLUMN IF NOT EXISTS subscription_provider text DEFAULT 'mock',
ADD COLUMN IF NOT EXISTS trial_start_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS trial_end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS subscription_plan text,
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Add check constraint for valid subscription statuses
ALTER TABLE public.users_profile
ADD CONSTRAINT valid_subscription_status 
CHECK (subscription_status IN ('preview', 'trialing', 'active', 'expired'));

-- Add index for subscription queries
CREATE INDEX IF NOT EXISTS idx_users_profile_subscription_status 
ON public.users_profile(subscription_status);

COMMENT ON COLUMN public.users_profile.subscription_status IS 'Current subscription state: preview, trialing, active, expired';
COMMENT ON COLUMN public.users_profile.subscription_provider IS 'Payment provider: mock (temporary), stripe (future)';
COMMENT ON COLUMN public.users_profile.stripe_customer_id IS 'Stripe customer ID - populated when Stripe is integrated';
COMMENT ON COLUMN public.users_profile.stripe_subscription_id IS 'Stripe subscription ID - populated when Stripe is integrated';