/**
 * App Tracking Transparency (ATT) for iOS
 * 
 * Requests ATT permission on iOS 14+ native apps.
 * On web/Android, this is a no-op.
 */
import { Capacitor } from '@capacitor/core';

export async function requestATTIfNeeded(): Promise<void> {
  // Only request ATT on iOS native builds
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
    return;
  }
  try {
    const { AppTrackingTransparency } = await import('capacitor-plugin-app-tracking-transparency');
    const { status } = await AppTrackingTransparency.getStatus();
    if (status === 'notDetermined') {
      await AppTrackingTransparency.requestPermission();
    }
  } catch (err) {
    // Plugin not available (e.g. web build) - silently ignore
    console.warn('ATT plugin not available:', err);
  }
}
