import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email.trim().toLowerCase(), password);
    setLoading(false);

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else {
      Alert.alert(
        'Check Your Email',
        'We sent you a verification link. Please check your email and click the link to verify your account.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F23' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <Text style={{ fontSize: 48, fontWeight: 'bold', color: '#7C3AED' }}>
              BisaFit
            </Text>
            <Text style={{ color: '#9CA3AF', marginTop: 8, fontSize: 16 }}>
              Create Your Account
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ color: '#D1D5DB', marginBottom: 8, fontSize: 14 }}>Email</Text>
              <TextInput
                style={{
                  backgroundColor: '#1A1A2E',
                  borderRadius: 12,
                  padding: 16,
                  color: '#fff',
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: '#374151',
                }}
                placeholder="Enter your email"
                placeholderTextColor="#6B7280"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View>
              <Text style={{ color: '#D1D5DB', marginBottom: 8, fontSize: 14 }}>Password</Text>
              <TextInput
                style={{
                  backgroundColor: '#1A1A2E',
                  borderRadius: 12,
                  padding: 16,
                  color: '#fff',
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: '#374151',
                }}
                placeholder="Create a password"
                placeholderTextColor="#6B7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View>
              <Text style={{ color: '#D1D5DB', marginBottom: 8, fontSize: 14 }}>Confirm Password</Text>
              <TextInput
                style={{
                  backgroundColor: '#1A1A2E',
                  borderRadius: 12,
                  padding: 16,
                  color: '#fff',
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: '#374151',
                }}
                placeholder="Confirm your password"
                placeholderTextColor="#6B7280"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              onPress={handleSignup}
              disabled={loading}
              style={{
                backgroundColor: '#7C3AED',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                marginTop: 8,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text style={{ color: '#6B7280', textAlign: 'center', marginTop: 16, fontSize: 12 }}>
            By signing up, you agree to our Terms of Service and Privacy Policy
          </Text>

          {/* Sign in link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32 }}>
            <Text style={{ color: '#9CA3AF' }}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={{ color: '#7C3AED', fontWeight: '600' }}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
