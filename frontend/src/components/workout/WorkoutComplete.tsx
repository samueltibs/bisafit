import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Dumbbell, ChevronRight, Flame, Zap } from 'lucide-react';
import { SessionLog } from '@/hooks/useWorkoutPlayer';
import { EnergyLevelPrompt } from '@/components/progress/EnergyLevelPrompt';
import { useProgressMetrics } from '@/hooks/useProgressMetrics';
import type { EnergyLevel } from '@/types/progress';
import { cn } from '@/lib/utils';

interface WorkoutCompleteProps {
  workoutTitle: string;
  sessionLog: SessionLog;
}

export function WorkoutComplete({ workoutTitle, sessionLog }: WorkoutCompleteProps) {
  const navigate = useNavigate();
  const { recordWorkoutCompletion, recordEnergyLevel } = useProgressMetrics();
  const [showEnergyPrompt, setShowEnergyPrompt] = useState(false);
  const [savingEnergy, setSavingEnergy] = useState(false);
  const [newPRs, setNewPRs] = useState<string[]>([]);
  const [currentStreak, setCurrentStreak] = useState<number>(0);

  // Record workout completion and check for PRs
  useEffect(() => {
    const recordCompletion = async () => {
      const durationMinutes = Math.round(sessionLog.total_duration_sec / 60);
      const result = await recordWorkoutCompletion(sessionLog, durationMinutes);
      
      if (result) {
        setNewPRs(result.newPRs.map(pr => pr.exercise_name));
        setCurrentStreak(result.currentStreak);
        
        // Show energy prompt after a brief delay
        setTimeout(() => {
          setShowEnergyPrompt(true);
        }, 1500);
      }
    };

    recordCompletion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnergySubmit = async (level: EnergyLevel) => {
    setSavingEnergy(true);
    await recordEnergyLevel(level);
    setSavingEnergy(false);
    setShowEnergyPrompt(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remainMins = mins % 60;
      return `${hrs}h ${remainMins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const totalSets = sessionLog.sets.length;
  const totalReps = sessionLog.sets.reduce((acc, set) => acc + set.reps, 0);
  const skipped = sessionLog.skipped_exercises.length;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-scale-in">
      {/* Energy Level Prompt */}
      <EnergyLevelPrompt
        open={showEnergyPrompt}
        onOpenChange={setShowEnergyPrompt}
        onSubmit={handleEnergySubmit}
        loading={savingEnergy}
      />

      {/* Trophy icon */}
      <div className="mb-6 p-4 rounded-full bg-primary/10">
        <Trophy className="h-16 w-16 text-primary" />
      </div>

      {/* Congrats message */}
      <h1 className="text-2xl font-bold text-center mb-2">Workout Complete!</h1>
      <p className="text-muted-foreground text-center mb-4">{workoutTitle}</p>

      {/* Streak badge */}
      {currentStreak > 0 && (
        <Badge className="gap-1 mb-6 bg-energy/10 text-energy border-energy/30 hover:bg-energy/20">
          <Flame className="h-4 w-4" />
          {currentStreak} Day Streak
        </Badge>
      )}

      {/* New PRs */}
      {newPRs.length > 0 && (
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-1 text-energy mb-2">
            <Zap className="h-5 w-5" />
            <span className="font-semibold">New Personal Bests!</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {newPRs.slice(0, 3).map((exercise, idx) => (
              <Badge key={idx} variant="outline" className="text-energy border-energy/30">
                {exercise}
              </Badge>
            ))}
            {newPRs.length > 3 && (
              <Badge variant="outline" className="text-muted-foreground">
                +{newPRs.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold tabular-nums">{formatDuration(sessionLog.total_duration_sec)}</p>
            <p className="text-xs text-muted-foreground">Duration</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Dumbbell className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold tabular-nums">{totalSets}</p>
            <p className="text-xs text-muted-foreground">Sets completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional stats */}
      <div className="text-center text-sm text-muted-foreground mb-8 space-y-1">
        <p>Total reps: {totalReps}</p>
        {skipped > 0 && (
          <p className="text-destructive">{skipped} exercise(s) skipped</p>
        )}
      </div>

      {/* Motivational message */}
      <p className="text-center text-sm text-muted-foreground mb-6 max-w-xs">
        You showed up today — that's progress. Every rep counts.
      </p>

      {/* Actions */}
      <div className="w-full max-w-sm space-y-3">
        <Button 
          className="w-full" 
          size="lg"
          onClick={() => navigate('/home')}
        >
          Back to Home
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate('/progress')}
        >
          View Progress
        </Button>
      </div>
    </div>
  );
}
