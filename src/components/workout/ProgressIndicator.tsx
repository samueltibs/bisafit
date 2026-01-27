import { cn } from '@/lib/utils';
import { ProgressRing } from '@/components/ui/progress-ring';

interface ProgressIndicatorProps {
  currentExercise: number;
  totalExercises: number;
  currentSet?: number;
  totalSets?: number;
  bigMode?: boolean;
  className?: string;
}

export function ProgressIndicator({
  currentExercise,
  totalExercises,
  currentSet,
  totalSets,
  bigMode = false,
  className,
}: ProgressIndicatorProps) {
  const exerciseProgress = (currentExercise / totalExercises) * 100;
  const setProgress = totalSets ? ((currentSet || 0) / totalSets) * 100 : 0;
  const isComplete = currentExercise === totalExercises && (!totalSets || currentSet === totalSets);

  return (
    <div className={cn(
      "flex items-center gap-6",
      className
    )}>
      {/* Circular progress ring */}
      <ProgressRing
        value={exerciseProgress}
        size={bigMode ? "lg" : "md"}
        variant={isComplete ? "success" : "default"}
        showValue={false}
      >
        <div className="flex flex-col items-center">
          <span className={cn(
            "font-bold tracking-tight transition-all duration-300 progress-value",
            bigMode ? "text-xl" : "text-sm",
            isComplete && "text-primary"
          )}>
            {currentExercise}/{totalExercises}
          </span>
          <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide">
            exercises
          </span>
        </div>
      </ProgressRing>
      
      {/* Set progress */}
      {currentSet !== undefined && totalSets !== undefined && totalSets > 1 && (
        <ProgressRing
          value={setProgress}
          size={bigMode ? "md" : "sm"}
          variant="accent"
          showValue={false}
        >
          <div className="flex flex-col items-center">
            <span className={cn(
              "font-bold tracking-tight transition-all duration-300 progress-value",
              bigMode ? "text-lg" : "text-xs"
            )}>
              {currentSet}/{totalSets}
            </span>
            <span className="text-[8px] text-muted-foreground font-medium uppercase tracking-wide">
              sets
            </span>
          </div>
        </ProgressRing>
      )}
    </div>
  );
}
