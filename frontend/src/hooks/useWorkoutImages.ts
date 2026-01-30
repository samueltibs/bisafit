/**
 * Workout Images Hook
 * 
 * Serves exercise form guide images from static library.
 * NO AI CREDITS REQUIRED - images are pre-generated and stored locally.
 * 
 * Images are stored in /public/exercise-media/
 * - Neutral images: /exercise-media/{filename}.png
 * - Male variants: /exercise-media/male/{filename}.png
 * - Female variants: /exercise-media/female/{filename}.png
 */

import { useState, useCallback } from 'react';
import { allExerciseMediaData, getExerciseMedia } from '@/lib/exerciseMediaData';

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
 * Get static image URL for an exercise
 */
function getStaticImageUrl(exerciseName: string, gender: string = 'neutral'): string | null {
  // First try to find in the exercise media data
  const mediaEntry = getExerciseMedia(exerciseName, gender as any);
  
  if (mediaEntry) {
    // Check for gender-specific images first
    if (mediaEntry.demoImages) {
      if (gender === 'male' && mediaEntry.demoImages.male) {
        return `${EXERCISE_MEDIA_BASE}/${mediaEntry.demoImages.male}`;
      }
      if (gender === 'female' && mediaEntry.demoImages.female) {
        return `${EXERCISE_MEDIA_BASE}/${mediaEntry.demoImages.female}`;
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

export function useWorkoutImages(userGender: string = 'male'): UseWorkoutImagesReturn {
  const [cache, setCache] = useState<Record<string, { image_url: string }>>(
    Object.entries(verifiedImageCache).reduce((acc, [key, url]) => {
      acc[key] = { image_url: url };
      return acc;
    }, {} as Record<string, { image_url: string }>)
  );
  const [isGenerating] = useState(false);

  // Get image URL from static library
  const getImageForExercise = useCallback((exerciseName: string, muscleGroup?: string): string | null => {
    const cacheKey = `${exerciseName.toLowerCase()}_${userGender}`;
    
    // Check cache first
    if (verifiedImageCache[cacheKey]) {
      return verifiedImageCache[cacheKey];
    }
    
    // Get static image URL
    const imageUrl = getStaticImageUrl(exerciseName, userGender);
    
    if (imageUrl) {
      // Cache the URL
      verifiedImageCache[cacheKey] = imageUrl;
      return imageUrl;
    }
    
    return null;
  }, [userGender]);

  // "Generate" image - just looks up from static library (no API call needed)
  const generateImage = useCallback(async (exerciseName: string, muscleGroup: string = 'full body', gender?: string) => {
    const genderToUse = gender || userGender || 'male';
    const cacheKey = `${exerciseName.toLowerCase()}_${genderToUse}`;
    
    // Get static image URL
    const imageUrl = getStaticImageUrl(exerciseName, genderToUse);
    
    if (imageUrl) {
      verifiedImageCache[cacheKey] = imageUrl;
      setCache(prev => ({
        ...prev,
        [cacheKey]: { image_url: imageUrl }
      }));
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
