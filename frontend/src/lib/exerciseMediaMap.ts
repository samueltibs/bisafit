/**
 * Exercise Media Map
 * 
 * Central lookup system for exercise demonstration assets and form tips.
 * Provides normalized name matching for flexible exercise lookups.
 * Supports gender-specific demo image selection.
 */

import { allExerciseMediaData, ExerciseMediaEntry, UserGender } from './exerciseMediaData';

export interface ExerciseMediaInfo {
  image_url: string;
  video_url_optional: string | null;
  default_cues: string[];
}

/**
 * Normalize exercise name for consistent lookup
 * - lowercase
 * - trim whitespace
 * - remove extra spaces
 * - handle common variations (db = dumbbell, bb = barbell, etc.)
 */
export function normalizeExerciseName(name: string): string {
  let normalized = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^db\s+/i, 'dumbbell ')
    .replace(/^bb\s+/i, 'barbell ')
    .replace(/^kb\s+/i, 'kettlebell ')
    .replace(/-/g, ' ') // Normalize hyphens to spaces for matching
    .replace(/\s+/g, ' '); // Clean up any double spaces
  
  return normalized;
}

/**
 * Try to find singular form of exercise name
 */
function getSingularForm(name: string): string | null {
  // Keep certain plurals as-is (they're proper names)
  const keepPlural = ['jumping jacks', 'high knees', 'butt kicks', 'flutter kicks'];
  if (keepPlural.includes(name)) return null;
  
  if (name.endsWith('es') && !name.endsWith('sses') && !name.endsWith('ches')) {
    return name.slice(0, -1); // lunges -> lunge
  }
  if (name.endsWith('s') && !name.endsWith('ss')) {
    return name.slice(0, -1); // squats -> squat
  }
  return null;
}

/**
 * Get the public URL for an exercise media file
 * Uses local public folder for now, can be updated to use Supabase storage
 */
function getExerciseMediaUrl(filename: string): string {
  // Use local public folder
  return `/exercise-media/${filename}`;
}

/**
 * Select the appropriate demo image based on user gender
 * Priority: gender-specific > neutral > legacy filename
 */
function selectDemoImage(
  entry: ExerciseMediaEntry,
  gender: UserGender = 'unspecified'
): string {
  // If demoImages exists, use gender-specific selection
  if (entry.demoImages) {
    const { male, female, neutral } = entry.demoImages;
    
    switch (gender) {
      case 'male':
        return male || neutral || entry.filename;
      case 'female':
        return female || neutral || male || entry.filename;
      case 'unspecified':
      default:
        return neutral || male || entry.filename;
    }
  }
  
  // Fallback to legacy filename
  return entry.filename;
}

/**
 * Resolved media map cache (per gender)
 */
const resolvedMediaMapCache: Map<UserGender, Record<string, ExerciseMediaInfo>> = new Map();

/**
 * Build the full media map with resolved URLs for a specific gender
 */
export function getExerciseMediaMap(gender: UserGender = 'unspecified'): Record<string, ExerciseMediaInfo> {
  // Check cache first
  const cached = resolvedMediaMapCache.get(gender);
  if (cached) {
    return cached;
  }

  const resolvedMediaMap: Record<string, ExerciseMediaInfo> = {};
  
  for (const [key, value] of Object.entries(allExerciseMediaData)) {
    const selectedFilename = selectDemoImage(value, gender);
    resolvedMediaMap[key] = {
      image_url: getExerciseMediaUrl(selectedFilename),
      video_url_optional: value.video_url_optional,
      default_cues: value.default_cues,
    };
  }

  // Cache the result
  resolvedMediaMapCache.set(gender, resolvedMediaMap);

  return resolvedMediaMap;
}

/**
 * Clear the media map cache (useful when assets are updated)
 */
export function clearMediaMapCache(): void {
  resolvedMediaMapCache.clear();
}

/**
 * Look up exercise media by name with optional gender preference
 * Returns null if not found
 * 
 * Uses multiple matching strategies:
 * 1. Direct match after normalization
 * 2. Partial match (exercise name contains key or key contains exercise name)
 * 3. Word-based matching for compound names
 */
export function lookupExerciseMedia(
  exerciseName: string,
  gender: UserGender = 'unspecified'
): ExerciseMediaInfo | null {
  const normalized = normalizeExerciseName(exerciseName);
  const mediaMap = getExerciseMediaMap(gender);
  
  // Direct lookup
  if (mediaMap[normalized]) {
    return mediaMap[normalized];
  }

  // Try without hyphens as well
  const withoutHyphens = normalized.replace(/-/g, ' ');
  if (mediaMap[withoutHyphens]) {
    return mediaMap[withoutHyphens];
  }

  // Try partial matching for variations
  let bestMatch: ExerciseMediaInfo | null = null;
  let bestMatchLength = 0;

  for (const [key, value] of Object.entries(mediaMap)) {
    const normalizedKey = normalizeExerciseName(key);
    
    // Check if the exercise name contains the key or vice versa
    if (normalized.includes(normalizedKey) || normalizedKey.includes(normalized)) {
      // Prefer longer matches (more specific)
      if (normalizedKey.length > bestMatchLength) {
        bestMatch = value;
        bestMatchLength = normalizedKey.length;
      }
    }

    // Word-based matching - check if key words appear in name
    const keyWords = normalizedKey.split(' ').filter(w => w.length > 2);
    const nameWords = normalized.split(' ');
    const matchingWords = keyWords.filter(kw => nameWords.some(nw => nw.includes(kw) || kw.includes(nw)));
    
    if (matchingWords.length >= Math.ceil(keyWords.length * 0.7) && matchingWords.length > 0) {
      const matchScore = matchingWords.join('').length;
      if (matchScore > bestMatchLength) {
        bestMatch = value;
        bestMatchLength = matchScore;
      }
    }
  }

  return bestMatch;
}

/**
 * Get default cues for an exercise
 * Returns empty array if not found
 */
export function getDefaultCues(exerciseName: string): string[] {
  const media = lookupExerciseMedia(exerciseName);
  return media?.default_cues || [];
}

/**
 * Check if an exercise has media available
 */
export function hasExerciseMedia(exerciseName: string): boolean {
  return lookupExerciseMedia(exerciseName) !== null;
}

/**
 * Get total count of exercises with media
 */
export function getExerciseMediaCount(): number {
  return Object.keys(getExerciseMediaMap()).length;
}
