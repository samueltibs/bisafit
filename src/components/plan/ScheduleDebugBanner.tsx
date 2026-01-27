import { Info } from 'lucide-react';

interface ScheduleDebugBannerProps {
  profileDays: string[];
  planDays: string[];
  hasMismatch: boolean;
  isDismissed?: boolean;
}

export function ScheduleDebugBanner({
  profileDays,
  planDays,
  hasMismatch,
  isDismissed = false,
}: ScheduleDebugBannerProps) {
  return (
    <div className="rounded-lg border bg-muted/50 p-3 text-sm space-y-1 animate-fade-in">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-muted-foreground">Schedule Info</span>
      </div>
      <div className="flex items-center gap-2 pl-6">
        <span className="text-muted-foreground">Your workout days:</span>
        <span className="font-medium">{profileDays.join(', ')}</span>
      </div>
      <div className="flex items-center gap-2 pl-6">
        <span className="text-muted-foreground">This plan's days:</span>
        <span className="font-medium">{planDays.join(', ')}</span>
      </div>
      {hasMismatch && isDismissed && (
        <div className="flex items-center gap-2 pl-6 text-xs text-muted-foreground italic">
          (Using original schedule - user chose "Keep As-Is")
        </div>
      )}
    </div>
  );
}
