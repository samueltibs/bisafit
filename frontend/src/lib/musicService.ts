/**
 * Music Service
 * 
 * Provider-agnostic music playback service for workout integration.
 * Designed to work with Capacitor native plugins when available,
 * with graceful fallback to external links on web.
 */

import { isNativePlatform } from '@/hooks/usePlatform';
import { openExternalLink } from '@/lib/externalLinks';

export type MusicProvider = 'spotify' | 'apple_music' | 'none';

export interface MusicSettings {
  provider: MusicProvider;
  playlistId: string | null;
  playlistName: string | null;
  autoplay: boolean;
  shuffle: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  imageUrl?: string;
  trackCount?: number;
}

export interface NowPlaying {
  trackName: string;
  artistName: string;
  albumArt?: string;
  isPlaying: boolean;
  progress?: number; // 0-1
  duration?: number; // seconds
}

// Provider-specific external URLs
const PROVIDER_URLS: Record<MusicProvider, { app: string; web: string }> = {
  spotify: {
    app: 'spotify://',
    web: 'https://open.spotify.com',
  },
  apple_music: {
    app: 'music://',
    web: 'https://music.apple.com',
  },
  none: {
    app: '',
    web: '',
  },
};

// Workout-themed playlist suggestions (for placeholder UI)
export const SUGGESTED_PLAYLISTS: Record<MusicProvider, Playlist[]> = {
  spotify: [
    { id: 'workout-mix', name: 'Workout Mix', trackCount: 50 },
    { id: 'beast-mode', name: 'Beast Mode', trackCount: 75 },
    { id: 'power-workout', name: 'Power Workout', trackCount: 60 },
  ],
  apple_music: [
    { id: 'pure-workout', name: 'Pure Workout', trackCount: 40 },
    { id: 'fitness-hits', name: 'Fitness Hits', trackCount: 55 },
    { id: 'strength-training', name: 'Strength Training', trackCount: 45 },
  ],
  none: [],
};

class MusicService {
  private currentProvider: MusicProvider = 'none';
  private isConnected: boolean = false;
  private nowPlaying: NowPlaying | null = null;
  private settings: MusicSettings = {
    provider: 'none',
    playlistId: null,
    playlistName: null,
    autoplay: false,
    shuffle: true,
  };

  /**
   * Check if we're running in a native Capacitor environment
   * where native music plugins could be available
   */
  isNativeAvailable(): boolean {
    return isNativePlatform();
  }

  /**
   * Check if native music integration is implemented
   * (Currently false - placeholder for future Capacitor plugin)
   */
  isNativeImplemented(): boolean {
    // TODO: Check for actual Capacitor music plugin availability
    return false;
  }

  /**
   * Connect to a music provider
   * On native: would authenticate with provider's SDK
   * On web: opens the provider's app/website
   */
  async connect(provider: MusicProvider): Promise<{ success: boolean; error?: string }> {
    if (provider === 'none') {
      this.disconnect(this.currentProvider);
      return { success: true };
    }

    if (this.isNativeImplemented()) {
      // TODO: Implement native OAuth flow with Capacitor plugin
      // This would use @nicklockwood/capacitor-spotify or similar
      console.log(`[MusicService] Native connect to ${provider} - not yet implemented`);
      return { success: false, error: 'Native integration coming soon' };
    }

    // Web fallback: open provider's website for manual connection
    const urls = PROVIDER_URLS[provider];
    if (urls.web) {
      openExternalLink(urls.web);
    }
    
    // Mark as connected for UI purposes (user manually connected externally)
    this.currentProvider = provider;
    this.isConnected = true;
    
    return { success: true };
  }

  /**
   * Disconnect from a music provider
   */
  async disconnect(provider: MusicProvider): Promise<void> {
    if (this.isNativeImplemented()) {
      // TODO: Revoke native SDK tokens
      console.log(`[MusicService] Native disconnect from ${provider}`);
    }

    if (this.currentProvider === provider) {
      this.currentProvider = 'none';
      this.isConnected = false;
      this.nowPlaying = null;
    }
  }

  /**
   * Get user's playlists from the provider
   * On native: would fetch from provider's API
   * On web: returns placeholder suggestions
   */
  async getPlaylists(provider: MusicProvider): Promise<Playlist[]> {
    if (provider === 'none') {
      return [];
    }

    if (this.isNativeImplemented()) {
      // TODO: Fetch actual playlists via Capacitor plugin
      console.log(`[MusicService] Fetching playlists from ${provider}`);
      return [];
    }

    // Web fallback: return suggested playlists
    return SUGGESTED_PLAYLISTS[provider] || [];
  }

  /**
   * Set the default playlist for workout autoplay
   */
  setDefaultPlaylist(provider: MusicProvider, playlistId: string | null, playlistName: string | null): void {
    this.settings.playlistId = playlistId;
    this.settings.playlistName = playlistName;
    this.settings.provider = provider;
    
    console.log(`[MusicService] Default playlist set: ${playlistName} (${playlistId})`);
  }

  /**
   * Update music settings
   */
  updateSettings(settings: Partial<MusicSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Get current settings
   */
  getSettings(): MusicSettings {
    return { ...this.settings };
  }

  /**
   * Play the default playlist when a workout starts
   * Only triggers if autoplay is enabled
   */
  async playDefaultPlaylistOnWorkoutStart(): Promise<{ success: boolean; error?: string }> {
    if (!this.settings.autoplay) {
      console.log('[MusicService] Autoplay disabled, skipping');
      return { success: true };
    }

    if (this.settings.provider === 'none') {
      console.log('[MusicService] No provider configured');
      return { success: false, error: 'No music provider configured' };
    }

    if (!this.settings.playlistId) {
      console.log('[MusicService] No default playlist set');
      return { success: false, error: 'No default playlist set' };
    }

    if (this.isNativeImplemented()) {
      // TODO: Start playback via Capacitor plugin
      console.log(`[MusicService] Starting playback: ${this.settings.playlistName}`);
      return { success: true };
    }

    // Web fallback: open the playlist in the provider's app/website
    const playlistUrl = this.getPlaylistUrl(this.settings.provider, this.settings.playlistId);
    if (playlistUrl) {
      openExternalLink(playlistUrl);
      return { success: true };
    }

    return { success: false, error: 'Could not open playlist' };
  }

  /**
   * Pause playback
   */
  async pause(): Promise<void> {
    if (this.isNativeImplemented()) {
      // TODO: Pause via Capacitor plugin
      console.log('[MusicService] Pausing playback');
    }
    
    if (this.nowPlaying) {
      this.nowPlaying = { ...this.nowPlaying, isPlaying: false };
    }
  }

  /**
   * Resume playback
   */
  async resume(): Promise<void> {
    if (this.isNativeImplemented()) {
      // TODO: Resume via Capacitor plugin
      console.log('[MusicService] Resuming playback');
    }
    
    if (this.nowPlaying) {
      this.nowPlaying = { ...this.nowPlaying, isPlaying: true };
    }
  }

  /**
   * Skip to next track
   */
  async next(): Promise<void> {
    if (this.isNativeImplemented()) {
      // TODO: Skip via Capacitor plugin
      console.log('[MusicService] Skipping to next track');
    }
  }

  /**
   * Get current now playing info
   */
  getNowPlaying(): NowPlaying | null {
    if (this.isNativeImplemented()) {
      // TODO: Get actual now playing from Capacitor plugin
    }
    
    return this.nowPlaying;
  }

  /**
   * Check connection status
   */
  isProviderConnected(provider: MusicProvider): boolean {
    return this.currentProvider === provider && this.isConnected;
  }

  /**
   * Get the URL to open a specific playlist
   */
  private getPlaylistUrl(provider: MusicProvider, playlistId: string): string | null {
    switch (provider) {
      case 'spotify':
        return `https://open.spotify.com/playlist/${playlistId}`;
      case 'apple_music':
        return `https://music.apple.com/playlist/${playlistId}`;
      default:
        return null;
    }
  }

  /**
   * Open the music provider's app or website
   */
  openProvider(provider: MusicProvider): void {
    const urls = PROVIDER_URLS[provider];
    if (urls.web) {
      openExternalLink(urls.web);
    }
  }
}

// Singleton instance
export const musicService = new MusicService();

// Hook-friendly exports
export function useMusicServiceSettings(): MusicSettings {
  return musicService.getSettings();
}
