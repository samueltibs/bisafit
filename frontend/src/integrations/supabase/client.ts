import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { SecureStoragePlugin } from '@capacitor-community/secure-storage-plugin';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const isNative = Capacitor.isNativePlatform();

const secureStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    if (!isNative) {
      try { return localStorage.getItem(key); } catch { return null; }
    }
    try {
      const result = await SecureStoragePlugin.get({ key });
      return result.value;
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    if (!isNative) {
      try { localStorage.setItem(key, value); } catch {}
      return;
    }
    try { await SecureStoragePlugin.set({ key, value }); } catch {}
  },
  async removeItem(key: string): Promise<void> {
    if (!isNative) {
      try { localStorage.removeItem(key); } catch {}
      return;
    }
    try { await SecureStoragePlugin.remove({ key }); } catch {}
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStorageAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
