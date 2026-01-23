import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Plus, Flame, Beef, Wheat, Droplets, Apple, Coffee, UtensilsCrossed, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

const nutritionTargets = {
  calories: { current: 1450, target: 2000, unit: 'kcal' },
  protein: { current: 85, target: 120, unit: 'g' },
  carbs: { current: 165, target: 250, unit: 'g' },
  fat: { current: 48, target: 65, unit: 'g' },
};

const meals = [
  {
    id: 1,
    type: 'Breakfast',
    icon: Coffee,
    time: '7:30 AM',
    items: [
      { name: 'Oatmeal with berries', calories: 320, protein: 12, carbs: 55, fat: 6 },
      { name: 'Greek yogurt', calories: 150, protein: 15, carbs: 8, fat: 5 },
    ],
  },
  {
    id: 2,
    type: 'Lunch',
    icon: UtensilsCrossed,
    time: '12:30 PM',
    items: [
      { name: 'Grilled chicken salad', calories: 450, protein: 35, carbs: 20, fat: 22 },
      { name: 'Whole grain bread', calories: 120, protein: 4, carbs: 22, fat: 2 },
    ],
  },
  {
    id: 3,
    type: 'Snack',
    icon: Apple,
    time: '3:30 PM',
    items: [
      { name: 'Protein shake', calories: 200, protein: 25, carbs: 10, fat: 3 },
    ],
  },
  {
    id: 4,
    type: 'Dinner',
    icon: Moon,
    time: 'Not logged',
    items: [],
  },
];

const macroColors = {
  protein: { bg: 'bg-blue-500/10', text: 'text-blue-500', bar: 'bg-blue-500' },
  carbs: { bg: 'bg-energy/10', text: 'text-energy', bar: 'bg-energy' },
  fat: { bg: 'bg-purple-500/10', text: 'text-purple-500', bar: 'bg-purple-500' },
};

export default function Nutrition() {
  const [selectedMeal, setSelectedMeal] = useState<number | null>(null);

  const calorieProgress = (nutritionTargets.calories.current / nutritionTargets.calories.target) * 100;

  return (
    <AppLayout>
      <div className="container space-y-6 px-4 py-6">
        {/* Calorie Overview */}
        <Card className="gradient-primary text-primary-foreground animate-slide-up">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Calories Today</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{nutritionTargets.calories.current}</span>
                  <span className="text-lg opacity-80">/ {nutritionTargets.calories.target}</span>
                </div>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-foreground/20">
                <Flame className="h-7 w-7" />
              </div>
            </div>
            <Progress value={calorieProgress} className="h-3 bg-primary-foreground/20" />
            <p className="mt-2 text-sm opacity-90">
              {nutritionTargets.calories.target - nutritionTargets.calories.current} kcal remaining
            </p>
          </CardContent>
        </Card>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-3 animate-slide-up">
          {Object.entries(nutritionTargets)
            .filter(([key]) => key !== 'calories')
            .map(([key, value]) => {
              const colors = macroColors[key as keyof typeof macroColors];
              const progress = (value.current / value.target) * 100;
              
              return (
                <Card key={key} className="border-border">
                  <CardContent className="p-4">
                    <div className={cn("mb-2 flex h-8 w-8 items-center justify-center rounded-lg", colors.bg)}>
                      {key === 'protein' && <Beef className={cn("h-4 w-4", colors.text)} />}
                      {key === 'carbs' && <Wheat className={cn("h-4 w-4", colors.text)} />}
                      {key === 'fat' && <Droplets className={cn("h-4 w-4", colors.text)} />}
                    </div>
                    <p className="text-xs capitalize text-muted-foreground">{key}</p>
                    <p className="text-lg font-bold">{value.current}g</p>
                    <Progress value={progress} className={cn("mt-2 h-1.5", colors.bar)} />
                    <p className="mt-1 text-xs text-muted-foreground">/ {value.target}g</p>
                  </CardContent>
                </Card>
              );
            })}
        </div>

        {/* Meals */}
        <div className="space-y-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Today's Meals</h2>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add Food
            </Button>
          </div>

          {meals.map((meal) => {
            const Icon = meal.icon;
            const totalCalories = meal.items.reduce((sum, item) => sum + item.calories, 0);
            
            return (
              <Card
                key={meal.id}
                className={cn(
                  "border-border cursor-pointer transition-all hover:border-primary/50",
                  selectedMeal === meal.id && "border-primary"
                )}
                onClick={() => setSelectedMeal(selectedMeal === meal.id ? null : meal.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                      <Icon className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{meal.type}</p>
                        <Badge variant="secondary" className="text-xs">
                          {meal.time}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {meal.items.length > 0
                          ? `${meal.items.length} items • ${totalCalories} kcal`
                          : 'Tap to log meal'}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>

                  {selectedMeal === meal.id && meal.items.length > 0 && (
                    <div className="mt-4 space-y-2 border-t pt-4">
                      {meal.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span>{item.name}</span>
                          <span className="text-muted-foreground">{item.calories} kcal</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Water Intake */}
        <Card className="border-border animate-slide-up">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Droplets className="h-5 w-5 text-blue-500" />
              Water Intake
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-8 w-6 rounded-md transition-all cursor-pointer",
                      i < 5 ? "bg-blue-500" : "bg-blue-500/20 hover:bg-blue-500/40"
                    )}
                  />
                ))}
              </div>
              <span className="text-lg font-bold">5/8 glasses</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
