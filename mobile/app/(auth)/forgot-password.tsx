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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(email.trim().toLowerCase());
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F23' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 64, marginBottom: 24 }}>📧</Text>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center' }}>
            Check Your Email
          </Text>
          <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 16, fontSize: 16, lineHeight: 24 }}>
            We've sent a password reset link to {email}. Click the link in the email to reset your password.
          </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity
              style={{
                backgroundColor: '#7C3AED',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                marginTop: 32,
                paddingHorizontal: 32,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Back to Login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

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
          {/* Back button */}
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={{ marginBottom: 32 }}>
              <Text style={{ color: '#7C3AED', fontSize: 16 }}>← Back to Login</Text>
            </TouchableOpacity>
          </Link>

          {/* Header */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#fff' }}>
              Forgot Password?
            </Text>
            <Text style={{ color: '#9CA3AF', marginTop: 8, fontSize: 16 }}>
              No worries, we'll send you reset instructions.
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

            <TouchableOpacity
              onPress={handleResetPassword}
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
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
