import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, UserRound, Loader2 } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export type CoachVoice = 'male' | 'female';

const VOICE_OPTIONS: { value: CoachVoice; label: string; icon: typeof User }[] = [
  { value: 'female', label: 'Female', icon: UserRound },
  { value: 'male', label: 'Male', icon: User },
];

interface CoachVoiceSelectorProps {
  compact?: boolean;
}

export function CoachVoiceSelector({ compact = false }: CoachVoiceSelectorProps) {
  const { profile, update, loading } = useUserProfile();
  const [selectedVoice, setSelectedVoice] = useState<CoachVoice>('female');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile?.coach_voice) {
      setSelectedVoice(profile.coach_voice as CoachVoice);
    }
  }, [profile?.coach_voice]);

  const handleVoiceChange = async (value: CoachVoice) => {
    setSelectedVoice(value);
    setIsSaving(true);

    try {
      const success = await update({ coach_voice: value });
      if (success) {
        toast.success('Voice preference updated');
      } else {
        toast.error('Failed to update voice preference');
        setSelectedVoice(profile?.coach_voice as CoachVoice || 'female');
      }
    } catch (error) {
      toast.error('Failed to update voice preference');
      setSelectedVoice(profile?.coach_voice as CoachVoice || 'female');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Compact inline version for main settings
  if (compact) {
    return (
      <RadioGroup
        value={selectedVoice}
        onValueChange={(value) => handleVoiceChange(value as CoachVoice)}
        disabled={isSaving}
        className="flex gap-2"
      >
        {VOICE_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <div key={option.value}>
              <RadioGroupItem
                value={option.value}
                id={`voice-compact-${option.value}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`voice-compact-${option.value}`}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors',
                  selectedVoice === option.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-muted/50'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{option.label}</span>
                {isSaving && selectedVoice === option.value && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    );
  }

  // Full card version
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Coach Voice</CardTitle>
        <CardDescription>
          Choose the voice for workout timer announcements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedVoice}
          onValueChange={(value) => handleVoiceChange(value as CoachVoice)}
          disabled={isSaving}
          className="space-y-3"
        >
          {VOICE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <div key={option.value} className="flex items-center space-x-3">
                <RadioGroupItem value={option.value} id={`voice-${option.value}`} />
                <Label
                  htmlFor={`voice-${option.value}`}
                  className="flex flex-1 cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{option.label} voice</span>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
        {isSaving && (
          <p className="mt-2 text-sm text-muted-foreground">Saving...</p>
        )}
      </CardContent>
    </Card>
  );
}
