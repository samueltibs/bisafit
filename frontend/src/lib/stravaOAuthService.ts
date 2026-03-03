/**
 * Strava OAuth Service
 * Handles Strava authentication and data fetching
 */

const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, Array.from(array)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export interface StravaActivity {
  id: string;
  source: 'strava';
  type: string;
  name: string;
  start_time: string;
  duration_minutes: number;
  calories: number;
  distance_meters?: number;
  avg_heart_rate?: number;
  elevation_gain?: number;
}

export class StravaOAuthService {
  private static STORAGE_KEYS = {
    STATE: 'strava_state',
  };

  /**
   * Start Strava OAuth flow
   */
  static async startOAuthFlow(userId: string): Promise<void> {
    const state = generateState();

    // Store for callback verification
    sessionStorage.setItem(this.STORAGE_KEYS.STATE, state);
    sessionStorage.setItem('strava_user_id', userId);

    // Get authorization URL from backend
    const response = await fetch(`${BACKEND_URL}/api/fitness/strava/auth-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    });

    if (!response.ok) {
      throw new Error('Failed to get Strava authorization URL');
    }

    const { url } = await response.json();
    
    // Redirect to Strava
    window.location.href = url;
  }

  /**
   * Handle OAuth callback
   */
  static async handleCallback(code: string, state: string): Promise<{ success: boolean; profile?: string; athlete_id?: number }> {
    // Verify state
    const storedState = sessionStorage.getItem(this.STORAGE_KEYS.STATE);
    if (!storedState || storedState !== state) {
      throw new Error('Invalid state parameter');
    }

    // Get user ID
    const userId = sessionStorage.getItem('strava_user_id');
    if (!userId) {
      throw new Error('User ID not found');
    }

    // Exchange code for tokens
    const response = await fetch(`${BACKEND_URL}/api/fitness/strava/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        state,
        user_id: userId,
      }),
    });

    // Clean up session storage
    sessionStorage.removeItem(this.STORAGE_KEYS.STATE);
    sessionStorage.removeItem('strava_user_id');

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to connect Strava');
    }

    return response.json();
  }

  /**
   * Get Strava activities
   */
  static async getActivities(userId: string, page: number = 1, perPage: number = 30): Promise<{ activities: StravaActivity[] }> {
    const response = await fetch(
      `${BACKEND_URL}/api/fitness/strava/activities/${userId}?page=${page}&per_page=${perPage}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to get Strava activities');
    }

    return response.json();
  }

  /**
   * Disconnect Strava
   */
  static async disconnect(userId: string): Promise<void> {
    const response = await fetch(`${BACKEND_URL}/api/fitness/disconnect/${userId}/strava`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to disconnect Strava');
    }
  }
}

export default StravaOAuthService;
