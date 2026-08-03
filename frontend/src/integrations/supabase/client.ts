import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration - these are embedded at build time
// IMPORTANT: For iOS/Android builds, run `npx cap sync` after building the web app
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// Fallback values for development/debugging - these won't work but prevent crashes
const FALLBACK_URL = 'https://placeholder.supabase.co';
const FALLBACK_KEY = 'placeholder-key';

// Validate Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing configuration. URL:', !!supabaseUrl, 'Key:', !!supabaseAnonKey);
  console.error('[Supabase] Ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in .env');
  // On iOS/native, this could crash the app - provide helpful error
  if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
    console.error('[Supabase] Native app detected but Supabase config missing. Ensure web app was built with correct .env before `npx cap sync`');
  }
}

// Simple localStorage-based storage adapter for web
// On native apps, Capacitor plugins handle secure storage differently
const webStorageAdapter = {
  getItem: (key: string): string | null => {
    try { 
      return localStorage.getItem(key); 
    } catch { 
      return null; 
    }
  },
  setItem: (key: string, value: string): void => {
    try { 
      localStorage.setItem(key, value); 
    } catch {}
  },
  removeItem: (key: string): void => {
    try { 
      localStorage.removeItem(key); 
    } catch {}
  },
};

// Use actual values or fallbacks to prevent crash on initialization
// The app will show errors on API calls if using fallbacks
export const supabase: SupabaseClient = createClient(
  supabaseUrl || FALLBACK_URL, 
  supabaseAnonKey || FALLBACK_KEY, 
  {
    auth: {
      storage: webStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
