/**
 * Fitbit OAuth Service
 * Handles Fitbit authentication and data fetching
 */

const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

// PKCE helpers
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, Array.from(array)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(hash))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateState(): string {
  return generateCodeVerifier();
}

export interface FitbitActivity {
  id: string;
  source: 'fitbit';
  type: string;
  name: string;
  start_time: string;
  duration_minutes: number;
  calories: number;
  distance_meters?: number;
  avg_heart_rate?: number;
  steps?: number;
}

export class FitbitOAuthService {
  private static STORAGE_KEYS = {
    CODE_VERIFIER: 'fitbit_code_verifier',
    STATE: 'fitbit_state',
  };

  /**
   * Start Fitbit OAuth flow
   */
  static async startOAuthFlow(userId: string): Promise<void> {
    // Generate PKCE values
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateState();

    // Store for callback verification
    sessionStorage.setItem(this.STORAGE_KEYS.CODE_VERIFIER, codeVerifier);
    sessionStorage.setItem(this.STORAGE_KEYS.STATE, state);
    sessionStorage.setItem('fitbit_user_id', userId);

    // Get authorization URL from backend
    const response = await fetch(`${BACKEND_URL}/api/fitness/fitbit/auth-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state, code_challenge: codeChallenge }),
    });

    if (!response.ok) {
      throw new Error('Failed to get Fitbit authorization URL');
    }

    const { url } = await response.json();
    
    // Redirect to Fitbit
    window.location.href = url;
  }

  /**
   * Handle OAuth callback
   */
  static async handleCallback(code: string, state: string): Promise<{ success: boolean; profile?: string }> {
    // Verify state
    const storedState = sessionStorage.getItem(this.STORAGE_KEYS.STATE);
    if (!storedState || storedState !== state) {
      throw new Error('Invalid state parameter');
    }

    // Get code verifier
    const codeVerifier = sessionStorage.getItem(this.STORAGE_KEYS.CODE_VERIFIER);
    if (!codeVerifier) {
      throw new Error('Code verifier not found');
    }

    // Get user ID
    const userId = sessionStorage.getItem('fitbit_user_id');
    if (!userId) {
      throw new Error('User ID not found');
    }

    // Exchange code for tokens
    const response = await fetch(`${BACKEND_URL}/api/fitness/fitbit/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        state,
        code_verifier: codeVerifier,
        user_id: userId,
      }),
    });

    // Clean up session storage
    sessionStorage.removeItem(this.STORAGE_KEYS.CODE_VERIFIER);
    sessionStorage.removeItem(this.STORAGE_KEYS.STATE);
    sessionStorage.removeItem('fitbit_user_id');

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to connect Fitbit');
    }

    return response.json();
  }

  /**
   * Get Fitbit activities
   */
  static async getActivities(userId: string, date: string = 'today'): Promise<any> {
    const response = await fetch(`${BACKEND_URL}/api/fitness/fitbit/activities/${userId}?date=${date}`);
    
    if (!response.ok) {
      throw new Error('Failed to get Fitbit activities');
    }

    return response.json();
  }

  /**
   * Disconnect Fitbit
   */
  static async disconnect(userId: string): Promise<void> {
    const response = await fetch(`${BACKEND_URL}/api/fitness/disconnect/${userId}/fitbit`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to disconnect Fitbit');
    }
  }
}

export default FitbitOAuthService;
