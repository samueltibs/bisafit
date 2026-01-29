/**
 * Workout Music Button
 * 
 * Displays a music control button during active workouts.
 * Shows now-playing info when available, or opens the music provider.
 */

import { useState } from 'react';
import { useMusicSettings } from '@/hooks/useMusicSettings';
import { musicService, type NowPlaying } from '@/lib/musicService';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Music, 
  Play, 
  Pause, 
  SkipForward, 
  ExternalLink,
  Volume2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkoutMusicButtonProps {
  className?: string;
  compact?: boolean;
}

export function WorkoutMusicButton({ className, compact = false }: WorkoutMusicButtonProps) {
  const { settings, openProviderApp } = useMusicSettings();
  const [isOpen, setIsOpen] = useState(false);
  
  // Get now playing info (currently placeholder)
  const nowPlaying = musicService.getNowPlaying();
  const hasProvider = settings.provider !== 'none';
  const isNativeImplemented = musicService.isNativeImplemented();

  // If no provider configured, don't show the button
  if (!hasProvider) {
    return null;
  }

  const handlePlayPause = async () => {
    if (nowPlaying?.isPlaying) {
      await musicService.pause();
    } else {
      await musicService.resume();
    }
  };

  const handleNext = async () => {
    await musicService.next();
  };

  const handleOpenProvider = () => {
    openProviderApp();
    setIsOpen(false);
  };

  const providerLabel = settings.provider === 'spotify' ? 'Spotify' : 'Apple Music';
  const providerIcon = settings.provider === 'spotify' ? '🟢' : '🎵';

  // Compact mode - just a simple button
  if (compact) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={openProviderApp}
        className={cn("relative", className)}
        title={`Open ${providerLabel}`}
      >
        <Music className="h-5 w-5" />
        {nowPlaying?.isPlaying && (
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
        )}
      </Button>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2",
            nowPlaying?.isPlaying && "border-primary/50",
            className
          )}
        >
          <Music className="h-4 w-4" />
          {nowPlaying ? (
            <span className="truncate max-w-[100px]">
              {nowPlaying.trackName}
            </span>
          ) : settings.playlistName ? (
            <span className="truncate max-w-[100px] text-muted-foreground">
              {settings.playlistName}
            </span>
          ) : (
            <span className="text-muted-foreground">Music</span>
          )}
          {nowPlaying?.isPlaying && (
            <Volume2 className="h-3 w-3 text-primary animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-3" align="end">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>{providerIcon}</span>
              <span className="font-medium text-sm">{providerLabel}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenProvider}
              className="h-8 px-2"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>

          {/* Now Playing or Playlist Info */}
          {nowPlaying ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {nowPlaying.albumArt ? (
                  <img
                    src={nowPlaying.albumArt}
                    alt="Album art"
                    className="h-12 w-12 rounded"
                  />
                ) : (
                  <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                    <Music className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{nowPlaying.trackName}</p>
                  <p className="text-xs text-muted-foreground truncate">{nowPlaying.artistName}</p>
                </div>
              </div>

              {/* Playback Controls (only when native is implemented) */}
              {isNativeImplemented && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePlayPause}
                    className="h-10 w-10"
                  >
                    {nowPlaying.isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    className="h-10 w-10"
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          ) : settings.playlistName ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                  <Music className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{settings.playlistName}</p>
                  <p className="text-xs text-muted-foreground">Default playlist</p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleOpenProvider}
              >
                <Play className="h-4 w-4 mr-2" />
                Open in {providerLabel}
              </Button>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">No playlist selected</p>
              <Button
                variant="link"
                size="sm"
                onClick={handleOpenProvider}
              >
                Open {providerLabel}
              </Button>
            </div>
          )}

          {/* Autoplay Status */}
          {settings.autoplay && settings.playlistName && (
            <p className="text-xs text-center text-muted-foreground border-t pt-2">
              ✓ Autoplay enabled for workouts
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
