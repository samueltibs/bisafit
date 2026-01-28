import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const PRESETS = [
  { label: '3 days', days: ['Monday', 'Wednesday', 'Friday'] },
  { label: '4 days', days: ['Monday', 'Tuesday', 'Thursday', 'Friday'] },
  { label: '5 days', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
];

interface WorkoutDaysSelectorProps {
  workoutDays: string[];
  onWorkoutDaysChange: (days: string[]) => void;
}

export function WorkoutDaysSelector({
  workoutDays,
  onWorkoutDaysChange,
}: WorkoutDaysSelectorProps) {
  const handleDayToggle = (day: string) => {
    if (workoutDays.includes(day)) {
      const newDays = workoutDays.filter(d => d !== day);
      onWorkoutDaysChange(newDays);
    } else {
      const newDays = [...workoutDays, day].sort((a, b) => 
        ALL_DAYS.indexOf(a) - ALL_DAYS.indexOf(b)
      );
      onWorkoutDaysChange(newDays);
    }
  };

  const handlePresetClick = (presetDays: string[]) => {
    onWorkoutDaysChange(presetDays);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Workout Days</Label>
        <span className="text-sm font-medium text-primary">{workoutDays.length} days/week</span>
      </div>

      {/* Helper text about automatic updates */}
      <p className="text-sm text-muted-foreground">
        Changing your workout days will automatically update your plan.
      </p>
      
      {/* Quick Presets */}
      <div className="flex gap-2 relative z-10">
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (import.meta.env.DEV) {
                console.log('[WorkoutDaysSelector] Preset tapped:', preset.label);
              }
              handlePresetClick(preset.days);
            }}
            style={{
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
            className={cn(
              "flex-1 text-xs min-h-[44px]",
              workoutDays.length === preset.days.length && 
              preset.days.every(d => workoutDays.includes(d)) &&
              "border-primary bg-primary/10"
            )}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Day Selection Grid */}
      <div className="grid grid-cols-7 gap-1 relative z-10">
        {ALL_DAYS.map((day) => {
          const isSelected = workoutDays.includes(day);
          return (
            <button
              key={day}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (import.meta.env.DEV) {
                  console.log('[WorkoutDaysSelector] Day tapped:', day, 'isSelected:', isSelected);
                }
                handleDayToggle(day);
              }}
              style={{
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                WebkitUserSelect: 'none',
                userSelect: 'none',
                pointerEvents: 'auto',
              }}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg p-3 text-xs transition-all min-h-[44px] min-w-[44px]",
                isSelected
                  ? "bg-primary text-primary-foreground active:bg-primary/90"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 active:bg-muted/70"
              )}
            >
              <span className="font-medium pointer-events-none">{day.slice(0, 2)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
