import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface WorkoutTimerProps {
  seconds: number;
  type: 'duration' | 'rest' | 'work' | null;
  label?: string;
  onSkip?: () => void;
  bigMode?: boolean;
  isPaused?: boolean;
  onCountdownTick?: (seconds: number) => void;
}

export function WorkoutTimer({ 
  seconds, 
  type, 
  label, 
  onSkip, 
  bigMode = false,
  isPaused = false,
  onCountdownTick,
}: WorkoutTimerProps) {
  const prevSecondsRef = useRef(seconds);

  // Notify on countdown ticks (3, 2, 1)
  useEffect(() => {
    if (seconds !== prevSecondsRef.current && seconds <= 3 && seconds > 0) {
      onCountdownTick?.(seconds);
    }
    prevSecondsRef.current = seconds;
  }, [seconds, onCountdownTick]);

  if (!type || seconds === 0) return null;

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeString = `${minutes}:${secs.toString().padStart(2, '0')}`;

  const isRest = type === 'rest';
  const isWork = type === 'work';
  const isDuration = type === 'duration';

  const getLabel = () => {
    if (label) return label;
    if (isRest) return 'Rest';
    if (isWork) return 'Work';
    if (isDuration) return 'Time';
    return '';
  };

  // Calculate progress for visual indicator
  const maxTime = isRest ? 120 : 60;
  const progress = Math.min((seconds / maxTime) * 100, 100);

  return (
    <div 
      className={cn(
        "relative rounded-2xl text-center overflow-hidden transition-all",
        bigMode ? "p-10" : "p-6",
        // Color distinctions for work vs rest vs duration
        isRest && "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-2 border-amber-500/30",
        isWork && "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-500/30",
        isDuration && "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-2 border-blue-500/30",
        isPaused && "opacity-60"
      )}
    >
      {/* Progress background */}
      <div 
        className={cn(
          "absolute inset-y-0 left-0 transition-all duration-1000",
          isRest && "bg-amber-500/20",
          isWork && "bg-emerald-500/20",
          isDuration && "bg-blue-500/20"
        )}
        style={{ width: `${progress}%` }}
      />
      
      <div className="relative z-10">
        <p className={cn(
          "font-medium uppercase tracking-wider mb-1",
          bigMode ? "text-lg" : "text-sm",
          isPaused ? "opacity-50" : "opacity-80"
        )}>
          {getLabel()}
          {isPaused && " (Paused)"}
        </p>
        <p className={cn(
          "font-bold font-mono tracking-tight",
          bigMode ? "text-7xl" : "text-5xl"
        )}>
          {timeString}
        </p>
        {isRest && onSkip && !isPaused && (
          <button 
            onClick={onSkip}
            className={cn(
              "underline opacity-70 hover:opacity-100 transition-opacity",
              bigMode ? "mt-4 text-base" : "mt-3 text-sm"
            )}
          >
            Skip rest
          </button>
        )}
      </div>
    </div>
  );
}
