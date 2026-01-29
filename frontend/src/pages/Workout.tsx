import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Loader2
} from 'lucide-react';
import { useWorkoutPlayer } from '@/hooks/useWorkoutPlayer';
import { useVoiceCues, type CoachVoice } from '@/hooks/useVoiceCues';
import { useWorkoutResume } from '@/hooks/useWorkoutResume';
import { usePremiumFeature } from '@/hooks/usePremiumFeature';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMusicSettings } from '@/hooks/useMusicSettings';
import { musicService } from '@/lib/musicService';
import { PremiumFeatureModal } from '@/components/subscription';
import {
  WorkoutComplete,
  SetLogDialog,
  SkipConfirmDialog,
  ResumeWorkoutDialog,
  ProgressIndicator,
  ActiveWorkoutHeader,
  ActiveWorkoutTimer,
  ActiveWorkoutControls,
  NextExercisePreview,
  MusicMiniPlayer,
  CastModeSheet,
  ExitWorkoutDialog,
  TVModeOverlay,
  CoachingCues,
  LargeDemoPanel,
  EnhancedExerciseDisplay,
  WorkoutPreparation,
} from '@/components/workout';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import { hasExerciseMedia } from '@/lib/exerciseMediaMap';
import { type UserGender } from '@/lib/exerciseMediaData';

export default function Workout() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // UI state
  const [showSetLog, setShowSetLog] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showCastSheet, setShowCastSheet] = useState(false);
  const [showMusicPanel, setShowMusicPanel] = useState(false);
  const [tvMode, setTvMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useEnhancedView, setUseEnhancedView] = useState(true); // New: Enhanced TV-style view
  const [showPreparation, setShowPreparation] = useState(false); // Pre-workout image generation
  const [preparationComplete, setPreparationComplete] = useState(false);

  // Premium feature gating
  const { showModal: showPremiumModal, setShowModal: setShowPremiumModal, checkPremiumAccess } = usePremiumFeature();

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

  // Get user's voice preference
  const { profile } = useUserProfile();
  const preferredVoice = (profile?.coach_voice as CoachVoice) || 'female';
  
  const voiceCues = useVoiceCues({ preferredVoice });
  
  // Music settings
  const { settings: musicSettings } = useMusicSettings();

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

  // Get next exercise info
  const nextExerciseInfo = useMemo(() => {
    if (!workout) return null;
    
    const block = workout.blocks[currentBlockIndex];
    
    // Check if there's a next item in current block
    if (currentItemIndex < block.items.length - 1) {
      const nextItem = block.items[currentItemIndex + 1];
      return { 
        name: nextItem.name, 
        blockType: block.type,
        detail: nextItem.sets && nextItem.reps 
          ? `${nextItem.sets}×${nextItem.reps}`
          : nextItem.duration_sec 
            ? `${nextItem.duration_sec}s`
            : undefined
      };
    }
    
    // Check if there's a next block
    if (currentBlockIndex < workout.blocks.length - 1) {
      const nextBlock = workout.blocks[currentBlockIndex + 1];
      const nextItem = nextBlock.items[0];
      return { 
        name: nextItem.name, 
        blockType: nextBlock.type,
        detail: nextItem.sets && nextItem.reps 
          ? `${nextItem.sets}×${nextItem.reps}`
          : nextItem.duration_sec 
            ? `${nextItem.duration_sec}s`
            : undefined
      };
    }
    
    return null;
  }, [workout, currentBlockIndex, currentItemIndex]);

  // Fullscreen API handling
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        // Fullscreen not supported or blocked
      });
    } else {
      document.exitFullscreen?.().then(() => {
        setIsFullscreen(false);
      });
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Exit TV mode when workout ends
  useEffect(() => {
    if (playerState === 'completed' && tvMode) {
      setTvMode(false);
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      }
    }
  }, [playerState, tvMode]);

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

  // Voice cue: workout start + optional music autoplay
  const handleStart = () => {
    trackEvent('workout_started');
    
    // Show preparation screen to pre-generate images
    if (useEnhancedView && !preparationComplete) {
      setShowPreparation(true);
      return;
    }
    
    startWorkout();
    voiceCues.announceWorkoutStart();
    
    // Trigger music autoplay if enabled
    if (musicSettings.autoplay && musicSettings.provider !== 'none') {
      musicService.playDefaultPlaylistOnWorkoutStart().catch(err => {
        console.log('[Workout] Music autoplay failed:', err);
      });
    }
  };
  
  const handlePreparationComplete = () => {
    setShowPreparation(false);
    setPreparationComplete(true);
    
    // Now start the actual workout
    startWorkout();
    voiceCues.announceWorkoutStart();
    
    // Trigger music autoplay if enabled
    if (musicSettings.autoplay && musicSettings.provider !== 'none') {
      musicService.playDefaultPlaylistOnWorkoutStart().catch(err => {
        console.log('[Workout] Music autoplay failed:', err);
      });
    }
  };
  
  const handlePreparationSkip = () => {
    setShowPreparation(false);
    setPreparationComplete(true);
    
    // Start without waiting for images
    startWorkout();
    voiceCues.announceWorkoutStart();
    
    if (musicSettings.autoplay && musicSettings.provider !== 'none') {
      musicService.playDefaultPlaylistOnWorkoutStart().catch(err => {
        console.log('[Workout] Music autoplay failed:', err);
      });
    }
  };

  // Voice cue: rest timer
  useEffect(() => {
    if (timerType === 'rest' && timerSeconds > 0 && playerState === 'active') {
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
      trackEvent('workout_completed');
      voiceCues.announceWorkoutComplete();
    }
  }, [playerState, voiceCues]);

  // Navigation handlers
  const handleBackClick = () => {
    if (playerState === 'active' || playerState === 'paused') {
      setShowExitDialog(true);
    } else {
      navigate(-1);
    }
  };

  const handleExitConfirm = () => {
    setShowExitDialog(false);
    navigate(-1);
  };

  const handlePrimaryAction = () => {
    if (playerState === 'idle') {
      if (!checkPremiumAccess()) return;
      handleStart();
      return;
    }

    if (!currentBlock || !currentExercise) return;

    // For strength exercises, show set log dialog
    if (currentBlock.type === 'strength') {
      setShowSetLog(true);
      return;
    }

    // For warmup/cooldown with timer, allow manual advance if timer is at 0
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
  const isActive = playerState === 'active' || playerState === 'paused';
  const hasMusicProvider = musicSettings.provider !== 'none';

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

  return (
    <>
      {/* TV Mode Overlay - renders on top when active */}
      {tvMode && isActive && (
        <TVModeOverlay
          workout={workout}
          currentExercise={currentExercise}
          currentBlock={currentBlock}
          currentBlockIndex={currentBlockIndex}
          currentItemIndex={currentItemIndex}
          currentSet={currentSet}
          timerSeconds={timerSeconds}
          timerType={timerType}
          isPaused={isPaused}
          progress={progress}
          onTogglePause={togglePause}
          onSkipExercise={skipExercise}
          onSkipRest={timerType === 'rest' ? skipRest : undefined}
          onExit={() => setTvMode(false)}
          onEndWorkout={() => {
            setTvMode(false);
            setShowExitDialog(true);
          }}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          userGender={(profile?.gender as UserGender) || 'unspecified'}
        />
      )}

      {/* Main workout screen (hidden during TV mode) */}
      {!tvMode && (
        <div className="fixed inset-0 flex flex-col bg-background">
          {/* Top App Bar */}
          <ActiveWorkoutHeader
            workoutTitle={workout.title}
            onBack={handleBackClick}
            onMusicClick={() => setShowMusicPanel(!showMusicPanel)}
            onCastClick={() => setShowCastSheet(true)}
            hasMusicProvider={hasMusicProvider}
          />

          {/* Music Mini Player (collapsible) */}
          {showMusicPanel && hasMusicProvider && isActive && (
            <div className="px-4 py-2 animate-fade-in">
              <MusicMiniPlayer
                provider={musicSettings.provider}
                playlistName={musicSettings.playlistName}
              />
            </div>
          )}

          {/* Main content area */}
          <div className="flex-1 overflow-auto pb-40">
            <div className="container max-w-lg mx-auto px-4 py-6">
              
              {/* Active workout state - Enhanced TV-Style View */}
              {isActive && currentExercise && currentBlock && useEnhancedView && (
                <div className="fixed inset-0 top-14 flex flex-col bg-background">
                  <EnhancedExerciseDisplay
                    exerciseName={currentExercise.name}
                    currentSet={currentSet}
                    totalSets={currentExercise.sets || 1}
                    repsTarget={currentExercise.reps || 0}
                    currentExerciseNum={currentExerciseNumber}
                    totalExercises={totalExercises}
                    timerSeconds={timerSeconds}
                    timerType={timerType || 'work'}
                    nextExerciseName={nextExerciseInfo?.name}
                    nextExerciseSets={nextExerciseInfo?.sets}
                    nextExerciseReps={nextExerciseInfo?.reps}
                    isPaused={isPaused}
                    muscleGroup={currentBlock.type}
                    userGender={(profile?.gender as string) || 'male'}
                    onPlayPause={togglePause}
                    onSkipForward={() => {
                      if (timerType === 'rest') {
                        skipRest();
                      } else {
                        setShowSetLog(true);
                      }
                    }}
                    onSkipBack={() => {
                      // Could implement going back to previous exercise
                    }}
                  />
                </div>
              )}
              
              {/* Active workout state - Classic View */}
              {isActive && currentExercise && currentBlock && !useEnhancedView && (
                <div className="space-y-4 animate-fade-in">
                  {/* Compact progress indicator */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Exercise {currentExerciseNumber} of {totalExercises}
                    </span>
                    <span className="font-medium tabular-nums text-primary">
                      {Math.round(progress.percentage)}%
                    </span>
                  </div>
                  <Progress value={progress.percentage} className="h-1.5" />

                  {/* Hero Timer (compact when demo is visible) */}
                  {timerType && timerSeconds > 0 && (
                    <div className="animate-scale-in">
                      <ActiveWorkoutTimer
                        seconds={timerSeconds}
                        type={timerType}
                        isPaused={isPaused}
                        onCountdownTick={handleCountdownTick}
                        compact={hasExerciseMedia(currentExercise.name)}
                      />
                      {timerType === 'rest' && (
                        <div className="text-center mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={skipRest}
                            className="text-muted-foreground h-8 text-xs"
                          >
                            Skip Rest
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* LARGE Demo Panel - primary visual */}
                  <LargeDemoPanel
                    videoUrl={currentExercise.video_url_optional}
                    imageUrl={currentExercise.image_url}
                    exerciseName={currentExercise.name}
                    userGender={(profile?.gender as UserGender) || 'unspecified'}
                    className="animate-fade-in"
                  />

                  {/* Exercise info */}
                  <div className="text-center space-y-2">
                    {/* Block badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 text-xs font-medium text-muted-foreground capitalize">
                      {currentBlock.type}
                    </div>

                    {/* Exercise name */}
                    <h2 className={cn(
                      "text-2xl font-bold leading-tight",
                      isPaused && "opacity-60"
                    )}>
                      {currentExercise.name}
                    </h2>

                    {/* Sets/reps info */}
                    <div className="flex items-center justify-center gap-6 text-muted-foreground">
                      {currentBlock.type === 'strength' && currentExercise.sets && (
                        <span className="text-lg">
                          Set <span className="font-bold text-primary tabular-nums">{currentSet}</span>
                          <span className="text-sm">/{currentExercise.sets}</span>
                        </span>
                      )}
                      {currentExercise.reps && (
                        <span className="text-lg">
                          <span className="font-bold tabular-nums">{currentExercise.reps}</span> reps
                        </span>
                      )}
                      {currentExercise.duration_sec && currentBlock.type !== 'strength' && (
                        <span className="text-lg">
                          <span className="font-bold tabular-nums">{currentExercise.duration_sec}</span>s
                        </span>
                      )}
                    </div>

                    {/* Rest info */}
                    {currentBlock.type === 'strength' && currentExercise.rest_sec && (
                      <p className="text-xs text-muted-foreground">
                        {currentExercise.rest_sec}s rest between sets
                      </p>
                    )}
                  </div>

                  {/* Coaching cues (collapsible) */}
                  <CoachingCues
                    exerciseName={currentExercise.name}
                    instructions={currentExercise.instructions}
                    coachingCues={currentExercise.coaching_cues}
                    isActiveCard={!isPaused}
                  />

                  {/* Next exercise preview */}
                  {nextExerciseInfo && (
                    <NextExercisePreview
                      exerciseName={nextExerciseInfo.name}
                      blockType={nextExerciseInfo.blockType}
                      setsOrDuration={nextExerciseInfo.detail}
                      className="animate-slide-up"
                    />
                  )}
                </div>
              )}

              {/* Idle state - workout overview */}
              {playerState === 'idle' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">{workout.title}</h1>
                    <p className="text-muted-foreground">
                      {workout.total_estimated_minutes} min • {totalExercises} exercises
                    </p>
                  </div>

                  {workout.blocks.map((block, blockIndex) => (
                    <div key={blockIndex} className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground capitalize">
                        {block.type} ({block.items.length} exercises)
                      </h3>
                      {block.items.map((item, itemIndex) => (
                        <div 
                          key={itemIndex} 
                          className="flex items-center justify-between rounded-xl border border-border/50 bg-card/50 p-3 text-sm"
                        >
                          <span className="font-medium">{item.name}</span>
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
            </div>
          </div>

          {/* Sticky bottom controls */}
          <ActiveWorkoutControls
            isPaused={isPaused}
            isIdle={playerState === 'idle'}
            primaryLabel={getPrimaryButtonText()}
            primaryDisabled={isPrimaryDisabled()}
            onPrimaryAction={handlePrimaryAction}
            onTogglePause={togglePause}
            onSkipForward={() => setShowSkipConfirm(true)}
            onEndWorkout={() => setShowExitDialog(true)}
          />
        </div>
      )}

      {/* Dialogs & Sheets */}
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

      <ExitWorkoutDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        onConfirm={handleExitConfirm}
        progressPercentage={progress.percentage}
      />

      <CastModeSheet
        open={showCastSheet}
        onOpenChange={setShowCastSheet}
        onTVModeEnable={() => setTvMode(true)}
        onFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
      />

      <PremiumFeatureModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
      />
    </>
  );
}
