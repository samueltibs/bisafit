-- =====================================================
-- BISAFIT DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS PROFILE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Basic Info
    full_name TEXT,
    email TEXT,
    gender TEXT,
    height_cm INTEGER,
    weight_kg DECIMAL(5,2),
    unit_preference TEXT DEFAULT 'metric',
    country TEXT,
    language TEXT DEFAULT 'auto',
    
    -- Fitness Goals
    goal_primary TEXT,
    goal_secondary TEXT,
    experience_level TEXT,
    
    -- Schedule
    days_per_week INTEGER DEFAULT 4,
    session_minutes INTEGER DEFAULT 45,
    workout_days JSONB DEFAULT '["Monday", "Wednesday", "Thursday", "Friday"]'::jsonb,
    workout_time_preferences_json JSONB,
    program_start_date DATE,
    
    -- Equipment & Constraints
    equipment_json JSONB DEFAULT '["bodyweight"]'::jsonb,
    constraints_json JSONB,
    
    -- Preferences
    coach_tone TEXT DEFAULT 'balanced',
    coach_voice TEXT,
    
    -- Active Rest Configuration
    active_rest_config JSONB,
    
    -- Current Plan
    current_plan_id UUID,
    
    -- Notifications & Calendar
    notifications_enabled BOOLEAN DEFAULT false,
    calendar_sync_enabled BOOLEAN DEFAULT false,
    calendar_provider TEXT,
    
    -- Onboarding & Tutorials
    has_seen_intro_tour BOOLEAN DEFAULT false,
    welcome_email_sent BOOLEAN DEFAULT false,
    
    -- Feature Toggles
    nutrition_enabled BOOLEAN DEFAULT true
);

-- =====================================================
-- 2. PLANS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'in_progress',
    plan_json JSONB
);

-- =====================================================
-- 3. WORKOUTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    title TEXT,
    scheduled_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    workout_json JSONB
);

-- =====================================================
-- 4. WORKOUT SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    calories_burned INTEGER,
    session_json JSONB
);

-- =====================================================
-- 5. NUTRITION PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.nutrition_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    dietary_preferences_json JSONB,
    calorie_target INTEGER,
    protein_target INTEGER,
    carbs_target INTEGER,
    fat_target INTEGER
);

-- =====================================================
-- 6. MEAL PLANS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.meal_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    date DATE,
    meals_json JSONB
);

-- =====================================================
-- 7. PROGRESS ENTRIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.progress_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    date DATE,
    weight_kg DECIMAL(5,2),
    body_fat_percentage DECIMAL(4,1),
    measurements_json JSONB,
    notes TEXT
);

-- =====================================================
-- 8. PROGRESS PHOTOS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.progress_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    date DATE,
    photo_url TEXT,
    photo_type TEXT,
    notes TEXT
);

-- =====================================================
-- 9. HEALTH UPLOADS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.health_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    upload_type TEXT,
    data_json JSONB,
    source TEXT
);

-- =====================================================
-- 10. BETA FEEDBACK TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.beta_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    feedback_data JSONB,
    attachment_urls JSONB
);

-- =====================================================
-- 11. ANALYTICS EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    event_name TEXT NOT NULL,
    event_data JSONB,
    session_id TEXT,
    device_info JSONB
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users_profile FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users_profile FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users_profile FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own plans" ON public.plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plans" ON public.plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plans" ON public.plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plans" ON public.plans FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own workouts" ON public.workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workouts" ON public.workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workouts" ON public.workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workouts" ON public.workouts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions" ON public.workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.workout_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own nutrition" ON public.nutrition_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own nutrition" ON public.nutrition_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own nutrition" ON public.nutrition_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own meal plans" ON public.meal_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meal plans" ON public.meal_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meal plans" ON public.meal_plans FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own progress" ON public.progress_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.progress_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.progress_entries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own photos" ON public.progress_photos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own photos" ON public.progress_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own photos" ON public.progress_photos FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own health data" ON public.health_uploads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health data" ON public.health_uploads FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can submit feedback" ON public.beta_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own feedback" ON public.beta_feedback FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert events" ON public.events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own events" ON public.events FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users_profile (id, email, created_at)
    VALUES (NEW.id, NEW.email, NOW())
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_plans_user_id ON public.plans(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_plan_id ON public.workouts(plan_id);
CREATE INDEX IF NOT EXISTS idx_workouts_scheduled_date ON public.workouts(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ BisaFit database schema created successfully!';
END $$;
