import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  X, 
  Tv,
  Maximize,
  Minimize 
} from 'lucide-react';
import { WorkoutItem, WorkoutBlock, WorkoutJson } from '@/types/plan';

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
}

/**
 * TV Mode overlay for active workouts.
 * Designed to be readable from 8-12 feet away with extra-large typography.
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
}: TVModeOverlayProps) {
  // Get next exercise preview
  const getNextExercise = (): { name: string; block: string } | null => {
    if (!workout) return null;
    
    const block = workout.blocks[currentBlockIndex];
    
    // Check if there's a next item in current block
    if (currentItemIndex < block.items.length - 1) {
      const nextItem = block.items[currentItemIndex + 1];
      return { name: nextItem.name, block: block.type };
    }
    
    // Check if there's a next block
    if (currentBlockIndex < workout.blocks.length - 1) {
      const nextBlock = workout.blocks[currentBlockIndex + 1];
      const nextItem = nextBlock.items[0];
      return { name: nextItem.name, block: nextBlock.type };
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
      {/* Top bar - minimal header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-border/30">
        <div className="flex items-center gap-4">
          <Tv className="h-8 w-8 text-primary" />
          <span className="text-2xl font-semibold text-muted-foreground">TV Mode</span>
        </div>
        
        {/* Progress bar */}
        <div className="flex-1 max-w-md mx-8">
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-700 ease-out rounded-full"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <p className="text-center text-lg text-muted-foreground mt-2">
            {Math.round(progress.percentage)}% complete
          </p>
        </div>
        
        {/* Top controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="lg"
            onClick={onToggleFullscreen}
            className="h-14 w-14"
          >
            {isFullscreen ? (
              <Minimize className="h-7 w-7" />
            ) : (
              <Maximize className="h-7 w-7" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={onExit}
            className="h-14 w-14"
          >
            <X className="h-7 w-7" />
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 gap-8">
        {/* Timer display - HUGE when active */}
        {hasTimer && (
          <div className={cn(
            "rounded-3xl px-16 py-10 text-center transition-all",
            isRest && "bg-amber-500/20 border-4 border-amber-500/40",
            timerType === 'work' && "bg-emerald-500/20 border-4 border-emerald-500/40",
            timerType === 'duration' && "bg-blue-500/20 border-4 border-blue-500/40"
          )}>
            <p className={cn(
              "text-3xl font-medium uppercase tracking-widest mb-4",
              isRest && "text-amber-400",
              timerType === 'work' && "text-emerald-400",
              timerType === 'duration' && "text-blue-400"
            )}>
              {isRest ? 'Rest' : timerType === 'work' ? 'Work' : 'Time'}
              {isPaused && ' (Paused)'}
            </p>
            <p className={cn(
              "text-[12rem] leading-none font-bold font-mono tracking-tight",
              isRest && "text-amber-300",
              timerType === 'work' && "text-emerald-300",
              timerType === 'duration' && "text-blue-300",
              isPaused && "opacity-60 animate-pulse"
            )}>
              {formatTime(timerSeconds)}
            </p>
            {isRest && onSkipRest && !isPaused && (
              <Button
                variant="ghost"
                size="lg"
                onClick={onSkipRest}
                className="mt-6 text-xl text-amber-400 hover:text-amber-300"
              >
                Skip Rest
              </Button>
            )}
          </div>
        )}

        {/* Current exercise display */}
        {currentExercise && currentBlock && (
          <Card className={cn(
            "w-full max-w-4xl p-12 text-center",
            !hasTimer && "gradient-primary border-4 border-primary"
          )}>
            {/* Block type badge */}
            <p className="text-2xl font-medium text-muted-foreground uppercase tracking-widest mb-6">
              {getBlockLabel(currentBlock.type)}
            </p>
            
            {/* Exercise name - HUGE */}
            <h1 className="text-6xl lg:text-7xl font-bold mb-8 leading-tight">
              {currentExercise.name}
            </h1>
            
            {/* Exercise metrics */}
            <div className="flex items-center justify-center gap-16 text-4xl">
              {currentBlock.type === 'strength' && currentExercise.sets && (
                <div className="text-center">
                  <span className="font-bold text-6xl text-primary">{currentSet}</span>
                  <span className="text-muted-foreground">/{currentExercise.sets}</span>
                  <p className="text-xl text-muted-foreground mt-2 uppercase tracking-wide">sets</p>
                </div>
              )}
              {currentExercise.reps && (
                <div className="text-center">
                  <span className="font-bold text-6xl">{currentExercise.reps}</span>
                  <p className="text-xl text-muted-foreground mt-2 uppercase tracking-wide">reps</p>
                </div>
              )}
              {currentExercise.duration_sec && currentBlock.type !== 'strength' && !hasTimer && (
                <div className="text-center">
                  <span className="font-bold text-6xl">{currentExercise.duration_sec}</span>
                  <p className="text-xl text-muted-foreground mt-2 uppercase tracking-wide">seconds</p>
                </div>
              )}
            </div>

            {/* Paused indicator */}
            {isPaused && !hasTimer && (
              <p className="mt-8 text-3xl font-semibold text-muted-foreground uppercase tracking-widest animate-pulse">
                Paused
              </p>
            )}
          </Card>
        )}

        {/* Next exercise preview */}
        {nextExercise && (
          <div className="text-center">
            <p className="text-xl text-muted-foreground uppercase tracking-widest mb-2">Up Next</p>
            <p className="text-3xl font-medium">
              <span className="text-muted-foreground">{getBlockLabel(nextExercise.block)}: </span>
              <span className="text-foreground">{nextExercise.name}</span>
            </p>
          </div>
        )}
      </div>

      {/* Bottom controls - minimal, large touch targets */}
      <div className="flex items-center justify-center gap-6 px-8 py-8 border-t border-border/30">
        {/* Back/Skip Back button */}
        <Button
          variant="outline"
          size="lg"
          className="h-20 px-8 text-xl gap-3"
          onClick={onSkipExercise}
          disabled={currentBlockIndex === 0 && currentItemIndex === 0}
        >
          <SkipBack className="h-8 w-8" />
          Previous
        </Button>

        {/* Pause/Resume button - PRIMARY */}
        <Button
          size="lg"
          className={cn(
            "h-24 px-16 text-2xl gap-4",
            isPaused && "bg-primary hover:bg-primary/90"
          )}
          onClick={onTogglePause}
        >
          {isPaused ? (
            <>
              <Play className="h-10 w-10" />
              Resume
            </>
          ) : (
            <>
              <Pause className="h-10 w-10" />
              Pause
            </>
          )}
        </Button>

        {/* Skip Forward button */}
        <Button
          variant="outline"
          size="lg"
          className="h-20 px-8 text-xl gap-3"
          onClick={onSkipExercise}
        >
          Skip
          <SkipForward className="h-8 w-8" />
        </Button>

        {/* End Workout button */}
        <Button
          variant="destructive"
          size="lg"
          className="h-20 px-8 text-xl ml-8"
          onClick={onEndWorkout}
        >
          End Workout
        </Button>
      </div>
    </div>
  );
}
