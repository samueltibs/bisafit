-- =====================================================
-- BISAFIT DATABASE MIGRATION
-- Run this in OLD Supabase project SQL Editor
-- Project: wfivicfvbihzkxrqcekv
-- =====================================================

-- Add missing columns to users_profile if they don't exist
DO $$ 
BEGIN
    -- Add current_plan_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users_profile' AND column_name = 'current_plan_id') THEN
        ALTER TABLE public.users_profile ADD COLUMN current_plan_id UUID;
        RAISE NOTICE 'Added current_plan_id column';
    END IF;

    -- Add active_rest_config column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users_profile' AND column_name = 'active_rest_config') THEN
        ALTER TABLE public.users_profile ADD COLUMN active_rest_config JSONB;
        RAISE NOTICE 'Added active_rest_config column';
    END IF;

    -- Add coach_tone column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users_profile' AND column_name = 'coach_tone') THEN
        ALTER TABLE public.users_profile ADD COLUMN coach_tone TEXT DEFAULT 'balanced';
        RAISE NOTICE 'Added coach_tone column';
    END IF;

    -- Add workout_days column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users_profile' AND column_name = 'workout_days') THEN
        ALTER TABLE public.users_profile ADD COLUMN workout_days JSONB DEFAULT '["Monday", "Wednesday", "Thursday", "Friday"]'::jsonb;
        RAISE NOTICE 'Added workout_days column';
    END IF;

    -- Add workout_time_preferences_json column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users_profile' AND column_name = 'workout_time_preferences_json') THEN
        ALTER TABLE public.users_profile ADD COLUMN workout_time_preferences_json JSONB;
        RAISE NOTICE 'Added workout_time_preferences_json column';
    END IF;

    -- Add program_start_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users_profile' AND column_name = 'program_start_date') THEN
        ALTER TABLE public.users_profile ADD COLUMN program_start_date DATE;
        RAISE NOTICE 'Added program_start_date column';
    END IF;

    -- Add language column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users_profile' AND column_name = 'language') THEN
        ALTER TABLE public.users_profile ADD COLUMN language TEXT DEFAULT 'auto';
        RAISE NOTICE 'Added language column';
    END IF;

    -- Add country column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users_profile' AND column_name = 'country') THEN
        ALTER TABLE public.users_profile ADD COLUMN country TEXT;
        RAISE NOTICE 'Added country column';
    END IF;

    -- Add goal_secondary column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users_profile' AND column_name = 'goal_secondary') THEN
        ALTER TABLE public.users_profile ADD COLUMN goal_secondary TEXT;
        RAISE NOTICE 'Added goal_secondary column';
    END IF;

    -- Add notifications_enabled column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users_profile' AND column_name = 'notifications_enabled') THEN
        ALTER TABLE public.users_profile ADD COLUMN notifications_enabled BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added notifications_enabled column';
    END IF;

    -- Add calendar_sync_enabled column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users_profile' AND column_name = 'calendar_sync_enabled') THEN
        ALTER TABLE public.users_profile ADD COLUMN calendar_sync_enabled BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added calendar_sync_enabled column';
    END IF;

    -- Add calendar_provider column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users_profile' AND column_name = 'calendar_provider') THEN
        ALTER TABLE public.users_profile ADD COLUMN calendar_provider TEXT;
        RAISE NOTICE 'Added calendar_provider column';
    END IF;

END $$;

-- Success message
SELECT 'Migration complete! All missing columns have been added.' as status;
