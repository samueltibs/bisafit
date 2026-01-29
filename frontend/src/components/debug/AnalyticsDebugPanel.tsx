import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Bug, X } from 'lucide-react';
import { getRecentEvents } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface AnalyticsEvent {
  id: string;
  event_name: string;
  properties: Record<string, unknown>;
  platform: string;
  created_at: string;
}

const eventCategoryColors: Record<string, string> = {
  // Activation - green
  signup_completed: 'bg-green-500/20 text-green-700',
  profile_completed: 'bg-green-500/20 text-green-700',
  plan_preview_viewed: 'bg-green-500/20 text-green-700',
  trial_started: 'bg-green-500/20 text-green-700',
  paywall_viewed: 'bg-green-500/20 text-green-700',
  // Engagement - blue
  workout_started: 'bg-blue-500/20 text-blue-700',
  workout_completed: 'bg-blue-500/20 text-blue-700',
  nutrition_plan_generated: 'bg-blue-500/20 text-blue-700',
  ingredient_scan_used: 'bg-blue-500/20 text-blue-700',
  calendar_event_created: 'bg-blue-500/20 text-blue-700',
  // Quality - red/orange
  generation_error: 'bg-red-500/20 text-red-700',
};

export function AnalyticsDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const isDev = process.env.NODE_ENV === 'development';

  const fetchEvents = async () => {
    setLoading(true);
    const data = await getRecentEvents(20);
    setEvents(data as AnalyticsEvent[]);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && isDev) {
      fetchEvents();
    }
  }, [isOpen, isDev]);

  // Only show in development
  if (!isDev) {
    return null;
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 left-4 z-50 h-10 w-10 rounded-full shadow-lg bg-background"
        onClick={() => setIsOpen(true)}
      >
        <Bug className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 left-4 z-50 w-96 max-h-[500px] shadow-xl border-2">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bug className="h-4 w-4" />
          Analytics Debug
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={fetchEvents}
            disabled={loading}
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-4 pb-4">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No events tracked yet
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-2 rounded-lg border bg-muted/30 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs font-mono",
                        eventCategoryColors[event.event_name] || 'bg-muted'
                      )}
                    >
                      {event.event_name}
                    </Badge>
                    <span className="text-muted-foreground">
                      {new Date(event.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  {Object.keys(event.properties).length > 1 && (
                    <pre className="text-[10px] text-muted-foreground overflow-x-auto">
                      {JSON.stringify(
                        Object.fromEntries(
                          Object.entries(event.properties).filter(
                            ([k]) => k !== 'timestamp'
                          )
                        ),
                        null,
                        1
                      )}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
