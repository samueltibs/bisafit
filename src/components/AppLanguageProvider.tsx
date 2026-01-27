/**
 * App Language Provider
 * 
 * Wraps the app with LanguageProvider, fetching the user's language preference
 * from the profile. This must be placed inside AuthProvider.
 */

import React from 'react';
import { LanguageProvider } from '@/lib/i18n';
import { useUserProfile } from '@/hooks/useUserProfile';

interface AppLanguageProviderProps {
  children: React.ReactNode;
}

export function AppLanguageProvider({ children }: AppLanguageProviderProps) {
  const { profile, loading } = useUserProfile();
  
  // Get stored language from profile, default to 'auto' while loading
  const storedLanguage = loading ? 'auto' : ((profile as any)?.language ?? 'auto');
  
  return (
    <LanguageProvider storedLanguage={storedLanguage}>
      {children}
    </LanguageProvider>
  );
}
