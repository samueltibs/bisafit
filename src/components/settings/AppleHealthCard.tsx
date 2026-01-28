/**
 * Apple Health Settings Card
 * 
 * Displays connection status, sync controls, and data types.
 * Handles all connection states: not_connected, connected, needs_permissions, syncing, error, unavailable
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Watch, 
  Check, 
  X, 
  RefreshCw, 
  AlertCircle, 
  Settings,
  Loader2,
  Footprints,
  Activity,
  Flame,
  Heart,
  Clock,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { useAppleHealth, type ConnectionState } from '@/hooks/useAppleHealth';
import { AppleHealthConnectFlow } from './AppleHealthConnectFlow';

interface AppleHealthCardProps {
  compact?: boolean;
}

export function AppleHealthCard({ compact = false }: AppleHealthCardProps) {
  const {
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
  } = useAppleHealth();

  const [showConnectFlow, setShowConnectFlow] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  const handleConnect = () => {
    startConnect();
    setShowConnectFlow(true);
  };

  const handleDisconnect = async () => {
    await disconnect();
    setShowDisconnectDialog(false);
  };

  // Status badge based on connection state
  const StatusBadge = () => {
    switch (connectionState) {
      case 'connected':
        return (
          <Badge variant="default" className="gap-1">
            <Check className="h-3 w-3" />
            Connected
          </Badge>
        );
      case 'syncing':
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Syncing…
          </Badge>
        );
      case 'needs_permissions':
        return (
          <Badge variant="secondary" className="gap-1 bg-accent/50 text-accent-foreground">
            <AlertCircle className="h-3 w-3" />
            Needs Permissions
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1">
            <X className="h-3 w-3" />
            Error
          </Badge>
        );
      case 'unavailable':
        return (
          <Badge variant="secondary" className="gap-1">
            <Smartphone className="h-3 w-3" />
            iOS Only
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            Not Connected
          </Badge>
        );
    }
  };

  // Compact version for use in other components
  if (compact) {
    return (
      <>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Watch className="h-4 w-4 text-primary" />
            <span className="text-sm">Apple Health</span>
          </div>
          {connectionState === 'connected' ? (
            <StatusBadge />
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleConnect}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Connect'}
            </Button>
          )}
        </div>

        <AppleHealthConnectFlow
          open={showConnectFlow}
          onOpenChange={setShowConnectFlow}
          isIOSNative={isIOSNative}
          onRequestPermissions={requestPermissions}
          onSyncNow={syncNow}
          isLoading={isLoading}
        />
      </>
    );
  }

  return (
    <>
      <Card className={cn(
        "border transition-colors",
        connectionState === 'connected' && "border-primary/30 bg-primary/5",
        connectionState === 'error' && "border-destructive/30 bg-destructive/5"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-full",
                connectionState === 'connected' ? "bg-primary/10" : "bg-muted"
              )}>
                <Watch className={cn(
                  "h-5 w-5",
                  connectionState === 'connected' ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <CardTitle className="text-base">Apple Watch / Apple Health</CardTitle>
                <CardDescription>
                  Import workouts and steps automatically
                </CardDescription>
              </div>
            </div>
            <StatusBadge />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Sync Progress */}
          {connectionState === 'syncing' && syncProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{syncProgress.message}</span>
                <span className="font-medium tabular-nums">
                  {syncProgress.imported} imported
                </span>
              </div>
              <Progress value={
                syncProgress.phase === 'steps' ? 33 :
                syncProgress.phase === 'workouts' ? 66 :
                syncProgress.phase === 'complete' ? 100 : 0
              } />
            </div>
          )}

          {/* Error message */}
          {connectionState === 'error' && error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Sync failed</p>
                <p className="text-destructive/80">{error}</p>
              </div>
            </div>
          )}

          {/* Data types being read */}
          {connectionState === 'connected' && (
            <div className="grid grid-cols-2 gap-2">
              <DataTypeBadge icon={Footprints} label="Steps (daily)" />
              <DataTypeBadge icon={Activity} label="Workouts" />
              <DataTypeBadge icon={Flame} label="Active calories" optional />
              <DataTypeBadge icon={Heart} label="Heart rate" optional />
            </div>
          )}

          {/* Last synced */}
          {connectionState === 'connected' && lastSyncAt && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Last synced {formatDistanceToNow(lastSyncAt, { addSuffix: true })}
              </span>
            </div>
          )}

          {/* Unavailable message */}
          {connectionState === 'unavailable' && (
            <div className="text-center py-4">
              <Smartphone className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Available on iOS app
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Install BisaFit on your iPhone to connect Apple Health
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {connectionState === 'not_connected' && (
              <Button onClick={handleConnect} disabled={isLoading} className="flex-1">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Connect
              </Button>
            )}

            {connectionState === 'connected' && (
              <>
                <Button 
                  onClick={syncNow} 
                  disabled={isLoading}
                  className="flex-1 gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Sync Now
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={openHealthSettings}
                  title="Manage permissions"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowDisconnectDialog(true)}
                  title="Disconnect"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}

            {connectionState === 'needs_permissions' && (
              <>
                <Button onClick={openHealthSettings} className="flex-1 gap-2">
                  <Settings className="h-4 w-4" />
                  Open Apple Health Settings
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowDisconnectDialog(true)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}

            {connectionState === 'error' && (
              <>
                <Button onClick={syncNow} disabled={isLoading} className="flex-1 gap-2">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Retry
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowDisconnectDialog(true)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connect Flow Modal */}
      <AppleHealthConnectFlow
        open={showConnectFlow}
        onOpenChange={setShowConnectFlow}
        isIOSNative={isIOSNative}
        onRequestPermissions={requestPermissions}
        onSyncNow={syncNow}
        isLoading={isLoading}
      />

      {/* Disconnect Confirmation */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Apple Health?</AlertDialogTitle>
            <AlertDialogDescription>
              BisaFit will no longer import steps and workouts from Apple Health. Your existing imported data will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect}>
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface DataTypeBadgeProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  optional?: boolean;
}

function DataTypeBadge({ icon: Icon, label, optional }: DataTypeBadgeProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-lg text-sm",
      optional ? "bg-muted/50 text-muted-foreground" : "bg-primary/10"
    )}>
      <Icon className="h-3.5 w-3.5" />
      <span className="truncate">{label}</span>
    </div>
  );
}

export default AppleHealthCard;
