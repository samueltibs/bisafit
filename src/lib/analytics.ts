import { supabase } from '@/integrations/supabase/client';

// App version from package.json or build
const APP_VERSION = '1.0.0';

// Allowed event names for type safety
export type AnalyticsEventName =
  // Activation
  | 'signup_completed'
  | 'profile_completed'
  | 'plan_preview_viewed'
  | 'trial_started'
  | 'paywall_viewed'
  // Engagement
  | 'workout_started'
  | 'workout_completed'
  | 'nutrition_plan_generated'
  | 'ingredient_scan_used'
  | 'calendar_event_created'
  // Meal logging
  | 'meal_logged'
  | 'meal_photo_scanned'
  | 'meal_scan_error'
  | 'meal_log_deleted'
  | 'meal_log_updated'
  // Notifications
  | 'notification_scheduled'
  | 'notification_delivered'
  | 'notification_opened'
  // Quality
  | 'generation_error'
  | 'scan_error';

export interface AnalyticsEventProperties {
  // Optional common properties
  plan_type?: 'monthly' | 'annual';
  cuisine_theme?: string;
  feature?: string;
  reason?: string;
  notification_type?: string;
  // Allow additional custom properties
  [key: string]: string | number | boolean | undefined;
}

/**
 * Track an analytics event with automatic user_id, platform, app_version, and timestamp.
 * Fire-and-forget: does not block the UI.
 * Note: Never log PII (no raw health records, no full image data).
 */
export async function trackEvent(
  name: AnalyticsEventName,
  props: AnalyticsEventProperties = {}
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Don't track events for unauthenticated users
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] Skipped (no user):', name, props);
      }
      return;
    }

    const eventData = {
      user_id: user.id,
      event_name: name,
      platform: 'web' as const,
      properties: {
        ...props,
        app_version: APP_VERSION,
        timestamp: new Date().toISOString(),
      },
    };

    // Fire and forget - don't await in production
    const insertPromise = supabase
      .from('analytics_events')
      .insert(eventData);

    if (process.env.NODE_ENV === 'development') {
      const { error } = await insertPromise;
      if (error) {
        console.error('[Analytics] Error:', error.message);
      } else {
        console.log('[Analytics] Tracked:', name, props);
      }
    }
  } catch (err) {
    // Silent fail - analytics should never break the app
    if (process.env.NODE_ENV === 'development') {
      console.error('[Analytics] Exception:', err);
    }
  }
}

/**
 * Fetch recent events for the current user (dev/debug only)
 */
export async function getRecentEvents(limit = 20) {
  const { data, error } = await supabase
    .from('analytics_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Analytics] Fetch error:', error.message);
    return [];
  }

  return data || [];
}
