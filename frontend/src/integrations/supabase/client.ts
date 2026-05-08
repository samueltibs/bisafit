import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

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

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: webStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
