import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, Dumbbell, ChevronRight } from 'lucide-react';
import { SessionLog } from '@/hooks/useWorkoutPlayer';

interface WorkoutCompleteProps {
  workoutTitle: string;
  sessionLog: SessionLog;
}

export function WorkoutComplete({ workoutTitle, sessionLog }: WorkoutCompleteProps) {
  const navigate = useNavigate();

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
      {/* Trophy icon */}
      <div className="mb-6 p-4 rounded-full bg-primary/10">
        <Trophy className="h-16 w-16 text-primary" />
      </div>

      {/* Congrats message */}
      <h1 className="text-2xl font-bold text-center mb-2">Workout Complete!</h1>
      <p className="text-muted-foreground text-center mb-8">{workoutTitle}</p>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{formatDuration(sessionLog.total_duration_sec)}</p>
            <p className="text-xs text-muted-foreground">Duration</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Dumbbell className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{totalSets}</p>
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
