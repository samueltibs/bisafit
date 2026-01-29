/**
 * Workout AI Images Hook
 * 
 * Manages AI-generated workout form guide images with caching.
 * Generates gender-specific images using OpenAI DALL-E 3.
 */

import { useState, useEffect, useCallback } from 'react';
import { useUserProfile } from './useUserProfile';
import { toast } from 'sonner';

interface WorkoutImage {
  exercise_name: string;
  image_base64: string;
  gender: string;
  muscle_group: string;
}

interface UseWorkoutImagesReturn {
  getImageForExercise: (exerciseName: string, muscleGroup?: string) => string | null;
  generateImage: (exerciseName: string, muscleGroup?: string) => Promise<void>;
  isGenerating: boolean;
  cache: Record<string, WorkoutImage>;
}

// In-memory cache for workout images
const imageCache: Record<string, WorkoutImage> = {};

export function useWorkoutImages(): UseWorkoutImagesReturn {
  const { profile } = useUserProfile();
  const [cache, setCache] = useState<Record<string, WorkoutImage>>(imageCache);
  const [isGenerating, setIsGenerating] = useState(false);

  // Get user's gender
  const userGender = profile?.gender?.toLowerCase() || 'male';

  // Get image from cache
  const getImageForExercise = useCallback((exerciseName: string, muscleGroup?: string): string | null => {
    const cacheKey = `${exerciseName.toLowerCase()}_${userGender}`;
    return imageCache[cacheKey]?.image_base64 || null;
  }, [userGender]);

  // Generate new image
  const generateImage = useCallback(async (exerciseName: string, muscleGroup: string = 'full body') => {
    const cacheKey = `${exerciseName.toLowerCase()}_${userGender}`;
    
    // Check if already cached
    if (imageCache[cacheKey]) {
      return;
    }

    setIsGenerating(true);

    try {
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      
      const response = await fetch(`${backendUrl}/api/generate-workout-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exercise_name: exerciseName,
          gender: userGender,
          muscle_group: muscleGroup,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate workout image');
      }

      const data = await response.json();
      
      // Store in cache
      imageCache[cacheKey] = data;
      setCache({ ...imageCache });

      toast.success(`Generated form guide for ${exerciseName}`);
    } catch (error) {
      console.error('Error generating workout image:', error);
      toast.error('Failed to generate workout form guide');
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
 * Batch generate images for an entire workout
 */
export async function generateWorkoutImagesBatch(
  exercises: Array<{ name: string; muscle_group?: string }>,
  gender: string = 'male'
): Promise<Record<string, string>> {
  try {
    const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
    
    const response = await fetch(`${backendUrl}/api/generate-workout-images-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        exercises: exercises.map(ex => ({
          exercise_name: ex.name,
          muscle_group: ex.muscle_group || 'full body',
        })),
        gender,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate workout images');
    }

    const data = await response.json();
    
    // Store in cache
    const imageMap: Record<string, string> = {};
    data.images.forEach((img: WorkoutImage) => {
      if (img.image_base64) {
        const cacheKey = `${img.exercise_name.toLowerCase()}_${gender}`;
        imageCache[cacheKey] = img;
        imageMap[img.exercise_name] = img.image_base64;
      }
    });

    return imageMap;
  } catch (error) {
    console.error('Error generating workout images batch:', error);
    throw error;
  }
}
