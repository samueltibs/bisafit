import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Volume2, VolumeX, Maximize2, Minimize2, Tv, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkoutControlsProps {
  voiceEnabled: boolean;
  onVoiceToggle: (enabled: boolean) => void;
  voiceAvailable: boolean;
  bigModeEnabled: boolean;
  onBigModeToggle: (enabled: boolean) => void;
  tvModeEnabled?: boolean;
  onTVModeToggle?: (enabled: boolean) => void;
  onFullscreenToggle?: () => void;
  isFullscreen?: boolean;
  className?: string;
}

export function WorkoutControls({
  voiceEnabled,
  onVoiceToggle,
  voiceAvailable,
  bigModeEnabled,
  onBigModeToggle,
  tvModeEnabled,
  onTVModeToggle,
  onFullscreenToggle,
  isFullscreen,
  className,
}: WorkoutControlsProps) {
  return (
    <div className={cn("flex items-center gap-4 text-sm flex-wrap", className)}>
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

      {/* TV Mode Toggle */}
      {onTVModeToggle && (
        <div className="flex items-center gap-2">
          <Tv className={cn(
            "h-4 w-4",
            tvModeEnabled ? "text-primary" : "text-muted-foreground"
          )} />
          <Label htmlFor="tv-mode" className="text-xs font-normal cursor-pointer">
            TV
          </Label>
          <Switch
            id="tv-mode"
            checked={tvModeEnabled}
            onCheckedChange={onTVModeToggle}
            className="scale-75"
          />
        </div>
      )}

      {/* Fullscreen Button */}
      {onFullscreenToggle && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onFullscreenToggle}
          className="h-8 px-2 gap-1.5"
        >
          <Maximize className={cn(
            "h-4 w-4",
            isFullscreen ? "text-primary" : "text-muted-foreground"
          )} />
          <span className="text-xs">
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </span>
        </Button>
      )}
    </div>
  );
}
