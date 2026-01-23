import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Flame, Droplets, Footprints, Dumbbell, Apple, ChevronRight, Trophy } from 'lucide-react';

export default function Home() {
  const { profile, loading } = useUserProfile();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const firstName = profile?.full_name?.split(' ')[0] || '';
  const displayName = firstName || 'there';

  // Mock data for today's summary
  const todayStats = {
    calories: { current: 1450, target: 2000 },
    water: { current: 5, target: 8 },
    steps: { current: 6234, target: 10000 },
  };

  return (
    <AppLayout>
      <div className="container space-y-6 px-4 py-6">
        {/* Greeting Section */}
        <div className="animate-fade-in">
          <p className="text-muted-foreground">{greeting}</p>
          <h1 className="text-2xl font-bold text-foreground">
            Hi, {displayName} 👋
          </h1>
        </div>

        {/* Daily Progress Card */}
        <Card className="gradient-primary text-primary-foreground animate-slide-up">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Today's Progress</p>
                <p className="text-2xl font-bold">72%</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20">
                <Trophy className="h-6 w-6" />
              </div>
            </div>
            <Progress value={72} className="h-2 bg-primary-foreground/20" />
            <p className="mt-2 text-sm opacity-90">Keep going! You're doing great today.</p>
          </CardContent>
        </Card>

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
          
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Footprints className="h-5 w-5 text-primary" />
              </div>
              <p className="text-lg font-bold">{(todayStats.steps.current / 1000).toFixed(1)}k</p>
              <p className="text-xs text-muted-foreground">/ {todayStats.steps.target / 1000}k steps</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3 animate-slide-up">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          
          <Link to="/workout/today">
            <Card className="cursor-pointer border-border transition-all hover:border-primary/50 hover:shadow-md">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Dumbbell className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Today's Workout</p>
                    <p className="text-sm text-muted-foreground">Full Body Strength • 45 min</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/nutrition">
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
