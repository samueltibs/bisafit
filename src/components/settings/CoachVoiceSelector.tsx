import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, UserRound, Loader2 } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';

export type CoachVoice = 'male' | 'female';

const VOICE_OPTIONS: { value: CoachVoice; label: string; icon: typeof User }[] = [
  { value: 'female', label: 'Female voice', icon: UserRound },
  { value: 'male', label: 'Male voice', icon: User },
];

export function CoachVoiceSelector() {
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
        // Revert on failure
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
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

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
                  <span className="font-medium">{option.label}</span>
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
