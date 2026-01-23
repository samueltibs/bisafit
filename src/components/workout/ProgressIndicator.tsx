import { cn } from '@/lib/utils';

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
  return (
    <div className={cn(
      "flex items-center justify-center gap-4",
      bigMode ? "text-lg" : "text-sm",
      className
    )}>
      <div className="flex items-center gap-1.5">
        <span className={cn(
          "font-bold",
          bigMode ? "text-2xl" : "text-base"
        )}>
          {currentExercise}
        </span>
        <span className="text-muted-foreground">
          / {totalExercises}
        </span>
        <span className="text-muted-foreground ml-1">
          exercises
        </span>
      </div>
      
      {currentSet !== undefined && totalSets !== undefined && totalSets > 1 && (
        <>
          <span className="text-muted-foreground">•</span>
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "font-bold",
              bigMode ? "text-2xl" : "text-base"  
            )}>
              {currentSet}
            </span>
            <span className="text-muted-foreground">
              / {totalSets}
            </span>
            <span className="text-muted-foreground ml-1">
              sets
            </span>
          </div>
        </>
      )}
    </div>
  );
}
