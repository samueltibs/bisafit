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
      
      {/* Quick Presets */}
      <div className="flex gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(preset.days)}
            className={cn(
              "flex-1 text-xs",
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
      <div className="grid grid-cols-7 gap-1">
        {ALL_DAYS.map((day) => {
          const isSelected = workoutDays.includes(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDayToggle(day)}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg p-2 text-xs transition-all",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <span className="font-medium">{day.slice(0, 2)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
