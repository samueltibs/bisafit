import { useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

// In-memory cache for the current session
const imageCache: Record<string, string | null> = {};

/**
 * Hook to fetch exercise image from cache
 * Images are stored in Supabase Storage, URLs fetched on-demand
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
      const cachedUrl = imageCache[normalizedName];
      setImageUrl(cachedUrl);
      return;
    }

    // Fetch from backend cache with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const fetchImage = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${BACKEND_URL}/api/exercise-image-cached/${encodeURIComponent(normalizedName)}`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          if (data.cached && data.image_url) {
            console.log(`[ExerciseImage] Loaded: ${exerciseName} -> ${data.image_url.substring(0, 60)}...`);
            imageCache[normalizedName] = data.image_url;
            setImageUrl(data.image_url);
          } else {
            console.log(`[ExerciseImage] Not cached: ${exerciseName}`);
            imageCache[normalizedName] = null;
            setImageUrl(null);
          }
        } else {
          console.log(`[ExerciseImage] Failed response for ${exerciseName}: ${response.status}`);
          imageCache[normalizedName] = null;
          setImageUrl(null);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          console.log(`[ExerciseImage] Timeout for ${exerciseName}`);
        } else {
          console.log(`[ExerciseImage] Error for ${exerciseName}:`, error);
        }
        imageCache[normalizedName] = null;
        setImageUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
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
