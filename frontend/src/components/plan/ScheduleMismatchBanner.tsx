import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';

interface ScheduleMismatchBannerProps {
  profileDays: string[];
  planDays: string[];
  onUpdateSchedule: () => void;
  onDismiss: () => void;
  isUpdating?: boolean;
}

export function ScheduleMismatchBanner({
  profileDays,
  planDays,
  onUpdateSchedule,
  onDismiss,
  isUpdating = false,
}: ScheduleMismatchBannerProps) {
  return (
    <Card className="border-orange-500/30 bg-orange-500/5 animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/20">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                Schedule Mismatch
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                This plan uses a different schedule than your current settings.
              </p>
            </div>
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-medium">Your settings:</span>
                <span>{profileDays.join(', ')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">This plan:</span>
                <span>{planDays.join(', ')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button 
                size="sm" 
                onClick={onUpdateSchedule}
                disabled={isUpdating}
                className="gap-1"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3" />
                    Update Schedule
                  </>
                )}
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={onDismiss}
                disabled={isUpdating}
              >
                Keep As-Is
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
