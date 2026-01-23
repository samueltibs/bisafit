import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Dumbbell, Timer, Flame, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';

const weeklyPlan = [
  { 
    id: 1, 
    day: 'Monday', 
    workout: 'Upper Body Strength', 
    duration: 45, 
    calories: 320,
    completed: true,
    type: 'strength'
  },
  { 
    id: 2, 
    day: 'Tuesday', 
    workout: 'HIIT Cardio', 
    duration: 30, 
    calories: 400,
    completed: true,
    type: 'cardio'
  },
  { 
    id: 3, 
    day: 'Wednesday', 
    workout: 'Lower Body Power', 
    duration: 50, 
    calories: 350,
    completed: true,
    type: 'strength'
  },
  { 
    id: 4, 
    day: 'Thursday', 
    workout: 'Active Recovery', 
    duration: 25, 
    calories: 150,
    completed: true,
    type: 'recovery'
  },
  { 
    id: 5, 
    day: 'Friday', 
    workout: 'Full Body Strength', 
    duration: 45, 
    calories: 380,
    completed: false,
    type: 'strength'
  },
  { 
    id: 6, 
    day: 'Saturday', 
    workout: 'Core & Abs', 
    duration: 30, 
    calories: 200,
    completed: false,
    type: 'core'
  },
  { 
    id: 7, 
    day: 'Sunday', 
    workout: 'Rest Day', 
    duration: 0, 
    calories: 0,
    completed: false,
    type: 'rest'
  },
];

const typeColors: Record<string, string> = {
  strength: 'bg-primary/10 text-primary',
  cardio: 'bg-energy/10 text-energy',
  recovery: 'bg-blue-500/10 text-blue-500',
  core: 'bg-purple-500/10 text-purple-500',
  rest: 'bg-muted text-muted-foreground',
};

export default function Plan() {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const goToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  return (
    <AppLayout>
      <div className="container space-y-6 px-4 py-6">
        {/* Week Navigation */}
        <div className="flex items-center justify-between animate-fade-in">
          <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h2 className="text-lg font-semibold">
              {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Week Overview */}
        <div className="flex justify-between gap-1 animate-slide-up">
          {weekDays.map((day, i) => (
            <div
              key={i}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg p-2 transition-all",
                isToday(day) && "bg-primary/10"
              )}
            >
              <span className="text-xs text-muted-foreground">{format(day, 'EEE')}</span>
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  isToday(day) ? "bg-primary text-primary-foreground" : ""
                )}
              >
                {format(day, 'd')}
              </span>
              {weeklyPlan[i]?.completed && (
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </div>
          ))}
        </div>

        {/* Weekly Workouts */}
        <div className="space-y-3 animate-slide-up">
          <h3 className="text-lg font-semibold">This Week's Plan</h3>
          
          {weeklyPlan.map((plan, index) => (
            <Link key={plan.id} to={plan.type !== 'rest' ? `/workout/${plan.id}` : '#'}>
              <Card
                className={cn(
                  "border-border transition-all",
                  plan.type !== 'rest' && "cursor-pointer hover:border-primary/50 hover:shadow-md",
                  plan.completed && "opacity-75"
                )}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl",
                      typeColors[plan.type]
                    )}
                  >
                    {plan.completed ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <Dumbbell className="h-6 w-6" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn("font-medium", plan.completed && "line-through")}>
                        {plan.workout}
                      </p>
                      {isToday(weekDays[index]) && (
                        <Badge variant="secondary" className="text-xs">Today</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.day}</p>
                  </div>
                  
                  {plan.type !== 'rest' && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Timer className="h-4 w-4" />
                        <span>{plan.duration}m</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Flame className="h-4 w-4" />
                        <span>{plan.calories}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
