/**
 * Workout Preparation Screen
 * 
 * Pre-loads all exercise form guide images before workout starts.
 * Uses STATIC images from the pre-generated library - NO AI CREDITS NEEDED.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, Sparkles, Zap, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { allExerciseMediaData } from '@/lib/exerciseMediaData';

interface Exercise {
  name: string;
  muscle_group?: string;
}

interface WorkoutPreparationProps {
  exercises: Exercise[];
  userGender: string;
  onComplete: () => void;
  onSkip: () => void;
}

// Base path for static exercise images
const EXERCISE_MEDIA_BASE = '/exercise-media';

/**
 * Convert exercise name to filename
 */
function exerciseNameToFilename(exerciseName: string): string {
  return exerciseName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .concat('.png');
}

/**
 * Look up exercise in the media data
 */
function findExerciseMedia(exerciseName: string) {
  const normalizedName = exerciseName.toLowerCase().trim();
  return allExerciseMediaData[normalizedName] || null;
}

/**
 * Get static image URL for an exercise
 */
function getStaticImageUrl(exerciseName: string, gender: string = 'neutral'): string {
  const mediaEntry = findExerciseMedia(exerciseName);
  
  if (mediaEntry) {
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
    
    if (mediaEntry.filename) {
      if (gender === 'male' || gender === 'female') {
        return `${EXERCISE_MEDIA_BASE}/${gender}/${mediaEntry.filename}`;
      }
      return `${EXERCISE_MEDIA_BASE}/${mediaEntry.filename}`;
    }
  }
  
  const filename = exerciseNameToFilename(exerciseName);
  
  if (gender === 'male' || gender === 'female') {
    return `${EXERCISE_MEDIA_BASE}/${gender}/${filename}`;
  }
  
  return `${EXERCISE_MEDIA_BASE}/${filename}`;
}

/**
 * Preload an image and return a promise
 */
function preloadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false); // Don't fail on missing images
    img.src = url;
  });
}

export function WorkoutPreparation({
  exercises,
  userGender,
  onComplete,
  onSkip,
}: WorkoutPreparationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Record<string, string>>({});

  const totalExercises = exercises.length;
  const progress = (completedCount / totalExercises) * 100;

  useEffect(() => {
    preloadAllImages();
  }, []);

  const preloadAllImages = async () => {
    const imageCache: Record<string, string> = {};
    
    for (let i = 0; i < exercises.length; i++) {
      setCurrentIndex(i);
      const exercise = exercises[i];
      
      // Get static image URL
      const imageUrl = getStaticImageUrl(exercise.name, userGender || 'male');
      
      // Preload the image
      await preloadImage(imageUrl);
      
      // Cache it
      const cacheKey = `${exercise.name.toLowerCase()}_${userGender}`;
      imageCache[cacheKey] = imageUrl;
      
      // Also store in window cache for the workout to use
      if (typeof window !== 'undefined') {
        (window as any).__workoutImageCache = (window as any).__workoutImageCache || {};
        (window as any).__workoutImageCache[cacheKey] = { image_url: imageUrl };
      }
      
      setCompletedCount(i + 1);
    }
    
    setLoadedImages(imageCache);
    setIsLoading(false);
    
    // Auto-complete after a short delay
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  const currentExercise = exercises[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border">
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              {isLoading ? (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              ) : (
                <CheckCircle2 className="h-8 w-8 text-primary" />
              )}
            </div>
            <h2 className="text-xl font-semibold">
              {isLoading ? 'Preparing Your Workout' : 'Ready to Go!'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isLoading
                ? 'Loading exercise images...'
                : 'All form guides ready'}
            </p>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {completedCount} of {totalExercises} exercises
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Current Exercise */}
          {isLoading && currentExercise && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                <Image className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentExercise.name}</p>
                <p className="text-xs text-muted-foreground">Loading image...</p>
              </div>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}

          {/* Features Badge */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>Form guides</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span>Instant loading</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onSkip}
            >
              Skip
            </Button>
            <Button
              className="flex-1"
              disabled={isLoading}
              onClick={onComplete}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Start Workout'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
