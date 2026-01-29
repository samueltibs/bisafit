-- Drop the old trigger that references non-existent profiles table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the handle_new_user function to insert into users_profile instead
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.users_profile (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Recreate the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix RLS policies for users_profile - drop existing and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Users can view own profile" ON public.users_profile;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users_profile;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users_profile;

CREATE POLICY "Users can view own profile" 
  ON public.users_profile FOR SELECT 
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" 
  ON public.users_profile FOR INSERT 
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile" 
  ON public.users_profile FOR UPDATE 
  USING (id = auth.uid());

CREATE POLICY "Users can delete own profile" 
  ON public.users_profile FOR DELETE 
  USING (id = auth.uid());

-- Fix RLS policies for other tables - make them PERMISSIVE (default)
-- Plans
DROP POLICY IF EXISTS "Users can manage own plans" ON public.plans;
CREATE POLICY "Users can manage own plans" 
  ON public.plans FOR ALL 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Workouts
DROP POLICY IF EXISTS "Users can manage own workouts" ON public.workouts;
CREATE POLICY "Users can manage own workouts" 
  ON public.workouts FOR ALL 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Workout Sessions
DROP POLICY IF EXISTS "Users can manage own workout sessions" ON public.workout_sessions;
CREATE POLICY "Users can manage own workout sessions" 
  ON public.workout_sessions FOR ALL 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Nutrition Profiles
DROP POLICY IF EXISTS "Users can manage own nutrition profile" ON public.nutrition_profiles;
CREATE POLICY "Users can manage own nutrition profile" 
  ON public.nutrition_profiles FOR ALL 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Meal Plans
DROP POLICY IF EXISTS "Users can manage own meal plans" ON public.meal_plans;
CREATE POLICY "Users can manage own meal plans" 
  ON public.meal_plans FOR ALL 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Progress Entries
DROP POLICY IF EXISTS "Users can manage own progress entries" ON public.progress_entries;
CREATE POLICY "Users can manage own progress entries" 
  ON public.progress_entries FOR ALL 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Progress Photos
DROP POLICY IF EXISTS "Users can manage own progress photos" ON public.progress_photos;
CREATE POLICY "Users can manage own progress photos" 
  ON public.progress_photos FOR ALL 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Health Uploads
DROP POLICY IF EXISTS "Users can manage own health uploads" ON public.health_uploads;
CREATE POLICY "Users can manage own health uploads" 
  ON public.health_uploads FOR ALL 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());