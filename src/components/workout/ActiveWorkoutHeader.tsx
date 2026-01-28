import { Button } from '@/components/ui/button';
import { ChevronLeft, Music, Cast } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActiveWorkoutHeaderProps {
  workoutTitle: string;
  onBack: () => void;
  onMusicClick: () => void;
  onCastClick: () => void;
  hasMusicProvider?: boolean;
  className?: string;
}

/**
 * Premium workout header with back, title, and action buttons.
 * Touch targets ≥ 44px for accessibility during movement.
 */
export function ActiveWorkoutHeader({
  workoutTitle,
  onBack,
  onMusicClick,
  onCastClick,
  hasMusicProvider = false,
  className,
}: ActiveWorkoutHeaderProps) {
  return (
    <header className={cn(
      "flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border/30 safe-area-top",
      className
    )}>
      {/* Left: Back button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        className="h-11 w-11 rounded-full"
        aria-label="Go back"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      {/* Center: Workout title (muted) */}
      <div className="flex-1 text-center px-2">
        <p className="text-sm font-medium text-muted-foreground truncate">
          {workoutTitle}
        </p>
      </div>

      {/* Right: Music + Cast buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMusicClick}
          className={cn(
            "h-11 w-11 rounded-full",
            hasMusicProvider && "text-primary"
          )}
          aria-label="Music controls"
        >
          <Music className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCastClick}
          className="h-11 w-11 rounded-full"
          aria-label="Cast or TV mode"
        >
          <Cast className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
