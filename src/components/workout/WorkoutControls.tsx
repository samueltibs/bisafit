import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkoutControlsProps {
  voiceEnabled: boolean;
  onVoiceToggle: (enabled: boolean) => void;
  voiceAvailable: boolean;
  bigModeEnabled: boolean;
  onBigModeToggle: (enabled: boolean) => void;
  className?: string;
}

export function WorkoutControls({
  voiceEnabled,
  onVoiceToggle,
  voiceAvailable,
  bigModeEnabled,
  onBigModeToggle,
  className,
}: WorkoutControlsProps) {
  return (
    <div className={cn("flex items-center gap-4 text-sm", className)}>
      {/* Voice Cues Toggle */}
      <div className="flex items-center gap-2">
        {voiceEnabled ? (
          <Volume2 className="h-4 w-4 text-primary" />
        ) : (
          <VolumeX className="h-4 w-4 text-muted-foreground" />
        )}
        <Label htmlFor="voice-cues" className="text-xs font-normal cursor-pointer">
          Voice
        </Label>
        <Switch
          id="voice-cues"
          checked={voiceEnabled}
          onCheckedChange={onVoiceToggle}
          disabled={!voiceAvailable}
          className="scale-75"
        />
      </div>

      {/* Big Mode Toggle */}
      <div className="flex items-center gap-2">
        {bigModeEnabled ? (
          <Minimize2 className="h-4 w-4 text-primary" />
        ) : (
          <Maximize2 className="h-4 w-4 text-muted-foreground" />
        )}
        <Label htmlFor="big-mode" className="text-xs font-normal cursor-pointer">
          Big
        </Label>
        <Switch
          id="big-mode"
          checked={bigModeEnabled}
          onCheckedChange={onBigModeToggle}
          className="scale-75"
        />
      </div>
    </div>
  );
}
