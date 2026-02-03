import { WorkoutItem, WorkoutBlock } from '@/types/plan';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Timer, RotateCcw, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExerciseMedia } from './ExerciseMedia';
import { CoachingCues } from './CoachingCues';
import { useExerciseImage } from '@/hooks/useExerciseImage';

interface ExerciseCardProps {
  item: WorkoutItem;
  block: WorkoutBlock;
  currentSet: number;
  currentRound?: number;
  isActive?: boolean;
  isPaused?: boolean;
  bigMode?: boolean;
}

export function ExerciseCard({ 
  item, 
  block, 
  currentSet, 
  currentRound, 
  isActive, 
  isPaused,
  bigMode = false 
}: ExerciseCardProps) {
  // Fetch exercise image from cache
  const { imageUrl: cachedImageUrl } = useExerciseImage(item.name);
  
  const isStrength = block.type === 'strength';
  const isConditioning = block.type === 'conditioning';
  const hasRounds = block.protocol && block.protocol.rounds > 1;
  const totalSets = item.sets || 1;

  const getBlockIcon = () => {
    const iconClass = bigMode ? "h-6 w-6" : "h-4 w-4";
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

  // Big mode - minimal UI with media
  if (bigMode) {
    return (
      <Card className={cn(
        "transition-all border-4 w-full",
        isActive && !isPaused && "gradient-primary text-primary-foreground border-primary",
        isActive && isPaused && "bg-muted text-muted-foreground border-muted-foreground/50",
        !isActive && "border-border"
      )}>
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Media section */}
            <div className="lg:w-1/3 flex-shrink-0">
              <ExerciseMedia
                videoUrl={item.video_url_optional}
                imageUrl={cachedImageUrl || item.image_url}
                exerciseName={item.name}
                bigMode
                className="w-full"
              />
            </div>

            {/* Content section */}
            <div className="flex-1 text-center lg:text-left">
              {/* Exercise name - extra large */}
              <h2 className="text-4xl font-bold mb-6">{item.name}</h2>

              {/* Key metrics only */}
              <div className="flex items-center justify-center lg:justify-start gap-8 text-2xl mb-6">
                {isStrength && item.sets && (
                  <div className="text-center">
                    <span className="font-bold text-4xl">{currentSet}</span>
                    <span className="opacity-70">/{totalSets}</span>
                    <span className="block text-sm opacity-60 mt-1">sets</span>
                  </div>
                )}
                {item.reps && (
                  <div className="text-center">
                    <span className="font-bold text-4xl">{item.reps}</span>
                    <span className="block text-sm opacity-60 mt-1">reps</span>
                  </div>
                )}
                {item.duration_sec && !isStrength && (
                  <div className="text-center">
                    <span className="font-bold text-4xl">{item.duration_sec}</span>
                    <span className="block text-sm opacity-60 mt-1">sec</span>
                  </div>
                )}
                {isConditioning && hasRounds && (
                  <div className="text-center">
                    <span className="font-bold text-4xl">{currentRound}</span>
                    <span className="opacity-70">/{block.protocol!.rounds}</span>
                    <span className="block text-sm opacity-60 mt-1">rounds</span>
                  </div>
                )}
              </div>

              {/* Coaching cues */}
              <CoachingCues
                exerciseName={item.name}
                instructions={item.instructions}
                coachingCues={item.coaching_cues}
                bigMode
                isActiveCard={isActive && !isPaused}
              />

              {/* Paused indicator */}
              {isPaused && (
                <div className="mt-6 text-xl font-semibold uppercase tracking-wider animate-pulse">
                  Paused
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Normal mode
  return (
    <Card className={cn(
      "transition-all border-2",
      isActive && !isPaused && "gradient-primary text-primary-foreground border-primary",
      isActive && isPaused && "bg-muted text-muted-foreground border-muted-foreground/50",
      !isActive && "border-border"
    )}>
      <CardContent className="p-6">
        {/* Block badge */}
        <div className="text-center mb-4">
          <Badge 
            variant={isActive ? "secondary" : "outline"}
            className={cn(
              "gap-1.5",
              isActive && !isPaused && "bg-primary-foreground/20 text-primary-foreground border-0",
              isPaused && "bg-muted-foreground/20"
            )}
          >
            {getBlockIcon()}
            {getBlockLabel()}
          </Badge>
        </div>

        {/* Media and content layout */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Media section - compact */}
          <div className="sm:w-1/3 flex-shrink-0">
            <ExerciseMedia
              videoUrl={item.video_url_optional}
              imageUrl={cachedImageUrl || item.image_url}
              exerciseName={item.name}
              className="w-full"
            />
          </div>

          {/* Content section */}
          <div className="flex-1">
            {/* Exercise name */}
            <h2 className="text-2xl font-bold mb-3 text-center sm:text-left">{item.name}</h2>

            {/* Exercise details */}
            <div className="flex items-center justify-center sm:justify-start gap-4 text-lg mb-3">
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
                "text-sm mb-2 text-center sm:text-left",
                isActive ? "opacity-80" : "text-muted-foreground"
              )}>
                Tempo: {item.tempo}
              </p>
            )}

            {/* Rest info for strength */}
            {isStrength && item.rest_sec && (
              <p className={cn(
                "text-sm text-center sm:text-left",
                isActive ? "opacity-70" : "text-muted-foreground"
              )}>
                {item.rest_sec}s rest between sets
              </p>
            )}
          </div>
        </div>

        {/* Coaching cues - full width below */}
        <div className="mt-4">
          <CoachingCues
            exerciseName={item.name}
            instructions={item.instructions}
            coachingCues={item.coaching_cues}
            isActiveCard={isActive && !isPaused}
          />
        </div>

        {/* Paused indicator */}
        {isPaused && (
          <div className="mt-4 text-center text-sm font-semibold uppercase tracking-wider animate-pulse">
            Paused
          </div>
        )}
      </CardContent>
    </Card>
  );
}
