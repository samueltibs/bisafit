import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface NutritionTargets {
  calories_target: { low: number; high: number };
  protein_g: number;
  carbs_g_optional?: number | null;
  fat_g_optional?: number | null;
  water_liters: number;
  notes: string;
  source?: 'ai' | 'fallback';
}

export interface Meal {
  name: string;
  recipe_title: string;
  ingredients: string[];
  instructions: string;
  protein_g_est: number;
  calories_est: number;
}

export interface DayPlan {
  day: string;
  meals: Meal[];
  snacks: Meal[];
}

export interface GroceryList {
  produce: string[];
  proteins: string[];
  pantry: string[];
  dairy_optional: string[];
}

export interface MealPlan {
  days: DayPlan[];
  grocery_list: GroceryList;
  prep_tips: string[];
  swap_rules: string;
}

export interface NutritionProfile {
  user_id: string;
  nutrition_goal_style: 'simple' | 'macros';
  dietary_preferences_json: Record<string, boolean>;
  cuisine_preferences_json: string[];
  meals_per_day: number;
  snacks_per_day: number;
  budget_level: 'low' | 'medium' | 'high';
  targets_json: NutritionTargets | null;
  meal_plan_json: MealPlan | null;
  calories_target: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}

interface UseNutritionResult {
  profile: NutritionProfile | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  generateTargets: () => Promise<{ success: boolean; isFallback: boolean }>;
  generatingTargets: boolean;
  generateMealPlan: (days?: number) => Promise<boolean>;
  generatingMealPlan: boolean;
  swapMeal: (dayIndex: number, mealIndex: number, isSnack?: boolean) => Promise<boolean>;
  swappingMeal: boolean;
  updatePreferences: (prefs: Partial<NutritionProfile>) => Promise<boolean>;
  retryTargets: () => Promise<{ success: boolean; isFallback: boolean }>;
}

export function useNutrition(): UseNutritionResult {
  const { user } = useAuth();
  const [profile, setProfile] = useState<NutritionProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [generatingTargets, setGeneratingTargets] = useState(false);
  const [generatingMealPlan, setGeneratingMealPlan] = useState(false);
  const [swappingMeal, setSwappingMeal] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('nutrition_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setProfile({
          user_id: data.user_id,
          nutrition_goal_style: (data as Record<string, unknown>).nutrition_goal_style as 'simple' | 'macros' || 'simple',
          dietary_preferences_json: (data.dietary_preferences_json || {}) as Record<string, boolean>,
          cuisine_preferences_json: ((data as Record<string, unknown>).cuisine_preferences_json || []) as string[],
          meals_per_day: (data as Record<string, unknown>).meals_per_day as number || 3,
          snacks_per_day: (data as Record<string, unknown>).snacks_per_day as number || 1,
          budget_level: (data as Record<string, unknown>).budget_level as 'low' | 'medium' | 'high' || 'medium',
          targets_json: (data as Record<string, unknown>).targets_json as NutritionTargets | null,
          meal_plan_json: (data as Record<string, unknown>).meal_plan_json as MealPlan | null,
          calories_target: data.calories_target,
          protein_g: data.protein_g,
          carbs_g: data.carbs_g,
          fat_g: data.fat_g,
        });
      } else {
        // Create default profile
        const { error: insertError } = await supabase
          .from('nutrition_profiles')
          .insert({ user_id: user.id });

        if (!insertError) {
          setProfile({
            user_id: user.id,
            nutrition_goal_style: 'simple',
            dietary_preferences_json: {},
            cuisine_preferences_json: [],
            meals_per_day: 3,
            snacks_per_day: 1,
            budget_level: 'medium',
            targets_json: null,
            meal_plan_json: null,
            calories_target: null,
            protein_g: null,
            carbs_g: null,
            fat_g: null,
          });
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load nutrition profile');
      console.error('useNutrition error:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Compute fallback targets based on user profile
  const computeFallbackTargets = useCallback(async (): Promise<NutritionTargets> => {
    // Try to get user profile for weight and goal
    const { data: userProfile } = await supabase
      .from('users_profile')
      .select('weight_kg, goal_primary')
      .eq('id', user?.id)
      .maybeSingle();

    const weightKg = userProfile?.weight_kg || null;
    const goalPrimary = userProfile?.goal_primary || 'maintenance';

    // Protein: weight_kg * 1.8, or 140g default
    const proteinG = weightKg ? Math.round(Number(weightKg) * 1.8) : 140;

    // Calorie ranges based on goal
    let caloriesLow: number;
    let caloriesHigh: number;
    
    if (goalPrimary === 'fat_loss' || goalPrimary === 'lose_weight') {
      caloriesLow = 2000;
      caloriesHigh = 2300;
    } else if (goalPrimary === 'muscle_gain' || goalPrimary === 'gain_weight' || goalPrimary === 'build_muscle') {
      caloriesLow = 2600;
      caloriesHigh = 2900;
    } else {
      // maintain / maintenance / default
      caloriesLow = 2300;
      caloriesHigh = 2600;
    }

    return {
      calories_target: { low: caloriesLow, high: caloriesHigh },
      protein_g: proteinG,
      water_liters: 3.0,
      notes: 'These are estimated targets. Tap "Try again" to generate personalized AI targets when available.',
      source: 'fallback',
    };
  }, [user]);

  // Save fallback targets to database
  const saveFallbackTargets = useCallback(async (targets: NutritionTargets): Promise<boolean> => {
    if (!user) return false;

    // First check if profile exists
    const { data: existing } = await supabase
      .from('nutrition_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    // Cast targets to Json type for Supabase - use explicit Json cast
    const targetsJson = targets as unknown as Json;

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('nutrition_profiles')
        .update({ targets_json: targetsJson })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error saving fallback targets:', error);
        return false;
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('nutrition_profiles')
        .insert([{ 
          user_id: user.id, 
          targets_json: targetsJson 
        }]);

      if (error) {
        console.error('Error saving fallback targets:', error);
        return false;
      }
    }

    await fetchProfile();
    return true;
  }, [user, fetchProfile]);

  const generateTargets = useCallback(async (): Promise<{ success: boolean; isFallback: boolean }> => {
    if (!user) return { success: false, isFallback: false };

    try {
      setGeneratingTargets(true);
      
      const { data, error } = await supabase.functions.invoke('generate-nutrition-targets', {});

      // Check for 5xx errors or deployment unavailability
      if (error) {
        console.error('Generate targets error:', error);
        
        // Check if it's a server error (5xx) or network/deployment issue
        const isServerError = error.message?.includes('5') || 
                              error.message?.toLowerCase().includes('unavailable') ||
                              error.message?.toLowerCase().includes('internal') ||
                              error.message?.toLowerCase().includes('failed to fetch');
        
        if (isServerError) {
          // Use fallback
          const fallbackTargets = await computeFallbackTargets();
          const saved = await saveFallbackTargets(fallbackTargets);
          
          if (saved) {
            toast('Nutrition targets are temporarily unavailable. Using estimated targets for now.', {
              icon: '⚠️',
              duration: 5000,
            });
            return { success: true, isFallback: true };
          }
        }
        
        toast.error(error.message || 'Failed to generate targets');
        return { success: false, isFallback: false };
      }

      if (data?.error) {
        // Also check for error responses from the function itself
        const fallbackTargets = await computeFallbackTargets();
        const saved = await saveFallbackTargets(fallbackTargets);
        
        if (saved) {
          toast('Nutrition targets are temporarily unavailable. Using estimated targets for now.', {
            icon: '⚠️',
            duration: 5000,
          });
          return { success: true, isFallback: true };
        }
        
        toast.error(data.error);
        return { success: false, isFallback: false };
      }

      toast.success('Nutrition targets generated!');
      await fetchProfile();
      return { success: true, isFallback: false };
    } catch (err) {
      console.error('Generate targets error:', err);
      
      // Network error or other failure - use fallback
      try {
        const fallbackTargets = await computeFallbackTargets();
        const saved = await saveFallbackTargets(fallbackTargets);
        
        if (saved) {
          toast('Nutrition targets are temporarily unavailable. Using estimated targets for now.', {
            icon: '⚠️',
            duration: 5000,
          });
          return { success: true, isFallback: true };
        }
      } catch (fallbackErr) {
        console.error('Fallback computation error:', fallbackErr);
      }
      
      toast.error('Failed to generate nutrition targets');
      return { success: false, isFallback: false };
    } finally {
      setGeneratingTargets(false);
    }
  }, [user, fetchProfile, computeFallbackTargets, saveFallbackTargets]);

  // Retry function - specifically tries AI again
  const retryTargets = useCallback(async (): Promise<{ success: boolean; isFallback: boolean }> => {
    return generateTargets();
  }, [generateTargets]);

  const generateMealPlan = useCallback(async (days = 7): Promise<boolean> => {
    if (!user) return false;

    try {
      setGeneratingMealPlan(true);
      
      const { data, error } = await supabase.functions.invoke('generate-meal-plan', {
        body: { days },
      });

      if (error) {
        console.error('Generate meal plan error:', error);
        toast.error(error.message || 'Failed to generate meal plan');
        return false;
      }

      if (data?.error) {
        toast.error(data.error);
        return false;
      }

      toast.success('Meal plan generated!');
      await fetchProfile();
      return true;
    } catch (err) {
      console.error('Generate meal plan error:', err);
      toast.error('Failed to generate meal plan');
      return false;
    } finally {
      setGeneratingMealPlan(false);
    }
  }, [user, fetchProfile]);

  const swapMeal = useCallback(async (dayIndex: number, mealIndex: number, isSnack = false): Promise<boolean> => {
    if (!user) return false;

    try {
      setSwappingMeal(true);
      
      const { data, error } = await supabase.functions.invoke('swap-meal', {
        body: { dayIndex, mealIndex, isSnack },
      });

      if (error) {
        console.error('Swap meal error:', error);
        toast.error(error.message || 'Failed to swap meal');
        return false;
      }

      if (data?.error) {
        toast.error(data.error);
        return false;
      }

      toast.success('Meal swapped!');
      await fetchProfile();
      return true;
    } catch (err) {
      console.error('Swap meal error:', err);
      toast.error('Failed to swap meal');
      return false;
    } finally {
      setSwappingMeal(false);
    }
  }, [user, fetchProfile]);

  const updatePreferences = useCallback(async (prefs: Partial<NutritionProfile>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('nutrition_profiles')
        .update(prefs as Record<string, unknown>)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchProfile();
      toast.success('Preferences updated');
      return true;
    } catch (err) {
      console.error('Update preferences error:', err);
      toast.error('Failed to update preferences');
      return false;
    }
  }, [user, fetchProfile]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    generateTargets,
    generatingTargets,
    generateMealPlan,
    generatingMealPlan,
    swapMeal,
    swappingMeal,
    updatePreferences,
    retryTargets,
  };
}
