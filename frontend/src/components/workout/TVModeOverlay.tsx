import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  SkipForward, 
  X, 
  Tv,
  Maximize,
  Minimize,
  ChevronRight
} from 'lucide-react';
import { WorkoutItem, WorkoutBlock, WorkoutJson } from '@/types/plan';
import { TVModeMedia } from './TVModeMedia';
import { type UserGender } from '@/lib/exerciseMediaData';

interface TVModeOverlayProps {
  workout: WorkoutJson;
  currentExercise: WorkoutItem | null;
  currentBlock: WorkoutBlock | null;
  currentBlockIndex: number;
  currentItemIndex: number;
  currentSet: number;
  timerSeconds: number;
  timerType: 'duration' | 'rest' | 'work' | null;
  isPaused: boolean;
  progress: { percentage: number };
  onTogglePause: () => void;
  onSkipExercise: () => void;
  onSkipRest?: () => void;
  onExit: () => void;
  onEndWorkout: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  /** User's gender for selecting appropriate demo image */
  userGender?: UserGender;
}

/**
 * TV Mode overlay for active workouts.
 * Redesigned with exercise demonstration as primary visual focus.
 * Layout: Top (timer) → Middle (demo) → Bottom (info + controls)
 */
export function TVModeOverlay({
  workout,
  currentExercise,
  currentBlock,
  currentBlockIndex,
  currentItemIndex,
  currentSet,
  timerSeconds,
  timerType,
  isPaused,
  progress,
  onTogglePause,
  onSkipExercise,
  onSkipRest,
  onExit,
  onEndWorkout,
  isFullscreen,
  onToggleFullscreen,
  userGender = 'unspecified',
}: TVModeOverlayProps) {
  // Get next exercise preview
  const getNextExercise = (): { name: string; block: string; detail?: string } | null => {
    if (!workout) return null;
    
    const block = workout.blocks[currentBlockIndex];
    
    // Check if there's a next item in current block
    if (currentItemIndex < block.items.length - 1) {
      const nextItem = block.items[currentItemIndex + 1];
      return { 
        name: nextItem.name, 
        block: block.type,
        detail: nextItem.sets && nextItem.reps 
          ? `${nextItem.sets}×${nextItem.reps}` 
          : nextItem.duration_sec 
            ? `${nextItem.duration_sec}s` 
            : undefined
      };
    }
    
    // Check if there's a next block
    if (currentBlockIndex < workout.blocks.length - 1) {
      const nextBlock = workout.blocks[currentBlockIndex + 1];
      const nextItem = nextBlock.items[0];
      return { 
        name: nextItem.name, 
        block: nextBlock.type,
        detail: nextItem.sets && nextItem.reps 
          ? `${nextItem.sets}×${nextItem.reps}` 
          : nextItem.duration_sec 
            ? `${nextItem.duration_sec}s` 
            : undefined
      };
    }
    
    return null;
  };

  const nextExercise = getNextExercise();
  const isRest = timerType === 'rest';
  const hasTimer = timerType && timerSeconds > 0;

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get block type label
  const getBlockLabel = (type: string) => {
    switch (type) {
      case 'warmup': return 'Warm-up';
      case 'strength': return 'Strength';
      case 'conditioning': return 'Conditioning';
      case 'cooldown': return 'Cool-down';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      {/* ============ TOP SECTION: Header + Timer ============ */}
      <div className="shrink-0 px-6 pt-4 pb-3">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Tv className="h-6 w-6 text-primary" />
            <span className="text-lg font-medium text-muted-foreground">{workout.title}</span>
          </div>
          
          {/* Top controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFullscreen}
              className="h-12 w-12"
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onExit}
              className="h-12 w-12"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Compact timer - only when active */}
        {hasTimer && (
          <div className={cn(
            "flex items-center justify-center gap-6 py-4 px-8 rounded-2xl mx-auto max-w-xl",
            isRest && "bg-amber-500/10 border border-amber-500/20",
            timerType === 'work' && "bg-emerald-500/10 border border-emerald-500/20",
            timerType === 'duration' && "bg-primary/10 border border-primary/20"
          )}>
            {/* Timer label */}
            <span className={cn(
              "text-xl font-semibold uppercase tracking-widest",
              isRest && "text-amber-400",
              timerType === 'work' && "text-emerald-400",
              timerType === 'duration' && "text-primary"
            )}>
              {isRest ? 'Rest' : timerType === 'work' ? 'Work' : 'Time'}
            </span>

            {/* Timer value - large but compact */}
            <span className={cn(
              "text-7xl font-bold font-mono tabular-nums",
              isRest && "text-amber-300",
              timerType === 'work' && "text-emerald-300",
              timerType === 'duration' && "text-primary",
              isPaused && "opacity-50 animate-pulse"
            )}>
              {formatTime(timerSeconds)}
            </span>

            {/* Skip rest button */}
            {isRest && onSkipRest && !isPaused && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkipRest}
                className="text-amber-400 hover:text-amber-300"
              >
                Skip
              </Button>
            )}

            {/* Paused indicator */}
            {isPaused && (
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Paused
              </span>
            )}
          </div>
        )}
      </div>

      {/* ============ MIDDLE SECTION: Exercise Demo (Primary Focus) ============ */}
      <div className="flex-1 flex items-center justify-center px-8 py-4 min-h-0">
        {currentExercise && (
          <TVModeMedia
            videoUrl={currentExercise.video_url_optional}
            imageUrl={currentExercise.image_url}
            exerciseName={currentExercise.name}
            userGender={userGender}
            className="w-full h-full"
          />
        )}
      </div>

      {/* ============ BOTTOM SECTION: Exercise Info + Controls ============ */}
      <div className="shrink-0 px-6 pb-6 pt-4 border-t border-border/20 bg-gradient-to-t from-background via-background to-transparent">
        {/* Exercise info row */}
        {currentExercise && currentBlock && (
          <div className="flex items-center justify-between mb-6">
            {/* Left: Current exercise */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
                {getBlockLabel(currentBlock.type)}
              </p>
              <h1 className="text-4xl font-bold truncate">
                {currentExercise.name}
              </h1>
            </div>

            {/* Center: Metrics */}
            <div className="flex items-center gap-10 px-8">
              {/* Sets */}
              {currentBlock.type === 'strength' && currentExercise.sets && (
                <div className="text-center">
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-primary tabular-nums">{currentSet}</span>
                    <span className="text-2xl text-muted-foreground">/{currentExercise.sets}</span>
                  </div>
                  <span className="text-sm text-muted-foreground uppercase tracking-wider">sets</span>
                </div>
              )}
              
              {/* Reps */}
              {currentExercise.reps && (
                <div className="text-center">
                  <span className="text-5xl font-bold tabular-nums">{currentExercise.reps}</span>
                  <span className="block text-sm text-muted-foreground uppercase tracking-wider">reps</span>
                </div>
              )}

              {/* Duration (non-timer display) */}
              {currentExercise.duration_sec && !hasTimer && (
                <div className="text-center">
                  <span className="text-5xl font-bold tabular-nums">{currentExercise.duration_sec}</span>
                  <span className="block text-sm text-muted-foreground uppercase tracking-wider">sec</span>
                </div>
              )}
            </div>

            {/* Right: Next exercise preview */}
            <div className="flex-1 flex justify-end">
              {nextExercise && (
                <div className="text-right bg-muted/30 rounded-xl px-5 py-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-end gap-1">
                    Up next <ChevronRight className="h-3 w-3" />
                  </p>
                  <p className="text-lg font-medium">{nextExercise.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {getBlockLabel(nextExercise.block)}
                    {nextExercise.detail && ` • ${nextExercise.detail}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Workout Progress</span>
            <span className="font-medium tabular-nums">{Math.round(progress.percentage)}%</span>
          </div>
          <Progress value={progress.percentage} className="h-2" />
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-center gap-4">
          {/* Skip Back (placeholder for now) */}
          <Button
            variant="outline"
            size="lg"
            className="h-16 px-6 text-lg"
            onClick={onSkipExercise}
            disabled={currentBlockIndex === 0 && currentItemIndex === 0}
          >
            Previous
          </Button>

          {/* Pause/Resume - Primary */}
          <Button
            size="lg"
            className={cn(
              "h-20 px-12 text-xl gap-3",
              isPaused && "bg-primary hover:bg-primary/90"
            )}
            onClick={onTogglePause}
          >
            {isPaused ? (
              <>
                <Play className="h-8 w-8" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-8 w-8" />
                Pause
              </>
            )}
          </Button>

          {/* Skip Forward */}
          <Button
            variant="outline"
            size="lg"
            className="h-16 px-6 text-lg gap-2"
            onClick={onSkipExercise}
          >
            Skip
            <SkipForward className="h-5 w-5" />
          </Button>

          {/* End Workout */}
          <Button
            variant="destructive"
            size="lg"
            className="h-16 px-6 text-lg ml-4"
            onClick={onEndWorkout}
          >
            End
          </Button>
        </div>
      </div>
    </div>
  );
}
