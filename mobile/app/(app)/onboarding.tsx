import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { ENV } from '../../src/lib/config';

const GOALS = [
  { id: 'build_muscle', label: 'Build Muscle', icon: '💪' },
  { id: 'lose_weight', label: 'Lose Weight', icon: '🔥' },
  { id: 'get_stronger', label: 'Get Stronger', icon: '🏋️' },
  { id: 'improve_endurance', label: 'Improve Endurance', icon: '🏃' },
  { id: 'stay_healthy', label: 'Stay Healthy', icon: '❤️' },
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Beginner', desc: 'New to fitness' },
  { id: 'intermediate', label: 'Intermediate', desc: '1-3 years experience' },
  { id: 'advanced', label: 'Advanced', desc: '3+ years experience' },
];

const DAYS_OPTIONS = [2, 3, 4, 5, 6];

export default function OnboardingScreen() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    goal: '',
    experience: '',
    daysPerWeek: 4,
  });

  const handleNext = () => {
    if (step === 1 && !formData.fullName.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }
    if (step === 2 && !formData.goal) {
      Alert.alert('Required', 'Please select a goal');
      return;
    }
    if (step === 3 && !formData.experience) {
      Alert.alert('Required', 'Please select your experience level');
      return;
    }
    
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Update user profile
      const { error } = await supabase
        .from('users_profile')
        .upsert({
          id: user.id,
          full_name: formData.fullName.trim(),
          goal_primary: formData.goal,
          experience_level: formData.experience,
          days_per_week: formData.daysPerWeek,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Generate workout plan
      setGenerating(true);
      const response = await fetch(`${ENV.BACKEND_URL}/api/generate-week`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          goal: formData.goal,
          experience_level: formData.experience,
          days_per_week: formData.daysPerWeek,
          start_date: getNextMonday(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate plan');
      }

      Alert.alert(
        'Plan Created! 🎉',
        'Your personalized workout plan is ready.',
        [{ text: 'Let\'s Go!', onPress: () => router.replace('/(app)/home') }]
      );
    } catch (error) {
      console.error('Onboarding error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  const getNextMonday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday.toISOString().split('T')[0];
  };

  const ProgressDots = () => (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
      {[1, 2, 3, 4].map((s) => (
        <View
          key={s}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: s <= step ? '#7C3AED' : '#374151',
          }}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F23' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20 }}>
        {step > 1 && (
          <TouchableOpacity onPress={() => setStep(step - 1)}>
            <Text style={{ color: '#7C3AED', fontSize: 24 }}>←</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#9CA3AF' }}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
        <ProgressDots />

        {/* Step 1: Name */}
        {step === 1 && (
          <View>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center' }}>
              What's your name?
            </Text>
            <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 8, marginBottom: 32 }}>
              Let's personalize your experience
            </Text>
            <TextInput
              style={{
                backgroundColor: '#1A1A2E',
                borderRadius: 16,
                padding: 20,
                color: '#fff',
                fontSize: 18,
                textAlign: 'center',
                borderWidth: 1,
                borderColor: '#374151',
              }}
              placeholder="Enter your name"
              placeholderTextColor="#6B7280"
              value={formData.fullName}
              onChangeText={(text) => setFormData({ ...formData, fullName: text })}
              autoFocus
            />
          </View>
        )}

        {/* Step 2: Goal */}
        {step === 2 && (
          <View>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center' }}>
              What's your goal?
            </Text>
            <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 8, marginBottom: 32 }}>
              We'll customize your plan based on this
            </Text>
            <View style={{ gap: 12 }}>
              {GOALS.map((goal) => (
                <TouchableOpacity
                  key={goal.id}
                  onPress={() => setFormData({ ...formData, goal: goal.id })}
                  style={{
                    backgroundColor: formData.goal === goal.id ? '#7C3AED' : '#1A1A2E',
                    borderRadius: 16,
                    padding: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: formData.goal === goal.id ? '#7C3AED' : '#374151',
                  }}
                >
                  <Text style={{ fontSize: 32, marginRight: 16 }}>{goal.icon}</Text>
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '500' }}>{goal.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 3: Experience */}
        {step === 3 && (
          <View>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center' }}>
              Your experience level?
            </Text>
            <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 8, marginBottom: 32 }}>
              This helps us adjust intensity
            </Text>
            <View style={{ gap: 12 }}>
              {EXPERIENCE_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.id}
                  onPress={() => setFormData({ ...formData, experience: level.id })}
                  style={{
                    backgroundColor: formData.experience === level.id ? '#7C3AED' : '#1A1A2E',
                    borderRadius: 16,
                    padding: 20,
                    borderWidth: 2,
                    borderColor: formData.experience === level.id ? '#7C3AED' : '#374151',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>{level.label}</Text>
                  <Text style={{ color: '#D1D5DB', marginTop: 4 }}>{level.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 4: Days per week */}
        {step === 4 && (
          <View>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center' }}>
              How many days?
            </Text>
            <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 8, marginBottom: 32 }}>
              Days per week you want to work out
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              {DAYS_OPTIONS.map((days) => (
                <TouchableOpacity
                  key={days}
                  onPress={() => setFormData({ ...formData, daysPerWeek: days })}
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    backgroundColor: formData.daysPerWeek === days ? '#7C3AED' : '#1A1A2E',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: formData.daysPerWeek === days ? '#7C3AED' : '#374151',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{days}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 16 }}>
              {formData.daysPerWeek} days selected
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Next Button */}
      <View style={{ padding: 20 }}>
        <TouchableOpacity
          onPress={handleNext}
          disabled={loading || generating}
          style={{
            backgroundColor: '#7C3AED',
            borderRadius: 16,
            padding: 20,
            alignItems: 'center',
            opacity: loading || generating ? 0.7 : 1,
          }}
        >
          {loading || generating ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <ActivityIndicator color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 18 }}>
                {generating ? 'Creating Your Plan...' : 'Saving...'}
              </Text>
            </View>
          ) : (
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 18 }}>
              {step === 4 ? 'Create My Plan' : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
