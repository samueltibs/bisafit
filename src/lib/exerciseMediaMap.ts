/**
 * Exercise Media Map
 * 
 * Central lookup system for exercise demonstration assets and form tips.
 * Provides normalized name matching for flexible exercise lookups.
 */

import { allExerciseMediaData, ExerciseMediaEntry } from './exerciseMediaData';

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
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^db\s+/i, 'dumbbell ')
    .replace(/^bb\s+/i, 'barbell ')
    .replace(/^kb\s+/i, 'kettlebell ')
    .replace(/-/g, ' ') // Normalize hyphens to spaces for matching
    .replace(/\s+/g, ' '); // Clean up any double spaces
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
 * Resolved media map cache
 */
let resolvedMediaMap: Record<string, ExerciseMediaInfo> | null = null;

/**
 * Build the full media map with resolved URLs
 */
export function getExerciseMediaMap(): Record<string, ExerciseMediaInfo> {
  if (resolvedMediaMap) {
    return resolvedMediaMap;
  }

  resolvedMediaMap = {};
  
  for (const [key, value] of Object.entries(allExerciseMediaData)) {
    resolvedMediaMap[key] = {
      image_url: getExerciseMediaUrl(value.filename),
      video_url_optional: value.video_url_optional,
      default_cues: value.default_cues,
    };
  }

  return resolvedMediaMap;
}

/**
 * Look up exercise media by name
 * Returns null if not found
 * 
 * Uses multiple matching strategies:
 * 1. Direct match after normalization
 * 2. Partial match (exercise name contains key or key contains exercise name)
 * 3. Word-based matching for compound names
 */
export function lookupExerciseMedia(exerciseName: string): ExerciseMediaInfo | null {
  const normalized = normalizeExerciseName(exerciseName);
  const mediaMap = getExerciseMediaMap();
  
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
