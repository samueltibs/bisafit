/**
 * Health Platform Settings
 * 
 * Combined settings for Apple Health and Google Fit integration.
 * This component wraps the individual platform cards.
 */

import { AppleHealthCard } from './AppleHealthCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Check, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { usePlatform } from '@/hooks/usePlatform';
import { requestGoogleFitPermissions, isAndroidPlatform } from '@/lib/healthPlatforms';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface HealthPlatformSettingsProps {
  compact?: boolean;
}

export function HealthPlatformSettings({ compact = false }: HealthPlatformSettingsProps) {
  const { profile, update, refetch } = useUserProfile();
  const { platform } = usePlatform();
  
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
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Connect your fitness tracker to import workouts and steps automatically.
        {!isNative && ' Install the mobile app to enable these connections.'}
      </p>

      {/* Apple Health Card - Full version */}
      <AppleHealthCard />

      {/* Google Fit Card */}
      <Card className={cn(
        "border transition-colors",
        googleFitConnected && "border-primary/30 bg-primary/5"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-full",
                googleFitConnected ? "bg-primary/10" : "bg-muted"
              )}>
                <Activity className={cn(
                  "h-5 w-5",
                  googleFitConnected ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <CardTitle className="text-base">Google Fit</CardTitle>
                <CardDescription>
                  Import workouts via Health Connect (Android)
                </CardDescription>
              </div>
            </div>
            {googleFitConnected ? (
              <Badge variant="default" className="gap-1">
                <Check className="h-3 w-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline">Not Connected</Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex gap-2">
            {googleFitConnected ? (
              <>
                <Button variant="outline" className="flex-1" disabled>
                  Sync handled by system
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDisconnectGoogle}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                onClick={handleConnectGoogleFit}
                disabled={isConnectingGoogle}
                className="flex-1"
              >
                {isConnectingGoogle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Connect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default HealthPlatformSettings;
