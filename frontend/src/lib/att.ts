import { Capacitor } from '@capacitor/core';

let attRequested = false;

export async function requestATTIfNeeded() {
  if (attRequested) return;
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') return;
  
  try {
    // Dynamic import to avoid bundling issues on web
    const { AppTrackingTransparency } = await import('@capacitor-community/app-tracking-transparency');
    const status = await AppTrackingTransparency.getStatus();
    if (status.status === 'notDetermined') {
      await AppTrackingTransparency.requestPermission();
    }
    attRequested = true;
  } catch (err) {
    console.error('ATT request failed:', err);
  }
}
