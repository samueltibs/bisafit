/**
 * Country/Region utilities
 * 
 * Provides country detection, defaults, and mapping for contextual preferences.
 * Country selection provides sensible defaults but does not restrict user choices.
 * Uses the full ISO-3166 country list from countryFlags.ts as the single source of truth.
 */

import type { UnitPreference } from './unitConversions';
import { ALL_COUNTRIES, getCountryFromCode as getCountryFromFullList } from './countryFlags';

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  defaultUnit: UnitPreference;
}

// Countries that use imperial units
const IMPERIAL_COUNTRIES = new Set(['US', 'LR', 'MM']);

/**
 * Re-export full country list with unit preference added
 */
export const COUNTRIES: Country[] = ALL_COUNTRIES.map(c => ({
  code: c.code,
  name: c.name,
  defaultUnit: IMPERIAL_COUNTRIES.has(c.code) ? 'imperial' as UnitPreference : 'metric' as UnitPreference,
}));

/**
 * Get country by ISO code from the full list
 */
export function getCountryByCode(code: string | null): Country | undefined {
  if (!code) return undefined;
  const country = getCountryFromFullList(code);
  if (!country) return undefined;
  return {
    code: country.code,
    name: country.name,
    defaultUnit: IMPERIAL_COUNTRIES.has(country.code) ? 'imperial' : 'metric',
  };
}

/**
 * Get the default unit preference for a country
 */
export function getUnitPreferenceForCountry(countryCode: string | null): UnitPreference {
  if (!countryCode) return 'metric';
  return IMPERIAL_COUNTRIES.has(countryCode.toUpperCase()) ? 'imperial' : 'metric';
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
      // Verify it's a valid country in our full list
      if (getCountryFromFullList(countryCode)) {
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
      sw: 'KE',
      af: 'ZA',
      lg: 'UG',
    };

    const langCode = parts[0].toLowerCase();
    const fallbackCountry = languageToCountry[langCode];
    if (fallbackCountry && getCountryFromFullList(fallbackCountry)) {
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
