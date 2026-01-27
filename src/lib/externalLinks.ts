/**
 * External Link Utilities
 * 
 * Handles opening external links appropriately based on platform.
 * On native apps, uses system browser. On web, uses default behavior.
 */

import { Browser } from '@capacitor/browser';
import { isNativePlatform } from '@/hooks/usePlatform';

/**
 * Open an external URL in the appropriate browser
 * - Native apps: Opens in system browser (Safari/Chrome)
 * - Web: Opens in new tab
 */
export async function openExternalLink(url: string): Promise<void> {
  if (isNativePlatform()) {
    try {
      await Browser.open({ url });
    } catch (error) {
      console.error('Failed to open browser:', error);
      // Fallback to window.open
      window.open(url, '_blank');
    }
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Open a mailto link
 * Works on both web and native platforms
 */
export async function openMailto(email: string, subject?: string): Promise<void> {
  const mailto = subject 
    ? `mailto:${email}?subject=${encodeURIComponent(subject)}`
    : `mailto:${email}`;
  
  if (isNativePlatform()) {
    try {
      await Browser.open({ url: mailto });
    } catch (error) {
      // Fallback for native
      window.location.href = mailto;
    }
  } else {
    window.location.href = mailto;
  }
}

/**
 * External link URLs for the app
 */
export const EXTERNAL_URLS = {
  privacyPolicy: 'https://bisafit.com/privacy',
  termsOfService: 'https://bisafit.com/terms',
} as const;
