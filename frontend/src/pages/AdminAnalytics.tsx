/**
 * Admin Analytics Dashboard
 * 
 * View beta feedback and analytics data from Supabase.
 * Access: /admin/analytics (admin users only)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  MessageSquare, 
  Users, 
  Activity,
  RefreshCw,
  Download,
  Star,
  ChevronDown,
  ChevronUp,
  Image,
  Video,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Admin emails - add your email(s) here
const ADMIN_EMAILS = [
  'support@bisafit.com',
  // Add more admin emails as needed
];

interface FeedbackEntry {
  id: string;
  user_id: string;
  feedback_data: {
    overallRating: number;
    wouldRecommend: string;
    onboardingClarity: string;
    onboardingLength: string;
    onboardingIssues: string;
    workoutEnjoyment: string;
    workoutInstructions: string;
    workoutTimer: string;
    workoutIssues: string;
    designRating: string;
    navigationEase: string;
    mobileExperience: string;
    designFeedback: string;
    favoriteFeatures: string[];
    missingFeatures: string;
    bugsEncountered: string;
    bugAttachments: string[];
    deviceInfo: string;
    oneImprovement: string;
    additionalComments: string;
  };
  submitted_at: string;
  app_version: string;
  device_info: string;
}

interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_name: string;
  platform: string;
  properties: Record<string, any>;
  created_at: string;
}

interface AnalyticsSummary {
  totalUsers: number;
  totalEvents: number;
  totalFeedback: number;
  avgRating: number;
  topEvents: { name: string; count: number }[];
}

export default function AdminAnalytics() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('feedback');
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    
    try {
      // Fetch beta feedback
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('beta_feedback')
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(100);

      if (!feedbackError && feedbackData) {
        setFeedback(feedbackData);
      }

      // Fetch analytics events
      const { data: eventsData, error: eventsError } = await supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (!eventsError && eventsData) {
        setEvents(eventsData);
        
        // Calculate summary
        const uniqueUsers = new Set(eventsData.map(e => e.user_id)).size;
        const eventCounts = eventsData.reduce((acc, e) => {
          acc[e.event_name] = (acc[e.event_name] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const topEvents = Object.entries(eventCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        const avgRating = feedbackData && feedbackData.length > 0
          ? feedbackData.reduce((sum, f) => sum + (f.feedback_data?.overallRating || 0), 0) / feedbackData.length
          : 0;

        setSummary({
          totalUsers: uniqueUsers,
          totalEvents: eventsData.length,
          totalFeedback: feedbackData?.length || 0,
          avgRating,
          topEvents,
        });
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const exportFeedback = () => {
    const csv = feedback.map(f => ({
      submitted_at: f.submitted_at,
      rating: f.feedback_data?.overallRating,
      would_recommend: f.feedback_data?.wouldRecommend,
      onboarding_clarity: f.feedback_data?.onboardingClarity,
      design_rating: f.feedback_data?.designRating,
      navigation_ease: f.feedback_data?.navigationEase,
      mobile_experience: f.feedback_data?.mobileExperience,
      favorite_features: f.feedback_data?.favoriteFeatures?.join(', '),
      missing_features: f.feedback_data?.missingFeatures,
      bugs: f.feedback_data?.bugsEncountered,
      one_improvement: f.feedback_data?.oneImprovement,
      device: f.feedback_data?.deviceInfo || f.device_info,
    }));

    const headers = Object.keys(csv[0] || {}).join(',');
    const rows = csv.map(row => Object.values(row).map(v => `"${v || ''}"`).join(','));
    const csvContent = [headers, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bisafit-feedback-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-4 w-4",
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <AppLayout title="Analytics" showNav={false}>
      <div className="container max-w-4xl py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">Beta feedback and usage analytics</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 icon-water" />
                  <div>
                    <p className="text-2xl font-bold">{summary.totalUsers}</p>
                    <p className="text-xs text-muted-foreground">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 icon-steps" />
                  <div>
                    <p className="text-2xl font-bold">{summary.totalEvents}</p>
                    <p className="text-xs text-muted-foreground">Events Tracked</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 icon-heart" />
                  <div>
                    <p className="text-2xl font-bold">{summary.totalFeedback}</p>
                    <p className="text-xs text-muted-foreground">Feedback Received</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 icon-trophy" />
                  <div>
                    <p className="text-2xl font-bold">{summary.avgRating.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Avg Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="feedback" className="gap-1">
              <MessageSquare className="h-4 w-4" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-1">
              <BarChart3 className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="top" className="gap-1">
              <Activity className="h-4 w-4" />
              Top Events
            </TabsTrigger>
          </TabsList>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={exportFeedback} disabled={feedback.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {feedback.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No feedback received yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Feedback will appear here when beta testers submit it
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {feedback.map((f) => (
                  <Card key={f.id} className="overflow-hidden">
                    <CardHeader 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedFeedback(expandedFeedback === f.id ? null : f.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {renderStars(f.feedback_data?.overallRating || 0)}
                          <Badge variant="secondary">
                            {f.feedback_data?.wouldRecommend?.replace('_', ' ') || 'N/A'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(f.submitted_at), 'MMM d, yyyy h:mm a')}
                          </span>
                          {expandedFeedback === f.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    {expandedFeedback === f.id && (
                      <CardContent className="pt-0 space-y-4">
                        {/* Quick Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div className="p-2 bg-muted/50 rounded">
                            <p className="text-xs text-muted-foreground">Onboarding</p>
                            <p className="font-medium">{f.feedback_data?.onboardingClarity?.replace('_', ' ') || 'N/A'}</p>
                          </div>
                          <div className="p-2 bg-muted/50 rounded">
                            <p className="text-xs text-muted-foreground">Design</p>
                            <p className="font-medium">{f.feedback_data?.designRating?.replace(/_/g, ' ') || 'N/A'}</p>
                          </div>
                          <div className="p-2 bg-muted/50 rounded">
                            <p className="text-xs text-muted-foreground">Navigation</p>
                            <p className="font-medium">{f.feedback_data?.navigationEase?.replace('_', ' ') || 'N/A'}</p>
                          </div>
                          <div className="p-2 bg-muted/50 rounded">
                            <p className="text-xs text-muted-foreground">Mobile</p>
                            <p className="font-medium">{f.feedback_data?.mobileExperience?.replace('_', ' ') || 'N/A'}</p>
                          </div>
                        </div>

                        {/* Favorite Features */}
                        {f.feedback_data?.favoriteFeatures?.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Favorite Features</p>
                            <div className="flex flex-wrap gap-1">
                              {f.feedback_data.favoriteFeatures.map((feat) => (
                                <Badge key={feat} variant="outline" className="text-xs">
                                  {feat.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Text Feedback */}
                        {f.feedback_data?.missingFeatures && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Missing Features</p>
                            <p className="text-sm bg-muted/30 p-2 rounded">{f.feedback_data.missingFeatures}</p>
                          </div>
                        )}

                        {f.feedback_data?.bugsEncountered && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Bugs Reported</p>
                            <p className="text-sm bg-muted/30 p-2 rounded">{f.feedback_data.bugsEncountered}</p>
                          </div>
                        )}

                        {/* Bug Attachments */}
                        {f.feedback_data?.bugAttachments?.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Attachments ({f.feedback_data.bugAttachments.length})</p>
                            <div className="grid grid-cols-3 gap-2">
                              {f.feedback_data.bugAttachments.map((url, idx) => (
                                <a 
                                  key={idx} 
                                  href={url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="relative block aspect-video bg-muted rounded overflow-hidden hover:opacity-80 transition-opacity"
                                >
                                  {url.startsWith('data:video') || url.includes('.mp4') || url.includes('.mov') ? (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Video className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                  ) : (
                                    <img src={url} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                                  )}
                                  <div className="absolute bottom-1 right-1">
                                    <ExternalLink className="h-3 w-3 text-white drop-shadow" />
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {f.feedback_data?.oneImprovement && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">One Improvement</p>
                            <p className="text-sm bg-muted/30 p-2 rounded font-medium">{f.feedback_data.oneImprovement}</p>
                          </div>
                        )}

                        {f.feedback_data?.additionalComments && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Additional Comments</p>
                            <p className="text-sm bg-muted/30 p-2 rounded">{f.feedback_data.additionalComments}</p>
                          </div>
                        )}

                        {/* Device Info */}
                        <div className="text-xs text-muted-foreground">
                          Device: {f.feedback_data?.deviceInfo || f.device_info || 'Unknown'}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            {events.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No events tracked yet</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-card border-b">
                        <tr>
                          <th className="text-left p-3 font-medium">Event</th>
                          <th className="text-left p-3 font-medium">Time</th>
                          <th className="text-left p-3 font-medium">Platform</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.slice(0, 100).map((event) => (
                          <tr key={event.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="p-3">
                              <Badge variant="outline" className="font-mono text-xs">
                                {event.event_name}
                              </Badge>
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {format(new Date(event.created_at), 'MMM d, h:mm a')}
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {event.platform}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Top Events Tab */}
          <TabsContent value="top" className="space-y-4">
            {summary?.topEvents && summary.topEvents.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Most Common Events</CardTitle>
                  <CardDescription>Top 10 events by frequency</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {summary.topEvents.map((event, idx) => (
                    <div key={event.name} className="flex items-center gap-3">
                      <span className="text-muted-foreground w-6">{idx + 1}.</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-sm">{event.name}</span>
                          <span className="text-sm text-muted-foreground">{event.count}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(event.count / summary.topEvents[0].count) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No event data yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
