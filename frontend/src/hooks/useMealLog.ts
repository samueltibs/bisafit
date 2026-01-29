/**
 * Meal Logging Hook
 * 
 * Provides CRUD operations and calculation logic for meal logs,
 * respecting the user's measurement system preferences.
 */

import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';
import type {
  FoodLog,
  FoodLogItem,
  FoodLogItemInput,
  CreateMealLogInput,
  Macros,
  MeasurementSystem,
  DetectedFoodItem,
  DailyNutritionSummary,
  MealType,
  EntryMethod,
} from '@/types/mealLog';
import { toGrams, getDefaultUnits, getPrimaryWeightUnit } from '@/lib/foodUnits';

/**
 * Generate a unique ID for items
 */
function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

/**
 * Calculate totals from a list of food items
 */
export function calculateTotals(items: FoodLogItem[]): { calories: number; macros: Macros } {
  const result = items.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.macros?.protein || 0),
      carbs: acc.carbs + (item.macros?.carbs || 0),
      fat: acc.fat + (item.macros?.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return {
    calories: Math.round(result.calories),
    macros: {
      protein: Math.round(result.protein * 10) / 10,
      carbs: Math.round(result.carbs * 10) / 10,
      fat: Math.round(result.fat * 10) / 10,
    },
  };
}

/**
 * Convert a detected food item from AI to FoodLogItem
 */
export function detectedItemToFoodLogItem(detected: DetectedFoodItem): FoodLogItem {
  return {
    id: generateId(),
    name: detected.name,
    portionDisplay: detected.portion,
    calories: Math.round(detected.calories),
    macros: {
      protein: Math.round(detected.protein_g * 10) / 10,
      carbs: Math.round(detected.carbs_g * 10) / 10,
      fat: Math.round(detected.fat_g * 10) / 10,
    },
    confidence: detected.confidence,
    source: 'ai_detected',
  };
}

/**
 * Create a new FoodLogItem from user input
 */
export function createFoodLogItem(input: FoodLogItemInput): FoodLogItem {
  const item: FoodLogItem = {
    id: generateId(),
    name: input.name,
    source: input.source || 'user_added',
  };

  if (input.quantity !== undefined) {
    item.quantity = input.quantity;
  }
  if (input.unit) {
    item.unit = input.unit;
    // Normalize to grams if we have quantity and unit
    if (input.quantity !== undefined) {
      item.grams = toGrams(input.quantity, input.unit);
    }
  }
  if (input.calories !== undefined) {
    item.calories = input.calories;
  }
  if (input.macros) {
    item.macros = {
      protein: input.macros.protein || 0,
      carbs: input.macros.carbs || 0,
      fat: input.macros.fat || 0,
    };
  }
  if (input.portionDisplay) {
    item.portionDisplay = input.portionDisplay;
  }
  if (input.confidence !== undefined) {
    item.confidence = input.confidence;
  }

  return item;
}

/**
 * Convert database row to FoodLog
 */
function dbRowToFoodLog(row: any): FoodLog {
  const items = (row.items_json as any[]) || [];
  return {
    id: row.id,
    userId: row.user_id,
    timestamp: row.logged_at,
    mealType: row.meal_type as MealType,
    source: row.entry_method as EntryMethod,
    photoUrl: row.photo_url || undefined,
    totalCalories: row.total_calories || 0,
    totalMacros: {
      protein: row.total_protein_g || 0,
      carbs: row.total_carbs_g || 0,
      fat: row.total_fat_g || 0,
    },
    items: items.map((item: any) => ({
      id: item.id || generateId(),
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      grams: item.grams,
      calories: item.calories,
      macros: item.macros || {
        protein: item.protein_g || 0,
        carbs: item.carbs_g || 0,
        fat: item.fat_g || 0,
      },
      confidence: item.confidence,
      source: item.source || 'user_added',
      portionDisplay: item.portionDisplay || item.portion,
    })),
    notes: row.notes || undefined,
    isEstimated: row.entry_method === 'photo',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Hook for meal logging functionality
 */
export function useMealLog() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Get measurement system from profile
  const measurementSystem: MeasurementSystem = useMemo(() => {
    return profile?.unit_preference === 'imperial' ? 'imperial' : 'metric';
  }, [profile?.unit_preference]);

  // Get default units based on measurement system
  const defaultUnits = useMemo(() => getDefaultUnits(measurementSystem), [measurementSystem]);
  const primaryWeightUnit = useMemo(() => getPrimaryWeightUnit(measurementSystem), [measurementSystem]);

  /**
   * Create a new meal log
   */
  const createMealLog = useCallback(async (input: CreateMealLogInput): Promise<FoodLog | null> => {
    if (!user) {
      toast.error('Please sign in to log meals');
      return null;
    }

    setSaving(true);
    try {
      // Create food log items
      const items = input.items.map(createFoodLogItem);
      const { calories, macros } = calculateTotals(items);

      // Prepare items for storage (convert to JSON-safe format)
      const itemsJson = items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        grams: item.grams,
        calories: item.calories,
        protein_g: item.macros?.protein,
        carbs_g: item.macros?.carbs,
        fat_g: item.macros?.fat,
        macros: item.macros,
        confidence: item.confidence,
        source: item.source,
        portion: item.portionDisplay,
        portionDisplay: item.portionDisplay,
      }));

      const timestamp = input.timestamp || new Date().toISOString();

      const { data, error } = await supabase
        .from('meal_logs')
        .insert([{
          user_id: user.id,
          logged_at: timestamp,
          meal_type: input.mealType,
          entry_method: input.source,
          photo_url: input.photoUrl || null,
          items_json: JSON.parse(JSON.stringify(itemsJson)),
          total_calories: calories,
          total_protein_g: macros.protein,
          total_carbs_g: macros.carbs,
          total_fat_g: macros.fat,
          notes: input.notes || null,
        }])
        .select()
        .single();

      if (error) throw error;

      trackEvent('meal_logged', {
        method: input.source,
        item_count: items.length,
        meal_type: input.mealType,
        has_photo: !!input.photoUrl,
      });

      toast.success('Meal logged successfully!');
      return dbRowToFoodLog(data);
    } catch (err) {
      console.error('Failed to create meal log:', err);
      toast.error('Failed to save meal log');
      return null;
    } finally {
      setSaving(false);
    }
  }, [user]);

  /**
   * Update an existing meal log
   */
  const updateMealLog = useCallback(async (
    logId: string,
    updates: Partial<Pick<FoodLog, 'items' | 'mealType' | 'notes' | 'timestamp'>>
  ): Promise<boolean> => {
    if (!user) return false;

    setSaving(true);
    try {
      const updateData: any = {};

      if (updates.items) {
        const { calories, macros } = calculateTotals(updates.items);
        const itemsJson = updates.items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          grams: item.grams,
          calories: item.calories,
          protein_g: item.macros?.protein,
          carbs_g: item.macros?.carbs,
          fat_g: item.macros?.fat,
          macros: item.macros,
          confidence: item.confidence,
          source: item.source,
          portion: item.portionDisplay,
          portionDisplay: item.portionDisplay,
        }));
        updateData.items_json = JSON.parse(JSON.stringify(itemsJson));
        updateData.total_calories = calories;
        updateData.total_protein_g = macros.protein;
        updateData.total_carbs_g = macros.carbs;
        updateData.total_fat_g = macros.fat;
      }

      if (updates.mealType) {
        updateData.meal_type = updates.mealType;
      }

      if (updates.notes !== undefined) {
        updateData.notes = updates.notes || null;
      }

      if (updates.timestamp) {
        updateData.logged_at = updates.timestamp;
      }

      const { error } = await supabase
        .from('meal_logs')
        .update(updateData)
        .eq('id', logId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Meal log updated');
      return true;
    } catch (err) {
      console.error('Failed to update meal log:', err);
      toast.error('Failed to update meal log');
      return false;
    } finally {
      setSaving(false);
    }
  }, [user]);

  /**
   * Delete a meal log
   */
  const deleteMealLog = useCallback(async (logId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('meal_logs')
        .delete()
        .eq('id', logId)
        .eq('user_id', user.id);

      if (error) throw error;

      trackEvent('meal_log_deleted');
      toast.success('Meal log deleted');
      return true;
    } catch (err) {
      console.error('Failed to delete meal log:', err);
      toast.error('Failed to delete meal log');
      return false;
    }
  }, [user]);

  /**
   * Fetch meal logs for a specific date
   */
  const fetchLogsForDate = useCallback(async (date: string): Promise<FoodLog[]> => {
    if (!user) return [];

    setLoading(true);
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', startOfDay.toISOString())
        .lte('logged_at', endOfDay.toISOString())
        .order('logged_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(dbRowToFoodLog);
    } catch (err) {
      console.error('Failed to fetch meal logs:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Fetch recent meal logs
   */
  const fetchRecentLogs = useCallback(async (limit = 10): Promise<FoodLog[]> => {
    if (!user) return [];

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(dbRowToFoodLog);
    } catch (err) {
      console.error('Failed to fetch recent logs:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Get daily nutrition summary
   */
  const getDailySummary = useCallback(async (date: string): Promise<DailyNutritionSummary> => {
    const logs = await fetchLogsForDate(date);
    
    const { calories, macros } = calculateTotals(
      logs.flatMap(log => log.items)
    );

    return {
      date,
      totalCalories: calories,
      totalMacros: macros,
      mealCount: logs.length,
      logs,
    };
  }, [fetchLogsForDate]);

  /**
   * Detect foods from a photo
   */
  const detectFoodsFromPhoto = useCallback(async (imageData: string): Promise<FoodLogItem[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('detect-meal-from-photo', {
        body: { image: imageData },
      });

      if (error) throw error;

      if (data?.error && (!data?.items || data.items.length === 0)) {
        toast.error(data.error);
        return [];
      }

      const detectedItems = (data.items || []).map((item: DetectedFoodItem) => 
        detectedItemToFoodLogItem(item)
      );

      trackEvent('meal_photo_scanned', { item_count: detectedItems.length });

      if (detectedItems.length === 0) {
        toast.info('No foods detected. Add items manually.');
      }

      return detectedItems;
    } catch (err) {
      console.error('Detection error:', err);
      toast.error('Failed to analyze photo. Try again or add manually.');
      trackEvent('meal_scan_error', { reason: err instanceof Error ? err.message : 'unknown' });
      return [];
    }
  }, []);

  return {
    // State
    loading,
    saving,
    measurementSystem,
    defaultUnits,
    primaryWeightUnit,

    // CRUD operations
    createMealLog,
    updateMealLog,
    deleteMealLog,

    // Queries
    fetchLogsForDate,
    fetchRecentLogs,
    getDailySummary,

    // AI detection
    detectFoodsFromPhoto,

    // Utilities
    calculateTotals,
    createFoodLogItem,
  };
}
