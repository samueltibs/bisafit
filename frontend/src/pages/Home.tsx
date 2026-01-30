import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { usePlan } from '@/hooks/usePlan';
import { useRefreshOnResume } from '@/hooks/useAppLifecycle';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SubscriptionBanner } from '@/components/subscription/SubscriptionBanner';
import { WeekRecapBanner } from '@/components/progress/WeekRecapBanner';
import { IntroTour } from '@/components/onboarding/IntroTour';
import { WhatsNew } from '@/components/onboarding/WhatsNew';
import { StepsCard } from '@/components/home/StepsCard';
import { Flame, Droplets, Dumbbell, Apple, ChevronRight, Trophy, User, Bed } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading, refetch, update } = useUserProfile();
  const { getTodayWorkout, getNextUpcomingWorkout, plan } = usePlan();
  const [greeting, setGreeting] = useState('');
  const [showIntroTour, setShowIntroTour] = useState(false);

  // Check if we should show the intro tour (only once after onboarding)
  useEffect(() => {
    if (!loading && profile && !profile.has_seen_intro_tour) {
      setShowIntroTour(true);
    }
  }, [loading, profile]);

  const handleTourComplete = async () => {
    setShowIntroTour(false);
    // Mark tour as seen in database
    await update({ has_seen_intro_tour: true });
  };

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Refresh data on app resume (Capacitor lifecycle)
  const handleAppResume = useCallback(async () => {
    refetch();
    // Sync scheduled notifications by calling the edge function
    if (user) {
      try {
        await supabase.functions.invoke('schedule-notifications');
      } catch (error) {
        console.error('Failed to sync notifications on resume:', error);
      }
    }
  }, [refetch, user]);

  // Use Capacitor-aware lifecycle hook
  useRefreshOnResume(handleAppResume);

  const fullName = profile?.full_name?.trim() || '';
  const hasName = fullName.length > 0;

  // Get today's workout from plan
  const todayWorkout = getTodayWorkout();
  const nextUpcomingWorkout = getNextUpcomingWorkout();

  // Mock data for today's summary
  const todayStats = {
    calories: { current: 1450, target: 2000 },
    water: { current: 5, target: 8 },
    steps: { current: 6234, target: 10000 },
  };

  const handleAddName = () => {
    navigate('/settings?edit=true');
  };

  return (
    <AppLayout>
      {/* Intro Tour - shown once after onboarding */}
      <IntroTour open={showIntroTour} onComplete={handleTourComplete} />
      
      {/* What's New - shown once per version update */}
      <WhatsNew />
      
      <div className="container space-y-6 px-4 py-6">
        {/* Greeting Section */}
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">
            {hasName ? `${greeting}, ${fullName} 👋` : `${greeting} 👋`}
          </h1>
        </div>

        {/* Personalization Banner - shown if no name */}
        {!loading && !hasName && (
          <Card className="border-primary/30 bg-primary/5 animate-fade-in">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Personalize your experience</p>
                <p className="text-xs text-muted-foreground">Add your name to get started</p>
              </div>
              <Button size="sm" onClick={handleAddName}>
                Add Name
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Subscription Banner - handles all subscription states */}
        <SubscriptionBanner />

        {/* Week Recap Banner - shows on weekends */}
        <WeekRecapBanner />

        {/* Daily Progress Card - Navigate to full Progress page on click */}
        <Link to="/progress" className="block">
          <Card className="gradient-primary text-primary-foreground animate-slide-up cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Progress</p>
                  <p className="text-2xl font-bold">72%</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full icon-bg-trophy">
                  <Trophy className="h-6 w-6 icon-trophy" />
                </div>
              </div>
              <Progress value={72} className="h-2 bg-primary-foreground/20" />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-sm opacity-90">Keep going! You're doing great today.</p>
                <ChevronRight className="h-5 w-5 opacity-70" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 animate-slide-up">
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-energy/10">
                <Flame className="h-5 w-5 text-energy" />
              </div>
              <p className="text-lg font-bold">{todayStats.calories.current}</p>
              <p className="text-xs text-muted-foreground">/ {todayStats.calories.target} kcal</p>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                <Droplets className="h-5 w-5 text-accent-foreground" />
              </div>
              <p className="text-lg font-bold">{todayStats.water.current}</p>
              <p className="text-xs text-muted-foreground">/ {todayStats.water.target} glasses</p>
            </CardContent>
          </Card>
          
          {/* Steps Card - with Apple Health sync support */}
          <StepsCard 
            steps={todayStats.steps.current} 
            target={todayStats.steps.target} 
          />
        </div>

        {/* Quick Actions */}
        <div className="space-y-3 animate-slide-up">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          
          {/* Today's Workout - Dynamic based on plan */}
          {todayWorkout ? (
            todayWorkout.isRest ? (
              <Card className="border-border/50 bg-muted/30">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                      <Bed className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Rest Day</p>
                      <p className="text-sm text-muted-foreground">Recovery & light mobility</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Link to={`/workout/${todayWorkout.id}`}>
                <Card className="cursor-pointer border-border transition-all hover:border-primary/50 hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Dumbbell className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Today's Workout</p>
                        <p className="text-sm text-muted-foreground">
                          {todayWorkout.workout} • {todayWorkout.duration} min
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            )
          ) : plan ? (
            nextUpcomingWorkout ? (
              <Link to={`/workout/${nextUpcomingWorkout.id}`}>
                <Card className="cursor-pointer border-border transition-all hover:border-primary/50 hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Dumbbell className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Next Workout: {nextUpcomingWorkout.day}</p>
                        <p className="text-sm text-muted-foreground">
                          {nextUpcomingWorkout.workout} • {nextUpcomingWorkout.duration} min
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ) : (
              <Card className="border-border/50 bg-muted/30">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                      <Dumbbell className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">No upcoming workouts</p>
                      <p className="text-sm text-muted-foreground">Check your plan for schedule</p>
                    </div>
                  </div>
                  <Link to="/plan">
                    <Button variant="ghost" size="sm">View Plan</Button>
                  </Link>
                </CardContent>
              </Card>
            )
          ) : (
            <Link to="/plan">
              <Card className="cursor-pointer border-border transition-all hover:border-primary/50 hover:shadow-md">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Dumbbell className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Get Your Training Plan</p>
                      <p className="text-sm text-muted-foreground">Generate a personalized 4-week plan</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          )}
          
        <Link to="/nutrition?openLogMeal=1">
            <Card className="cursor-pointer border-border transition-all hover:border-primary/50 hover:shadow-md">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-energy/10">
                    <Apple className="h-6 w-6 text-energy" />
                  </div>
                  <div>
                    <p className="font-medium">Log Meal</p>
                    <p className="text-sm text-muted-foreground">Track your nutrition</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Weekly Overview */}
        <Card className="border-border animate-slide-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">{day}</span>
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      i < 4
                        ? 'bg-primary text-primary-foreground'
                        : i === 4
                        ? 'border-2 border-primary text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {i < 4 ? '✓' : i + 20}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
