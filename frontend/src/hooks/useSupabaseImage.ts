/**
 * Simple Supabase Storage Image Hook
 * 
 * Directly constructs URLs to images stored in Supabase Storage.
 * No API calls needed - just URL construction.
 * 
 * Images are stored at:
 * https://qteefcujottugvwnhvix.supabase.co/storage/v1/object/public/exercise-images/{name}.png
 */

import { useState, useEffect } from 'react';

// Supabase Storage base URL
const STORAGE_URL = 'https://qteefcujottugvwnhvix.supabase.co/storage/v1/object/public/exercise-images';

// Cache of verified working URLs
const verifiedUrls: Record<string, string | null> = {};

/**
 * Normalize exercise name to match storage filename
 * e.g., "Arm Circles" -> "arm_circles"
 * e.g., "Push-up" -> "push_up"
 */
function normalizeToFilename(exerciseName: string): string {
  return exerciseName
    .toLowerCase()
    .trim()
    .replace(/-/g, ' ')      // push-up -> push up
    .replace(/\s+/g, '_')    // push up -> push_up
    .replace(/[^a-z0-9_]/g, ''); // remove special chars
}

/**
 * Get the Supabase Storage URL for an exercise image
 */
export function getExerciseImageUrl(exerciseName: string): string {
  const filename = normalizeToFilename(exerciseName);
  return `${STORAGE_URL}/${filename}.png`;
}

/**
 * Hook to get exercise image from Supabase Storage
 */
export function useSupabaseImage(exerciseName: string | undefined) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!exerciseName) {
      setImageUrl(null);
      return;
    }

    const normalized = normalizeToFilename(exerciseName);

    // Check cache first
    if (normalized in verifiedUrls) {
      setImageUrl(verifiedUrls[normalized]);
      return;
    }

    // Construct URL and verify it works
    const url = `${STORAGE_URL}/${normalized}.png`;
    
    setLoading(true);
    setError(false);

    // Test if image exists with a HEAD request
    fetch(url, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          verifiedUrls[normalized] = url;
          setImageUrl(url);
          console.log(`[SupabaseImage] Found: ${exerciseName} -> ${url}`);
        } else {
          verifiedUrls[normalized] = null;
          setImageUrl(null);
          console.log(`[SupabaseImage] Not found: ${exerciseName}`);
        }
      })
      .catch(() => {
        verifiedUrls[normalized] = null;
        setImageUrl(null);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [exerciseName]);

  return { imageUrl, loading, error };
}

/**
 * Get all available exercise images from Supabase Storage
 * These are the 86 images we migrated
 */
export const AVAILABLE_EXERCISES = [
  'jumping jacks', 'high knees', 'arm circles', 'hip circles', 'march in place',
  'butt kicks', 'torso twists', 'squat', 'bodyweight squat', 'goblet squat',
  'leg swings', 'lunge', 'forward lunge', 'reverse lunge', 'walking lunge',
  'glute bridge', 'hip thrust', 'calf raise', 'step up', 'wall sit',
  'deadlift', 'romanian deadlift', 'leg press', 'push up', 'incline push up',
  'decline push up', 'diamond push up', 'wide push up', 'bench press',
  'dumbbell press', 'dumbbell chest press', 'chest fly', 'dumbbell fly',
  'dumbbell row', 'bent over row', 'single arm row', 'superman', 'lat pulldown',
  'reverse fly', 'pull up', 'chin up', 'shoulder press', 'overhead press',
  'dumbbell shoulder press', 'lateral raise', 'front raise', 'arnold press',
  'upright row', 'face pull', 'bicep curl', 'dumbbell curl', 'hammer curl',
  'concentration curl', 'tricep dip', 'tricep extension', 'overhead tricep extension',
  'tricep kickback', 'skull crusher', 'plank', 'side plank', 'bird dog',
  'mountain climber', 'crunch', 'russian twist', 'bicycle crunch', 'flutter kicks',
  'sit up', 'hamstring stretch', 'ab rollout', 'quad stretch', 'childs pose',
  'shoulder stretch', 'cat cow stretch', 'chest stretch', 'hip flexor stretch',
  'pigeon pose', 'cobra stretch', 'standing forward fold', 'burpee', 'jump squat',
  'box jump', 'jumping lunge', 'skater', 'bear crawl', 'jump rope', 'dead bug'
];
