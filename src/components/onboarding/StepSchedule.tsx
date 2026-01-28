import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Clock, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const PRESETS = [
  { label: '3 days', days: ['Monday', 'Wednesday', 'Friday'] },
  { label: '4 days', days: ['Monday', 'Tuesday', 'Thursday', 'Friday'] },
  { label: '5 days', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
];

const DURATION_OPTIONS = [30, 45, 60, 75, 90];
const BUFFER_OPTIONS = [0, 5, 10, 15];

export interface WorkoutTimePrefs {
  default_time: string;
  fallback_duration_minutes: number;
  buffer_minutes: number;
}

interface StepScheduleProps {
  daysPerWeek: number;
  sessionMinutes: number;
  workoutDays: string[];
  workoutTimePrefs?: WorkoutTimePrefs | null;
  onDaysChange: (value: number) => void;
  onSessionChange: (value: number) => void;
  onWorkoutDaysChange: (days: string[]) => void;
  onWorkoutTimePrefsChange?: (prefs: WorkoutTimePrefs | null) => void;
}

export function StepSchedule({
  daysPerWeek,
  sessionMinutes,
  workoutDays,
  workoutTimePrefs,
  onDaysChange,
  onSessionChange,
  onWorkoutDaysChange,
  onWorkoutTimePrefsChange,
}: StepScheduleProps) {
  const [timeOpen, setTimeOpen] = useState(false);

  const handleDayToggle = (day: string) => {
    if (workoutDays.includes(day)) {
      const newDays = workoutDays.filter(d => d !== day);
      onWorkoutDaysChange(newDays);
      onDaysChange(newDays.length);
    } else {
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

  const handleTimeChange = (time: string) => {
    const current = workoutTimePrefs || { default_time: '06:00', fallback_duration_minutes: 60, buffer_minutes: 5 };
    onWorkoutTimePrefsChange?.({ ...current, default_time: time });
  };

  const handleDurationChange = (value: string) => {
    const current = workoutTimePrefs || { default_time: '06:00', fallback_duration_minutes: 60, buffer_minutes: 5 };
    onWorkoutTimePrefsChange?.({ ...current, fallback_duration_minutes: parseInt(value, 10) });
  };

  const handleBufferChange = (value: string) => {
    const current = workoutTimePrefs || { default_time: '06:00', fallback_duration_minutes: 60, buffer_minutes: 5 };
    onWorkoutTimePrefsChange?.({ ...current, buffer_minutes: parseInt(value, 10) });
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
                  console.log('[StepSchedule] Preset tapped:', preset.label);
                }
                handlePresetClick(preset.days);
              }}
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
              className={cn(
                "flex-1 min-h-[44px]",
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
                    console.log('[StepSchedule] Day tapped:', day, 'isSelected:', isSelected);
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
                <span className="font-medium pointer-events-none">{day.slice(0, 3)}</span>
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

      {/* Workout Time Preferences (Optional/Collapsible) */}
      {onWorkoutTimePrefsChange && (
        <Collapsible open={timeOpen} onOpenChange={setTimeOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-between px-0 hover:bg-transparent"
              type="button"
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-base font-medium">Workout time (optional)</span>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                timeOpen && "rotate-180"
              )} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Set your preferred time for calendar events. You can change this anytime in Settings.
            </p>

            {/* Time Picker */}
            <div className="space-y-2">
              <Label htmlFor="onboarding-workout-time">When do you usually work out?</Label>
              <Input
                id="onboarding-workout-time"
                type="time"
                value={workoutTimePrefs?.default_time || '06:00'}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Fallback Duration */}
            <div className="space-y-2">
              <Label htmlFor="onboarding-duration">Default event duration</Label>
              <Select
                value={(workoutTimePrefs?.fallback_duration_minutes || 60).toString()}
                onValueChange={handleDurationChange}
              >
                <SelectTrigger id="onboarding-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((mins) => (
                    <SelectItem key={mins} value={mins.toString()}>
                      {mins} minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Buffer Time */}
            <div className="space-y-2">
              <Label htmlFor="onboarding-buffer">Setup/cooldown buffer</Label>
              <Select
                value={(workoutTimePrefs?.buffer_minutes || 5).toString()}
                onValueChange={handleBufferChange}
              >
                <SelectTrigger id="onboarding-buffer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUFFER_OPTIONS.map((mins) => (
                    <SelectItem key={mins} value={mins.toString()}>
                      {mins === 0 ? 'No buffer' : `${mins} minutes`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground text-center italic">
              You can change this anytime in Settings.
            </p>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
