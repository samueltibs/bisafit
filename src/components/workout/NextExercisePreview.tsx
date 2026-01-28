import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NextExercisePreviewProps {
  exerciseName: string;
  blockType: string;
  setsOrDuration?: string;
  className?: string;
}

/**
 * Preview card for the next exercise - minimal, secondary info.
 */
export function NextExercisePreview({
  exerciseName,
  blockType,
  setsOrDuration,
  className,
}: NextExercisePreviewProps) {
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
    <Card className={cn(
      "bg-muted/50 border-border/30",
      className
    )}>
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-3">
          {/* "Up next" label */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wider shrink-0">
            <span>Up next</span>
            <ChevronRight className="h-3 w-3" />
          </div>

          {/* Exercise info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {exerciseName}
            </p>
            <p className="text-xs text-muted-foreground">
              {getBlockLabel(blockType)}
              {setsOrDuration && ` • ${setsOrDuration}`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
