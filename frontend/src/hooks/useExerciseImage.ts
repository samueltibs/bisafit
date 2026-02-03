import { useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

// In-memory cache for the current session
const imageCache: Record<string, string | null> = {};

/**
 * Hook to fetch exercise image from cache
 * Images are stored in Supabase, fetched on-demand, and cached locally
 */
export function useExerciseImage(exerciseName: string | undefined) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!exerciseName) {
      setImageUrl(null);
      return;
    }

    const normalizedName = exerciseName.toLowerCase().trim();

    // Check local memory cache first
    if (normalizedName in imageCache) {
      setImageUrl(imageCache[normalizedName]);
      return;
    }

    // Fetch from backend cache
    const fetchImage = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${BACKEND_URL}/api/exercise-image-cached/${encodeURIComponent(normalizedName)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.cached && data.image_url) {
            imageCache[normalizedName] = data.image_url;
            setImageUrl(data.image_url);
          } else {
            imageCache[normalizedName] = null;
            setImageUrl(null);
          }
        }
      } catch (error) {
        console.log(`[ExerciseImage] Failed to fetch image for ${exerciseName}`);
        imageCache[normalizedName] = null;
        setImageUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [exerciseName]);

  return { imageUrl, loading };
}

/**
 * Batch fetch images for multiple exercises
 * Useful for pre-loading images when workout loads
 */
export async function prefetchExerciseImages(exerciseNames: string[]): Promise<void> {
  const uncachedNames = exerciseNames.filter(name => {
    const normalized = name.toLowerCase().trim();
    return !(normalized in imageCache);
  });

  if (uncachedNames.length === 0) return;

  try {
    const response = await fetch(`${BACKEND_URL}/api/exercise-images-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exercises: uncachedNames.map(name => ({ exercise_name: name })),
        gender: 'neutral'
      }),
    });

    if (response.ok) {
      const data = await response.json();
      for (const result of data.results || []) {
        const normalized = result.exercise_name.toLowerCase().trim();
        imageCache[normalized] = result.image_url || null;
      }
    }
  } catch (error) {
    console.log('[ExerciseImage] Batch prefetch failed:', error);
  }
}
