/**
 * Workout Images Hook
 * 
 * Serves exercise form guide images from:
 * 1. Static library in /public/exercise-media/ (first priority)
 * 2. Supabase Storage cache (fallback for AI-generated images)
 * 
 * Images are stored in /public/exercise-media/
 * - Neutral images: /exercise-media/{filename}.png
 * - Male variants: /exercise-media/male/{filename}.png
 * - Female variants: /exercise-media/female/{filename}.png
 */

import { useState, useCallback, useEffect } from 'react';
import { allExerciseMediaData } from '@/lib/exerciseMediaData';

const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

interface UseWorkoutImagesReturn {
  getImageForExercise: (exerciseName: string, muscleGroup?: string) => string | null;
  generateImage: (exerciseName: string, muscleGroup?: string, gender?: string) => Promise<void>;
  isGenerating: boolean;
  cache: Record<string, { image_url: string }>;
}

// Base path for static exercise images
const EXERCISE_MEDIA_BASE = '/exercise-media';

/**
 * Convert exercise name to filename
 * e.g., "Jumping Jacks" -> "jumping-jacks.png"
 */
function exerciseNameToFilename(exerciseName: string): string {
  return exerciseName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .concat('.png');
}

/**
 * Look up exercise in the media data
 */
function findExerciseMedia(exerciseName: string) {
  const normalizedName = exerciseName.toLowerCase().trim();
  
  // Direct lookup
  if (allExerciseMediaData[normalizedName]) {
    return allExerciseMediaData[normalizedName];
  }
  
  // Try variations
  const variations = [
    normalizedName,
    normalizedName.replace(/s$/, ''), // Remove trailing 's'
    normalizedName.replace(/es$/, ''), // Remove trailing 'es'
    normalizedName.replace(/-/g, ' '), // Replace hyphens with spaces
    normalizedName.replace(/\s+/g, '-'), // Replace spaces with hyphens
  ];
  
  for (const variation of variations) {
    if (allExerciseMediaData[variation]) {
      return allExerciseMediaData[variation];
    }
  }
  
  return null;
}

/**
 * Get static image URL for an exercise
 */
function getStaticImageUrl(exerciseName: string, gender: string = 'neutral'): string | null {
  const mediaEntry = findExerciseMedia(exerciseName);
  
  if (mediaEntry) {
    // Check for gender-specific images first
    if (mediaEntry.demoImages) {
      if (gender === 'male' && mediaEntry.demoImages.male) {
        return `${EXERCISE_MEDIA_BASE}/male/${mediaEntry.demoImages.male}`;
      }
      if (gender === 'female' && mediaEntry.demoImages.female) {
        return `${EXERCISE_MEDIA_BASE}/female/${mediaEntry.demoImages.female}`;
      }
      if (mediaEntry.demoImages.neutral) {
        return `${EXERCISE_MEDIA_BASE}/${mediaEntry.demoImages.neutral}`;
      }
    }
    
    // Fall back to filename
    if (mediaEntry.filename) {
      // Check gender-specific folder first
      if (gender === 'male' || gender === 'female') {
        return `${EXERCISE_MEDIA_BASE}/${gender}/${mediaEntry.filename}`;
      }
      return `${EXERCISE_MEDIA_BASE}/${mediaEntry.filename}`;
    }
  }
  
  // Generate filename from exercise name as fallback
  const filename = exerciseNameToFilename(exerciseName);
  
  // Try gender-specific folder first
  if (gender === 'male' || gender === 'female') {
    return `${EXERCISE_MEDIA_BASE}/${gender}/${filename}`;
  }
  
  return `${EXERCISE_MEDIA_BASE}/${filename}`;
}

// In-memory cache for verified image URLs
const verifiedImageCache: Record<string, string> = {};

// Cache for Supabase Storage URLs
const supabaseImageCache: Record<string, string | null> = {};

// Fetch image from Supabase Storage cache
async function fetchSupabaseImage(exerciseName: string): Promise<string | null> {
  const normalizedName = exerciseName.toLowerCase().trim();
  
  // Check local cache first
  if (normalizedName in supabaseImageCache) {
    return supabaseImageCache[normalizedName];
  }
  
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/exercise-image-cached/${encodeURIComponent(normalizedName)}`,
      { signal: AbortSignal.timeout(10000) }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.cached && data.image_url) {
        console.log(`[WorkoutImages] Supabase cache hit: ${exerciseName} -> ${data.image_url.substring(0, 60)}...`);
        supabaseImageCache[normalizedName] = data.image_url;
        return data.image_url;
      }
    }
  } catch (error) {
    console.log(`[WorkoutImages] Failed to fetch from Supabase: ${exerciseName}`);
  }
  
  supabaseImageCache[normalizedName] = null;
  return null;
}

export function useWorkoutImages(userGender: string = 'male'): UseWorkoutImagesReturn {
  const [cache, setCache] = useState<Record<string, { image_url: string }>>(
    Object.entries(verifiedImageCache).reduce((acc, [key, url]) => {
      acc[key] = { image_url: url };
      return acc;
    }, {} as Record<string, { image_url: string }>)
  );
  const [isGenerating, setIsGenerating] = useState(false);

  // Get image URL from static library OR Supabase cache
  const getImageForExercise = useCallback((exerciseName: string, muscleGroup?: string): string | null => {
    const cacheKey = `${exerciseName.toLowerCase()}_${userGender}`;
    
    // Check verified cache first
    if (verifiedImageCache[cacheKey]) {
      return verifiedImageCache[cacheKey];
    }
    
    // Check Supabase cache (synchronous check of already-fetched URLs)
    const normalizedName = exerciseName.toLowerCase().trim();
    if (supabaseImageCache[normalizedName]) {
      return supabaseImageCache[normalizedName];
    }
    
    // Try static image URL
    const imageUrl = getStaticImageUrl(exerciseName, userGender);
    
    if (imageUrl) {
      // Cache the URL
      verifiedImageCache[cacheKey] = imageUrl;
      return imageUrl;
    }
    
    return null;
  }, [userGender]);

  // "Generate" image - tries static library first, then Supabase cache
  const generateImage = useCallback(async (exerciseName: string, muscleGroup: string = 'full body', gender?: string) => {
    const genderToUse = gender || userGender || 'male';
    const cacheKey = `${exerciseName.toLowerCase()}_${genderToUse}`;
    
    setIsGenerating(true);
    
    try {
      // First try static image
      const staticUrl = getStaticImageUrl(exerciseName, genderToUse);
      
      if (staticUrl) {
        console.log(`[WorkoutImages] Using static: ${exerciseName} -> ${staticUrl}`);
        verifiedImageCache[cacheKey] = staticUrl;
        setCache(prev => ({
          ...prev,
          [cacheKey]: { image_url: staticUrl }
        }));
        return;
      }
      
      // Fall back to Supabase Storage cache
      const supabaseUrl = await fetchSupabaseImage(exerciseName);
      
      if (supabaseUrl) {
        verifiedImageCache[cacheKey] = supabaseUrl;
        setCache(prev => ({
          ...prev,
          [cacheKey]: { image_url: supabaseUrl }
        }));
      }
    } finally {
      setIsGenerating(false);
    }
  }, [userGender]);

  return {
    getImageForExercise,
    generateImage,
    isGenerating,
    cache,
  };
}

/**
 * Batch "generate" images for an entire workout
 * Now just returns static image URLs (no API call needed)
 */
export async function generateWorkoutImagesBatch(
  exercises: Array<{ name: string; muscle_group?: string }>,
  gender: string = 'male'
): Promise<Record<string, string>> {
  const imageMap: Record<string, string> = {};
  
  for (const exercise of exercises) {
    const imageUrl = getStaticImageUrl(exercise.name, gender);
    if (imageUrl) {
      imageMap[exercise.name] = imageUrl;
      
      // Also cache it
      const cacheKey = `${exercise.name.toLowerCase()}_${gender}`;
      verifiedImageCache[cacheKey] = imageUrl;
    }
  }
  
  return imageMap;
}
