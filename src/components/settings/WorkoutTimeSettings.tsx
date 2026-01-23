import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Download, 
  CheckCircle2,
  Loader2,
  Timer,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePremiumFeature } from '@/hooks/usePremiumFeature';
import { PremiumFeatureModal } from '@/components/subscription';
import { 
  WorkoutTimePreferences, 
  parseTimePreferences, 
  formatTimeDisplay,
  downloadICSFile,
  WorkoutForCalendar,
  PlanForCalendar,
} from '@/lib/calendarUtils';

interface WorkoutTimeSettingsProps {
  preferences: WorkoutTimePreferences;
  calendarSyncEnabled: boolean;
  calendarProvider: 'google' | 'ics' | null;
  onPreferencesChange: (prefs: WorkoutTimePreferences) => void;
  onCalendarSyncChange: (enabled: boolean) => void;
  onCalendarProviderChange: (provider: 'google' | 'ics' | null) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
  currentPlanWorkouts?: WorkoutForCalendar[];
  currentPlan?: PlanForCalendar | null;
}

const DURATION_OPTIONS = [30, 45, 60, 75, 90];
const BUFFER_OPTIONS = [0, 5, 10, 15];

export function WorkoutTimeSettings({
  preferences,
  calendarSyncEnabled,
  calendarProvider,
  onPreferencesChange,
  onCalendarSyncChange,
  onCalendarProviderChange,
  onSave,
  isSaving,
  currentPlanWorkouts = [],
  currentPlan = null,
}: WorkoutTimeSettingsProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
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

  const handleBufferChange = (value: string) => {
    onPreferencesChange({ 
      ...preferences, 
      buffer_minutes: parseInt(value, 10) 
    });
  };

  const handleDownloadICS = async () => {
    // Gate calendar sync behind premium
    if (!checkPremiumAccess()) return;
    
    if (!currentPlan || currentPlanWorkouts.length === 0) {
      toast.error('No current plan with workouts to export');
      return;
    }

    setIsDownloading(true);
    try {
      downloadICSFile(currentPlanWorkouts, currentPlan, preferences);
      toast.success('Calendar file downloaded');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error) {
      console.error('ICS download error:', error);
      toast.error('Failed to generate calendar file');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveAndSync = async () => {
    await onSave();
    if (calendarSyncEnabled && calendarProvider === 'ics') {
      // Automatically offer download after saving
      toast.info('Tip: Download the calendar file to add workouts to your calendar');
    }
  };

  const workoutsWithSchedule = currentPlanWorkouts.filter(w => w.scheduled_date);

  return (
    <div className="space-y-4">
      {/* Workout Time Section */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Workout Time
          </CardTitle>
          <CardDescription>
            Set your preferred workout time for calendar events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Time Picker */}
          <div className="space-y-2">
            <Label htmlFor="workout-time">When do you usually work out?</Label>
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

          {/* Fallback Duration */}
          <div className="space-y-2">
            <Label htmlFor="fallback-duration">
              Default workout duration
            </Label>
            <Select
              value={preferences.fallback_duration_minutes.toString()}
              onValueChange={handleDurationChange}
            >
              <SelectTrigger id="fallback-duration">
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
              Used when workout estimate is unavailable
            </p>
          </div>

          {/* Buffer Time */}
          <div className="space-y-2">
            <Label htmlFor="buffer-time">Setup/cooldown buffer</Label>
            <Select
              value={preferences.buffer_minutes.toString()}
              onValueChange={handleBufferChange}
            >
              <SelectTrigger id="buffer-time">
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
            <p className="text-xs text-muted-foreground">
              Extra time added before/after workout
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Sync Section */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendar Integration
          </CardTitle>
          <CardDescription>
            Add your workouts as calendar events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="calendar-sync">Add workouts to my calendar</Label>
              <p className="text-xs text-muted-foreground">
                Create events for your current training block
              </p>
            </div>
            <Switch
              id="calendar-sync"
              checked={calendarSyncEnabled}
              onCheckedChange={(enabled) => {
                // Gate calendar sync toggle behind premium
                if (enabled && !checkPremiumAccess()) return;
                onCalendarSyncChange(enabled);
              }}
            />
          </div>

          {calendarSyncEnabled && (
            <>
              {/* ICS Download Option */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Timer className="h-4 w-4" />
                  <span>
                    {workoutsWithSchedule.length > 0
                      ? `${workoutsWithSchedule.length} workouts ready for calendar`
                      : 'No scheduled workouts in current block'}
                  </span>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDownloadICS}
                  disabled={isDownloading || workoutsWithSchedule.length === 0}
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

                <p className="text-xs text-muted-foreground text-center">
                  Import into Apple Calendar, Google Calendar, Outlook, etc.
                </p>

                {/* Google Calendar - Coming Soon */}
                <div className="pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    className="w-full opacity-60"
                    disabled
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Connect Google Calendar
                    <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">Soon</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Success Message */}
      {showSuccess && (
        <Alert className="border-primary/30 bg-primary/5">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <AlertDescription>
            <strong>Your workouts are now scheduled like real appointments.</strong>
            <br />
            <span className="text-muted-foreground">Consistency beats motivation.</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Save Button */}
      <Button 
        onClick={handleSaveAndSync} 
        disabled={isSaving}
        className="w-full"
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Schedule Settings'
        )}
      </Button>

      <PremiumFeatureModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
      />
    </div>
  );
}
