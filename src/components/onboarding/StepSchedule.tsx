import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const PRESETS = [
  { label: '3 days', days: ['Monday', 'Wednesday', 'Friday'] },
  { label: '4 days', days: ['Monday', 'Tuesday', 'Thursday', 'Friday'] },
  { label: '5 days', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
];

interface StepScheduleProps {
  daysPerWeek: number;
  sessionMinutes: number;
  workoutDays: string[];
  onDaysChange: (value: number) => void;
  onSessionChange: (value: number) => void;
  onWorkoutDaysChange: (days: string[]) => void;
}

export function StepSchedule({
  daysPerWeek,
  sessionMinutes,
  workoutDays,
  onDaysChange,
  onSessionChange,
  onWorkoutDaysChange,
}: StepScheduleProps) {
  const handleDayToggle = (day: string) => {
    if (workoutDays.includes(day)) {
      // Remove the day
      const newDays = workoutDays.filter(d => d !== day);
      onWorkoutDaysChange(newDays);
      onDaysChange(newDays.length);
    } else {
      // Add the day
      const newDays = [...workoutDays, day].sort((a, b) => 
        ALL_DAYS.indexOf(a) - ALL_DAYS.indexOf(b)
      );
      onWorkoutDaysChange(newDays);
      onDaysChange(newDays.length);
    }
  };

  const handlePresetClick = (presetDays: string[]) => {
    onWorkoutDaysChange(presetDays);
    onDaysChange(presetDays.length);
  };

  return (
    <div className="space-y-8">
      {/* Days Per Week Display */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Workout days</Label>
          <span className="text-2xl font-bold text-primary">{workoutDays.length} days</span>
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
                "flex-1",
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
                <span className="font-medium">{day.slice(0, 3)}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Tap days to toggle • {7 - workoutDays.length} rest day{7 - workoutDays.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Session Duration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Session duration</Label>
          <span className="text-2xl font-bold text-primary">{sessionMinutes} min</span>
        </div>
        <Slider
          value={[sessionMinutes]}
          onValueChange={([v]) => onSessionChange(v)}
          min={15}
          max={90}
          step={5}
          className="py-4"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>15 min</span>
          <span>90 min</span>
        </div>
      </div>
    </div>
  );
}
