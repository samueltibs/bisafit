import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Flame, Dumbbell, Zap, Scale } from 'lucide-react';
import { useTranslation, type TranslationKey } from '@/lib/i18n';

const goals: { value: string; labelKey: TranslationKey; descKey: TranslationKey; icon: typeof Flame; colorClass: string; bgClass: string }[] = [
  { value: 'fat_loss', labelKey: 'goal.fatLoss', descKey: 'goal.fatLoss.desc', icon: Flame, colorClass: 'icon-fire', bgClass: 'icon-bg-fire' },
  { value: 'muscle_gain', labelKey: 'goal.muscleGain', descKey: 'goal.muscleGain.desc', icon: Dumbbell, colorClass: 'icon-workout', bgClass: 'icon-bg-workout' },
  { value: 'endurance', labelKey: 'goal.endurance', descKey: 'goal.endurance.desc', icon: Zap, colorClass: 'icon-energy', bgClass: 'icon-bg-energy' },
  { value: 'maintenance', labelKey: 'goal.maintenance', descKey: 'goal.maintenance.desc', icon: Scale, colorClass: 'icon-heart', bgClass: 'icon-bg-heart' },
];

const experienceLevels: { value: string; labelKey: TranslationKey; descKey: TranslationKey }[] = [
  { value: 'beginner', labelKey: 'experience.beginner', descKey: 'experience.beginner.desc' },
  { value: 'intermediate', labelKey: 'experience.intermediate', descKey: 'experience.intermediate.desc' },
  { value: 'advanced', labelKey: 'experience.advanced', descKey: 'experience.advanced.desc' },
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
  const { t } = useTranslation();
  
  // Filter out primary goal from secondary options
  const secondaryGoalOptions = goals.filter(g => g.value !== goalPrimary);

  return (
    <div className="space-y-6">
      {/* Primary Goal */}
      <div className="space-y-3">
        <Label className="text-base font-medium">{t('onboarding.primaryGoal')}</Label>
        <RadioGroup value={goalPrimary} onValueChange={onGoalChange} className="grid grid-cols-2 gap-3">
          {goals.map((goal) => (
            <div
              key={goal.value}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all",
                goalPrimary === goal.value
                  ? "border-foreground/30 bg-secondary"
                  : "border-border hover:border-foreground/20"
              )}
              onClick={() => onGoalChange(goal.value)}
            >
              <RadioGroupItem value={goal.value} id={goal.value} className="sr-only" />
              <goal.icon className={cn("h-8 w-8", goal.colorClass)} />
              <Label htmlFor={goal.value} className="cursor-pointer font-medium">
                {t(goal.labelKey)}
              </Label>
              <p className="text-xs text-muted-foreground">{t(goal.descKey)}</p>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Secondary Goal - Optional */}
      {goalPrimary && (
        <div className="space-y-3 animate-fade-in">
          <div>
            <Label className="text-base font-medium">{t('onboarding.secondaryGoal')} ({t('common.optional')})</Label>
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
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <goal.icon className={cn("h-4 w-4", goal.colorClass)} />
                {t(goal.labelKey)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Experience Level */}
      <div className="space-y-3">
        <Label className="text-base font-medium">{t('onboarding.experienceLevel')}</Label>
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
                  {t(level.labelKey)}
                </Label>
                <p className="text-sm text-muted-foreground">{t(level.descKey)}</p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
