import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

interface Workout {
  id: string;
  scheduled_date: string;
  content: any;
  completed_at: string | null;
}

interface DayWorkout {
  date: string;
  dayName: string;
  dayNum: number;
  workout: Workout | null;
  isToday: boolean;
}

export default function PlanScreen() {
  const { user } = useAuth();
  const [weekWorkouts, setWeekWorkouts] = useState<DayWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()));

  function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  const fetchWeekWorkouts = async () => {
    if (!user) return;

    try {
      const startDate = currentWeekStart.toISOString().split('T')[0];
      const endDate = new Date(currentWeekStart);
      endDate.setDate(endDate.getDate() + 6);
      const endDateStr = endDate.toISOString().split('T')[0];

      const { data: workouts } = await supabase
        .from('workouts')
        .select('id, scheduled_date, content, completed_at')
        .eq('user_id', user.id)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDateStr)
        .order('scheduled_date', { ascending: true });

      // Build week array
      const days: DayWorkout[] = [];
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const today = new Date().toISOString().split('T')[0];

      for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        const workout = workouts?.find(w => w.scheduled_date === dateStr) || null;
        
        days.push({
          date: dateStr,
          dayName: dayNames[i],
          dayNum: date.getDate(),
          workout,
          isToday: dateStr === today,
        });
      }

      setWeekWorkouts(days);
    } catch (error) {
      console.log('Error fetching workouts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeekWorkouts();
  }, [user, currentWeekStart]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWeekWorkouts();
  };

  const goToPreviousWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const formatWeekRange = () => {
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${currentWeekStart.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  };

  const getWorkoutName = (content: any): string => {
    if (!content) return 'Workout';
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch {
        return 'Workout';
      }
    }
    return content.name || content.title || 'Workout';
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F23' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F23' }}>
      {/* Header */}
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>Your Plan</Text>
      </View>

      {/* Week Navigation */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: 20,
      }}>
        <TouchableOpacity onPress={goToPreviousWeek}>
          <Text style={{ color: '#7C3AED', fontSize: 24 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
          {formatWeekRange()}
        </Text>
        <TouchableOpacity onPress={goToNextWeek}>
          <Text style={{ color: '#7C3AED', fontSize: 24 }}>→</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 0 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
        }
      >
        {/* Week Days */}
        {weekWorkouts.map((day) => (
          <TouchableOpacity
            key={day.date}
            onPress={() => day.workout && router.push(`/(app)/workout/${day.workout.id}`)}
            disabled={!day.workout}
            style={{
              backgroundColor: day.isToday ? '#252540' : '#1A1A2E',
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              borderWidth: day.isToday ? 2 : 1,
              borderColor: day.isToday ? '#7C3AED' : '#374151',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {/* Day indicator */}
            <View style={{ 
              width: 50, 
              alignItems: 'center',
              marginRight: 16,
            }}>
              <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{day.dayName}</Text>
              <Text style={{ 
                color: day.isToday ? '#7C3AED' : '#fff', 
                fontSize: 24, 
                fontWeight: 'bold',
                marginTop: 4,
              }}>
                {day.dayNum}
              </Text>
            </View>

            {/* Workout info */}
            <View style={{ flex: 1 }}>
              {day.workout ? (
                <>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                    {getWorkoutName(day.workout.content)}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    {day.workout.completed_at ? (
                      <Text style={{ color: '#10B981', fontSize: 14 }}>✓ Completed</Text>
                    ) : (
                      <Text style={{ color: '#9CA3AF', fontSize: 14 }}>Tap to start</Text>
                    )}
                  </View>
                </>
              ) : (
                <Text style={{ color: '#6B7280', fontSize: 16 }}>Rest Day</Text>
              )}
            </View>

            {/* Arrow */}
            {day.workout && (
              <Text style={{ color: '#7C3AED', fontSize: 20 }}>→</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* Generate Plan CTA if no workouts */}
        {weekWorkouts.every(d => !d.workout) && (
          <TouchableOpacity
            onPress={() => router.push('/(app)/onboarding')}
            style={{
              backgroundColor: '#7C3AED',
              borderRadius: 16,
              padding: 20,
              alignItems: 'center',
              marginTop: 20,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
              Generate Your Plan
            </Text>
            <Text style={{ color: '#E9D5FF', marginTop: 4 }}>
              Get personalized workouts for the week
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
