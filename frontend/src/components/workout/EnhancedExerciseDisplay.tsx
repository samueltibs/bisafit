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
  onPlayPause,
  onSkipForward,
  onSkipBack,
  onGenerateImage,
}: ExerciseDisplayProps) {
  const { getImageForExercise, generateImage, isGenerating } = useWorkoutImages();
  const [showImage, setShowImage] = useState(true);
  const [imageRequested, setImageRequested] = useState(false);

  const formImage = getImageForExercise(exerciseName, muscleGroup);

  // Auto-generate image on mount if not in cache
  useEffect(() => {
    if (!formImage && !imageRequested && !isGenerating) {
      setImageRequested(true);
      generateImage(exerciseName, muscleGroup);
    }
  }, [formImage, exerciseName, muscleGroup, imageRequested, isGenerating, generateImage]);

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
        <div className="text-center mb-4">
          <div className={cn("text-6xl font-bold tabular-nums", timerColor)}>
            {formatTime(timerSeconds)}
          </div>
        </div>

        {/* Exercise Info */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">{exerciseName}</h2>
          <p className="text-lg text-muted-foreground">
            Set {currentSet} of {totalSets} • {repsTarget} Reps
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-1 mb-6">
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

        {/* Form Guide Image */}
        {showImage && (
          <Card className="mb-6 overflow-hidden border-2 border-primary/20">
            <div className="relative aspect-[4/3] bg-muted">
              {formImage ? (
                <img
                  src={formImage}
                  alt={`${exerciseName} form guide`}
                  className="w-full h-full object-cover"
                />
              ) : isGenerating ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Generating form guide...
                  </p>
                  <p className="text-xs text-muted-foreground px-4 text-center">
                    This takes 30-60 seconds • Using AI to create your personalized guide
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <Sparkles className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No form guide yet</p>
                  {onGenerateImage && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setImageRequested(true);
                        generateImage(exerciseName, muscleGroup);
                      }}
                      disabled={isGenerating}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Generate Form Guide
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Toggle Image Button */}
        <div className="flex justify-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowImage(!showImage)}
            className="text-xs"
          >
            {showImage ? (
              <>
                <EyeOff className="h-3 w-3 mr-1" />
                Hide Form Guide
              </>
            ) : (
              <>
                <Eye className="h-3 w-3 mr-1" />
                Show Form Guide
              </>
            )}
          </Button>
        </div>

        {/* Next Exercise Preview */}
        {nextExerciseName && (
          <Card className="bg-muted/50 border-border/50">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                  <SkipForward className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Next: {nextExerciseName}</p>
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
