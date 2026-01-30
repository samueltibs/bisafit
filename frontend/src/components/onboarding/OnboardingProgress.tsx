import { cn } from '@/lib/utils';
import { User, Target, Calendar, Dumbbell, Heart, Utensils, MessageSquare } from 'lucide-react';

const steps = [
  { id: 1, title: 'About You', icon: User, colorClass: 'icon-water' },
  { id: 2, title: 'Goals', icon: Target, colorClass: 'icon-fire' },
  { id: 3, title: 'Schedule', icon: Calendar, colorClass: 'icon-calendar' },
  { id: 4, title: 'Equipment', icon: Dumbbell, colorClass: 'icon-workout' },
  { id: 5, title: 'Health', icon: Heart, colorClass: 'icon-heart' },
  { id: 6, title: 'Nutrition', icon: Utensils, colorClass: 'icon-nutrition' },
  { id: 7, title: 'Coach Style', icon: MessageSquare, colorClass: 'icon-energy' },
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
                  ? 'bg-secondary'
                  : 'bg-muted'
              )}
            >
              <step.icon className={cn(
                "h-4 w-4 sm:h-5 sm:w-5",
                currentStep >= step.id ? step.colorClass : 'text-muted-foreground'
              )} />
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-4 sm:w-8 mx-0.5 sm:mx-1',
                  currentStep > step.id ? 'bg-foreground/30' : 'bg-muted'
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
