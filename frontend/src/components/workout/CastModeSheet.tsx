import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tv, Maximize, Monitor, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CastModeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTVModeEnable: () => void;
  onFullscreen: () => void;
  isFullscreen: boolean;
}

/**
 * Sheet for cast/display options.
 * TV Mode uses the same data but with larger typography.
 * Prepared for future Chromecast/AirPlay integration.
 */
export function CastModeSheet({
  open,
  onOpenChange,
  onTVModeEnable,
  onFullscreen,
  isFullscreen,
}: CastModeSheetProps) {
  const handleTVMode = () => {
    onTVModeEnable();
    onOpenChange(false);
  };

  const handleFullscreen = () => {
    onFullscreen();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="text-lg">Display Options</SheetTitle>
        </SheetHeader>

        <div className="space-y-2 pb-safe">
          {/* TV Mode */}
          <Button
            variant="outline"
            className="w-full h-16 justify-start gap-4 px-4"
            onClick={handleTVMode}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Tv className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium">TV Mode</p>
              <p className="text-xs text-muted-foreground">
                Large display optimized for viewing from a distance
              </p>
            </div>
          </Button>

          {/* Fullscreen */}
          <Button
            variant="outline"
            className="w-full h-16 justify-start gap-4 px-4"
            onClick={handleFullscreen}
          >
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Maximize className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="font-medium">
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </p>
              <p className="text-xs text-muted-foreground">
                Expand to fill your screen
              </p>
            </div>
          </Button>

          {/* Chromecast placeholder */}
          <Button
            variant="outline"
            className="w-full h-16 justify-start gap-4 px-4 opacity-50"
            disabled
          >
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Monitor className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="font-medium">Cast to TV</p>
              <p className="text-xs text-muted-foreground">
                Coming soon with Chromecast & AirPlay
              </p>
            </div>
          </Button>

          {/* Mirror tip */}
          <div className="pt-4 flex items-start gap-3 text-xs text-muted-foreground">
            <Smartphone className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              Tip: You can also mirror your screen using your device's built-in screen mirroring or browser tab casting.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
