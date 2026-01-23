import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Timer, 
  ChevronLeft,
  Check,
  Loader2
} from 'lucide-react';
import { useWorkoutPlayer } from '@/hooks/useWorkoutPlayer';
import {
  WorkoutTimer,
  ExerciseCard,
  SetLogDialog,
  SkipConfirmDialog,
  WorkoutComplete,
} from '@/components/workout';

export default function Workout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showSetLog, setShowSetLog] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const {
    workout,
    isLoading,
    playerState,
    currentSet,
    currentRound,
    timerSeconds,
    timerType,
    sessionLog,
    getCurrentExercise,
    getCurrentBlock,
    getProgress,
    startWorkout,
    togglePause,
    completeSet,
    skipExercise,
    skipRest,
    completeWorkout,
  } = useWorkoutPlayer(id);

  const currentExercise = getCurrentExercise();
  const currentBlock = getCurrentBlock();
  const progress = getProgress();

  // Loading state
  if (isLoading) {
    return (
      <AppLayout showNav={false}>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // No workout found
  if (!workout) {
    return (
      <AppLayout showNav={false}>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
          <p className="text-muted-foreground">Workout not found</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </AppLayout>
    );
  }

  // Workout completed
  if (playerState === 'completed') {
    return (
      <AppLayout showNav={false}>
        <div className="container px-4 py-6">
          <WorkoutComplete workoutTitle={workout.title} sessionLog={sessionLog} />
        </div>
      </AppLayout>
    );
  }

  const handlePrimaryAction = () => {
    if (playerState === 'idle') {
      startWorkout();
      return;
    }

    if (!currentBlock || !currentExercise) return;

    // For strength exercises, show set log dialog
    if (currentBlock.type === 'strength') {
      setShowSetLog(true);
      return;
    }

    // For warmup/cooldown with timer, we auto-advance
    // But allow manual advance if timer is at 0
    if (timerSeconds === 0 || !timerType) {
      completeSet();
    }
  };

  const handleSkipConfirm = () => {
    skipExercise();
    setShowSkipConfirm(false);
  };

  const getPrimaryButtonText = () => {
    if (playerState === 'idle') return 'Start Workout';
    if (!currentBlock) return 'Next';
    
    if (currentBlock.type === 'strength') {
      const totalSets = currentExercise?.sets || 1;
      if (currentSet <= totalSets) {
        return `Complete Set ${currentSet}/${totalSets}`;
      }
    }
    
    if (timerType === 'rest') return 'Waiting...';
    if (timerType === 'duration' && timerSeconds > 0) return 'In Progress...';
    
    return 'Next Exercise';
  };

  const isPrimaryDisabled = () => {
    if (playerState === 'idle') return false;
    if (playerState === 'paused') return true;
    if (timerType === 'rest') return true;
    if (timerType === 'duration' && timerSeconds > 0) return true;
    return false;
  };

  return (
    <AppLayout showNav={false}>
      <div className="container flex min-h-[calc(100vh-3.5rem)] flex-col px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4 animate-fade-in">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{workout.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Timer className="h-4 w-4" /> {workout.total_estimated_minutes} min
              </span>
            </div>
          </div>
          {playerState !== 'idle' && (
            <Button variant="ghost" size="icon" onClick={togglePause}>
              {playerState === 'paused' ? (
                <Play className="h-5 w-5" />
              ) : (
                <Pause className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>

        {/* Progress */}
        {playerState !== 'idle' && (
          <div className="mb-6 animate-slide-up">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress.percentage)}%</span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>
        )}

        {/* Timer (when active) */}
        {playerState !== 'idle' && timerType && timerSeconds > 0 && (
          <div className="mb-6 animate-scale-in">
            <WorkoutTimer
              seconds={timerSeconds}
              type={timerType}
              onSkip={timerType === 'rest' ? skipRest : undefined}
            />
          </div>
        )}

        {/* Current Exercise */}
        {playerState !== 'idle' && currentExercise && currentBlock && (
          <div className="mb-6 animate-scale-in">
            <ExerciseCard
              item={currentExercise}
              block={currentBlock}
              currentSet={currentSet}
              currentRound={currentRound}
              isActive
            />
          </div>
        )}

        {/* Idle state - workout overview */}
        {playerState === 'idle' && (
          <div className="mb-6 flex-1 space-y-4 animate-slide-up">
            <h2 className="text-lg font-semibold">Workout Overview</h2>
            {workout.blocks.map((block, blockIndex) => (
              <div key={blockIndex} className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground capitalize">
                  {block.type} ({block.items.length} exercises)
                </h3>
                {block.items.map((item, itemIndex) => (
                  <div 
                    key={itemIndex} 
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                  >
                    <span>{item.name}</span>
                    <span className="text-muted-foreground">
                      {item.sets && item.reps 
                        ? `${item.sets}×${item.reps}`
                        : item.duration_sec 
                          ? `${item.duration_sec}s`
                          : ''
                      }
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="mt-auto space-y-4 pb-safe animate-slide-up">
          {/* Primary action button */}
          <Button
            size="lg"
            className="h-14 w-full text-lg"
            onClick={handlePrimaryAction}
            disabled={isPrimaryDisabled()}
          >
            {playerState === 'idle' ? (
              <>
                <Play className="mr-2 h-5 w-5" />
                {getPrimaryButtonText()}
              </>
            ) : (
              <>
                <Check className="mr-2 h-5 w-5" />
                {getPrimaryButtonText()}
              </>
            )}
          </Button>

          {/* Skip button (when active) */}
          {playerState !== 'idle' && currentExercise && (
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setShowSkipConfirm(true)}
            >
              <SkipForward className="mr-2 h-4 w-4" />
              Skip Exercise
            </Button>
          )}
        </div>

        {/* Dialogs */}
        <SetLogDialog
          open={showSetLog}
          onOpenChange={setShowSetLog}
          exerciseName={currentExercise?.name || ''}
          setNumber={currentSet}
          prescribedReps={currentExercise?.reps || '10'}
          onComplete={(weight, reps) => {
            completeSet(weight, reps);
            setShowSetLog(false);
          }}
        />

        <SkipConfirmDialog
          open={showSkipConfirm}
          onOpenChange={setShowSkipConfirm}
          exerciseName={currentExercise?.name || ''}
          onConfirm={handleSkipConfirm}
        />
      </div>
    </AppLayout>
  );
}
