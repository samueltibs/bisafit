-- Drop existing tables to replace with new schema
DROP TABLE IF EXISTS public.nutrition_logs CASCADE;
DROP TABLE IF EXISTS public.progress_entries CASCADE;
DROP TABLE IF EXISTS public.workouts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- A) users_profile table
CREATE TABLE public.users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  gender TEXT,
  height_cm INT,
  weight_kg NUMERIC,
  goal_primary TEXT CHECK (goal_primary IN ('fat_loss', 'muscle_gain', 'endurance', 'maintenance')),
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  days_per_week INT DEFAULT 4,
  session_minutes INT DEFAULT 45,
  rest_day TEXT DEFAULT 'Tuesday',
  constraints_json JSONB DEFAULT '{}'::jsonb,
  equipment_json JSONB DEFAULT '[]'::jsonb,
  is_pro BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- B) plans table
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users_profile(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  start_date DATE,
  weeks INT,
  plan_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- C) workouts table
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users_profile(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  title TEXT,
  scheduled_date DATE,
  workout_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- D) workout_sessions table
CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users_profile(id) ON DELETE CASCADE NOT NULL,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  session_log_json JSONB DEFAULT '{}'::jsonb
);

-- E) nutrition_profiles table
CREATE TABLE public.nutrition_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users_profile(id) ON DELETE CASCADE,
  calories_target INT,
  protein_g INT,
  carbs_g INT,
  fat_g INT,
  dietary_preferences_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- F) meal_plans table
CREATE TABLE public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users_profile(id) ON DELETE CASCADE NOT NULL,
  start_date DATE,
  days INT,
  meal_plan_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- G) progress_entries table
CREATE TABLE public.progress_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users_profile(id) ON DELETE CASCADE NOT NULL,
  entry_date DATE NOT NULL,
  weight_kg NUMERIC,
  waist_cm NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- H) progress_photos table
CREATE TABLE public.progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users_profile(id) ON DELETE CASCADE NOT NULL,
  entry_date DATE NOT NULL,
  photo_url TEXT NOT NULL,
  pose TEXT CHECK (pose IN ('front', 'side', 'back')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- I) health_uploads table
CREATE TABLE public.health_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users_profile(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES
CREATE INDEX idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX idx_workouts_plan_id ON public.workouts(plan_id);
CREATE INDEX idx_workouts_scheduled_date ON public.workouts(scheduled_date);
CREATE INDEX idx_plans_user_start ON public.plans(user_id, start_date);
CREATE INDEX idx_workout_sessions_user_workout ON public.workout_sessions(user_id, workout_id);
CREATE INDEX idx_progress_entries_user_date ON public.progress_entries(user_id, entry_date);
CREATE INDEX idx_progress_photos_user_date ON public.progress_photos(user_id, entry_date);
CREATE INDEX idx_meal_plans_user_start ON public.meal_plans(user_id, start_date);

-- ENABLE RLS ON ALL TABLES
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_uploads ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR users_profile (uses id = auth.uid())
CREATE POLICY "Users can view own profile" ON public.users_profile
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.users_profile
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users_profile
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can delete own profile" ON public.users_profile
  FOR DELETE USING (id = auth.uid());

-- RLS POLICIES FOR plans
CREATE POLICY "Users can manage own plans" ON public.plans
  FOR ALL USING (user_id = auth.uid());

-- RLS POLICIES FOR workouts
CREATE POLICY "Users can manage own workouts" ON public.workouts
  FOR ALL USING (user_id = auth.uid());

-- RLS POLICIES FOR workout_sessions
CREATE POLICY "Users can manage own workout sessions" ON public.workout_sessions
  FOR ALL USING (user_id = auth.uid());

-- RLS POLICIES FOR nutrition_profiles
CREATE POLICY "Users can manage own nutrition profile" ON public.nutrition_profiles
  FOR ALL USING (user_id = auth.uid());

-- RLS POLICIES FOR meal_plans
CREATE POLICY "Users can manage own meal plans" ON public.meal_plans
  FOR ALL USING (user_id = auth.uid());

-- RLS POLICIES FOR progress_entries
CREATE POLICY "Users can manage own progress entries" ON public.progress_entries
  FOR ALL USING (user_id = auth.uid());

-- RLS POLICIES FOR progress_photos
CREATE POLICY "Users can manage own progress photos" ON public.progress_photos
  FOR ALL USING (user_id = auth.uid());

-- RLS POLICIES FOR health_uploads
CREATE POLICY "Users can manage own health uploads" ON public.health_uploads
  FOR ALL USING (user_id = auth.uid());

-- UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- TRIGGERS FOR updated_at
CREATE TRIGGER on_users_profile_updated
  BEFORE UPDATE ON public.users_profile
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_nutrition_profiles_updated
  BEFORE UPDATE ON public.nutrition_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('progress_photos', 'progress_photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('health_uploads', 'health_uploads', false, 20971520, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES FOR progress_photos bucket
CREATE POLICY "Users can upload own progress photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'progress_photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own progress photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'progress_photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own progress photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'progress_photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own progress photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'progress_photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- STORAGE POLICIES FOR health_uploads bucket
CREATE POLICY "Users can upload own health files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'health_uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own health files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'health_uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own health files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'health_uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own health files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'health_uploads' AND auth.uid()::text = (storage.foldername(name))[1]);