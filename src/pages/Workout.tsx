import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Timer, 
  Flame, 
  Dumbbell, 
  Check,
  ChevronLeft,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

const exercises = [
  { id: 1, name: 'Warm-up Jumping Jacks', sets: 1, reps: 30, duration: 60, type: 'warmup' },
  { id: 2, name: 'Push-ups', sets: 3, reps: 12, rest: 60, type: 'strength' },
  { id: 3, name: 'Dumbbell Rows', sets: 3, reps: 10, rest: 60, type: 'strength' },
  { id: 4, name: 'Squats', sets: 3, reps: 15, rest: 60, type: 'strength' },
  { id: 5, name: 'Plank Hold', sets: 3, reps: 1, duration: 45, rest: 30, type: 'core' },
  { id: 6, name: 'Lunges', sets: 3, reps: 12, rest: 60, type: 'strength' },
  { id: 7, name: 'Cool-down Stretch', sets: 1, reps: 1, duration: 120, type: 'cooldown' },
];

export default function Workout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);

  const workout = {
    id,
    name: 'Full Body Strength',
    duration: 45,
    calories: 380,
    exercises,
  };

  const progress = (completedExercises.length / exercises.length) * 100;
  const currentEx = exercises[currentExercise];

  const handleComplete = () => {
    if (!completedExercises.includes(currentExercise)) {
      setCompletedExercises([...completedExercises, currentExercise]);
    }
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
    }
  };

  const handleNext = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
    }
  };

  const handleReset = () => {
    setCurrentExercise(0);
    setCompletedExercises([]);
    setIsPlaying(false);
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
            <h1 className="text-xl font-bold">{workout.name}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Timer className="h-4 w-4" /> {workout.duration} min
              </span>
              <span className="flex items-center gap-1">
                <Flame className="h-4 w-4" /> {workout.calories} kcal
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleReset}>
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress */}
        <div className="mb-6 animate-slide-up">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{completedExercises.length}/{exercises.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Exercise */}
        <Card className="mb-6 gradient-primary text-primary-foreground animate-scale-in">
          <CardContent className="p-6 text-center">
            <Badge className="mb-4 bg-primary-foreground/20 text-primary-foreground">
              {currentEx.type.toUpperCase()}
            </Badge>
            <h2 className="mb-2 text-2xl font-bold">{currentEx.name}</h2>
            <div className="flex items-center justify-center gap-6 text-lg">
              {currentEx.sets > 1 && (
                <span>{currentEx.sets} sets</span>
              )}
              {currentEx.reps > 1 && (
                <span>{currentEx.reps} reps</span>
              )}
              {currentEx.duration && (
                <span>{currentEx.duration}s</span>
              )}
            </div>
            {currentEx.rest && (
              <p className="mt-2 text-sm opacity-80">Rest: {currentEx.rest}s between sets</p>
            )}
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="mb-8 flex items-center justify-center gap-4 animate-slide-up">
          <Button
            size="lg"
            variant="outline"
            className="h-14 w-14 rounded-full"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </Button>
          <Button
            size="lg"
            className="h-16 w-32 rounded-full"
            onClick={handleComplete}
          >
            <Check className="mr-2 h-5 w-5" />
            Done
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-14 w-14 rounded-full"
            onClick={handleNext}
          >
            <SkipForward className="h-6 w-6" />
          </Button>
        </div>

        {/* Exercise List */}
        <div className="flex-1 space-y-2 animate-slide-up">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">All Exercises</h3>
          {exercises.map((exercise, index) => (
            <Card
              key={exercise.id}
              className={cn(
                "cursor-pointer border-border transition-all",
                index === currentExercise && "border-primary bg-accent",
                completedExercises.includes(index) && "opacity-60"
              )}
              onClick={() => setCurrentExercise(index)}
            >
              <CardContent className="flex items-center gap-3 p-3">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                    completedExercises.includes(index)
                      ? "bg-primary text-primary-foreground"
                      : index === currentExercise
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {completedExercises.includes(index) ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <div className="flex-1">
                  <p className={cn("font-medium text-sm", completedExercises.includes(index) && "line-through")}>
                    {exercise.name}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {exercise.sets > 1 ? `${exercise.sets}x${exercise.reps}` : exercise.duration ? `${exercise.duration}s` : `${exercise.reps}x`}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
