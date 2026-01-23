import { cn } from '@/lib/utils';

interface WorkoutTimerProps {
  seconds: number;
  type: 'duration' | 'rest' | 'work' | null;
  label?: string;
  onSkip?: () => void;
}

export function WorkoutTimer({ seconds, type, label, onSkip }: WorkoutTimerProps) {
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
  const maxTime = isRest ? 120 : 60; // Approximate max for visual
  const progress = Math.min((seconds / maxTime) * 100, 100);

  return (
    <div 
      className={cn(
        "relative rounded-2xl p-6 text-center overflow-hidden",
        isRest && "bg-accent text-accent-foreground",
        isWork && "bg-primary text-primary-foreground",
        isDuration && "bg-secondary text-secondary-foreground"
      )}
    >
      {/* Progress background */}
      <div 
        className={cn(
          "absolute inset-0 transition-all duration-1000",
          isRest && "bg-accent-foreground/10",
          isWork && "bg-primary-foreground/10",
          isDuration && "bg-secondary-foreground/10"
        )}
        style={{ width: `${progress}%` }}
      />
      
      <div className="relative z-10">
        <p className="text-sm font-medium uppercase tracking-wider mb-1 opacity-80">
          {getLabel()}
        </p>
        <p className="text-5xl font-bold font-mono tracking-tight">
          {timeString}
        </p>
        {isRest && onSkip && (
          <button 
            onClick={onSkip}
            className="mt-3 text-sm underline opacity-70 hover:opacity-100 transition-opacity"
          >
            Skip rest
          </button>
        )}
      </div>
    </div>
  );
}
