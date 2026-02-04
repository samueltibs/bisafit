/**
 * Enhanced Workout Exercise Display
 * 
 * TV-style workout interface optimized for quick glances during exercise.
 * Features large timer, prominent exercise name, and form guide images.
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Loader2,
  Dumbbell,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSupabaseImage } from '@/hooks/useSupabaseImage';

interface ExerciseDisplayProps {
  exerciseName: string;
  currentSet: number;
  totalSets: number;
  repsTarget: number | string;
  currentExerciseNum: number;
  totalExercises: number;
  timerSeconds: number;
  timerType: 'work' | 'rest' | 'prepare';
  nextExerciseName?: string;
  nextExerciseSets?: number;
  nextExerciseReps?: number | string;
  isPaused: boolean;
  muscleGroup?: string;
  userGender?: string;
  onPlayPause: () => void;
  onSkipForward: () => void;
  onSkipBack: () => void;
  onGenerateImage?: () => void;
}

/**
 * Capitalize each word in a string for proper title case
 */
function toTitleCase(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
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
  // Simple hook that directly uses Supabase Storage URLs
  const { imageUrl: formImage, loading: isLoading } = useSupabaseImage(exerciseName);
  const [showImage, setShowImage] = useState(true);

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer color and label based on type
  const timerConfig = {
    work: { color: 'text-primary', label: 'Working', bgColor: 'bg-primary/10' },
    rest: { color: 'text-orange-500', label: 'Rest', bgColor: 'bg-orange-500/10' },
    prepare: { color: 'text-blue-500', label: 'Get Ready', bgColor: 'bg-blue-500/10' },
  }[timerType];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top Bar - Status & Progress */}
      <div className="px-4 pt-3 pb-2 border-b border-border/30">
        <div className="flex items-center justify-between">
          <Badge 
            variant="outline" 
            className={cn("text-xs font-semibold", timerConfig.bgColor, timerConfig.color)}
          >
            {timerConfig.label}
          </Badge>
          <span className="text-sm font-medium text-muted-foreground">
            {currentExerciseNum} / {totalExercises}
          </span>
        </div>
      </div>

      {/* Main Content Area - Optimized for Quick Glances */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        
        {/* EXERCISE NAME - Large, Bold, All Caps for Quick Recognition */}
        <div className="text-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-black tracking-wide uppercase text-foreground">
            {exerciseName.toUpperCase()}
          </h1>
          <p className="text-lg font-semibold text-muted-foreground mt-1">
            Set {currentSet} of {totalSets} · {repsTarget} Reps
          </p>
        </div>

        {/* TIMER - Prominent and Easy to Read */}
        <div className="text-center mb-5">
          <div className={cn(
            "text-6xl sm:text-7xl font-bold tabular-nums tracking-tight",
            timerConfig.color
          )}>
            {formatTime(timerSeconds)}
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-1.5 mb-5">
          {Array.from({ length: totalExercises }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i < currentExerciseNum - 1
                  ? "w-4 bg-primary"
                  : i === currentExerciseNum - 1
                  ? "w-6 bg-primary animate-pulse"
                  : "w-2 bg-muted-foreground/30"
              )}
            />
          ))}
        </div>

        {/* Form Guide Image */}
        {showImage && (
          <Card className="mb-4 overflow-hidden border-0 shadow-lg">
            <div className="relative aspect-[4/3] bg-gradient-to-b from-muted/50 to-muted">
              {formImage ? (
                <img
                  src={formImage}
                  alt={`${exerciseName} form guide`}
                  className="w-full h-full object-contain p-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <Dumbbell className="h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No image available</p>
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
            className="text-xs h-8 px-4"
          >
            {showImage ? (
              <>
                <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                Hide Image
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Show Image
              </>
            )}
          </Button>
        </div>

        {/* Next Exercise Preview */}
        {nextExerciseName && (
          <Card className="bg-muted/30 border-border/50">
            <div className="p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background shadow-sm flex-shrink-0">
                  <SkipForward className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    Up Next: {toTitleCase(nextExerciseName)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {nextExerciseSets} Sets · {nextExerciseReps} Reps
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Bottom Controls - Fixed */}
      <div className="border-t border-border bg-card/95 backdrop-blur-sm p-4 safe-area-pb">
        <div className="flex items-center justify-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSkipBack}
            className="h-14 w-14 rounded-full hover:bg-muted"
          >
            <SkipBack className="h-7 w-7" />
          </Button>

          <Button
            size="icon"
            onClick={onPlayPause}
            className="h-18 w-18 rounded-full shadow-lg"
            style={{ width: '72px', height: '72px' }}
          >
            {isPaused ? (
              <Play className="h-9 w-9 ml-1" />
            ) : (
              <Pause className="h-9 w-9" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onSkipForward}
            className="h-14 w-14 rounded-full hover:bg-muted"
          >
            <SkipForward className="h-7 w-7" />
          </Button>
        </div>
      </div>
    </div>
  );
}
