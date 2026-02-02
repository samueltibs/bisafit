import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Clock, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { WorkoutDaysSelector } from '@/components/settings/WorkoutDaysSelector';
import { ActiveRestSelector } from '@/components/settings/ActiveRestSelector';
import { ActiveRestConfig, getDefaultActiveRestConfig } from '@/types/activeRest';

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
  activeRestConfig?: ActiveRestConfig;
  onDaysChange: (value: number) => void;
  onSessionChange: (value: number) => void;
  onWorkoutDaysChange: (days: string[]) => void;
  onWorkoutTimePrefsChange?: (prefs: WorkoutTimePrefs | null) => void;
  onActiveRestChange?: (config: ActiveRestConfig) => void;
}

export function StepSchedule({
  daysPerWeek,
  sessionMinutes,
  workoutDays,
  workoutTimePrefs,
  activeRestConfig,
  onDaysChange,
  onSessionChange,
  onWorkoutDaysChange,
  onWorkoutTimePrefsChange,
  onActiveRestChange,
}: StepScheduleProps) {
  const [timeOpen, setTimeOpen] = useState(false);
  const [activeRestOpen, setActiveRestOpen] = useState(false);

  // Initialize active rest config if not provided
  const currentActiveRestConfig = activeRestConfig || getDefaultActiveRestConfig();


  const handleWorkoutDaysChange = (days: string[]) => {
    if (import.meta.env.DEV) {
      console.log('[StepSchedule] handleWorkoutDaysChange called:', days);
    }
    onWorkoutDaysChange(days);
    onDaysChange(days.length);
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
    <div 
      className="space-y-8"
      style={{
        // Ensure no ancestor blocks pointer events
        pointerEvents: 'auto',
        touchAction: 'auto',
      }}
    >
      {/* Workout Days - Uses shared component from Settings */}
      <div className="relative" style={{ pointerEvents: 'auto' }}>
        <WorkoutDaysSelector
          workoutDays={workoutDays}
          onWorkoutDaysChange={handleWorkoutDaysChange}
        />
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

      {/* Active Rest Days (Optional/Collapsible) */}
      {onActiveRestChange && workoutDays.length < 7 && (
        <Collapsible open={activeRestOpen} onOpenChange={setActiveRestOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-between px-0 hover:bg-transparent"
              type="button"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🔄</span>
                <span className="text-base font-medium">Active rest days (optional)</span>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                activeRestOpen && "rotate-180"
              )} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Add light activities on rest days to stay active and aid recovery. These will be included in your workout plan.
            </p>
            <ActiveRestSelector
              workoutDays={workoutDays}
              config={currentActiveRestConfig}
              onChange={onActiveRestChange}
              showAISuggestions={true}
            />
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
