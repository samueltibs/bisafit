import { useState, useEffect, useMemo } from 'react';
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
import { useVoiceCues } from '@/hooks/useVoiceCues';
import { useWorkoutResume } from '@/hooks/useWorkoutResume';
import {
  WorkoutTimer,
  ExerciseCard,
  SetLogDialog,
  SkipConfirmDialog,
  WorkoutComplete,
  ResumeWorkoutDialog,
  WorkoutControls,
  ProgressIndicator,
} from '@/components/workout';
import { cn } from '@/lib/utils';

export default function Workout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showSetLog, setShowSetLog] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [bigMode, setBigMode] = useState(false);

  // Hooks
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
    currentBlockIndex,
    currentItemIndex,
  } = useWorkoutPlayer(id);

  const voiceCues = useVoiceCues();

  const {
    incompleteSession,
    isChecking,
    showResumeModal,
    discardSession,
    confirmResume,
    saveResumeState,
  } = useWorkoutResume(id);

  const currentExercise = getCurrentExercise();
  const currentBlock = getCurrentBlock();
  const progress = getProgress();

  // Calculate total exercises for progress indicator
  const { currentExerciseNumber, totalExercises } = useMemo(() => {
    if (!workout) return { currentExerciseNumber: 0, totalExercises: 0 };
    
    let total = 0;
    let current = 0;
    let found = false;

    workout.blocks.forEach((block, blockIdx) => {
      block.items.forEach((_, itemIdx) => {
        total++;
        if (!found) {
          current++;
          if (blockIdx === currentBlockIndex && itemIdx === currentItemIndex) {
            found = true;
          }
        }
      });
    });

    return { currentExerciseNumber: current, totalExercises: total };
  }, [workout, currentBlockIndex, currentItemIndex]);

  // Save resume state on position changes
  useEffect(() => {
    if (playerState === 'active' || playerState === 'paused') {
      saveResumeState({
        currentBlockIndex,
        currentItemIndex,
        currentSet,
        currentRound,
        sessionLog,
      });
    }
  }, [playerState, currentBlockIndex, currentItemIndex, currentSet, currentRound, sessionLog, saveResumeState]);

  // Voice cue: workout start
  const handleStart = () => {
    startWorkout();
    voiceCues.announceWorkoutStart();
  };

  // Voice cue: rest timer
  useEffect(() => {
    if (timerType === 'rest' && timerSeconds > 0 && playerState === 'active') {
      // Announce rest only when it starts (timer just set)
      if (currentExercise?.rest_sec === timerSeconds || timerSeconds === 60) {
        voiceCues.announceRest(timerSeconds);
      }
    }
  }, [timerType, timerSeconds, playerState, voiceCues, currentExercise]);

  // Voice cue: next exercise
  useEffect(() => {
    if (playerState === 'active' && currentExercise && timerType !== 'rest') {
      voiceCues.announceNextExercise(currentExercise.name);
    }
  }, [currentExercise?.name, playerState]);

  // Voice cue: countdown
  const handleCountdownTick = (seconds: number) => {
    voiceCues.announceTimerWarning(seconds);
  };

  // Voice cue: workout complete
  useEffect(() => {
    if (playerState === 'completed') {
      voiceCues.announceWorkoutComplete();
    }
  }, [playerState, voiceCues]);

  // Loading state
  if (isLoading || isChecking) {
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
      handleStart();
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

  const handleSetComplete = (weight?: number, reps?: number) => {
    const totalSets = currentExercise?.sets || 1;
    voiceCues.announceSetComplete(currentSet, totalSets);
    completeSet(weight, reps);
    setShowSetLog(false);
  };

  const handleSkipConfirm = () => {
    skipExercise();
    setShowSkipConfirm(false);
  };

  const handleResume = () => {
    confirmResume();
    handleStart();
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
    
    if (timerType === 'rest') return 'Resting...';
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

  const isPaused = playerState === 'paused';

  return (
    <AppLayout showNav={false}>
      <div className={cn(
        "container flex min-h-[calc(100vh-3.5rem)] flex-col px-4 py-6",
        bigMode && "px-6 py-8"
      )}>
        {/* Header */}
        {!bigMode && (
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
                {isPaused ? (
                  <Play className="h-5 w-5" />
                ) : (
                  <Pause className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
        )}

        {/* Controls (voice + big mode toggles) */}
        {playerState !== 'idle' && (
          <div className={cn(
            "mb-4 flex items-center justify-between",
            bigMode && "mb-6"
          )}>
            <WorkoutControls
              voiceEnabled={voiceCues.isEnabled}
              onVoiceToggle={voiceCues.setIsEnabled}
              voiceAvailable={voiceCues.isAvailable}
              bigModeEnabled={bigMode}
              onBigModeToggle={setBigMode}
            />
            {bigMode && (
              <Button variant="ghost" size="sm" onClick={togglePause}>
                {isPaused ? (
                  <><Play className="h-4 w-4 mr-2" /> Resume</>
                ) : (
                  <><Pause className="h-4 w-4 mr-2" /> Pause</>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Progress */}
        {playerState !== 'idle' && !bigMode && (
          <div className="mb-6 animate-slide-up">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress.percentage)}%</span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>
        )}

        {/* Progress Indicator (exercise X of Y) */}
        {playerState !== 'idle' && (
          <ProgressIndicator
            currentExercise={currentExerciseNumber}
            totalExercises={totalExercises}
            currentSet={currentBlock?.type === 'strength' ? currentSet : undefined}
            totalSets={currentBlock?.type === 'strength' ? currentExercise?.sets : undefined}
            bigMode={bigMode}
            className={cn("mb-4", bigMode && "mb-6")}
          />
        )}

        {/* Timer (when active) */}
        {playerState !== 'idle' && timerType && timerSeconds > 0 && (
          <div className={cn("mb-6 animate-scale-in", bigMode && "mb-8")}>
            <WorkoutTimer
              seconds={timerSeconds}
              type={timerType}
              onSkip={timerType === 'rest' ? skipRest : undefined}
              bigMode={bigMode}
              isPaused={isPaused}
              onCountdownTick={handleCountdownTick}
            />
          </div>
        )}

        {/* Current Exercise */}
        {playerState !== 'idle' && currentExercise && currentBlock && (
          <div className={cn("mb-6 animate-scale-in", bigMode && "mb-8 flex-1 flex items-center")}>
            <ExerciseCard
              item={currentExercise}
              block={currentBlock}
              currentSet={currentSet}
              currentRound={currentRound}
              isActive
              isPaused={isPaused}
              bigMode={bigMode}
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
        <div className={cn(
          "mt-auto space-y-4 pb-safe animate-slide-up",
          bigMode && "space-y-6"
        )}>
          {/* Primary action button */}
          <Button
            size="lg"
            className={cn(
              "w-full",
              bigMode ? "h-20 text-2xl" : "h-14 text-lg"
            )}
            onClick={handlePrimaryAction}
            disabled={isPrimaryDisabled()}
          >
            {playerState === 'idle' ? (
              <>
                <Play className={cn("mr-2", bigMode ? "h-7 w-7" : "h-5 w-5")} />
                {getPrimaryButtonText()}
              </>
            ) : (
              <>
                <Check className={cn("mr-2", bigMode ? "h-7 w-7" : "h-5 w-5")} />
                {getPrimaryButtonText()}
              </>
            )}
          </Button>

          {/* Skip button (when active) */}
          {playerState !== 'idle' && currentExercise && !bigMode && (
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
          onComplete={handleSetComplete}
        />

        <SkipConfirmDialog
          open={showSkipConfirm}
          onOpenChange={setShowSkipConfirm}
          exerciseName={currentExercise?.name || ''}
          onConfirm={handleSkipConfirm}
        />

        <ResumeWorkoutDialog
          open={showResumeModal}
          onResume={handleResume}
          onDiscard={discardSession}
          startedAt={incompleteSession?.started_at || ''}
          setsCompleted={incompleteSession?.session_log_json?.sets?.length}
        />
      </div>
    </AppLayout>
  );
}
