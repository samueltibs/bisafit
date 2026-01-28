/**
 * Apple Health Integration Hook
 * 
 * Manages Apple Health connection state, sync operations, and progress tracking.
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { useWorkoutLogs } from './useWorkoutLogs';
import { usePlatform } from './usePlatform';
import { 
  AppleHealthService, 
  type AppleHealthPermissions, 
  type AppleHealthConnectionStatus,
  type SyncProgress,
  type DailyStepsData,
} from '@/lib/appleHealthService';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';

export type ConnectionState = 
  | 'not_connected'
  | 'connected'
  | 'needs_permissions'
  | 'syncing'
  | 'error'
  | 'unavailable';

export interface UseAppleHealthReturn {
  // State
  connectionState: ConnectionState;
  isLoading: boolean;
  syncProgress: SyncProgress | null;
  lastSyncAt: Date | null;
  error: string | null;
  
  // Connection management
  startConnect: () => void;
  requestPermissions: (permissions: AppleHealthPermissions) => Promise<boolean>;
  disconnect: () => Promise<void>;
  
  // Sync
  syncNow: () => Promise<void>;
  
  // Settings
  openHealthSettings: () => Promise<void>;
  
  // Platform info
  isIOSNative: boolean;
  isAvailable: boolean;
  
  // Daily steps (from last sync)
  todaySteps: number | null;
}

export function useAppleHealth(): UseAppleHealthReturn {
  const { user } = useAuth();
  const { profile, update, refetch } = useUserProfile();
  const { importExternalWorkouts } = useWorkoutLogs();
  const { isIOS, isNativeApp } = usePlatform();
  
  const [connectionState, setConnectionState] = useState<ConnectionState>('not_connected');
  const [isLoading, setIsLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [todaySteps, setTodaySteps] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  const isIOSNative = isIOS && isNativeApp;
  const connected = (profile as any)?.apple_health_connected ?? false;
  const lastSyncAt = (profile as any)?.last_health_sync_at 
    ? new Date((profile as any).last_health_sync_at) 
    : null;

  // Check availability and update connection state
  useEffect(() => {
    async function checkStatus() {
      if (!isIOSNative) {
        setIsAvailable(false);
        setConnectionState(connected ? 'connected' : 'not_connected');
        return;
      }
      
      const available = await AppleHealthService.isAvailable();
      setIsAvailable(available);
      
      if (!available) {
        setConnectionState('unavailable');
        return;
      }
      
      if (connected) {
        const permissions = await AppleHealthService.getPermissionStatus();
        if (!permissions.steps && !permissions.workouts) {
          setConnectionState('needs_permissions');
        } else {
          setConnectionState('connected');
        }
      } else {
        setConnectionState('not_connected');
      }
    }
    
    checkStatus();
  }, [isIOSNative, connected]);

  // Start the connect flow (called from UI)
  const startConnect = useCallback(() => {
    setError(null);
    // The UI will handle showing the connect flow modal/sheet
    // This is just a hook for analytics
    trackEvent('apple_health_connect_started');
  }, []);

  // Request permissions from user
  const requestPermissions = useCallback(async (permissions: AppleHealthPermissions): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await AppleHealthService.requestPermissions(permissions);
      
      // Check if we got any permissions
      const hasPermissions = result.steps || result.workouts;
      
      if (hasPermissions) {
        // Mark as connected in profile
        await update({ apple_health_connected: true } as any);
        await refetch();
        
        setConnectionState('connected');
        trackEvent('apple_health_connected', { 
          has_steps: permissions.steps, 
          has_workouts: permissions.workouts 
        });
        
        return true;
      } else {
        setConnectionState('needs_permissions');
        setError('Please allow access to at least Steps or Workouts');
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request permissions';
      setError(message);
      setConnectionState('error');
      trackEvent('apple_health_connect_failed', { error: message });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [update, refetch]);

  // Disconnect from Apple Health
  const disconnect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await update({ 
        apple_health_connected: false,
        last_health_sync_at: null,
      } as any);
      await refetch();
      
      setConnectionState('not_connected');
      setTodaySteps(null);
      setSyncProgress(null);
      
      trackEvent('apple_health_disconnected');
      toast.success('Disconnected from Apple Health');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disconnect';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [update, refetch]);

  // Sync steps and workouts
  const syncNow = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    setConnectionState('syncing');
    setSyncProgress({
      phase: 'idle',
      message: 'Starting sync...',
      imported: 0,
      skipped: 0,
    });
    
    try {
      const endDate = new Date();
      const stepsStartDate = subDays(endDate, 7); // 7 days of steps
      const workoutsStartDate = subDays(endDate, 30); // 30 days of workouts
      
      // Sync steps
      setSyncProgress({
        phase: 'steps',
        message: 'Syncing steps...',
        imported: 0,
        skipped: 0,
      });
      
      const steps = await AppleHealthService.fetchDailySteps(stepsStartDate, endDate);
      
      // Save steps to daily_progress
      if (steps.length > 0) {
        await saveStepsToProgress(user.id, steps);
        
        // Get today's steps
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const todayData = steps.find(s => s.date === todayStr);
        if (todayData) {
          setTodaySteps(todayData.steps);
        }
      }
      
      // Sync workouts
      setSyncProgress({
        phase: 'workouts',
        message: 'Syncing workouts...',
        imported: steps.length,
        skipped: 0,
      });
      
      const workouts = await AppleHealthService.fetchWorkouts(workoutsStartDate, endDate);
      
      let importedCount = 0;
      let skippedCount = 0;
      
      if (workouts.length > 0) {
        const result = await importExternalWorkouts(workouts);
        importedCount = result.imported;
        skippedCount = result.skipped;
      }
      
      // Update last sync time
      await update({ last_health_sync_at: new Date().toISOString() } as any);
      await refetch();
      
      setSyncProgress({
        phase: 'complete',
        message: `Synced ${steps.length} days of steps and ${importedCount} workouts`,
        imported: importedCount,
        skipped: skippedCount,
      });
      
      setConnectionState('connected');
      
      trackEvent('apple_health_synced', {
        stepsCount: steps.length,
        workoutsImported: importedCount,
        workoutsSkipped: skippedCount,
      });
      
      if (importedCount > 0) {
        toast.success(`Imported ${importedCount} workout${importedCount !== 1 ? 's' : ''}`);
      } else if (skippedCount > 0) {
        toast.info(`${skippedCount} workout${skippedCount !== 1 ? 's' : ''} already synced`);
      } else {
        toast.success('Steps synced successfully');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      setError(message);
      setConnectionState('error');
      setSyncProgress({
        phase: 'error',
        message,
        imported: 0,
        skipped: 0,
      });
      
      trackEvent('apple_health_sync_failed', { error: message });
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [user, update, refetch, importExternalWorkouts]);

  // Open Health settings on iOS
  const openHealthSettings = useCallback(async () => {
    await AppleHealthService.openHealthSettings();
  }, []);

  return {
    connectionState,
    isLoading,
    syncProgress,
    lastSyncAt,
    error,
    startConnect,
    requestPermissions,
    disconnect,
    syncNow,
    openHealthSettings,
    isIOSNative,
    isAvailable,
    todaySteps,
  };
}

/**
 * Save steps data to daily_progress table
 */
async function saveStepsToProgress(userId: string, steps: DailyStepsData[]) {
  for (const day of steps) {
    const { error } = await supabase
      .from('daily_progress')
      .upsert({
        user_id: userId,
        date: day.date,
        // We don't overwrite other fields, just add steps to endurance_signals
        endurance_signals: { steps: day.steps, source: 'apple_health' },
      }, {
        onConflict: 'user_id,date',
      });
    
    if (error) {
      console.error('[AppleHealth] Failed to save steps:', error);
    }
  }
}

export default useAppleHealth;
