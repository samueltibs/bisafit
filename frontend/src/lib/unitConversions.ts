/**
 * Unit conversion utilities for height and weight
 * Database always stores: height_cm (integer), weight_kg (numeric)
 */

export type UnitPreference = 'imperial' | 'metric';

// Weight conversions
const LB_TO_KG = 0.45359237;
const KG_TO_LB = 1 / LB_TO_KG;

// Height conversions
const INCH_TO_CM = 2.54;
const CM_TO_INCH = 1 / INCH_TO_CM;

/**
 * Convert pounds to kilograms
 */
export function lbToKg(lb: number): number {
  return Math.round(lb * LB_TO_KG * 10) / 10;
}

/**
 * Convert kilograms to pounds
 */
export function kgToLb(kg: number): number {
  return Math.round(kg * KG_TO_LB * 10) / 10;
}

/**
 * Convert feet and inches to centimeters
 */
export function ftInToCm(feet: number, inches: number): number {
  const totalInches = feet * 12 + inches;
  return Math.round(totalInches * INCH_TO_CM);
}

/**
 * Convert centimeters to feet and inches
 */
export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalInches = cm * CM_TO_INCH;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  // Handle edge case where inches rounds to 12
  if (inches === 12) {
    return { feet: feet + 1, inches: 0 };
  }
  return { feet, inches };
}

/**
 * Get default unit preference based on browser locale
 * US uses imperial, most other countries use metric
 */
export function getDefaultUnitPreference(): UnitPreference {
  const locale = navigator.language || 'en-US';
  // US, Liberia, and Myanmar use imperial
  if (locale.startsWith('en-US') || locale === 'en-LR' || locale === 'my-MM') {
    return 'imperial';
  }
  return 'metric';
}

/**
 * Format height for display based on unit preference
 */
export function formatHeight(heightCm: number | null, unit: UnitPreference): string {
  if (!heightCm) return '-';
  if (unit === 'metric') {
    return `${heightCm} cm`;
  }
  const { feet, inches } = cmToFtIn(heightCm);
  return `${feet}'${inches}"`;
}

/**
 * Format weight for display based on unit preference
 */
export function formatWeight(weightKg: number | null, unit: UnitPreference): string {
  if (!weightKg) return '-';
  if (unit === 'metric') {
    return `${Number(weightKg)} kg`;
  }
  return `${kgToLb(Number(weightKg))} lb`;
}
