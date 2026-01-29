-- Create meal_logs table for tracking logged meals
CREATE TABLE public.meal_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  meal_type TEXT NOT NULL CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack')),
  photo_url TEXT,
  items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_calories INTEGER,
  total_protein_g NUMERIC,
  total_carbs_g NUMERIC,
  total_fat_g NUMERIC,
  notes TEXT,
  linked_meal_plan_id UUID,
  entry_method TEXT NOT NULL DEFAULT 'manual' CHECK (entry_method IN ('photo', 'manual', 'copy')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for meal_logs
CREATE POLICY "Users can view own meal logs"
ON public.meal_logs
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create own meal logs"
ON public.meal_logs
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own meal logs"
ON public.meal_logs
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own meal logs"
ON public.meal_logs
FOR DELETE
USING (user_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_meal_logs_updated_at
BEFORE UPDATE ON public.meal_logs
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add foreign key constraints
ALTER TABLE public.meal_logs
ADD CONSTRAINT meal_logs_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users_profile(id) ON DELETE CASCADE;

ALTER TABLE public.meal_logs
ADD CONSTRAINT meal_logs_linked_meal_plan_id_fkey
FOREIGN KEY (linked_meal_plan_id) REFERENCES public.meal_plans(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_meal_logs_user_logged_at ON public.meal_logs(user_id, logged_at DESC);
CREATE INDEX idx_meal_logs_user_meal_type ON public.meal_logs(user_id, meal_type);