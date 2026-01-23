import { WorkoutItem, WorkoutBlock } from '@/types/plan';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Timer, RotateCcw, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExerciseCardProps {
  item: WorkoutItem;
  block: WorkoutBlock;
  currentSet: number;
  currentRound?: number;
  isActive?: boolean;
}

export function ExerciseCard({ item, block, currentSet, currentRound, isActive }: ExerciseCardProps) {
  const isStrength = block.type === 'strength';
  const isConditioning = block.type === 'conditioning';
  const hasRounds = block.protocol && block.protocol.rounds > 1;
  const totalSets = item.sets || 1;

  const getBlockIcon = () => {
    switch (block.type) {
      case 'warmup':
        return <Timer className="h-4 w-4" />;
      case 'strength':
        return <Dumbbell className="h-4 w-4" />;
      case 'conditioning':
        return <Zap className="h-4 w-4" />;
      case 'cooldown':
        return <RotateCcw className="h-4 w-4" />;
    }
  };

  const getBlockLabel = () => {
    switch (block.type) {
      case 'warmup':
        return 'Warm-up';
      case 'strength':
        return 'Strength';
      case 'conditioning':
        return 'Conditioning';
      case 'cooldown':
        return 'Cool-down';
    }
  };

  return (
    <Card className={cn(
      "transition-all border-2",
      isActive ? "gradient-primary text-primary-foreground border-primary" : "border-border"
    )}>
      <CardContent className="p-6 text-center">
        {/* Block badge */}
        <Badge 
          variant={isActive ? "secondary" : "outline"}
          className={cn(
            "mb-4 gap-1.5",
            isActive && "bg-primary-foreground/20 text-primary-foreground border-0"
          )}
        >
          {getBlockIcon()}
          {getBlockLabel()}
        </Badge>

        {/* Exercise name */}
        <h2 className="text-2xl font-bold mb-4">{item.name}</h2>

        {/* Exercise details */}
        <div className="flex items-center justify-center gap-6 text-lg mb-4">
          {isStrength && item.sets && (
            <div className="text-center">
              <span className="font-bold">{currentSet}</span>
              <span className="opacity-70">/{totalSets} sets</span>
            </div>
          )}
          {item.reps && (
            <div>
              <span className="font-bold">{item.reps}</span>
              <span className="opacity-70 ml-1">reps</span>
            </div>
          )}
          {item.duration_sec && !isStrength && (
            <div>
              <span className="font-bold">{item.duration_sec}</span>
              <span className="opacity-70 ml-1">sec</span>
            </div>
          )}
          {isConditioning && hasRounds && (
            <div>
              <span className="font-bold">{currentRound}</span>
              <span className="opacity-70">/{block.protocol!.rounds} rounds</span>
            </div>
          )}
        </div>

        {/* Tempo */}
        {item.tempo && (
          <p className={cn(
            "text-sm mb-2",
            isActive ? "opacity-80" : "text-muted-foreground"
          )}>
            Tempo: {item.tempo}
          </p>
        )}

        {/* Rest info for strength */}
        {isStrength && item.rest_sec && (
          <p className={cn(
            "text-sm",
            isActive ? "opacity-70" : "text-muted-foreground"
          )}>
            {item.rest_sec}s rest between sets
          </p>
        )}

        {/* Instructions */}
        {item.instructions && (
          <p className={cn(
            "mt-4 text-sm",
            isActive ? "opacity-80" : "text-muted-foreground"
          )}>
            {item.instructions}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
