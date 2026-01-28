/**
 * Music Settings Hook
 * 
 * Manages user music preferences with database persistence.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { musicService, type MusicProvider, type MusicSettings, type Playlist } from '@/lib/musicService';

export interface UseMusicSettingsReturn {
  settings: MusicSettings;
  loading: boolean;
  isNativeAvailable: boolean;
  playlists: Playlist[];
  loadingPlaylists: boolean;
  
  // Actions
  setProvider: (provider: MusicProvider) => Promise<boolean>;
  setAutoplay: (enabled: boolean) => Promise<boolean>;
  setShuffle: (enabled: boolean) => Promise<boolean>;
  setDefaultPlaylist: (playlistId: string | null, playlistName: string | null) => Promise<boolean>;
  connectProvider: (provider: MusicProvider) => Promise<{ success: boolean; error?: string }>;
  disconnectProvider: (provider: MusicProvider) => Promise<void>;
  refreshPlaylists: () => Promise<void>;
  openProviderApp: () => void;
}

export function useMusicSettings(): UseMusicSettingsReturn {
  const { user } = useAuth();
  const { profile, update, loading: profileLoading } = useUserProfile();
  
  const [settings, setSettings] = useState<MusicSettings>({
    provider: 'none',
    playlistId: null,
    playlistName: null,
    autoplay: false,
    shuffle: true,
  });
  
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);

  // Sync settings from profile
  useEffect(() => {
    if (profile) {
      const newSettings: MusicSettings = {
        provider: ((profile as any).music_provider as MusicProvider) || 'none',
        playlistId: (profile as any).music_playlist_id || null,
        playlistName: (profile as any).music_playlist_name || null,
        autoplay: (profile as any).music_autoplay ?? false,
        shuffle: (profile as any).music_shuffle ?? true,
      };
      
      setSettings(newSettings);
      musicService.updateSettings(newSettings);
    }
  }, [profile]);

  // Load playlists when provider changes
  useEffect(() => {
    if (settings.provider !== 'none') {
      refreshPlaylists();
    } else {
      setPlaylists([]);
    }
  }, [settings.provider]);

  const refreshPlaylists = useCallback(async () => {
    if (settings.provider === 'none') return;
    
    setLoadingPlaylists(true);
    try {
      const fetchedPlaylists = await musicService.getPlaylists(settings.provider);
      setPlaylists(fetchedPlaylists);
    } catch (error) {
      console.error('[useMusicSettings] Failed to fetch playlists:', error);
    } finally {
      setLoadingPlaylists(false);
    }
  }, [settings.provider]);

  const setProvider = useCallback(async (provider: MusicProvider): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const success = await update({
        music_provider: provider,
        // Clear playlist when changing provider
        music_playlist_id: null,
        music_playlist_name: null,
      } as any);
      
      if (success) {
        setSettings(prev => ({ 
          ...prev, 
          provider,
          playlistId: null,
          playlistName: null,
        }));
        musicService.updateSettings({ 
          provider,
          playlistId: null,
          playlistName: null,
        });
      }
      
      return success;
    } catch (error) {
      console.error('[useMusicSettings] Failed to update provider:', error);
      return false;
    }
  }, [user, update]);

  const setAutoplay = useCallback(async (enabled: boolean): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const success = await update({ music_autoplay: enabled } as any);
      
      if (success) {
        setSettings(prev => ({ ...prev, autoplay: enabled }));
        musicService.updateSettings({ autoplay: enabled });
      }
      
      return success;
    } catch (error) {
      console.error('[useMusicSettings] Failed to update autoplay:', error);
      return false;
    }
  }, [user, update]);

  const setShuffle = useCallback(async (enabled: boolean): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const success = await update({ music_shuffle: enabled } as any);
      
      if (success) {
        setSettings(prev => ({ ...prev, shuffle: enabled }));
        musicService.updateSettings({ shuffle: enabled });
      }
      
      return success;
    } catch (error) {
      console.error('[useMusicSettings] Failed to update shuffle:', error);
      return false;
    }
  }, [user, update]);

  const setDefaultPlaylist = useCallback(async (
    playlistId: string | null, 
    playlistName: string | null
  ): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const success = await update({
        music_playlist_id: playlistId,
        music_playlist_name: playlistName,
      } as any);
      
      if (success) {
        setSettings(prev => ({ ...prev, playlistId, playlistName }));
        musicService.setDefaultPlaylist(settings.provider, playlistId, playlistName);
      }
      
      return success;
    } catch (error) {
      console.error('[useMusicSettings] Failed to update default playlist:', error);
      return false;
    }
  }, [user, update, settings.provider]);

  const connectProvider = useCallback(async (provider: MusicProvider) => {
    return musicService.connect(provider);
  }, []);

  const disconnectProvider = useCallback(async (provider: MusicProvider) => {
    await musicService.disconnect(provider);
    await setProvider('none');
  }, [setProvider]);

  const openProviderApp = useCallback(() => {
    if (settings.provider !== 'none') {
      musicService.openProvider(settings.provider);
    }
  }, [settings.provider]);

  return {
    settings,
    loading: profileLoading,
    isNativeAvailable: musicService.isNativeAvailable(),
    playlists,
    loadingPlaylists,
    setProvider,
    setAutoplay,
    setShuffle,
    setDefaultPlaylist,
    connectProvider,
    disconnectProvider,
    refreshPlaylists,
    openProviderApp,
  };
}
