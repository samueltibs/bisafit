/**
 * Apple Health Connect Flow
 * 
 * Multi-step modal flow for connecting to Apple Health:
 * 1. Intro screen - explains what data will be synced
 * 2. Permissions screen - toggles for data types
 * 3. Success screen - shows connection status with sync button
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Watch, 
  Footprints, 
  Activity, 
  Flame, 
  Heart,
  Check,
  ChevronRight,
  Loader2,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppleHealthPermissions } from '@/lib/appleHealthService';

interface AppleHealthConnectFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isIOSNative: boolean;
  onRequestPermissions: (permissions: AppleHealthPermissions) => Promise<boolean>;
  onSyncNow: () => Promise<void>;
  isLoading: boolean;
}

type FlowStep = 'intro' | 'permissions' | 'success';

export function AppleHealthConnectFlow({
  open,
  onOpenChange,
  isIOSNative,
  onRequestPermissions,
  onSyncNow,
  isLoading,
}: AppleHealthConnectFlowProps) {
  const [step, setStep] = useState<FlowStep>('intro');
  const [permissions, setPermissions] = useState<AppleHealthPermissions>({
    steps: true,
    workouts: true,
    activeEnergy: false,
    heartRate: false,
  });
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleClose = () => {
    onOpenChange(false);
    // Reset to intro when closing
    setTimeout(() => setStep('intro'), 300);
  };

  const handleContinue = () => {
    setStep('permissions');
  };

  const handleRequestPermissions = async () => {
    if (!isIOSNative) {
      // On web, show info and move to success (placeholder)
      setStep('success');
      return;
    }

    setIsRequesting(true);
    const success = await onRequestPermissions(permissions);
    setIsRequesting(false);

    if (success) {
      setStep('success');
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    await onSyncNow();
    setIsSyncing(false);
    handleClose();
  };

  const handleDone = () => {
    handleClose();
  };

  const togglePermission = (key: keyof AppleHealthPermissions) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'intro' && (
          <>
            <DialogHeader className="text-center sm:text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Watch className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-xl">Connect Apple Watch</DialogTitle>
              <DialogDescription className="text-center pt-2">
                BisaFit reads your Apple Health activity to sync steps and workouts automatically.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              <DataTypeItem 
                icon={Footprints} 
                label="Daily Steps"
                description="Track your daily movement"
              />
              <DataTypeItem 
                icon={Activity} 
                label="Workouts"
                description="Import completed workouts"
              />
              <DataTypeItem 
                icon={Flame} 
                label="Active Calories"
                description="Track energy burned"
                optional
              />
              <DataTypeItem 
                icon={Heart} 
                label="Heart Rate"
                description="Average during workouts"
                optional
              />
            </div>

            <DialogFooter className="sm:justify-center">
              <Button onClick={handleContinue} className="w-full sm:w-auto gap-2">
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'permissions' && (
          <>
            <DialogHeader>
              <DialogTitle>Select Data to Sync</DialogTitle>
              <DialogDescription>
                Choose which data types BisaFit can read from Apple Health.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <PermissionToggle
                icon={Footprints}
                label="Steps"
                description="Daily step counts"
                checked={permissions.steps}
                onCheckedChange={() => togglePermission('steps')}
              />
              <PermissionToggle
                icon={Activity}
                label="Workouts"
                description="Exercise sessions"
                checked={permissions.workouts}
                onCheckedChange={() => togglePermission('workouts')}
              />
              <PermissionToggle
                icon={Flame}
                label="Active Energy"
                description="Calories burned"
                checked={permissions.activeEnergy}
                onCheckedChange={() => togglePermission('activeEnergy')}
                optional
              />
              <PermissionToggle
                icon={Heart}
                label="Heart Rate"
                description="Workout heart rate summary"
                checked={permissions.heartRate}
                onCheckedChange={() => togglePermission('heartRate')}
                optional
              />
            </div>

            {!isIOSNative && (
              <div className="rounded-lg bg-muted p-4 text-center">
                <Smartphone className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  This requires the iOS app. You'll enable it after installing BisaFit on your iPhone.
                </p>
              </div>
            )}

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button 
                onClick={handleRequestPermissions} 
                disabled={isRequesting || (!permissions.steps && !permissions.workouts)}
                className="w-full gap-2"
              >
                {isRequesting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Watch className="h-4 w-4" />
                )}
                {isIOSNative ? 'Allow in Apple Health' : 'Continue'}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setStep('intro')}
                className="w-full"
              >
                Back
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'success' && (
          <>
            <DialogHeader className="text-center sm:text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-xl">Connected!</DialogTitle>
              <DialogDescription className="text-center pt-2">
                Apple Health is now connected. Sync your data to see it in BisaFit.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="gap-1">
                    <Check className="h-3 w-3" />
                    Connected
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {permissions.steps && 'Steps'}{permissions.steps && permissions.workouts && ' • '}{permissions.workouts && 'Workouts'}
                  {(permissions.steps || permissions.workouts) && (permissions.activeEnergy || permissions.heartRate) && ' • '}
                  {permissions.activeEnergy && 'Calories'}{permissions.activeEnergy && permissions.heartRate && ' • '}{permissions.heartRate && 'Heart Rate'}
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button 
                onClick={handleSyncNow} 
                disabled={isSyncing}
                className="w-full gap-2"
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Sync Now
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleDone}
                className="w-full"
              >
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface DataTypeItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  optional?: boolean;
}

function DataTypeItem({ icon: Icon, label, description, optional }: DataTypeItemProps) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
      <div className="flex-shrink-0 p-2 rounded-full bg-background">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{label}</span>
          {optional && (
            <Badge variant="secondary" className="text-xs">Optional</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

interface PermissionToggleProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: () => void;
  optional?: boolean;
}

function PermissionToggle({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
  optional,
}: PermissionToggleProps) {
  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
        checked ? "border-primary/50 bg-primary/5" : "border-border"
      )}
      onClick={onCheckedChange}
    >
      <div className={cn(
        "flex-shrink-0 p-2 rounded-full",
        checked ? "bg-primary/10" : "bg-muted"
      )}>
        <Icon className={cn(
          "h-4 w-4",
          checked ? "text-primary" : "text-muted-foreground"
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{label}</span>
          {optional && (
            <Badge variant="secondary" className="text-xs">Optional</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch 
        checked={checked} 
        onCheckedChange={onCheckedChange}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default AppleHealthConnectFlow;
