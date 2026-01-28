/**
 * Music Settings Component
 * 
 * Settings UI for music provider selection, autoplay toggle, and default playlist.
 */

import { useState } from 'react';
import { useMusicSettings } from '@/hooks/useMusicSettings';
import { type MusicProvider, type Playlist } from '@/lib/musicService';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  Music, 
  Shuffle, 
  Play, 
  ExternalLink,
  Loader2,
  ListMusic,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PROVIDER_OPTIONS: { value: MusicProvider; label: string; icon: string }[] = [
  { value: 'none', label: 'None', icon: '🔇' },
  { value: 'spotify', label: 'Spotify', icon: '🟢' },
  { value: 'apple_music', label: 'Apple Music', icon: '🎵' },
];

interface MusicSettingsProps {
  compact?: boolean;
}

export function MusicSettings({ compact = false }: MusicSettingsProps) {
  const {
    settings,
    loading,
    isNativeAvailable,
    playlists,
    loadingPlaylists,
    setProvider,
    setAutoplay,
    setShuffle,
    setDefaultPlaylist,
    openProviderApp,
  } = useMusicSettings();

  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [savingProvider, setSavingProvider] = useState(false);

  const handleProviderChange = async (provider: MusicProvider) => {
    setSavingProvider(true);
    try {
      const success = await setProvider(provider);
      if (success) {
        if (provider !== 'none') {
          toast.success(`${PROVIDER_OPTIONS.find(p => p.value === provider)?.label} selected`);
        }
      } else {
        toast.error('Failed to update music provider');
      }
    } finally {
      setSavingProvider(false);
    }
  };

  const handleAutoplayToggle = async (enabled: boolean) => {
    const success = await setAutoplay(enabled);
    if (success) {
      toast.success(enabled ? 'Autoplay enabled' : 'Autoplay disabled');
    } else {
      toast.error('Failed to update autoplay setting');
    }
  };

  const handleShuffleToggle = async (enabled: boolean) => {
    const success = await setShuffle(enabled);
    if (!success) {
      toast.error('Failed to update shuffle setting');
    }
  };

  const handlePlaylistSelect = async (playlist: Playlist) => {
    const success = await setDefaultPlaylist(playlist.id, playlist.name);
    if (success) {
      toast.success(`Default playlist set to "${playlist.name}"`);
      setPlaylistDialogOpen(false);
    } else {
      toast.error('Failed to set default playlist');
    }
  };

  const handleClearPlaylist = async () => {
    const success = await setDefaultPlaylist(null, null);
    if (success) {
      toast.success('Default playlist cleared');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const providerLabel = PROVIDER_OPTIONS.find(p => p.value === settings.provider)?.label || 'None';
  const hasProvider = settings.provider !== 'none';

  return (
    <div className="space-y-4">
      {/* Provider Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Music Provider</Label>
          {!isNativeAvailable && hasProvider && (
            <Badge variant="outline" className="text-xs">
              <Smartphone className="h-3 w-3 mr-1" />
              Web Mode
            </Badge>
          )}
        </div>
        
        <Select
          value={settings.provider}
          onValueChange={(value) => handleProviderChange(value as MusicProvider)}
          disabled={savingProvider}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select music provider">
              {savingProvider ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>{PROVIDER_OPTIONS.find(p => p.value === settings.provider)?.icon}</span>
                  {providerLabel}
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PROVIDER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <span className="flex items-center gap-2">
                  <span>{option.icon}</span>
                  {option.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!isNativeAvailable && hasProvider && (
          <p className="text-xs text-muted-foreground">
            On web, we'll open {providerLabel} for you. Native app integration coming soon!
          </p>
        )}
      </div>

      {hasProvider && (
        <>
          {/* Default Playlist */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Default Workout Playlist</Label>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="flex-1 justify-start"
                onClick={() => setPlaylistDialogOpen(true)}
              >
                <ListMusic className="h-4 w-4 mr-2 text-muted-foreground" />
                {settings.playlistName ? (
                  <span className="truncate">{settings.playlistName}</span>
                ) : (
                  <span className="text-muted-foreground">Select a playlist</span>
                )}
              </Button>
              
              {settings.playlistName && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearPlaylist}
                  className="shrink-0"
                >
                  ×
                </Button>
              )}
            </div>
          </div>

          {/* Autoplay Toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="music-autoplay" className="text-sm font-medium cursor-pointer">
                  Autoplay on Workout Start
                </Label>
                <p className="text-xs text-muted-foreground">
                  Automatically start music when you begin a workout
                </p>
              </div>
            </div>
            <Switch
              id="music-autoplay"
              checked={settings.autoplay}
              onCheckedChange={handleAutoplayToggle}
            />
          </div>

          {/* Shuffle Toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Shuffle className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="music-shuffle" className="text-sm font-medium cursor-pointer">
                Shuffle Playlist
              </Label>
            </div>
            <Switch
              id="music-shuffle"
              checked={settings.shuffle}
              onCheckedChange={handleShuffleToggle}
            />
          </div>

          {/* Open Provider Button */}
          {!compact && (
            <Button
              variant="outline"
              className="w-full"
              onClick={openProviderApp}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open {providerLabel}
            </Button>
          )}
        </>
      )}

      {/* Playlist Selection Dialog */}
      <Dialog open={playlistDialogOpen} onOpenChange={setPlaylistDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Workout Playlist</DialogTitle>
            <DialogDescription>
              Choose a playlist to play automatically when you start a workout.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {loadingPlaylists ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : playlists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Music className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No playlists available</p>
                <p className="text-xs mt-1">
                  Connect your {providerLabel} account to see your playlists
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={openProviderApp}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open {providerLabel}
                </Button>
              </div>
            ) : (
              playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => handlePlaylistSelect(playlist)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg text-left",
                    "hover:bg-muted/50 transition-colors",
                    settings.playlistId === playlist.id && "bg-primary/10 border border-primary/30"
                  )}
                >
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                    <Music className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{playlist.name}</p>
                    {playlist.trackCount && (
                      <p className="text-xs text-muted-foreground">
                        {playlist.trackCount} tracks
                      </p>
                    )}
                  </div>
                  {settings.playlistId === playlist.id && (
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
