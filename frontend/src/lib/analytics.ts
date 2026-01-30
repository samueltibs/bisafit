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
  | 'workout_skipped'
  | 'workout_paused'
  | 'quick_win_started'
  | 'quick_win_completed'
  | 'nutrition_plan_generated'
  | 'ingredient_scan_used'
  | 'calendar_event_created'
  // Meal logging
  | 'meal_logged'
  | 'meal_photo_scanned'
  | 'meal_scan_error'
  | 'meal_log_deleted'
  | 'meal_log_updated'
  // Progress tracking
  | 'energy_level_logged'
  | 'personal_best_achieved'
  | 'streak_milestone'
  | 'streak_saved'
  | 'weight_logged'
  | 'measurement_logged'
  | 'photo_uploaded'
  // Notifications & Reminders
  | 'notification_scheduled'
  | 'notification_delivered'
  | 'notification_opened'
  | 'smart_reminder_shown'
  | 'reminder_preferences_updated'
  // Health platform integration
  | 'apple_health_connect_started'
  | 'apple_health_connected'
  | 'apple_health_connect_failed'
  | 'apple_health_disconnected'
  | 'apple_health_synced'
  | 'apple_health_sync_failed'
  // Navigation & Feature Usage (Beta Analytics)
  | 'page_viewed'
  | 'feature_used'
  | 'settings_changed'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'onboarding_abandoned'
  // Beta Feedback
  | 'beta_feedback_started'
  | 'beta_feedback_submitted'
  | 'beta_feedback_abandoned'
  // Session Analytics
  | 'session_started'
  | 'session_ended'
  | 'app_backgrounded'
  | 'app_foregrounded'
  // Errors & Quality
  | 'generation_error'
  | 'scan_error'
  | 'api_error'
  | 'ui_error';

export interface AnalyticsEventProperties {
  // Optional common properties
  plan_type?: 'monthly' | 'annual';
  cuisine_theme?: string;
  feature?: string;
  reason?: string;
  notification_type?: string;
  // Page tracking
  page_name?: string;
  previous_page?: string;
  // Session tracking
  session_duration_seconds?: number;
  // Beta feedback
  overall_rating?: number;
  would_recommend?: string;
  sections_completed?: number;
  // Workout tracking
  workout_id?: string;
  workout_name?: string;
  workout_duration_minutes?: number;
  exercises_completed?: number;
  // Error tracking
  error_type?: string;
  error_message?: string;
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

/**
 * Track page view - call this when navigating to a new page
 */
export function trackPageView(pageName: string, previousPage?: string): void {
  trackEvent('page_viewed', {
    page_name: pageName,
    previous_page: previousPage,
  });
}

/**
 * Track feature usage - call this when a user interacts with a feature
 */
export function trackFeatureUsage(featureName: string, additionalProps?: AnalyticsEventProperties): void {
  trackEvent('feature_used', {
    feature: featureName,
    ...additionalProps,
  });
}

/**
 * Track errors for debugging and quality monitoring
 */
export function trackError(errorType: string, errorMessage: string, additionalProps?: AnalyticsEventProperties): void {
  trackEvent('ui_error', {
    error_type: errorType,
    error_message: errorMessage.substring(0, 200), // Truncate long error messages
    ...additionalProps,
  });
}

// Session management for tracking app usage duration
let sessionStartTime: Date | null = null;

export function startSession(): void {
  sessionStartTime = new Date();
  trackEvent('session_started', {});
}

export function endSession(): void {
  if (sessionStartTime) {
    const durationSeconds = Math.round((new Date().getTime() - sessionStartTime.getTime()) / 1000);
    trackEvent('session_ended', {
      session_duration_seconds: durationSeconds,
    });
    sessionStartTime = null;
  }
}
