import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NutritionTargets {
  calories_target: { low: number; high: number };
  protein_g: number;
  carbs_g_optional?: number | null;
  fat_g_optional?: number | null;
  water_liters: number;
  notes: string;
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
  generateTargets: () => Promise<boolean>;
  generatingTargets: boolean;
  generateMealPlan: (days?: number) => Promise<boolean>;
  generatingMealPlan: boolean;
  swapMeal: (dayIndex: number, mealIndex: number, isSnack?: boolean) => Promise<boolean>;
  swappingMeal: boolean;
  updatePreferences: (prefs: Partial<NutritionProfile>) => Promise<boolean>;
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

  const generateTargets = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      setGeneratingTargets(true);
      
      const { data, error } = await supabase.functions.invoke('generate-nutrition-targets', {});

      if (error) {
        console.error('Generate targets error:', error);
        toast.error(error.message || 'Failed to generate targets');
        return false;
      }

      if (data?.error) {
        toast.error(data.error);
        return false;
      }

      toast.success('Nutrition targets generated!');
      await fetchProfile();
      return true;
    } catch (err) {
      console.error('Generate targets error:', err);
      toast.error('Failed to generate nutrition targets');
      return false;
    } finally {
      setGeneratingTargets(false);
    }
  }, [user, fetchProfile]);

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
  };
}
