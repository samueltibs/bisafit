import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

export interface NutritionTargets {
  calories_target: { low: number; high: number };
  protein_g: number;
  carbs_g_optional?: number | null;
  fat_g_optional?: number | null;
  water_liters: number;
  notes: string;
  source?: 'ai' | 'fallback' | 'api';
}

export type InstructionStyle = 'simple' | 'detailed' | 'gourmet';

export interface Meal {
  name: string;
  recipe_title: string;
  ingredients: string[];
  instructions: string;
  detailed_instructions?: string[];
  gourmet_notes?: string;
  protein_g_est: number;
  calories_est: number;
  cuisine_style?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  recipe_source_url?: string;
  meal_prep_notes?: string;
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

      // First check localStorage for cached data
      const localKey = `bisafit_nutrition_${user.id}`;
      const localData = localStorage.getItem(localKey);
      let localProfile: Partial<NutritionProfile> | null = null;
      
      if (localData) {
        try {
          localProfile = JSON.parse(localData);
          console.log('[Nutrition] Found localStorage data');
        } catch (e) {
          console.log('[Nutrition] Invalid localStorage data');
        }
      }

      // Try nutrition_profiles table
      const { data, error: fetchError } = await supabase
        .from('nutrition_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // If database has data, use it (merge with localStorage)
      if (!fetchError && data) {
        const dbTargets = (data as Record<string, unknown>).targets_json as NutritionTargets | null;
        const dbMealPlan = (data as Record<string, unknown>).meal_plan_json as MealPlan | null;
        
        // Prefer localStorage data if DB data is null
        const finalTargets = dbTargets || localProfile?.targets_json || null;
        const finalMealPlan = dbMealPlan || localProfile?.meal_plan_json || null;
        
        setProfile({
          user_id: data.user_id,
          nutrition_goal_style: (data as Record<string, unknown>).nutrition_goal_style as 'simple' | 'macros' || 'simple',
          dietary_preferences_json: (data.dietary_preferences_json || {}) as Record<string, boolean>,
          cuisine_preferences_json: ((data as Record<string, unknown>).cuisine_preferences_json || []) as string[],
          meals_per_day: (data as Record<string, unknown>).meals_per_day as number || 3,
          snacks_per_day: (data as Record<string, unknown>).snacks_per_day as number || 1,
          budget_level: (data as Record<string, unknown>).budget_level as 'low' | 'medium' | 'high' || 'medium',
          targets_json: finalTargets,
          meal_plan_json: finalMealPlan,
          calories_target: data.calories_target,
          protein_g: data.protein_g,
          carbs_g: data.carbs_g,
          fat_g: data.fat_g,
        });
        setLoading(false);
        return;
      }

      // If DB failed but we have localStorage data, use it
      if (localProfile && (localProfile.targets_json || localProfile.meal_plan_json)) {
        console.log('[Nutrition] Using localStorage data (DB unavailable)');
        setProfile({
          user_id: user.id,
          nutrition_goal_style: localProfile.nutrition_goal_style || 'simple',
          dietary_preferences_json: localProfile.dietary_preferences_json || {},
          cuisine_preferences_json: localProfile.cuisine_preferences_json || [],
          meals_per_day: localProfile.meals_per_day || 3,
          snacks_per_day: localProfile.snacks_per_day || 1,
          budget_level: localProfile.budget_level || 'medium',
          targets_json: localProfile.targets_json || null,
          meal_plan_json: localProfile.meal_plan_json || null,
          calories_target: localProfile.calories_target || null,
          protein_g: localProfile.protein_g || null,
          carbs_g: localProfile.carbs_g || null,
          fat_g: localProfile.fat_g || null,
        });
        setLoading(false);
        return;
      }

      // No data anywhere - set default profile
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

  // Save nutrition data to localStorage (reliable fallback when DB has RLS issues)
  const saveToLocalStorage = useCallback((data: Partial<NutritionProfile>) => {
    if (!user) return;
    try {
      const key = `bisafit_nutrition_${user.id}`;
      const existing = localStorage.getItem(key);
      const current = existing ? JSON.parse(existing) : {};
      const updated = { ...current, ...data };
      localStorage.setItem(key, JSON.stringify(updated));
      console.log('[Nutrition] Saved to localStorage');
    } catch (err) {
      console.error('Error saving to localStorage:', err);
    }
  }, [user]);

  // Load nutrition data from localStorage
  const loadFromLocalStorage = useCallback((): Partial<NutritionProfile> | null => {
    if (!user) return null;
    try {
      const key = `bisafit_nutrition_${user.id}`;
      const data = localStorage.getItem(key);
      if (data) {
        console.log('[Nutrition] Loaded from localStorage');
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('Error loading from localStorage:', err);
    }
    return null;
  }, [user]);

  // Save targets (localStorage + attempt DB)
  const saveFallbackTargets = useCallback(async (targets: NutritionTargets): Promise<boolean> => {
    if (!user) return false;

    // Update local state immediately
    setProfile(prev => prev ? { ...prev, targets_json: targets } : {
      user_id: user.id,
      nutrition_goal_style: 'simple',
      dietary_preferences_json: {},
      cuisine_preferences_json: [],
      meals_per_day: 3,
      snacks_per_day: 1,
      budget_level: 'medium',
      targets_json: targets,
      meal_plan_json: null,
      calories_target: targets.calories_target.high,
      protein_g: targets.protein_g,
      carbs_g: null,
      fat_g: null,
    });

    // Save to localStorage for persistence
    saveToLocalStorage({ targets_json: targets });

    // Try to save to nutrition_profiles table (may fail due to RLS)
    try {
      const targetsJson = targets as unknown as Json;
      const { data: existing } = await supabase
        .from('nutrition_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('nutrition_profiles')
          .update({ targets_json: targetsJson })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('nutrition_profiles')
          .insert([{ user_id: user.id, targets_json: targetsJson }]);
      }
    } catch (err) {
      console.log('[Nutrition] DB save failed (using localStorage)');
    }

    return true;
  }, [user, saveToLocalStorage]);

  const generateTargets = useCallback(async (): Promise<{ success: boolean; isFallback: boolean }> => {
    if (!user) return { success: false, isFallback: false };

    try {
      setGeneratingTargets(true);
      
      // Get user profile for weight and goal
      const { data: userProfile } = await supabase
        .from('users_profile')
        .select('weight_kg, goal_primary')
        .eq('id', user.id)
        .maybeSingle();

      // Use backend API instead of Supabase Edge Function
      const response = await fetch(`${BACKEND_URL}/api/generate-nutrition-targets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          weight_kg: userProfile?.weight_kg || null,
          goal_primary: userProfile?.goal_primary || 'maintenance',
          activity_level: 'moderate',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate targets');
      }

      const data = await response.json();
      console.log('[Nutrition] API response:', data);

      if (data.success && data.targets) {
        // Directly set profile state with the targets
        const newTargets: NutritionTargets = {
          calories_target: data.targets.calories_target,
          protein_g: data.targets.protein_g,
          water_liters: data.targets.water_liters,
          notes: data.targets.notes,
          source: data.targets.source || 'api',
        };
        
        setProfile(prev => prev ? { ...prev, targets_json: newTargets } : {
          user_id: user.id,
          nutrition_goal_style: 'simple',
          dietary_preferences_json: {},
          cuisine_preferences_json: [],
          meals_per_day: 3,
          snacks_per_day: 1,
          budget_level: 'medium',
          targets_json: newTargets,
          meal_plan_json: null,
          calories_target: newTargets.calories_target.high,
          protein_g: newTargets.protein_g,
          carbs_g: null,
          fat_g: null,
        });
        
        // Try to save to DB in background (don't await, don't block UI)
        saveFallbackTargets(newTargets).catch(err => {
          console.log('[Nutrition] Background save failed (OK):', err);
        });
        
        toast.success('Nutrition targets generated!');
        return { success: true, isFallback: false };
      }

      // If API fails, use local fallback
      const fallbackTargets = await computeFallbackTargets();
      setProfile(prev => prev ? { ...prev, targets_json: fallbackTargets } : {
        user_id: user.id,
        nutrition_goal_style: 'simple',
        dietary_preferences_json: {},
        cuisine_preferences_json: [],
        meals_per_day: 3,
        snacks_per_day: 1,
        budget_level: 'medium',
        targets_json: fallbackTargets,
        meal_plan_json: null,
        calories_target: fallbackTargets.calories_target.high,
        protein_g: fallbackTargets.protein_g,
        carbs_g: null,
        fat_g: null,
      });
      
      toast.success('Nutrition targets generated!');
      return { success: true, isFallback: true };
    } catch (err) {
      console.error('Generate targets error:', err);
      
      // Network error or other failure - use fallback
      try {
        const fallbackTargets = await computeFallbackTargets();
        setProfile(prev => prev ? { ...prev, targets_json: fallbackTargets } : {
          user_id: user.id,
          nutrition_goal_style: 'simple',
          dietary_preferences_json: {},
          cuisine_preferences_json: [],
          meals_per_day: 3,
          snacks_per_day: 1,
          budget_level: 'medium',
          targets_json: fallbackTargets,
          meal_plan_json: null,
          calories_target: fallbackTargets.calories_target.high,
          protein_g: fallbackTargets.protein_g,
          carbs_g: null,
          fat_g: null,
        });
        
        toast.success('Nutrition targets generated!');
        return { success: true, isFallback: true };
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
      
      // Get current targets for the meal plan
      const targets = profile?.targets_json;
      
      // Use backend API instead of Supabase Edge Function
      const response = await fetch(`${BACKEND_URL}/api/generate-meal-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          days,
          calories_target: targets?.calories_target || null,
          protein_g: targets?.protein_g || null,
          dietary_preferences: [],
          cuisine_preferences: [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate meal plan');
      }

      const data = await response.json();
      console.log('[Nutrition] Meal plan API response:', data);

      if (data.success && data.meal_plan) {
        // Update local state with the meal plan
        setProfile(prev => prev ? { ...prev, meal_plan_json: data.meal_plan } : null);
        
        // Save to localStorage for persistence
        saveToLocalStorage({ meal_plan_json: data.meal_plan as unknown as MealPlan });
        
        toast.success('Meal plan generated!');
        return true;
      }

      toast.error(data.error || 'Failed to generate meal plan');
      return false;
    } catch (err) {
      console.error('Generate meal plan error:', err);
      toast.error('Failed to generate meal plan');
      return false;
    } finally {
      setGeneratingMealPlan(false);
    }
  }, [user, profile?.targets_json, saveToLocalStorage]);

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
