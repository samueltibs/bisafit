import { cn } from '@/lib/utils';
import { User, Target, Calendar, Dumbbell, Heart, Utensils } from 'lucide-react';

const steps = [
  { id: 1, title: 'About You', icon: User },
  { id: 2, title: 'Goals', icon: Target },
  { id: 3, title: 'Schedule', icon: Calendar },
  { id: 4, title: 'Equipment', icon: Dumbbell },
  { id: 5, title: 'Health', icon: Heart },
  { id: 6, title: 'Nutrition', icon: Utensils },
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
                'flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-all',
                currentStep >= step.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <step.icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-4 sm:w-8 mx-0.5 sm:mx-1',
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
