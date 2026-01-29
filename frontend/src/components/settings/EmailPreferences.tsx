/**
 * Email Preferences Component
 * 
 * Allows users to configure their email notification preferences.
 * Transactional emails (receipts, account notices) always send.
 * Optional emails (product updates, store launch) can be toggled.
 */

import { useState, useEffect } from 'react';
import { Mail, Package, Megaphone, ShoppingBag, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const OPTIONAL_EMAIL_TYPES = [
  { 
    id: 'product_updates', 
    label: 'Product updates', 
    description: 'New features and improvements',
    icon: Megaphone 
  },
  { 
    id: 'store_launch', 
    label: 'Store notifications', 
    description: 'Get notified when our store launches',
    icon: ShoppingBag 
  },
] as const;

type OptionalEmailType = typeof OPTIONAL_EMAIL_TYPES[number]['id'];

export function EmailPreferences() {
  const { user } = useAuth();
  const [emailConsent, setEmailConsent] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<OptionalEmailType[]>([
    'product_updates',
    'store_launch',
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
        .select('email_consent, email_preferences_json')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setEmailConsent(data.email_consent ?? true);
        if (Array.isArray(data.email_preferences_json)) {
          setSelectedTypes(data.email_preferences_json as OptionalEmailType[]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch email preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const logPreferenceChange = async (
    previousConsent: boolean,
    newConsent: boolean,
    previousPrefs: OptionalEmailType[],
    newPrefs: OptionalEmailType[]
  ) => {
    if (!user) return;
    
    // Log via edge function to bypass RLS (service role required)
    try {
      await supabase.functions.invoke('log-email-preference', {
        body: {
          userId: user.id,
          previousEmailConsent: previousConsent,
          newEmailConsent: newConsent,
          previousPreferences: previousPrefs,
          newPreferences: newPrefs,
          changeSource: 'app',
        },
      });
    } catch (error) {
      console.error('Failed to log preference change:', error);
    }
  };

  const saveSettings = async (
    newConsent: boolean,
    newTypes: OptionalEmailType[]
  ) => {
    if (!user) return;

    const previousConsent = emailConsent;
    const previousTypes = [...selectedTypes];

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users_profile')
        .update({
          email_consent: newConsent,
          email_preferences_json: newTypes,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Log the change for compliance
      await logPreferenceChange(previousConsent, newConsent, previousTypes, newTypes);

      toast.success('Email preferences saved');
    } catch (error) {
      console.error('Failed to save email preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleConsent = async (value: boolean) => {
    setEmailConsent(value);
    await saveSettings(value, selectedTypes);
  };

  const handleToggleType = async (typeId: OptionalEmailType) => {
    const newTypes = selectedTypes.includes(typeId)
      ? selectedTypes.filter(t => t !== typeId)
      : [...selectedTypes, typeId];
    
    setSelectedTypes(newTypes);
    await saveSettings(emailConsent, newTypes);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Preferences
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
          <Mail className="h-5 w-5" />
          Email Preferences
        </CardTitle>
        <CardDescription>
          Choose which emails you'd like to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Transactional email notice */}
        <Alert className="border-muted bg-muted/30">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm text-muted-foreground">
            Transactional emails like receipts, trial notices, and account updates will always be sent.
          </AlertDescription>
        </Alert>

        {/* Master toggle for optional emails */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-consent" className="text-base font-medium">
              Receive optional emails
            </Label>
            <p className="text-sm text-muted-foreground">
              Get updates about new features and announcements
            </p>
          </div>
          <Switch
            id="email-consent"
            checked={emailConsent}
            onCheckedChange={handleToggleConsent}
            disabled={saving}
          />
        </div>

        {/* Optional email types */}
        <div className={`space-y-4 ${!emailConsent ? 'opacity-50 pointer-events-none' : ''}`}>
          <Label className="text-sm font-medium text-muted-foreground">
            Email types
          </Label>
          <div className="space-y-3">
            {OPTIONAL_EMAIL_TYPES.map(({ id, label, description, icon: Icon }) => (
              <label
                key={id}
                className="flex items-start gap-3 cursor-pointer group"
              >
                <Checkbox
                  checked={selectedTypes.includes(id)}
                  onCheckedChange={() => handleToggleType(id)}
                  disabled={!emailConsent || saving}
                  className="mt-0.5"
                />
                <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors mt-0.5" />
                <div className="flex-1">
                  <span className="text-sm font-medium">{label}</span>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
