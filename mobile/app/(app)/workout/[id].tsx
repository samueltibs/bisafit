import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { supabase } from '../../../src/lib/supabase';

interface Exercise {
  name: string;
  sets: number;
  reps: string | number;
  rest: string;
  notes?: string;
}

interface WorkoutContent {
  name: string;
  description?: string;
  duration?: string;
  exercises: Exercise[];
}

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [workout, setWorkout] = useState<any>(null);
  const [content, setContent] = useState<WorkoutContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchWorkout();
  }, [id, user]);

  const fetchWorkout = async () => {
    if (!id || !user) return;

    try {
      const { data } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (data) {
        setWorkout(data);
        
        // Parse content
        let parsedContent = data.content;
        if (typeof parsedContent === 'string') {
          try {
            parsedContent = JSON.parse(parsedContent);
          } catch {
            parsedContent = null;
          }
        }
        setContent(parsedContent);
      }
    } catch (error) {
      console.log('Error fetching workout:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteExercise = (index: number) => {
    const newCompleted = new Set(completedExercises);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedExercises(newCompleted);
  };

  const handleCompleteWorkout = async () => {
    if (!workout || !user) return;

    try {
      // Update workout as completed
      await supabase
        .from('workouts')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', workout.id);

      // Log workout session
      await supabase.from('workout_sessions').insert({
        user_id: user.id,
        workout_id: workout.id,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        exercises_completed: completedExercises.size,
        total_exercises: content?.exercises?.length || 0,
      });

      Alert.alert(
        'Workout Complete! 🎉',
        'Great job! Your workout has been logged.',
        [{ text: 'Done', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save workout');
    }
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

  if (!content || !content.exercises) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F23' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center' }}>
            No workout content available
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: '#7C3AED',
              borderRadius: 12,
              padding: 16,
              marginTop: 20,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const progressPercent = (completedExercises.size / content.exercises.length) * 100;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F23' }}>
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#7C3AED', fontSize: 24 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
            {content.name}
          </Text>
          <Text style={{ color: '#9CA3AF', marginTop: 4 }}>
            {content.exercises.length} exercises • {content.duration || '45 min'}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ color: '#9CA3AF', fontSize: 14 }}>Progress</Text>
          <Text style={{ color: '#fff', fontSize: 14 }}>
            {completedExercises.size}/{content.exercises.length}
          </Text>
        </View>
        <View style={{ height: 8, backgroundColor: '#374151', borderRadius: 4 }}>
          <View 
            style={{ 
              width: `${progressPercent}%`, 
              height: '100%', 
              backgroundColor: '#7C3AED', 
              borderRadius: 4 
            }} 
          />
        </View>
      </View>

      {/* Exercise List */}
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {content.exercises.map((exercise, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleCompleteExercise(index)}
            style={{
              backgroundColor: completedExercises.has(index) ? '#1a2e1a' : '#1A1A2E',
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              borderWidth: 2,
              borderColor: completedExercises.has(index) ? '#10B981' : '#374151',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Checkbox */}
              <View style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                borderWidth: 2,
                borderColor: completedExercises.has(index) ? '#10B981' : '#6B7280',
                backgroundColor: completedExercises.has(index) ? '#10B981' : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16,
              }}>
                {completedExercises.has(index) && (
                  <Text style={{ color: '#fff', fontSize: 14 }}>✓</Text>
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ 
                  color: completedExercises.has(index) ? '#10B981' : '#fff', 
                  fontSize: 16, 
                  fontWeight: '600',
                  textDecorationLine: completedExercises.has(index) ? 'line-through' : 'none',
                }}>
                  {exercise.name}
                </Text>
                <View style={{ flexDirection: 'row', marginTop: 8, gap: 16 }}>
                  <View style={{ 
                    backgroundColor: '#252540', 
                    paddingHorizontal: 8, 
                    paddingVertical: 4, 
                    borderRadius: 6 
                  }}>
                    <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
                      {exercise.sets} sets
                    </Text>
                  </View>
                  <View style={{ 
                    backgroundColor: '#252540', 
                    paddingHorizontal: 8, 
                    paddingVertical: 4, 
                    borderRadius: 6 
                  }}>
                    <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
                      {exercise.reps} reps
                    </Text>
                  </View>
                  {exercise.rest && (
                    <View style={{ 
                      backgroundColor: '#252540', 
                      paddingHorizontal: 8, 
                      paddingVertical: 4, 
                      borderRadius: 6 
                    }}>
                      <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
                        {exercise.rest} rest
                      </Text>
                    </View>
                  )}
                </View>
                {exercise.notes && (
                  <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 8, fontStyle: 'italic' }}>
                    💡 {exercise.notes}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Complete Button */}
        <TouchableOpacity
          onPress={handleCompleteWorkout}
          disabled={completedExercises.size === 0}
          style={{
            backgroundColor: completedExercises.size > 0 ? '#10B981' : '#374151',
            borderRadius: 16,
            padding: 20,
            alignItems: 'center',
            marginTop: 20,
            marginBottom: 40,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
            {completedExercises.size === content.exercises.length 
              ? '🎉 Complete Workout' 
              : `Complete (${completedExercises.size}/${content.exercises.length})`
            }
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
