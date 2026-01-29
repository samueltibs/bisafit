import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Heart, Scale, Zap, Check } from 'lucide-react';
import { type CoachTone, TONE_OPTIONS } from '@/lib/coachTone';

interface StepCoachToneProps {
  coachTone: CoachTone;
  onToneChange: (tone: CoachTone) => void;
}

const TONE_ICONS: Record<CoachTone, React.ReactNode> = {
  gentle: <Heart className="h-6 w-6" />,
  balanced: <Scale className="h-6 w-6" />,
  direct: <Zap className="h-6 w-6" />,
};

const TONE_EXAMPLES: Record<CoachTone, string> = {
  gentle: '"Your workout is waiting for you whenever you\'re ready."',
  balanced: '"Today\'s workout is ready. Let\'s make it count."',
  direct: '"Workout ready. Time to get after it."',
};

export function StepCoachTone({ coachTone, onToneChange }: StepCoachToneProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">How do you like to be coached?</h2>
        <p className="text-muted-foreground">
          Choose your preferred coaching style. You can change this anytime in Settings.
        </p>
      </div>

      <div className="space-y-3">
        {TONE_OPTIONS.map((option) => {
          const isSelected = coachTone === option.value;
          return (
            <Card
              key={option.value}
              className={cn(
                'cursor-pointer transition-all duration-200',
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:border-primary/50'
              )}
              onClick={() => onToneChange(option.value)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-xl transition-colors',
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {TONE_ICONS[option.value]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{option.label}</h3>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {option.description}
                    </p>
                    <p className="text-xs text-muted-foreground/80 mt-2 italic">
                      {TONE_EXAMPLES[option.value]}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        All tones maintain a respectful, supportive voice — just with different energy levels.
      </p>
    </div>
  );
}
