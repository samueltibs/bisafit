/**
 * Country/Region utilities
 * 
 * Provides country detection, defaults, and mapping for contextual preferences.
 * Country selection provides sensible defaults but does not restrict user choices.
 */

import type { UnitPreference } from './unitConversions';

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  defaultUnit: UnitPreference;
}

// Common countries list - can be expanded as needed
const countriesData: Array<{ code: string; name: string; defaultUnit: UnitPreference }> = [
  { code: 'US', name: 'United States', defaultUnit: 'imperial' },
  { code: 'GB', name: 'United Kingdom', defaultUnit: 'metric' },
  { code: 'CA', name: 'Canada', defaultUnit: 'metric' },
  { code: 'AU', name: 'Australia', defaultUnit: 'metric' },
  { code: 'DE', name: 'Germany', defaultUnit: 'metric' },
  { code: 'FR', name: 'France', defaultUnit: 'metric' },
  { code: 'ES', name: 'Spain', defaultUnit: 'metric' },
  { code: 'IT', name: 'Italy', defaultUnit: 'metric' },
  { code: 'NL', name: 'Netherlands', defaultUnit: 'metric' },
  { code: 'BE', name: 'Belgium', defaultUnit: 'metric' },
  { code: 'CH', name: 'Switzerland', defaultUnit: 'metric' },
  { code: 'AT', name: 'Austria', defaultUnit: 'metric' },
  { code: 'SE', name: 'Sweden', defaultUnit: 'metric' },
  { code: 'NO', name: 'Norway', defaultUnit: 'metric' },
  { code: 'DK', name: 'Denmark', defaultUnit: 'metric' },
  { code: 'FI', name: 'Finland', defaultUnit: 'metric' },
  { code: 'IE', name: 'Ireland', defaultUnit: 'metric' },
  { code: 'PT', name: 'Portugal', defaultUnit: 'metric' },
  { code: 'PL', name: 'Poland', defaultUnit: 'metric' },
  { code: 'CZ', name: 'Czech Republic', defaultUnit: 'metric' },
  { code: 'HU', name: 'Hungary', defaultUnit: 'metric' },
  { code: 'RO', name: 'Romania', defaultUnit: 'metric' },
  { code: 'GR', name: 'Greece', defaultUnit: 'metric' },
  { code: 'RU', name: 'Russia', defaultUnit: 'metric' },
  { code: 'UA', name: 'Ukraine', defaultUnit: 'metric' },
  { code: 'TR', name: 'Turkey', defaultUnit: 'metric' },
  { code: 'BR', name: 'Brazil', defaultUnit: 'metric' },
  { code: 'MX', name: 'Mexico', defaultUnit: 'metric' },
  { code: 'AR', name: 'Argentina', defaultUnit: 'metric' },
  { code: 'CL', name: 'Chile', defaultUnit: 'metric' },
  { code: 'CO', name: 'Colombia', defaultUnit: 'metric' },
  { code: 'PE', name: 'Peru', defaultUnit: 'metric' },
  { code: 'JP', name: 'Japan', defaultUnit: 'metric' },
  { code: 'KR', name: 'South Korea', defaultUnit: 'metric' },
  { code: 'CN', name: 'China', defaultUnit: 'metric' },
  { code: 'IN', name: 'India', defaultUnit: 'metric' },
  { code: 'ID', name: 'Indonesia', defaultUnit: 'metric' },
  { code: 'MY', name: 'Malaysia', defaultUnit: 'metric' },
  { code: 'SG', name: 'Singapore', defaultUnit: 'metric' },
  { code: 'TH', name: 'Thailand', defaultUnit: 'metric' },
  { code: 'VN', name: 'Vietnam', defaultUnit: 'metric' },
  { code: 'PH', name: 'Philippines', defaultUnit: 'metric' },
  { code: 'ZA', name: 'South Africa', defaultUnit: 'metric' },
  { code: 'EG', name: 'Egypt', defaultUnit: 'metric' },
  { code: 'NG', name: 'Nigeria', defaultUnit: 'metric' },
  { code: 'KE', name: 'Kenya', defaultUnit: 'metric' },
  { code: 'AE', name: 'United Arab Emirates', defaultUnit: 'metric' },
  { code: 'SA', name: 'Saudi Arabia', defaultUnit: 'metric' },
  { code: 'IL', name: 'Israel', defaultUnit: 'metric' },
  { code: 'NZ', name: 'New Zealand', defaultUnit: 'metric' },
  { code: 'LR', name: 'Liberia', defaultUnit: 'imperial' },
  { code: 'MM', name: 'Myanmar', defaultUnit: 'imperial' },
];

export const COUNTRIES: Country[] = countriesData.sort((a, b) => a.name.localeCompare(b.name));

/**
 * Get country by ISO code
 */
export function getCountryByCode(code: string | null): Country | undefined {
  if (!code) return undefined;
  return COUNTRIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
}

/**
 * Get the default unit preference for a country
 */
export function getUnitPreferenceForCountry(countryCode: string | null): UnitPreference {
  const country = getCountryByCode(countryCode);
  return country?.defaultUnit || 'metric';
}

/**
 * Detect country from browser/device settings
 * Returns ISO 3166-1 alpha-2 code or null if not detectable
 */
export function detectCountryFromDevice(): string | null {
  try {
    // Get locale from navigator
    const locale = navigator.language || navigator.languages?.[0];
    if (!locale) return null;

    // Extract country code from locale (e.g., 'en-US' -> 'US', 'de-DE' -> 'DE')
    const parts = locale.split('-');
    if (parts.length >= 2) {
      const countryCode = parts[parts.length - 1].toUpperCase();
      // Verify it's a valid country in our list
      if (getCountryByCode(countryCode)) {
        return countryCode;
      }
    }

    // Fallback: try to map language to common country
    const languageToCountry: Record<string, string> = {
      en: 'US',
      de: 'DE',
      fr: 'FR',
      es: 'ES',
      it: 'IT',
      pt: 'BR',
      ja: 'JP',
      ko: 'KR',
      zh: 'CN',
      ru: 'RU',
      ar: 'SA',
      hi: 'IN',
      nl: 'NL',
      pl: 'PL',
      tr: 'TR',
    };

    const langCode = parts[0].toLowerCase();
    const fallbackCountry = languageToCountry[langCode];
    if (fallbackCountry && getCountryByCode(fallbackCountry)) {
      return fallbackCountry;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get country name for display
 */
export function getCountryName(code: string | null): string {
  const country = getCountryByCode(code);
  return country?.name || 'Not set';
}
