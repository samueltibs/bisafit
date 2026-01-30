import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Scale, 
  Ruler, 
  TrendingUp, 
  TrendingDown, 
  Plus,
  Calendar,
  Activity,
  Sparkles,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { WorkoutHistoryList, NonScaleProgress, WeeklyStoryCard } from '@/components/progress';
import { ProgressPhotosGrid } from '@/components/progress/ProgressPhotosGrid';
import { PhotoUploadDialog } from '@/components/progress/PhotoUploadDialog';
import { useProgressMetrics } from '@/hooks/useProgressMetrics';
import { useProgressPhotos } from '@/hooks/useProgressPhotos';

const weightData = [
  { date: 'Jan 1', weight: 82 },
  { date: 'Jan 8', weight: 81.5 },
  { date: 'Jan 15', weight: 81.2 },
  { date: 'Jan 22', weight: 80.8 },
  { date: 'Jan 29', weight: 80.3 },
  { date: 'Feb 5', weight: 79.8 },
  { date: 'Feb 12', weight: 79.5 },
];

const measurements = [
  { part: 'Chest', current: 102, previous: 104, unit: 'cm' },
  { part: 'Waist', current: 84, previous: 88, unit: 'cm' },
  { part: 'Hips', current: 98, previous: 100, unit: 'cm' },
  { part: 'Arms', current: 36, previous: 35, unit: 'cm' },
  { part: 'Thighs', current: 58, previous: 60, unit: 'cm' },
];

export default function Progress() {
  const [activeTab, setActiveTab] = useState('progress');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { summary, loading: metricsLoading } = useProgressMetrics();
  const { photos, loading: photosLoading, uploading, uploadPhoto, deletePhoto } = useProgressPhotos();

  const currentWeight = weightData[weightData.length - 1].weight;
  const previousWeight = weightData[weightData.length - 2].weight;
  const weightChange = currentWeight - previousWeight;
  const totalChange = currentWeight - weightData[0].weight;

  // Use real streak data if available
  const streakDays = summary?.streak.current ?? 0;

  return (
    <AppLayout>
      <div className="container space-y-6 px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in">
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <Scale className="mx-auto mb-2 h-5 w-5 text-primary" />
              <p className="text-xl font-bold">{currentWeight}</p>
              <p className="text-xs text-muted-foreground">kg</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <div className="mx-auto mb-2 flex items-center justify-center">
                {totalChange < 0 ? (
                  <TrendingDown className="h-5 w-5 text-primary" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-energy" />
                )}
              </div>
              <p className="text-xl font-bold">{totalChange.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">kg total</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <Calendar className="mx-auto mb-2 h-5 w-5 icon-calendar" />
              <p className="text-xl font-bold tabular-nums">{streakDays}</p>
              <p className="text-xs text-muted-foreground">day streak</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-slide-up">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="progress" className="gap-1">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Progress</span>
            </TabsTrigger>
            <TabsTrigger value="workouts" className="gap-1">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="weight" className="gap-1">
              <Scale className="h-4 w-4" />
              <span className="hidden sm:inline">Weight</span>
            </TabsTrigger>
            <TabsTrigger value="measurements" className="gap-1">
              <Ruler className="h-4 w-4" />
              <span className="hidden sm:inline">Body</span>
            </TabsTrigger>
            <TabsTrigger value="photos" className="gap-1">
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Photos</span>
            </TabsTrigger>
          </TabsList>

          {/* Non-Scale Progress Tab */}
          <TabsContent value="progress" className="mt-4 space-y-4">
            {/* Weekly Story Card */}
            <WeeklyStoryCard />
            
            {/* Non-Scale Progress */}
            <NonScaleProgress summary={summary} loading={metricsLoading} />
          </TabsContent>

          <TabsContent value="workouts" className="mt-4">
            <WorkoutHistoryList />
          </TabsContent>

          <TabsContent value="weight" className="mt-4 space-y-4">
            {/* Weight Chart */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Weight Trend</CardTitle>
                  <Badge variant={weightChange < 0 ? "default" : "secondary"}>
                    {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg this week
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightData}>
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis 
                        domain={['dataMin - 1', 'dataMax + 1']}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Log Weight Button */}
            <Button className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Log Today's Weight
            </Button>
          </TabsContent>

          <TabsContent value="measurements" className="mt-4 space-y-4">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Body Measurements</CardTitle>
                  <Button variant="ghost" size="sm">
                    <Plus className="mr-1 h-4 w-4" />
                    Update
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {measurements.map((m) => {
                  const change = m.current - m.previous;
                  const isPositive = change > 0;
                  
                  return (
                    <div key={m.part} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{m.part}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{m.current} {m.unit}</span>
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-xs",
                            isPositive ? "text-energy" : "text-primary"
                          )}
                        >
                          {isPositive ? '+' : ''}{change} {m.unit}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos" className="mt-4 space-y-4">
            {/* Progress Photos Grid */}
            <ProgressPhotosGrid
              photos={photos}
              loading={photosLoading}
              onDelete={deletePhoto}
              onAddPhoto={() => setUploadDialogOpen(true)}
            />

            {/* Add Photo Button */}
            {photos.length > 0 && (
              <Button 
                className="w-full gap-2"
                onClick={() => setUploadDialogOpen(true)}
              >
                <Camera className="h-4 w-4" />
                Add Progress Photo
              </Button>
            )}

            <p className="text-center text-sm text-muted-foreground">
              Photos are stored privately and only visible to you
            </p>
          </TabsContent>
        </Tabs>

        {/* Photo Upload Dialog */}
        <PhotoUploadDialog
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          onUpload={uploadPhoto}
          uploading={uploading}
        />
      </div>
    </AppLayout>
  );
}
