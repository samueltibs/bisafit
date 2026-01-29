/**
 * Meal Logging Data Models
 * 
 * These types define the structure for meal logging functionality,
 * supporting both photo-based AI detection and manual entry.
 */

// Allowed unit types based on measurement system
export type MetricUnit = 'g' | 'kg' | 'ml' | 'L' | 'serving' | 'piece' | 'cup' | 'tbsp' | 'tsp';
export type ImperialUnit = 'oz' | 'lb' | 'fl oz' | 'cup' | 'serving' | 'piece' | 'tbsp' | 'tsp' | 'pint' | 'quart';
export type FoodUnit = MetricUnit | ImperialUnit;

export type MeasurementSystem = 'metric' | 'imperial';
export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
export type EntryMethod = 'photo' | 'manual' | 'copy' | 'planned_meal';
export type ItemSource = 'ai_detected' | 'user_added' | 'copied' | 'from_plan';

/**
 * Macronutrient breakdown
 */
export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Individual food item within a meal log
 */
export interface FoodLogItem {
  /** Unique identifier for this item */
  id: string;
  /** Name of the food item */
  name: string;
  /** Display quantity (user-entered value) */
  quantity?: number;
  /** Unit of measurement */
  unit?: FoodUnit;
  /** Normalized weight in grams (for consistent calculations) */
  grams?: number;
  /** Estimated calories for this item */
  calories?: number;
  /** Macronutrient breakdown */
  macros?: Macros;
  /** AI confidence score (0-1) for detected items */
  confidence?: number;
  /** How this item was added to the log */
  source: ItemSource;
  /** User-facing portion description (e.g., "1 medium", "2 cups") */
  portionDisplay?: string;
}

/**
 * Complete meal log entry
 */
export interface FoodLog {
  /** Unique identifier */
  id: string;
  /** User who created this log */
  userId: string;
  /** When the meal was consumed */
  timestamp: string;
  /** Type of meal */
  mealType: MealType;
  /** How the log was created */
  source: EntryMethod;
  /** URL to photo (if photo-based entry) */
  photoUrl?: string;
  /** Total calories for the meal */
  totalCalories: number;
  /** Total macronutrients */
  totalMacros: Macros;
  /** Individual food items */
  items: FoodLogItem[];
  /** Optional notes about the meal */
  notes?: string;
  /** Whether this log is marked as estimated (AI-detected) */
  isEstimated: boolean;
  /** When this log was created */
  createdAt: string;
  /** When this log was last updated */
  updatedAt: string;
}

/**
 * Input for creating a new food item
 */
export interface FoodLogItemInput {
  name: string;
  quantity?: number;
  unit?: FoodUnit;
  calories?: number;
  macros?: Partial<Macros>;
  source?: ItemSource;
  portionDisplay?: string;
  confidence?: number;
}

/**
 * Input for creating a new meal log
 */
export interface CreateMealLogInput {
  mealType: MealType;
  source: EntryMethod;
  items: FoodLogItemInput[];
  timestamp?: string;
  photoUrl?: string;
  notes?: string;
}

/**
 * AI detection result for a single food item
 */
export interface DetectedFoodItem {
  name: string;
  portion: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: number;
}

/**
 * Response from meal photo detection
 */
export interface MealDetectionResult {
  items: DetectedFoodItem[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  notes?: string;
  error?: string;
}

/**
 * Daily nutrition summary
 */
export interface DailyNutritionSummary {
  date: string;
  totalCalories: number;
  totalMacros: Macros;
  mealCount: number;
  logs: FoodLog[];
}
