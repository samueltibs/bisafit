/**
 * Workout Preparation Screen
 * 
 * Pre-generates all AI form guide images before workout starts.
 * Shows loading progress and only proceeds when all images are ready.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function WorkoutPreparation({
  exercises,
  userGender,
  onComplete,
  onSkip,
}: WorkoutPreparationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalExercises = exercises.length;
  const progress = (completedCount / totalExercises) * 100;

  useEffect(() => {
    generateAllImages();
  }, []);

  const generateAllImages = async () => {
    const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL;
    
    if (!backendUrl) {
      setError('Backend configuration error');
      setIsGenerating(false);
      return;
    }

    try {
      for (let i = 0; i < exercises.length; i++) {
        setCurrentIndex(i);
        const exercise = exercises[i];
        
        console.log(`Generating image ${i + 1}/${exercises.length}:`, exercise.name);

        try {
          const response = await fetch(`${backendUrl}/api/generate-workout-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              exercise_name: exercise.name,
              gender: userGender || 'male',
              muscle_group: exercise.muscle_group || 'full body',
            }),
          });

          if (response.ok) {
            const data = await response.json();
            // Store in cache (will be picked up by useWorkoutImages hook)
            const cacheKey = `${exercise.name.toLowerCase()}_${userGender}`;
            (window as any).__workoutImageCache = (window as any).__workoutImageCache || {};
            (window as any).__workoutImageCache[cacheKey] = data;
            
            console.log(`✓ Generated: ${exercise.name}`);
          } else {
            console.warn(`Failed to generate: ${exercise.name}`);
          }
        } catch (err) {
          console.warn(`Error generating ${exercise.name}:`, err);
        }

        setCompletedCount(i + 1);
      }

      setIsGenerating(false);
      
      // Auto-proceed after 1 second
      setTimeout(() => {
        onComplete();
      }, 1000);

    } catch (err) {
      console.error('Batch generation error:', err);
      setError('Failed to prepare workout');
      setIsGenerating(false);
    }
  };

  const currentExercise = exercises[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 pb-6 px-6">
          <div className="space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                {isGenerating ? (
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                ) : error ? (
                  <Zap className="h-8 w-8 text-destructive" />
                ) : (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                )}
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold">
                {isGenerating ? 'Preparing Your Workout' : error ? 'Ready to Start' : 'All Set!'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isGenerating
                  ? 'Generating AI form guides for your exercises...'
                  : error
                  ? 'Some images failed, but you can still start'
                  : 'All form guides ready. Let\'s go!'}
              </p>
            </div>

            {/* Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {isGenerating ? 'Generating...' : 'Complete'}
                </span>
                <span className="font-medium tabular-nums">
                  {completedCount}/{totalExercises}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Current Exercise */}
            {isGenerating && currentExercise && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm truncate">{currentExercise.name}</span>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              {!isGenerating && (
                <Button 
                  onClick={onComplete} 
                  className="w-full"
                  size="lg"
                >
                  {error ? 'Start Anyway' : 'Start Workout'}
                </Button>
              )}
              
              {isGenerating && (
                <Button 
                  onClick={onSkip} 
                  variant="outline" 
                  className="w-full"
                  size="lg"
                >
                  Skip & Start Now
                </Button>
              )}
            </div>

            {/* Info */}
            <p className="text-xs text-center text-muted-foreground">
              {isGenerating ? (
                <>This takes ~30 seconds per exercise. You can skip and images will generate during your workout.</>
              ) : (
                <>Form guides will help you maintain perfect technique!</>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
