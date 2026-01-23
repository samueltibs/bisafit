import { cn } from '@/lib/utils';
import { Target, Calendar, Dumbbell, Heart, Utensils } from 'lucide-react';

const steps = [
  { id: 1, title: 'Goals', icon: Target },
  { id: 2, title: 'Schedule', icon: Calendar },
  { id: 3, title: 'Equipment', icon: Dumbbell },
  { id: 4, title: 'Health', icon: Heart },
  { id: 5, title: 'Nutrition', icon: Utensils },
];

interface OnboardingProgressProps {
  currentStep: number;
}

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full transition-all',
                currentStep >= step.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <step.icon className="h-5 w-5" />
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-8 sm:w-12 mx-1',
                  currentStep > step.id ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>
      <div className="text-center">
        <span className="text-sm text-muted-foreground">
          Step {currentStep} of {steps.length}
        </span>
        <h2 className="text-lg font-semibold">{steps[currentStep - 1].title}</h2>
      </div>
    </div>
  );
}
