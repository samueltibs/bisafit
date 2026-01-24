import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, Heart, Scale, Zap, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { type CoachTone, TONE_OPTIONS, normalizeCoachTone } from '@/lib/coachTone';
import { cn } from '@/lib/utils';

interface CoachToneSelectorProps {
  currentTone: CoachTone;
  onToneChange: (tone: CoachTone) => void;
}

const TONE_ICONS: Record<CoachTone, React.ReactNode> = {
  gentle: <Heart className="h-4 w-4" />,
  balanced: <Scale className="h-4 w-4" />,
  direct: <Zap className="h-4 w-4" />,
};

export function CoachToneSelector({ currentTone, onToneChange }: CoachToneSelectorProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [selectedTone, setSelectedTone] = useState<CoachTone>(currentTone);

  const handleToneChange = async (value: string) => {
    if (!user) return;
    
    const tone = normalizeCoachTone(value);
    setSelectedTone(tone);
    setSaving(true);

    try {
      const { error } = await supabase
        .from('users_profile')
        .update({ coach_tone: tone })
        .eq('id', user.id);

      if (error) throw error;

      onToneChange(tone);
      toast.success('Coach tone updated');
    } catch (error) {
      console.error('Failed to update coach tone:', error);
      toast.error('Failed to update coach tone');
      setSelectedTone(currentTone); // Revert on error
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Coach Tone</CardTitle>
          {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <CardDescription>
          Choose how your AI coach communicates with you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedTone}
          onValueChange={handleToneChange}
          className="space-y-3"
          disabled={saving}
        >
          {TONE_OPTIONS.map((option) => (
            <div
              key={option.value}
              className={cn(
                'flex items-center space-x-3 rounded-lg border p-3 transition-colors',
                selectedTone === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              )}
            >
              <RadioGroupItem value={option.value} id={`tone-${option.value}`} />
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg',
                  selectedTone === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {TONE_ICONS[option.value]}
              </div>
              <Label
                htmlFor={`tone-${option.value}`}
                className="flex-1 cursor-pointer"
              >
                <span className="font-medium">{option.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {option.description}
                </span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
