import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, RefreshCw, Smartphone, Watch, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWorkoutLogs } from '@/hooks/useWorkoutLogs';
import { usePlatform } from '@/hooks/usePlatform';
import {
  isIOSPlatform,
  isAndroidPlatform,
  requestAppleHealthPermissions,
  requestGoogleFitPermissions,
  syncExternalWorkouts,
} from '@/lib/healthPlatforms';
import { subDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface HealthPlatformSettingsProps {
  compact?: boolean;
}

export function HealthPlatformSettings({ compact = false }: HealthPlatformSettingsProps) {
  const { profile, update, refetch } = useUserProfile();
  const { importExternalWorkouts } = useWorkoutLogs();
  const { platform } = usePlatform();
  
  const [isConnectingApple, setIsConnectingApple] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const appleHealthConnected = (profile as any)?.apple_health_connected ?? false;
  const googleFitConnected = (profile as any)?.google_fit_connected ?? false;
  const lastSyncAt = (profile as any)?.last_health_sync_at;

  const isNative = platform === 'ios' || platform === 'android';

  const handleConnectAppleHealth = async () => {
    setIsConnectingApple(true);
    try {
      const status = await requestAppleHealthPermissions();
      
      if (status.authorized) {
        await update({ apple_health_connected: true } as any);
        await refetch();
        toast.success('Connected to Apple Health');
      } else {
        // For web preview, show info message
        if (!isIOSPlatform()) {
          toast.info('Apple Health is only available on iOS devices. Install the app to connect.');
        } else {
          toast.error('Permission denied. Please allow access in Settings.');
        }
      }
    } catch (error) {
      console.error('Apple Health connection error:', error);
      toast.error('Failed to connect to Apple Health');
    } finally {
      setIsConnectingApple(false);
    }
  };

  const handleConnectGoogleFit = async () => {
    setIsConnectingGoogle(true);
    try {
      const status = await requestGoogleFitPermissions();
      
      if (status.authorized) {
        await update({ google_fit_connected: true } as any);
        await refetch();
        toast.success('Connected to Google Fit');
      } else {
        // For web preview, show info message
        if (!isAndroidPlatform()) {
          toast.info('Google Fit is only available on Android devices. Install the app to connect.');
        } else {
          toast.error('Permission denied. Please allow access in Settings.');
        }
      }
    } catch (error) {
      console.error('Google Fit connection error:', error);
      toast.error('Failed to connect to Google Fit');
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleDisconnect = async (platform: 'apple' | 'google') => {
    try {
      if (platform === 'apple') {
        await update({ apple_health_connected: false } as any);
        toast.success('Disconnected from Apple Health');
      } else {
        await update({ google_fit_connected: false } as any);
        toast.success('Disconnected from Google Fit');
      }
      await refetch();
    } catch (error) {
      toast.error('Failed to disconnect');
    }
  };

  const handleSyncWorkouts = async () => {
    if (!appleHealthConnected && !googleFitConnected) {
      toast.error('No health platforms connected');
      return;
    }

    setIsSyncing(true);
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, 30); // Sync last 30 days

      const workouts = await syncExternalWorkouts(startDate, endDate);
      
      if (workouts.length === 0) {
        toast.info('No new workouts found');
      } else {
        const result = await importExternalWorkouts(workouts);
        
        await update({ last_health_sync_at: new Date().toISOString() } as any);
        await refetch();

        if (result.imported > 0) {
          toast.success(`Imported ${result.imported} workout${result.imported !== 1 ? 's' : ''}`);
        }
        if (result.skipped > 0) {
          toast.info(`Skipped ${result.skipped} duplicate${result.skipped !== 1 ? 's' : ''}`);
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync workouts');
    } finally {
      setIsSyncing(false);
    }
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Apple Health */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Watch className="h-4 w-4 text-primary" />
            <span className="text-sm">Apple Health</span>
          </div>
          {appleHealthConnected ? (
            <Badge variant="default">
              <Check className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleConnectAppleHealth}
              disabled={isConnectingApple}
            >
              {isConnectingApple ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Connect'}
            </Button>
          )}
        </div>

        {/* Google Fit */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-sm">Google Fit</span>
          </div>
          {googleFitConnected ? (
            <Badge variant="default">
              <Check className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleConnectGoogleFit}
              disabled={isConnectingGoogle}
            >
              {isConnectingGoogle ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Connect'}
            </Button>
          )}
        </div>

        {/* Sync Button */}
        {(appleHealthConnected || googleFitConnected) && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={handleSyncWorkouts}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-3 w-3" />
                Sync Workouts
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Connect your fitness tracker to import workouts automatically.
        {!isNative && ' Install the mobile app to enable these connections.'}
      </p>

      {/* Apple Health Card */}
      <div className={cn(
        "flex items-center justify-between p-4 rounded-lg border",
        appleHealthConnected ? "border-primary/30 bg-primary/5" : "border-border"
      )}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-muted">
            <Watch className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Apple Health</p>
            <p className="text-sm text-muted-foreground">
              Import workouts from Apple Watch
            </p>
          </div>
        </div>
        
        {appleHealthConnected ? (
          <div className="flex items-center gap-2">
            <Badge variant="default">
              <Check className="mr-1 h-3 w-3" />
              Connected
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDisconnect('apple')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleConnectAppleHealth}
            disabled={isConnectingApple}
          >
            {isConnectingApple ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Connect
          </Button>
        )}
      </div>

      {/* Google Fit Card */}
      <div className={cn(
        "flex items-center justify-between p-4 rounded-lg border",
        googleFitConnected ? "border-primary/30 bg-primary/5" : "border-border"
      )}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-muted">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Google Fit</p>
            <p className="text-sm text-muted-foreground">
              Import workouts via Health Connect
            </p>
          </div>
        </div>
        
        {googleFitConnected ? (
          <div className="flex items-center gap-2">
            <Badge variant="default">
              <Check className="mr-1 h-3 w-3" />
              Connected
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDisconnect('google')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleConnectGoogleFit}
            disabled={isConnectingGoogle}
          >
            {isConnectingGoogle ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Connect
          </Button>
        )}
      </div>

      {/* Sync Section */}
      {(appleHealthConnected || googleFitConnected) && (
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sync Workouts</p>
              <p className="text-sm text-muted-foreground">
                {lastSyncAt 
                  ? `Last synced: ${new Date(lastSyncAt).toLocaleDateString()}`
                  : 'Never synced'}
              </p>
            </div>
            <Button
              onClick={handleSyncWorkouts}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Now
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
