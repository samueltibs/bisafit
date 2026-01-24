/**
 * Notification Settings Component
 * 
 * Allows users to configure their notification preferences.
 * Note: Notifications are only delivered via mobile app.
 */

import { useState, useEffect } from 'react';
import { Bell, Dumbbell, UtensilsCrossed, Clock, Megaphone, Smartphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const NOTIFICATION_TYPES = [
  { id: 'workout_reminders', label: 'Workout reminders', icon: Dumbbell },
  { id: 'meal_reminders', label: 'Meal reminders', icon: UtensilsCrossed },
  { id: 'trial_reminders', label: 'Trial reminders', icon: Clock },
  { id: 'general_updates', label: 'Product updates', icon: Megaphone },
] as const;

type NotificationType = typeof NOTIFICATION_TYPES[number]['id'];

export function NotificationSettings() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<NotificationType[]>([
    'workout_reminders',
    'meal_reminders',
    'trial_reminders',
    'general_updates',
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('notifications_enabled, notification_types_json')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setEnabled(data.notifications_enabled ?? false);
        if (Array.isArray(data.notification_types_json)) {
          setSelectedTypes(data.notification_types_json as NotificationType[]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (
    newEnabled: boolean,
    newTypes: NotificationType[]
  ) => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users_profile')
        .update({
          notifications_enabled: newEnabled,
          notification_types_json: newTypes,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Notification preferences saved');
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async (value: boolean) => {
    setEnabled(value);
    await saveSettings(value, selectedTypes);
  };

  const handleToggleType = async (typeId: NotificationType) => {
    const newTypes = selectedTypes.includes(typeId)
      ? selectedTypes.filter(t => t !== typeId)
      : [...selectedTypes, typeId];
    
    setSelectedTypes(newTypes);
    await saveSettings(enabled, newTypes);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
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
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
        <CardDescription>
          Manage how you receive updates and reminders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mobile app notice */}
        <Alert className="border-primary/20 bg-primary/5">
          <Smartphone className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            Notifications are available on the mobile app. You can change these anytime.
          </AlertDescription>
        </Alert>

        {/* Master toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications-enabled" className="text-base font-medium">
              Enable notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive reminders and updates
            </p>
          </div>
          <Switch
            id="notifications-enabled"
            checked={enabled}
            onCheckedChange={handleToggleEnabled}
            disabled={saving}
          />
        </div>

        {/* Notification types */}
        <div className={`space-y-4 ${!enabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <Label className="text-sm font-medium text-muted-foreground">
            Notification types
          </Label>
          <div className="space-y-3">
            {NOTIFICATION_TYPES.map(({ id, label, icon: Icon }) => (
              <label
                key={id}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <Checkbox
                  checked={selectedTypes.includes(id)}
                  onCheckedChange={() => handleToggleType(id)}
                  disabled={!enabled || saving}
                />
                <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
