import { Button } from '@/components/ui/button';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Check,
  Square
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActiveWorkoutControlsProps {
  isPaused: boolean;
  isIdle: boolean;
  primaryLabel: string;
  primaryDisabled?: boolean;
  showSkipBack?: boolean;
  onPrimaryAction: () => void;
  onTogglePause: () => void;
  onSkipForward: () => void;
  onSkipBack?: () => void;
  onEndWorkout: () => void;
  className?: string;
}

/**
 * Sticky bottom control bar for workout.
 * Primary Play/Pause button largest, secondary Skip/Back buttons smaller.
 * Touch targets ≥ 44px minimum.
 */
export function ActiveWorkoutControls({
  isPaused,
  isIdle,
  primaryLabel,
  primaryDisabled = false,
  showSkipBack = false,
  onPrimaryAction,
  onTogglePause,
  onSkipForward,
  onSkipBack,
  onEndWorkout,
  className,
}: ActiveWorkoutControlsProps) {
  // Idle state - just show start button
  if (isIdle) {
    return (
      <div className={cn(
        "fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/30 p-4 pb-safe",
        className
      )}>
        <Button
          size="lg"
          className="w-full h-14 text-lg font-semibold"
          onClick={onPrimaryAction}
        >
          <Play className="mr-2 h-5 w-5" />
          Start Workout
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/30 p-4 pb-safe",
      className
    )}>
      {/* Top row: Complete set / action button */}
      <Button
        size="lg"
        className="w-full h-14 text-lg font-semibold mb-3"
        onClick={onPrimaryAction}
        disabled={primaryDisabled}
      >
        <Check className="mr-2 h-5 w-5" />
        {primaryLabel}
      </Button>

      {/* Bottom row: Playback controls */}
      <div className="flex items-center justify-center gap-3">
        {/* Skip Back */}
        {showSkipBack && onSkipBack && (
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={onSkipBack}
            aria-label="Previous exercise"
          >
            <SkipBack className="h-5 w-5" />
          </Button>
        )}

        {/* Pause/Resume - Primary control */}
        <Button
          variant={isPaused ? "default" : "outline"}
          size="icon"
          className={cn(
            "h-16 w-16 rounded-full transition-all",
            isPaused && "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
          )}
          onClick={onTogglePause}
          aria-label={isPaused ? "Resume" : "Pause"}
        >
          {isPaused ? (
            <Play className="h-7 w-7 ml-0.5" />
          ) : (
            <Pause className="h-7 w-7" />
          )}
        </Button>

        {/* Skip Forward */}
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={onSkipForward}
          aria-label="Skip exercise"
        >
          <SkipForward className="h-5 w-5" />
        </Button>

        {/* End Workout */}
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full text-destructive hover:bg-destructive/10"
          onClick={onEndWorkout}
          aria-label="End workout"
        >
          <Square className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
