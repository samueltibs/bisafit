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

interface UserProfile {
  full_name: string | null;
  goal_primary: string | null;
  current_plan_id: string | null;
}

interface TodayWorkout {
  id: string;
  scheduled_date: string;
  content: any;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<TodayWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('users_profile')
        .select('full_name, goal_primary, current_plan_id')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      // Fetch today's workout
      const today = new Date().toISOString().split('T')[0];
      const { data: workoutData } = await supabase
        .from('workouts')
        .select('id, scheduled_date, content')
        .eq('user_id', user.id)
        .eq('scheduled_date', today)
        .single();

      setTodayWorkout(workoutData);
    } catch (error) {
      console.log('Error fetching home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatWorkoutContent = (content: any) => {
    if (!content) return null;
    
    // Parse the workout content
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch {
        return null;
      }
    }

    const exercises = content.exercises || [];
    return {
      name: content.name || content.title || 'Workout',
      exerciseCount: exercises.length,
      duration: content.duration || '45 min',
    };
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

  const workoutInfo = todayWorkout ? formatWorkoutContent(todayWorkout.content) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F23' }}>
      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
        }
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#9CA3AF', fontSize: 16 }}>{getGreeting()},</Text>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 4 }}>
            {profile?.full_name || 'Athlete'}
          </Text>
        </View>

        {/* Today's Workout Card */}
        <TouchableOpacity
          onPress={() => todayWorkout && router.push(`/(app)/workout/${todayWorkout.id}`)}
          style={{
            backgroundColor: '#1A1A2E',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#374151',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#9CA3AF', fontSize: 14 }}>TODAY'S WORKOUT</Text>
            <View style={{ 
              backgroundColor: todayWorkout ? '#7C3AED' : '#374151', 
              paddingHorizontal: 12, 
              paddingVertical: 4, 
              borderRadius: 12 
            }}>
              <Text style={{ color: '#fff', fontSize: 12 }}>
                {todayWorkout ? 'Ready' : 'Rest Day'}
              </Text>
            </View>
          </View>

          {workoutInfo ? (
            <View style={{ marginTop: 16 }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '600' }}>
                {workoutInfo.name}
              </Text>
              <View style={{ flexDirection: 'row', marginTop: 8, gap: 16 }}>
                <Text style={{ color: '#9CA3AF' }}>
                  {workoutInfo.exerciseCount} exercises
                </Text>
                <Text style={{ color: '#9CA3AF' }}>
                  ~{workoutInfo.duration}
                </Text>
              </View>
              <TouchableOpacity
                style={{
                  backgroundColor: '#7C3AED',
                  borderRadius: 12,
                  padding: 14,
                  alignItems: 'center',
                  marginTop: 16,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                  Start Workout →
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ marginTop: 16 }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '600' }}>Rest & Recover</Text>
              <Text style={{ color: '#9CA3AF', marginTop: 8 }}>
                Take it easy today. Your body needs rest to grow stronger.
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Quick Stats */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <View style={{
            flex: 1,
            backgroundColor: '#1A1A2E',
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: '#374151',
          }}>
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>STREAK</Text>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 4 }}>0</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>days</Text>
          </View>
          <View style={{
            flex: 1,
            backgroundColor: '#1A1A2E',
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: '#374151',
          }}>
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>THIS WEEK</Text>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 4 }}>0</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>workouts</Text>
          </View>
        </View>

        {/* Goal Card */}
        {profile?.goal_primary && (
          <View style={{
            backgroundColor: '#1A1A2E',
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: '#374151',
          }}>
            <Text style={{ color: '#9CA3AF', fontSize: 14 }}>YOUR GOAL</Text>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 8 }}>
              {profile.goal_primary.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </View>
        )}

        {/* No Plan CTA */}
        {!profile?.current_plan_id && (
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
              Create Your First Plan
            </Text>
            <Text style={{ color: '#E9D5FF', marginTop: 4 }}>
              Get a personalized workout plan in minutes
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
