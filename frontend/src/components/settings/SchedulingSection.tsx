import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Clock, Calendar, Bell, ChevronDown, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkoutDaysSelector } from './WorkoutDaysSelector';
import { usePremiumFeature } from '@/hooks/usePremiumFeature';
import { PremiumFeatureModal } from '@/components/subscription';
import { 
  WorkoutTimePreferences, 
  formatTimeDisplay,
  downloadICSFile,
  WorkoutForCalendar,
  PlanForCalendar,
} from '@/lib/calendarUtils';
import { trackEvent } from '@/lib/analytics';
import { toast } from 'sonner';

const DURATION_OPTIONS = [30, 45, 60, 75, 90];

interface SchedulingSectionProps {
  workoutDays: string[];
  onWorkoutDaysChange: (days: string[]) => void;
  preferences: WorkoutTimePreferences;
  onPreferencesChange: (prefs: WorkoutTimePreferences) => void;
  calendarSyncEnabled: boolean;
  onCalendarSyncChange: (enabled: boolean) => void;
  notificationsEnabled: boolean;
  onNotificationsChange: (enabled: boolean) => void;
  currentPlanWorkouts?: WorkoutForCalendar[];
  currentPlan?: PlanForCalendar | null;
}

export function SchedulingSection({
  workoutDays,
  onWorkoutDaysChange,
  preferences,
  onPreferencesChange,
  calendarSyncEnabled,
  onCalendarSyncChange,
  notificationsEnabled,
  onNotificationsChange,
  currentPlanWorkouts = [],
  currentPlan = null,
}: SchedulingSectionProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { showModal: showPremiumModal, setShowModal: setShowPremiumModal, checkPremiumAccess } = usePremiumFeature();

  const handleTimeChange = (time: string) => {
    onPreferencesChange({ ...preferences, default_time: time });
  };

  const handleDurationChange = (value: string) => {
    onPreferencesChange({ 
      ...preferences, 
      fallback_duration_minutes: parseInt(value, 10) 
    });
  };

  const handleDownloadICS = async () => {
    if (!checkPremiumAccess()) return;
    
    if (!currentPlan || currentPlanWorkouts.length === 0) {
      toast.error('No current plan with workouts to export');
      return;
    }

    setIsDownloading(true);
    try {
      downloadICSFile(currentPlanWorkouts, currentPlan, preferences);
      trackEvent('calendar_event_created');
      toast.success('Calendar file downloaded');
    } catch (error) {
      console.error('ICS download error:', error);
      toast.error('Failed to generate calendar file');
    } finally {
      setIsDownloading(false);
    }
  };

  const workoutsWithSchedule = currentPlanWorkouts.filter(w => w.scheduled_date);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        <Label className="text-base font-semibold">When do you want to work out?</Label>
      </div>

      {/* Workout Days */}
      <WorkoutDaysSelector
        workoutDays={workoutDays}
        onWorkoutDaysChange={onWorkoutDaysChange}
      />

      {/* Preferred Time */}
      <div className="space-y-2">
        <Label htmlFor="workout-time">Preferred workout time</Label>
        <Input
          id="workout-time"
          type="time"
          value={preferences.default_time}
          onChange={(e) => handleTimeChange(e.target.value)}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Currently set to {formatTimeDisplay(preferences.default_time)}
        </p>
      </div>

      {/* Calendar Sync Toggle */}
      <div className="flex items-center justify-between py-2 border-t border-border">
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <Label htmlFor="calendar-sync" className="text-sm font-medium">Add to calendar</Label>
            <p className="text-xs text-muted-foreground">Sync workouts to your calendar</p>
          </div>
        </div>
        <Switch
          id="calendar-sync"
          checked={calendarSyncEnabled}
          onCheckedChange={(enabled) => {
            if (enabled && !checkPremiumAccess()) return;
            onCalendarSyncChange(enabled);
          }}
        />
      </div>

      {/* Download ICS when calendar sync is enabled */}
      {calendarSyncEnabled && workoutsWithSchedule.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleDownloadICS}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download Calendar (.ics)
            </>
          )}
        </Button>
      )}

      {/* Workout Reminders Toggle */}
      <div className="flex items-center justify-between py-2 border-t border-border">
        <div className="flex items-center gap-3">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <div>
            <Label htmlFor="workout-reminders" className="text-sm font-medium">Workout reminders</Label>
            <p className="text-xs text-muted-foreground">Get notified before workouts</p>
          </div>
        </div>
        <Switch
          id="workout-reminders"
          checked={notificationsEnabled}
          onCheckedChange={onNotificationsChange}
        />
      </div>

      {/* Advanced Options (Collapsible) */}
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <span>Advanced options</span>
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            isAdvancedOpen && "rotate-180"
          )} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          {/* Workout Duration */}
          <div className="space-y-2">
            <Label htmlFor="fallback-duration" className="text-sm">Default workout duration</Label>
            <Select
              value={preferences.fallback_duration_minutes.toString()}
              onValueChange={handleDurationChange}
            >
              <SelectTrigger id="fallback-duration" className="w-full">
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
            <p className="text-xs text-muted-foreground">
              Used for calendar events when workout estimate is unavailable
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <PremiumFeatureModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
      />
    </div>
  );
}
