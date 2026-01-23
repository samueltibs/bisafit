import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Flame, Dumbbell, Zap, Scale } from 'lucide-react';

const goals = [
  { value: 'fat_loss', label: 'Fat Loss', description: 'Burn fat and get lean', icon: Flame },
  { value: 'muscle_gain', label: 'Build Muscle', description: 'Gain strength and size', icon: Dumbbell },
  { value: 'endurance', label: 'Endurance', description: 'Improve stamina & cardio', icon: Zap },
  { value: 'maintenance', label: 'Maintenance', description: 'Maintain current fitness', icon: Scale },
];

const experienceLevels = [
  { value: 'beginner', label: 'Beginner', description: 'New to fitness or returning after a break' },
  { value: 'intermediate', label: 'Intermediate', description: '1-3 years of consistent training' },
  { value: 'advanced', label: 'Advanced', description: '3+ years of serious training' },
];

interface StepGoalsProps {
  goalPrimary: string;
  goalSecondary: string;
  experienceLevel: string;
  onGoalChange: (value: string) => void;
  onSecondaryGoalChange: (value: string) => void;
  onExperienceChange: (value: string) => void;
}

export function StepGoals({ 
  goalPrimary, 
  goalSecondary,
  experienceLevel, 
  onGoalChange, 
  onSecondaryGoalChange,
  onExperienceChange 
}: StepGoalsProps) {
  // Filter out primary goal from secondary options
  const secondaryGoalOptions = goals.filter(g => g.value !== goalPrimary);

  return (
    <div className="space-y-6">
      {/* Primary Goal */}
      <div className="space-y-3">
        <Label className="text-base font-medium">What's your primary goal?</Label>
        <RadioGroup value={goalPrimary} onValueChange={onGoalChange} className="grid grid-cols-2 gap-3">
          {goals.map((goal) => (
            <div
              key={goal.value}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all",
                goalPrimary === goal.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => onGoalChange(goal.value)}
            >
              <RadioGroupItem value={goal.value} id={goal.value} className="sr-only" />
              <goal.icon className={cn(
                "h-8 w-8",
                goalPrimary === goal.value ? "text-primary" : "text-muted-foreground"
              )} />
              <Label htmlFor={goal.value} className="cursor-pointer font-medium">
                {goal.label}
              </Label>
              <p className="text-xs text-muted-foreground">{goal.description}</p>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Secondary Goal - Optional */}
      {goalPrimary && (
        <div className="space-y-3 animate-fade-in">
          <div>
            <Label className="text-base font-medium">Secondary goal (optional)</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Helps tailor your conditioning and exercise variety
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {secondaryGoalOptions.map((goal) => (
              <button
                key={goal.value}
                type="button"
                onClick={() => onSecondaryGoalChange(goalSecondary === goal.value ? '' : goal.value)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                  goalSecondary === goal.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <goal.icon className="h-4 w-4" />
                {goal.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Experience Level */}
      <div className="space-y-3">
        <Label className="text-base font-medium">What's your experience level?</Label>
        <RadioGroup value={experienceLevel} onValueChange={onExperienceChange} className="space-y-2">
          {experienceLevels.map((level) => (
            <div
              key={level.value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-all",
                experienceLevel === level.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => onExperienceChange(level.value)}
            >
              <RadioGroupItem value={level.value} id={level.value} />
              <div>
                <Label htmlFor={level.value} className="cursor-pointer font-medium">
                  {level.label}
                </Label>
                <p className="text-sm text-muted-foreground">{level.description}</p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
