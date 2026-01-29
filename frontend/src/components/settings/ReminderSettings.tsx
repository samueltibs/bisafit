/**
 * Reminder Settings Component
 * Configures intelligent workout reminders and streak protection
 */

import { useState, useEffect } from 'react';
import { Clock, Zap, Shield, Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ReminderPreferences {
  smart_reminders_enabled: boolean;
  streak_save_enabled: boolean;
  quick_win_suggestions: boolean;
}

const DEFAULT_PREFERENCES: ReminderPreferences = {
  smart_reminders_enabled: true,
  streak_save_enabled: true,
  quick_win_suggestions: true,
};

export function ReminderSettings() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<ReminderPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('notification_types_json')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Parse preferences from notification_types_json
      const types = data?.notification_types_json as string[] | null;
      if (types) {
        setPreferences({
          smart_reminders_enabled: types.includes('smart_reminders') || types.includes('workout_reminders'),
          streak_save_enabled: types.includes('streak_protection') || true,
          quick_win_suggestions: types.includes('quick_win') || true,
        });
      }
    } catch (error) {
      console.error('Failed to fetch reminder preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreference = async (key: keyof ReminderPreferences, value: boolean) => {
    if (!user) return;

    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    setSaving(true);

    try {
      // Build notification types array
      const notificationTypes: string[] = ['trial_reminders', 'general_updates'];
      
      if (newPreferences.smart_reminders_enabled) {
        notificationTypes.push('workout_reminders', 'smart_reminders');
      }
      if (newPreferences.streak_save_enabled) {
        notificationTypes.push('streak_protection');
      }
      if (newPreferences.quick_win_suggestions) {
        notificationTypes.push('quick_win', 'meal_reminders');
      }

      const { error } = await supabase
        .from('users_profile')
        .update({
          notification_types_json: notificationTypes,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Reminder preferences saved');
    } catch (error) {
      console.error('Failed to save reminder preferences:', error);
      toast.error('Failed to save preferences');
      // Revert on error
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  const handleSyncReminders = async () => {
    setSyncing(true);
    try {
      const { error } = await supabase.functions.invoke('schedule-notifications');
      if (error) throw error;
      toast.success('Reminders synced');
    } catch (error) {
      console.error('Failed to sync reminders:', error);
      toast.error('Failed to sync reminders');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Smart Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded" />
            <div className="h-24 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Smart Reminders
        </CardTitle>
        <CardDescription>
          Personalized reminders that adapt to your schedule
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Smart reminders toggle */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-medium">
                Time-aware reminders
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Get reminded based on your preferred workout time
            </p>
          </div>
          <Switch
            checked={preferences.smart_reminders_enabled}
            onCheckedChange={(v) => savePreference('smart_reminders_enabled', v)}
            disabled={saving}
          />
        </div>

        {/* Quick Win suggestions */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-medium">
                Quick Win suggestions
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Offer shorter workouts when you're short on time
            </p>
          </div>
          <Switch
            checked={preferences.quick_win_suggestions}
            onCheckedChange={(v) => savePreference('quick_win_suggestions', v)}
            disabled={saving}
          />
        </div>

        {/* Streak protection */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-medium">
                Streak protection
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Completing 10+ minutes or a Quick Win saves your streak
            </p>
          </div>
          <Switch
            checked={preferences.streak_save_enabled}
            onCheckedChange={(v) => savePreference('streak_save_enabled', v)}
            disabled={saving}
          />
        </div>

        {/* Info alert */}
        <Alert className="border-primary/20 bg-primary/5">
          <Bell className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            Reminders adapt to your coach tone and stop automatically when you complete a workout.
          </AlertDescription>
        </Alert>

        {/* Sync button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleSyncReminders}
          disabled={syncing}
        >
          {syncing ? 'Syncing...' : 'Sync Reminders Now'}
        </Button>
      </CardContent>
    </Card>
  );
}
