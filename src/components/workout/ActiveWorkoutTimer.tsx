import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface ActiveWorkoutTimerProps {
  seconds: number;
  type: 'duration' | 'rest' | 'work' | null;
  isPaused?: boolean;
  onCountdownTick?: (seconds: number) => void;
  className?: string;
}

/**
 * Hero timer element - large, high-contrast, readable from distance.
 * Designed as the central focus of the active workout screen.
 */
export function ActiveWorkoutTimer({
  seconds,
  type,
  isPaused = false,
  onCountdownTick,
  className,
}: ActiveWorkoutTimerProps) {
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

  const getLabel = () => {
    if (isRest) return 'REST';
    if (isWork) return 'WORK';
    return 'TIME';
  };

  // Progress ring calculations
  const maxTime = isRest ? 120 : 60;
  const progress = Math.min((seconds / maxTime) * 100, 100);
  const circumference = 2 * Math.PI * 120; // radius 120
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center",
      className
    )}>
      {/* Timer container with progress ring */}
      <div className="relative">
        {/* Background ring */}
        <svg className="w-64 h-64 -rotate-90" viewBox="0 0 280 280">
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            strokeWidth="8"
            className="stroke-muted/30"
          />
          {/* Progress ring */}
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn(
              "transition-all duration-1000 ease-linear",
              isRest && "stroke-amber-500",
              isWork && "stroke-emerald-500",
              !isRest && !isWork && "stroke-primary"
            )}
          />
        </svg>

        {/* Timer content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Label */}
          <span className={cn(
            "text-sm font-semibold tracking-[0.3em] uppercase mb-1",
            isRest && "text-amber-500",
            isWork && "text-emerald-500",
            !isRest && !isWork && "text-primary",
            isPaused && "opacity-60"
          )}>
            {getLabel()}
          </span>

          {/* Time display */}
          <span className={cn(
            "text-7xl font-bold font-mono tracking-tight tabular-nums",
            isPaused && "opacity-60 animate-pulse"
          )}>
            {timeString}
          </span>

          {/* Paused indicator */}
          {isPaused && (
            <span className="text-xs font-medium text-muted-foreground mt-2 uppercase tracking-wider">
              Paused
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
