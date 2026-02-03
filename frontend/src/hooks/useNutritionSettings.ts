/**
 * Nutrition Settings Hook
 * 
 * Provides access to user's nutrition preferences throughout the app.
 * Used to conditionally show/hide nutrition-related UI elements.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface NutritionSettings {
  enabled: boolean;
  loading: boolean;
  configured: boolean; // Has the user set up their preferences?
  preferences: {
    goal_style: string;
    dietary: string[];
    allergies: string;
    protein_emphasis: string;
  } | null;
  toggleNutrition: (enabled: boolean) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useNutritionSettings(): NutritionSettings {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [preferences, setPreferences] = useState<NutritionSettings['preferences']>(null);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get nutrition_enabled from profile
      const { data: profile, error: profileError } = await supabase
        .from('users_profile')
        .select('nutrition_enabled')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const nutritionEnabled = profile?.nutrition_enabled ?? true; // Default to true
      setEnabled(nutritionEnabled);

      // If nutrition is enabled, check if preferences are configured
      if (nutritionEnabled) {
        const { data: nutritionProfile, error: nutritionError } = await supabase
          .from('nutrition_profiles')
          .select('dietary_preferences_json')
          .eq('user_id', user.id)
          .single();

        if (!nutritionError && nutritionProfile?.dietary_preferences_json) {
          setConfigured(true);
          setPreferences(nutritionProfile.dietary_preferences_json as any);
        } else {
          setConfigured(false);
          setPreferences(null);
        }
      } else {
        setConfigured(false);
        setPreferences(null);
      }
    } catch (error) {
      console.error('Error fetching nutrition settings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const toggleNutrition = async (newEnabled: boolean): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('users_profile')
        .update({ nutrition_enabled: newEnabled })
        .eq('id', user.id);

      if (error) throw error;

      setEnabled(newEnabled);
      return true;
    } catch (error) {
      console.error('Error toggling nutrition:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    enabled,
    loading,
    configured,
    preferences,
    toggleNutrition,
    refetch: fetchSettings,
  };
}
