/**
 * Workout AI Images Hook
 * 
 * Manages AI-generated workout form guide images with caching.
 * Generates gender-specific images using OpenAI DALL-E 3.
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface WorkoutImage {
  exercise_name: string;
  image_base64: string;
  gender: string;
  muscle_group: string;
}

interface UseWorkoutImagesReturn {
  getImageForExercise: (exerciseName: string, muscleGroup?: string) => string | null;
  generateImage: (exerciseName: string, muscleGroup?: string, gender?: string) => Promise<void>;
  isGenerating: boolean;
  cache: Record<string, WorkoutImage>;
}

// In-memory cache for workout images
const imageCache: Record<string, WorkoutImage> = {};

export function useWorkoutImages(userGender: string = 'male'): UseWorkoutImagesReturn {
  const [cache, setCache] = useState<Record<string, WorkoutImage>>(imageCache);
  const [isGenerating, setIsGenerating] = useState(false);

  // Get image from cache
  const getImageForExercise = useCallback((exerciseName: string, muscleGroup?: string): string | null => {
    const cacheKey = `${exerciseName.toLowerCase()}_${userGender}`;
    return imageCache[cacheKey]?.image_base64 || null;
  }, [userGender]);

  // Generate new image
  const generateImage = useCallback(async (exerciseName: string, muscleGroup: string = 'full body', gender?: string) => {
    const genderToUse = gender || userGender || 'male';
    const cacheKey = `${exerciseName.toLowerCase()}_${genderToUse}`;
    
    // Check if already cached
    if (imageCache[cacheKey]) {
      console.log('Image already cached for:', exerciseName);
      return;
    }

    setIsGenerating(true);
    console.log('Starting image generation for:', exerciseName, 'Gender:', genderToUse);

    try {
      const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL;
      
      if (!backendUrl) {
        console.error('Backend URL not configured');
        throw new Error('Backend URL not found');
      }
      
      console.log('Backend URL:', backendUrl);
      console.log('Generating workout image:', exerciseName, genderToUse, muscleGroup);
      
      const response = await fetch(`${backendUrl}/api/generate-workout-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exercise_name: exerciseName,
          gender: genderToUse,
          muscle_group: muscleGroup,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to generate workout image: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('Image generated successfully for:', exerciseName);
      
      // Store in cache
      imageCache[cacheKey] = data;
      setCache({ ...imageCache });

      toast.success(`Form guide ready for ${exerciseName}`);
    } catch (error) {
      console.error('Error generating workout image:', error);
      toast.error('Could not generate form guide. Using workout without image.');
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
    const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL;
    
    if (!backendUrl) {
      throw new Error('Backend URL not configured');
    }
    
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
