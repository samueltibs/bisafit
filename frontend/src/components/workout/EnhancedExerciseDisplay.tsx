/**
 * Enhanced Workout Exercise Display
 * 
 * TV-style workout interface with large timer, AI-generated form guide,
 * and intuitive controls. Optimized for mobile viewing.
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Loader2,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkoutImages } from '@/hooks/useWorkoutImages';

interface ExerciseDisplayProps {
  exerciseName: string;
  currentSet: number;
  totalSets: number;
  repsTarget: number;
  currentExerciseNum: number;
  totalExercises: number;
  timerSeconds: number;
  timerType: 'work' | 'rest' | 'prepare';
  nextExerciseName?: string;
  nextExerciseSets?: number;
  nextExerciseReps?: number;
  isPaused: boolean;
  muscleGroup?: string;
  userGender?: string;
  onPlayPause: () => void;
  onSkipForward: () => void;
  onSkipBack: () => void;
  onGenerateImage?: () => void;
}

export function EnhancedExerciseDisplay({
  exerciseName,
  currentSet,
  totalSets,
  repsTarget,
  currentExerciseNum,
  totalExercises,
  timerSeconds,
  timerType,
  nextExerciseName,
  nextExerciseSets,
  nextExerciseReps,
  isPaused,
  muscleGroup = 'full body',
  userGender = 'male',
  onPlayPause,
  onSkipForward,
  onSkipBack,
  onGenerateImage,
}: ExerciseDisplayProps) {
  const { getImageForExercise, generateImage, isGenerating } = useWorkoutImages(userGender);
  const [showImage, setShowImage] = useState(true);
  const [imageRequested, setImageRequested] = useState(false);

  const formImage = getImageForExercise(exerciseName, muscleGroup);

  // Auto-generate image on mount if not in cache
  useEffect(() => {
    if (!formImage && !imageRequested && !isGenerating && exerciseName) {
      console.log('Auto-generating workout image for:', exerciseName, 'Gender:', userGender);
      setImageRequested(true);
      generateImage(exerciseName, muscleGroup, userGender);
    }
  }, [formImage, exerciseName, muscleGroup, userGender, imageRequested, isGenerating, generateImage]);

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer color based on type
  const timerColor = {
    work: 'text-primary',
    rest: 'text-orange-500',
    prepare: 'text-blue-500',
  }[timerType];

  return (
    <div className="flex flex-col h-full">
      {/* Top Section - Context */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {timerType === 'work' ? 'Working' : timerType === 'rest' ? 'Rest' : 'Get Ready'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Exercise {currentExerciseNum} of {totalExercises}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        {/* Timer - Large and Prominent */}
        <div className="text-center mb-3">
          <div className={cn("text-5xl font-bold tabular-nums", timerColor)}>
            {formatTime(timerSeconds)}
          </div>
        </div>

        {/* Exercise Info */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold mb-1">{exerciseName}</h2>
          <p className="text-base text-muted-foreground">
            Set {currentSet} of {totalSets} • {repsTarget} Reps
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-1 mb-4">
          {Array.from({ length: totalExercises }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 rounded-full transition-all",
                i < currentExerciseNum - 1
                  ? "w-4 bg-primary"
                  : i === currentExerciseNum - 1
                  ? "w-8 bg-primary"
                  : "w-3 bg-muted"
              )}
            />
          ))}
        </div>

        {/* Form Guide Image - Compact for Mobile */}
        {showImage && (
          <Card className="mb-4 overflow-hidden border border-border/50">
            <div className="relative aspect-video bg-muted">
              {formImage ? (
                <img
                  src={formImage}
                  alt={`${exerciseName} form guide`}
                  className="w-full h-full object-contain"
                />
              ) : isGenerating ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground text-center">
                    Generating AI form guide...
                  </p>
                  <p className="text-xs text-muted-foreground/70 text-center">
                    30-60 seconds
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">No form guide</p>
                  {onGenerateImage && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setImageRequested(true);
                        generateImage(exerciseName, muscleGroup, userGender);
                      }}
                      disabled={isGenerating}
                      className="text-xs h-7"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Generate
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Toggle Image Button */}
        <div className="flex justify-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowImage(!showImage)}
            className="text-xs h-7"
          >
            {showImage ? (
              <>
                <EyeOff className="h-3 w-3 mr-1" />
                Hide Guide
              </>
            ) : (
              <>
                <Eye className="h-3 w-3 mr-1" />
                Show Guide
              </>
            )}
          </Button>
        </div>

        {/* Next Exercise Preview */}
        {nextExerciseName && (
          <Card className="bg-muted/50 border-border/50">
            <div className="p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background flex-shrink-0">
                  <SkipForward className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium truncate">
                    Next: {nextExerciseName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {nextExerciseSets} Sets • {nextExerciseReps} Reps
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Bottom Controls - Fixed */}
      <div className="border-t border-border bg-card/95 backdrop-blur-sm p-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSkipBack}
            className="h-12 w-12 rounded-full"
          >
            <SkipBack className="h-6 w-6" />
          </Button>

          <Button
            size="icon"
            onClick={onPlayPause}
            className="h-16 w-16 rounded-full"
          >
            {isPaused ? (
              <Play className="h-8 w-8 ml-1" />
            ) : (
              <Pause className="h-8 w-8" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onSkipForward}
            className="h-12 w-12 rounded-full"
          >
            <SkipForward className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
