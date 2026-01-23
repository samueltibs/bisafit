import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePlan } from '@/hooks/usePlan';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dumbbell, 
  Utensils, 
  Calendar, 
  Loader2, 
  Sparkles,
  ChevronRight,
  Check
} from 'lucide-react';

export default function PlanPreview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { plan, workouts, loading: planLoading } = usePlan();

  const isLoading = profileLoading || planLoading;

  // Extract preview data
  const workoutDays = profile?.workout_days as string[] | null;
  const sampleWorkout = workouts?.[0];
  const workoutTitle = sampleWorkout?.title || 'Full Body Strength';
  
  const workoutTimePrefs = profile?.workout_time_preferences_json as {
    default_time?: string;
  } | null;
  const workoutTime = workoutTimePrefs?.default_time || null;

  // Format workout time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleUnlock = () => {
    navigate('/paywall');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Preparing your preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background p-4">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Dumbbell className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold">BisaFit</span>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Success Badge */}
        <div className="flex justify-center">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Plan Generated
          </Badge>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Your personalized plan is ready</h1>
          <p className="text-muted-foreground">
            Here's a preview of what we've created for you
          </p>
        </div>

        {/* Preview Cards */}
        <div className="space-y-4">
          {/* Training Card */}
          <Card className="border-border overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Dumbbell className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold">Training</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {workoutDays?.slice(0, 4).map((day) => (
                      <Badge key={day} variant="outline" className="text-xs">
                        {day.slice(0, 3)}
                      </Badge>
                    ))}
                    {workoutDays && workoutDays.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{workoutDays.length - 4}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sample: {workoutTitle}
                  </p>
                </div>
                <Check className="h-5 w-5 text-primary shrink-0" />
              </div>
            </CardContent>
          </Card>

          {/* Nutrition Card */}
          <Card className="border-border overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent">
                  <Utensils className="h-6 w-6 text-accent-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold">Nutrition</h3>
                  <p className="text-sm text-muted-foreground">
                    Personalized meal suggestions
                  </p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      Breakfast
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Lunch
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Dinner
                    </Badge>
                  </div>
                </div>
                <Check className="h-5 w-5 text-primary shrink-0" />
              </div>
            </CardContent>
          </Card>

          {/* Schedule Card */}
          <Card className="border-border overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <Calendar className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold">Schedule</h3>
                  {workoutTime ? (
                    <p className="text-sm text-muted-foreground">
                      Workouts at {formatTime(workoutTime)}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {workoutDays?.length || 4} workouts per week
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {profile?.session_minutes || 45} min sessions
                  </p>
                </div>
                <Check className="h-5 w-5 text-primary shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features List */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-2">
          <p className="text-sm font-medium">Your plan includes:</p>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              AI-powered workout progression
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              Personalized nutrition guidance
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              Progress tracking & analytics
            </li>
          </ul>
        </div>
      </div>

      {/* CTA Button */}
      <div className="mt-6 space-y-3">
        <Button 
          onClick={handleUnlock} 
          className="w-full h-12 text-base gap-2"
          size="lg"
        >
          Unlock Full Access
          <ChevronRight className="h-5 w-5" />
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Start your 7-day free trial
        </p>
      </div>
    </div>
  );
}
