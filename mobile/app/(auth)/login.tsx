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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);

    if (error) {
      Alert.alert('Login Failed', error.message);
    } else {
      router.replace('/(app)/home');
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
              Your AI-Powered Fitness Coach
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
                placeholder="Enter your password"
                placeholderTextColor="#6B7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity style={{ alignSelf: 'flex-end' }}>
                <Text style={{ color: '#7C3AED', fontSize: 14 }}>Forgot Password?</Text>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity
              onPress={handleLogin}
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
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign up link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32 }}>
            <Text style={{ color: '#9CA3AF' }}>Don't have an account? </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text style={{ color: '#7C3AED', fontWeight: '600' }}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
