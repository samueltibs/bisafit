import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Clock, 
  Flame, 
  Activity, 
  Watch, 
  Footprints,
  Filter,
  ChevronDown,
  StickyNote,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useWorkoutLogs } from '@/hooks/useWorkoutLogs';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { WorkoutLog, WorkoutSourceFilter } from '@/types/workoutLog';
import { 
  getSourceDisplayName, 
  getSourceBadgeColor, 
  formatWorkoutType 
} from '@/types/workoutLog';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { HealthPlatformSettings } from '@/components/settings/HealthPlatformSettings';

function formatDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEE, MMM d');
}

function formatTime(dateStr: string): string {
  return format(parseISO(dateStr), 'h:mm a');
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

interface WorkoutItemProps {
  log: WorkoutLog;
  onAddNote: (id: string, note: string) => void;
}

function WorkoutItem({ log, onAddNote }: WorkoutItemProps) {
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [note, setNote] = useState(log.user_notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const isExternal = log.source !== 'bisafit';

  const handleSaveNote = async () => {
    setIsSaving(true);
    await onAddNote(log.id, note);
    setIsSaving(false);
    setIsNoteModalOpen(false);
  };

  return (
    <>
      <div className="flex items-start gap-3 p-4 border-b last:border-b-0">
        <div className="flex-shrink-0 p-2 rounded-full bg-muted">
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{formatWorkoutType(log.workout_type)}</span>
            {isExternal && (
              <Badge 
                variant="secondary" 
                className={cn("text-xs", getSourceBadgeColor(log.source))}
              >
                {log.source === 'apple_health' && <Watch className="mr-1 h-3 w-3" />}
                {log.source === 'google_fit' && <Activity className="mr-1 h-3 w-3" />}
                {getSourceDisplayName(log.source)}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(log.duration_minutes)}
            </span>
            
            {log.calories_burned && (
              <span className="flex items-center gap-1">
                <Flame className="h-3 w-3" />
                {log.calories_burned} cal
              </span>
            )}
            
            {log.steps && (
              <span className="flex items-center gap-1">
                <Footprints className="h-3 w-3" />
                {log.steps.toLocaleString()}
              </span>
            )}
          </div>

          {log.user_notes && (
            <p className="mt-2 text-sm text-muted-foreground italic">
              "{log.user_notes}"
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-sm text-muted-foreground">
            {formatTime(log.start_time)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setIsNoteModalOpen(true)}
          >
            <StickyNote className="h-3 w-3 mr-1" />
            {log.user_notes ? 'Edit' : 'Note'}
          </Button>
        </div>
      </div>

      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note about this workout..."
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function WorkoutHistoryList() {
  const [filter, setFilter] = useState<WorkoutSourceFilter>('all');
  const { 
    logs, 
    loading, 
    error, 
    refetch, 
    updateLog,
    getTotalMinutes,
    getTotalCalories,
    getWorkoutCount,
    getStreak,
  } = useWorkoutLogs({ filter });
  const { profile } = useUserProfile();

  const appleHealthConnected = (profile as any)?.apple_health_connected ?? false;
  const googleFitConnected = (profile as any)?.google_fit_connected ?? false;
  const hasConnections = appleHealthConnected || googleFitConnected;

  const handleAddNote = async (id: string, note: string) => {
    const success = await updateLog(id, { user_notes: note || null });
    if (success) {
      toast.success('Note saved');
    } else {
      toast.error('Failed to save note');
    }
  };

  // Group logs by date
  const groupedLogs = logs.reduce((groups, log) => {
    const dateKey = format(parseISO(log.start_time), 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(log);
    return groups;
  }, {} as Record<string, WorkoutLog[]>);

  const dateKeys = Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a));

  // Summary stats
  const weeklyMinutes = getTotalMinutes(7);
  const weeklyCalories = getTotalCalories(7);
  const weeklyCount = getWorkoutCount(7);
  const streak = getStreak();

  return (
    <div className="space-y-4">
      {/* Weekly Summary */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold">{weeklyCount}</p>
            <p className="text-xs text-muted-foreground">Workouts</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold">{weeklyMinutes}</p>
            <p className="text-xs text-muted-foreground">Minutes</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold">{weeklyCalories}</p>
            <p className="text-xs text-muted-foreground">Calories</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold">{streak}</p>
            <p className="text-xs text-muted-foreground">Streak 🔥</p>
          </CardContent>
        </Card>
      </div>

      {/* Connect Health Platforms */}
      {!hasConnections && (
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Import Workouts</CardTitle>
          </CardHeader>
          <CardContent>
            <HealthPlatformSettings compact />
          </CardContent>
        </Card>
      )}

      {/* Filter & Actions */}
      <div className="flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              {filter === 'all' ? 'All Sources' : getSourceDisplayName(filter)}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setFilter('all')}>
              All Sources
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('bisafit')}>
              BisaFit Only
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('apple_health')}>
              Apple Watch
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('google_fit')}>
              Google Fit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {hasConnections && (
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        )}
      </div>

      {/* Workout List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex items-center gap-2 p-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm">Failed to load workout history</p>
          </CardContent>
        </Card>
      ) : logs.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-8 text-center">
            <Activity className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No workouts yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              {filter === 'all' 
                ? 'Complete a workout or connect a health platform to see your history'
                : `No ${getSourceDisplayName(filter)} workouts found`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {dateKeys.map(dateKey => (
            <Card key={dateKey} className="border-border overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 border-b">
                <p className="text-sm font-medium">
                  {formatDate(groupedLogs[dateKey][0].start_time)}
                </p>
              </div>
              {groupedLogs[dateKey].map(log => (
                <WorkoutItem 
                  key={log.id} 
                  log={log} 
                  onAddNote={handleAddNote}
                />
              ))}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
