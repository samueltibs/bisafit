/**
 * Platform Detection Hook
 * 
 * Provides platform awareness for Capacitor native apps.
 * Detects whether running on web, iOS, or Android.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';

export type Platform = 'web' | 'ios' | 'android';

interface PlatformContextValue {
  platform: Platform;
  isNativeApp: boolean;
  isWebApp: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}

const PlatformContext = createContext<PlatformContextValue>({
  platform: 'web',
  isNativeApp: false,
  isWebApp: true,
  isIOS: false,
  isAndroid: false,
});

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [platformInfo, setPlatformInfo] = useState<PlatformContextValue>(() => {
    // Initial detection
    const platform = detectPlatform();
    return {
      platform,
      isNativeApp: platform !== 'web',
      isWebApp: platform === 'web',
      isIOS: platform === 'ios',
      isAndroid: platform === 'android',
    };
  });

  useEffect(() => {
    // Re-detect on mount to ensure accuracy
    const platform = detectPlatform();
    setPlatformInfo({
      platform,
      isNativeApp: platform !== 'web',
      isWebApp: platform === 'web',
      isIOS: platform === 'ios',
      isAndroid: platform === 'android',
    });
  }, []);

  return (
    <PlatformContext.Provider value={platformInfo}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform(): PlatformContextValue {
  return useContext(PlatformContext);
}

/**
 * Detect the current platform
 */
function detectPlatform(): Platform {
  if (!Capacitor.isNativePlatform()) {
    return 'web';
  }
  
  const platform = Capacitor.getPlatform();
  if (platform === 'ios') return 'ios';
  if (platform === 'android') return 'android';
  
  return 'web';
}

/**
 * Static platform check (for use outside React components)
 */
export function getPlatform(): Platform {
  return detectPlatform();
}

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}
