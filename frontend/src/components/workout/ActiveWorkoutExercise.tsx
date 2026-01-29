import { useState } from 'react';
import { WorkoutItem, WorkoutBlock } from '@/types/plan';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dumbbell, Timer, RotateCcw, Zap, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExerciseMedia } from './ExerciseMedia';
import { FormTipsModal } from './FormTipsModal';
import { getDefaultCues } from '@/lib/exerciseMediaMap';

interface ActiveWorkoutExerciseProps {
  item: WorkoutItem;
  block: WorkoutBlock;
  currentSet: number;
  currentRound?: number;
  isPaused?: boolean;
  className?: string;
}

/**
 * Current exercise display - bold name, set/rep/duration details.
 * Optimized for readability during movement.
 */
export function ActiveWorkoutExercise({
  item,
  block,
  currentSet,
  currentRound,
  isPaused = false,
  className,
}: ActiveWorkoutExerciseProps) {
  const [showFormTips, setShowFormTips] = useState(false);
  
  const isStrength = block.type === 'strength';
  const isConditioning = block.type === 'conditioning';
  const hasRounds = block.protocol && block.protocol.rounds > 1;
  const totalSets = item.sets || 1;

  // Get form tips from the exercise data or central map
  const formTips = getDefaultCues(item.name);
  const hasFormTips = formTips.length > 0;

  const getBlockIcon = () => {
    const iconClass = "h-3.5 w-3.5";
    switch (block.type) {
      case 'warmup':
        return <Timer className={iconClass} />;
      case 'strength':
        return <Dumbbell className={iconClass} />;
      case 'conditioning':
        return <Zap className={iconClass} />;
      case 'cooldown':
        return <RotateCcw className={iconClass} />;
    }
  };

  const getBlockLabel = () => {
    switch (block.type) {
      case 'warmup': return 'Warm-up';
      case 'strength': return 'Strength';
      case 'conditioning': return 'Conditioning';
      case 'cooldown': return 'Cool-down';
    }
  };

  return (
    <div className={cn(
      "flex flex-col items-center text-center",
      className
    )}>
      {/* Block type badge */}
      <Badge 
        variant="outline" 
        className="gap-1.5 mb-4 text-xs font-medium border-border/50"
      >
        {getBlockIcon()}
        {getBlockLabel()}
      </Badge>

      {/* Exercise media - always render, let component handle lookup/fallback */}
      <div className="w-40 h-40 rounded-2xl overflow-hidden mb-4">
        <ExerciseMedia
          videoUrl={item.video_url_optional}
          imageUrl={item.image_url}
          exerciseName={item.name}
          bigMode
          className="w-full h-full"
        />
      </div>

      {/* Exercise name - hero text */}
      <h1 className={cn(
        "text-3xl font-bold mb-2 leading-tight px-4",
        isPaused && "opacity-60"
      )}>
        {item.name}
      </h1>

      {/* Form tips button */}
      {hasFormTips && (
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
          onClick={() => setShowFormTips(true)}
        >
          <Info className="h-3.5 w-3.5" />
          Form Tips
        </Button>
      )}

      {/* Metrics row */}
      <div className="flex items-center justify-center gap-8">
        {/* Sets */}
        {isStrength && item.sets && (
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-4xl font-bold text-primary tabular-nums">
                {currentSet}
              </span>
              <span className="text-xl text-muted-foreground">
                /{totalSets}
              </span>
            </div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              sets
            </span>
          </div>
        )}

        {/* Reps */}
        {item.reps && (
          <div className="text-center">
            <span className="text-4xl font-bold tabular-nums">
              {item.reps}
            </span>
            <span className="block text-xs text-muted-foreground uppercase tracking-wider">
              reps
            </span>
          </div>
        )}

        {/* Duration (non-strength) */}
        {item.duration_sec && !isStrength && (
          <div className="text-center">
            <span className="text-4xl font-bold tabular-nums">
              {item.duration_sec}
            </span>
            <span className="block text-xs text-muted-foreground uppercase tracking-wider">
              sec
            </span>
          </div>
        )}

        {/* Rounds (conditioning) */}
        {isConditioning && hasRounds && (
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-4xl font-bold tabular-nums">
                {currentRound}
              </span>
              <span className="text-xl text-muted-foreground">
                /{block.protocol!.rounds}
              </span>
            </div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              rounds
            </span>
          </div>
        )}
      </div>

      {/* Rest info for strength */}
      {isStrength && item.rest_sec && (
        <p className="mt-4 text-sm text-muted-foreground">
          {item.rest_sec}s rest between sets
        </p>
      )}

      {/* Tempo if present */}
      {item.tempo && (
        <p className="mt-2 text-sm text-muted-foreground">
          Tempo: {item.tempo}
        </p>
      )}

      {/* Form Tips Modal */}
      <FormTipsModal
        open={showFormTips}
        onOpenChange={setShowFormTips}
        exerciseName={item.name}
        tips={formTips}
      />
    </div>
  );
}
