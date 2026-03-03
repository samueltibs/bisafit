/**
 * Health Platform Settings
 * 
 * Combined settings for fitness platform integrations:
 * - Apple Health (iOS native)
 * - Google Fit (Android native)
 * - Fitbit (OAuth)
 * - Strava (OAuth)
 */

import { AppleHealthCard } from './AppleHealthCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Check, Loader2, X, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { usePlatform } from '@/hooks/usePlatform';
import { useFitnessConnections } from '@/hooks/useFitnessConnections';
import { requestGoogleFitPermissions, isAndroidPlatform } from '@/lib/healthPlatforms';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface HealthPlatformSettingsProps {
  compact?: boolean;
}

export function HealthPlatformSettings({ compact = false }: HealthPlatformSettingsProps) {
  const { profile, update, refetch } = useUserProfile();
  const { platform } = usePlatform();
  const { 
    connections, 
    loading: connectionsLoading,
    connecting,
    connectFitbit,
    disconnectFitbit,
    connectStrava,
    disconnectStrava,
  } = useFitnessConnections();
  
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  const googleFitConnected = (profile as any)?.google_fit_connected ?? false;
  const isNative = platform === 'ios' || platform === 'android';

  const handleConnectGoogleFit = async () => {
    setIsConnectingGoogle(true);
    try {
      const status = await requestGoogleFitPermissions();
      
      if (status.authorized) {
        await update({ google_fit_connected: true } as any);
        await refetch();
        toast.success('Connected to Google Fit');
      } else {
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

  const handleDisconnectGoogle = async () => {
    try {
      await update({ google_fit_connected: false } as any);
      await refetch();
      toast.success('Disconnected from Google Fit');
    } catch (error) {
      toast.error('Failed to disconnect');
    }
  };

  const handleConnectFitbit = async () => {
    try {
      await connectFitbit();
    } catch (error) {
      toast.error('Failed to connect Fitbit');
    }
  };

  const handleDisconnectFitbit = async () => {
    try {
      await disconnectFitbit();
      toast.success('Disconnected from Fitbit');
    } catch (error) {
      toast.error('Failed to disconnect Fitbit');
    }
  };

  const handleConnectStrava = async () => {
    try {
      await connectStrava();
    } catch (error) {
      toast.error('Failed to connect Strava');
    }
  };

  const handleDisconnectStrava = async () => {
    try {
      await disconnectStrava();
      toast.success('Disconnected from Strava');
    } catch (error) {
      toast.error('Failed to disconnect Strava');
    }
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Apple Health */}
        <AppleHealthCard compact />
        
        {/* Google Fit */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-sm">Google Fit</span>
          </div>
          {googleFitConnected ? (
            <Badge variant="default">
              <Check className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary">Not connected</Badge>
          )}
        </div>

        {/* Fitbit */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">⌚</span>
            <span className="text-sm">Fitbit</span>
          </div>
          {connections.fitbit ? (
            <Badge variant="default" style={{ backgroundColor: '#00B0B9' }}>
              <Check className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary">Not connected</Badge>
          )}
        </div>

        {/* Strava */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🏃</span>
            <span className="text-sm">Strava</span>
          </div>
          {connections.strava ? (
            <Badge variant="default" style={{ backgroundColor: '#FC4C02' }}>
              <Check className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary">Not connected</Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Apple Health Card */}
      <AppleHealthCard />
      
      {/* Google Fit Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Google Fit</CardTitle>
            </div>
            {googleFitConnected && (
              <Badge variant="default" className="bg-green-500">
                <Check className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
          <CardDescription>
            Sync workouts, steps, and heart rate from Google Fit
          </CardDescription>
        </CardHeader>
        <CardContent>
          {googleFitConnected ? (
            <Button variant="outline" className="w-full" onClick={handleDisconnectGoogle}>
              <X className="h-4 w-4 mr-2" />
              Disconnect Google Fit
            </Button>
          ) : (
            <Button 
              className="w-full" 
              onClick={handleConnectGoogleFit}
              disabled={isConnectingGoogle}
            >
              {isConnectingGoogle ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Activity className="h-4 w-4 mr-2" />
              )}
              {isNative ? 'Connect Google Fit' : 'Available on Android app'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Fitbit Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">⌚</span>
              <CardTitle className="text-lg">Fitbit</CardTitle>
            </div>
            {connections.fitbit && (
              <Badge variant="default" style={{ backgroundColor: '#00B0B9' }}>
                <Check className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
          <CardDescription>
            Import workouts, steps, and heart rate from your Fitbit device
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connections.fitbit ? (
            <Button variant="outline" className="w-full" onClick={handleDisconnectFitbit}>
              <X className="h-4 w-4 mr-2" />
              Disconnect Fitbit
            </Button>
          ) : (
            <Button 
              className="w-full" 
              onClick={handleConnectFitbit}
              disabled={connecting === 'fitbit'}
              style={{ backgroundColor: '#00B0B9' }}
            >
              {connecting === 'fitbit' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Connect Fitbit
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Strava Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏃</span>
              <CardTitle className="text-lg">Strava</CardTitle>
            </div>
            {connections.strava && (
              <Badge variant="default" style={{ backgroundColor: '#FC4C02' }}>
                <Check className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
          <CardDescription>
            Import runs, rides, and workouts from Strava
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connections.strava ? (
            <Button variant="outline" className="w-full" onClick={handleDisconnectStrava}>
              <X className="h-4 w-4 mr-2" />
              Disconnect Strava
            </Button>
          ) : (
            <Button 
              className="w-full" 
              onClick={handleConnectStrava}
              disabled={connecting === 'strava'}
              style={{ backgroundColor: '#FC4C02' }}
            >
              {connecting === 'strava' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Connect Strava
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default HealthPlatformSettings;
