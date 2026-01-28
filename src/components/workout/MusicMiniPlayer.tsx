import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Play, 
  Pause, 
  SkipForward, 
  ChevronUp, 
  ChevronDown,
  Music,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { musicService, MusicProvider } from '@/lib/musicService';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface MusicMiniPlayerProps {
  provider: MusicProvider;
  playlistName?: string;
  isPlaying?: boolean;
  trackName?: string;
  artistName?: string;
  onClose?: () => void;
  className?: string;
}

/**
 * Collapsible mini music panel for active workouts.
 * Collapsed: provider icon, track name, play/pause
 * Expanded: track + artist, play/pause/next, change playlist
 */
export function MusicMiniPlayer({
  provider,
  playlistName,
  isPlaying = false,
  trackName,
  artistName,
  onClose,
  className,
}: MusicMiniPlayerProps) {
  const [expanded, setExpanded] = useState(false);
  const [localPlaying, setLocalPlaying] = useState(isPlaying);

  if (provider === 'none') return null;

  const getProviderIcon = () => {
    // Use generic music icon for now
    return <Music className="h-5 w-5" />;
  };

  const getProviderColor = () => {
    switch (provider) {
      case 'spotify': return 'text-[#1DB954]';
      case 'apple_music': return 'text-[#FA243C]';
      default: return 'text-primary';
    }
  };

  const handlePlayPause = async () => {
    try {
      if (localPlaying) {
        await musicService.pause();
        setLocalPlaying(false);
      } else {
        await musicService.resume();
        setLocalPlaying(true);
      }
    } catch (error) {
      console.log('[MusicMiniPlayer] Playback control error:', error);
    }
  };

  const handleNext = async () => {
    try {
      await musicService.next();
    } catch (error) {
      console.log('[MusicMiniPlayer] Next track error:', error);
    }
  };

  const handleOpenApp = () => {
    musicService.openProvider(provider);
  };

  return (
    <Card className={cn(
      "bg-card/80 backdrop-blur-sm border-border/40 overflow-hidden",
      className
    )}>
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger asChild>
          <CardContent className="py-2.5 px-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              {/* Provider icon */}
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full bg-muted",
                getProviderColor()
              )}>
                {getProviderIcon()}
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {trackName || playlistName || 'No track playing'}
                </p>
                {artistName && (
                  <p className="text-xs text-muted-foreground truncate">
                    {artistName}
                  </p>
                )}
              </div>

              {/* Quick play/pause */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayPause();
                }}
              >
                {localPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </Button>

              {/* Expand indicator */}
              {expanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="py-3 px-3 pt-0 border-t border-border/30">
            {/* Extended controls */}
            <div className="flex items-center justify-between">
              {/* Playback controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={handlePlayPause}
                >
                  {localPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={handleNext}
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>

              {/* Open in app */}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handleOpenApp}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open {provider === 'spotify' ? 'Spotify' : 'Apple Music'}
              </Button>
            </div>

            {/* Playlist info */}
            {playlistName && (
              <p className="mt-2 text-xs text-muted-foreground">
                Playlist: {playlistName}
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
