/**
 * Food Unit Conversion Utilities
 * 
 * Handles unit conversions for food measurements, supporting both
 * metric and imperial systems while normalizing to grams for calculations.
 */

import type { FoodUnit, MeasurementSystem, MetricUnit, ImperialUnit } from '@/types/mealLog';

// Conversion factors to grams
const UNIT_TO_GRAMS: Record<string, number> = {
  // Metric
  'g': 1,
  'kg': 1000,
  'ml': 1, // Approximation: 1ml water = 1g
  'L': 1000,
  // Imperial weight
  'oz': 28.3495,
  'lb': 453.592,
  // Imperial volume (approximate for water-like liquids)
  'fl oz': 29.5735,
  'pint': 473.176,
  'quart': 946.353,
  // Common measures (approximate)
  'cup': 240, // ~240ml
  'tbsp': 15,
  'tsp': 5,
  'serving': 100, // Default assumption
  'piece': 100, // Default assumption
};

// Default units for each measurement system
export const DEFAULT_METRIC_UNITS: MetricUnit[] = ['g', 'kg', 'ml', 'serving', 'piece', 'cup', 'tbsp', 'tsp'];
export const DEFAULT_IMPERIAL_UNITS: ImperialUnit[] = ['oz', 'lb', 'fl oz', 'cup', 'serving', 'piece', 'tbsp', 'tsp'];

/**
 * Get the default units based on measurement system
 */
export function getDefaultUnits(system: MeasurementSystem): FoodUnit[] {
  return system === 'imperial' ? DEFAULT_IMPERIAL_UNITS : DEFAULT_METRIC_UNITS;
}

/**
 * Get the primary weight unit for a measurement system
 */
export function getPrimaryWeightUnit(system: MeasurementSystem): FoodUnit {
  return system === 'imperial' ? 'oz' : 'g';
}

/**
 * Get the primary volume unit for a measurement system
 */
export function getPrimaryVolumeUnit(system: MeasurementSystem): FoodUnit {
  return system === 'imperial' ? 'fl oz' : 'ml';
}

/**
 * Convert a quantity with unit to normalized grams
 */
export function toGrams(quantity: number, unit: FoodUnit): number {
  const factor = UNIT_TO_GRAMS[unit] || 1;
  return Math.round(quantity * factor * 10) / 10;
}

/**
 * Convert grams to a specific unit
 */
export function fromGrams(grams: number, targetUnit: FoodUnit): number {
  const factor = UNIT_TO_GRAMS[targetUnit] || 1;
  return Math.round((grams / factor) * 100) / 100;
}

/**
 * Convert between any two food units
 */
export function convertUnits(quantity: number, fromUnit: FoodUnit, toUnit: FoodUnit): number {
  if (fromUnit === toUnit) return quantity;
  const grams = toGrams(quantity, fromUnit);
  return fromGrams(grams, toUnit);
}

/**
 * Format a quantity with unit for display
 */
export function formatQuantityWithUnit(quantity: number | undefined, unit: FoodUnit | undefined): string {
  if (quantity === undefined || quantity === null) return '';
  if (!unit) return `${quantity}`;
  
  // Format the quantity nicely
  const formatted = quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(1);
  return `${formatted} ${unit}`;
}

/**
 * Parse a portion string into quantity and unit
 * e.g., "100g" -> { quantity: 100, unit: 'g' }
 * e.g., "2 cups" -> { quantity: 2, unit: 'cup' }
 */
export function parsePortionString(portion: string): { quantity?: number; unit?: FoodUnit; display: string } {
  if (!portion) return { display: '' };

  // Common patterns
  const patterns = [
    /^(\d+(?:\.\d+)?)\s*(g|kg|ml|L|oz|lb|fl\s*oz|cup|cups|tbsp|tsp|serving|servings|piece|pieces|pint|quart)s?$/i,
    /^(\d+(?:\.\d+)?)\s*$/,
  ];

  for (const pattern of patterns) {
    const match = portion.trim().match(pattern);
    if (match) {
      const quantity = parseFloat(match[1]);
      let unit = match[2]?.toLowerCase().replace(/s$/, '').replace(/\s+/g, ' ') as FoodUnit | undefined;
      
      // Normalize unit names
      if (unit === 'fl oz') unit = 'fl oz' as FoodUnit;
      if (unit === 'serving') unit = 'serving' as FoodUnit;
      if (unit === 'piece') unit = 'piece' as FoodUnit;
      if (unit === 'cup') unit = 'cup' as FoodUnit;

      return { quantity, unit, display: portion };
    }
  }

  // If no match, return the original string as display
  return { display: portion };
}

/**
 * Get a display label for a unit
 */
export function getUnitLabel(unit: FoodUnit): string {
  const labels: Record<FoodUnit, string> = {
    'g': 'grams',
    'kg': 'kilograms',
    'ml': 'milliliters',
    'L': 'liters',
    'oz': 'ounces',
    'lb': 'pounds',
    'fl oz': 'fluid ounces',
    'cup': 'cups',
    'tbsp': 'tablespoons',
    'tsp': 'teaspoons',
    'serving': 'servings',
    'piece': 'pieces',
    'pint': 'pints',
    'quart': 'quarts',
  };
  return labels[unit] || unit;
}

/**
 * Check if a unit is a weight unit
 */
export function isWeightUnit(unit: FoodUnit): boolean {
  return ['g', 'kg', 'oz', 'lb'].includes(unit);
}

/**
 * Check if a unit is a volume unit
 */
export function isVolumeUnit(unit: FoodUnit): boolean {
  return ['ml', 'L', 'fl oz', 'cup', 'pint', 'quart', 'tbsp', 'tsp'].includes(unit);
}

/**
 * Suggest the best unit based on the grams value
 */
export function suggestUnit(grams: number, system: MeasurementSystem): FoodUnit {
  if (system === 'imperial') {
    if (grams >= 453.592) return 'lb'; // >= 1 lb
    return 'oz';
  } else {
    if (grams >= 1000) return 'kg';
    return 'g';
  }
}
