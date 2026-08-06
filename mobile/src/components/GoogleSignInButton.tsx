import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { supabase } from '../lib/supabase';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

// Google OAuth Client IDs from Google Cloud Console
const GOOGLE_WEB_CLIENT_ID = '848182182705-ssof1qrt27lh6uuesga4avng65j51no4.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = '848182182705-jiko6v3bon544jrdnmnk75roa0kes8ki.apps.googleusercontent.com';

export function GoogleSignInButton({ onSuccess, onError }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    // Configure Google Sign In on mount
    try {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        iosClientId: Platform.OS === 'ios' ? GOOGLE_IOS_CLIENT_ID : undefined,
        offlineAccess: true,
      });
      setConfigured(true);
    } catch (error) {
      console.error('Google Sign In configuration error:', error);
    }
  }, []);

  async function handleGoogleSignIn() {
    if (!configured) {
      Alert.alert('Error', 'Google Sign In is not configured');
      return;
    }

    setLoading(true);

    try {
      // Check if Play Services are available (Android only)
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();

      if (!userInfo.data?.idToken) {
        throw new Error('No ID token received from Google');
      }

      // Sign in with Supabase using the Google ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: userInfo.data.idToken,
      });

      if (error) throw error;

      // Update user profile with Google info if available
      if (userInfo.data.user) {
        await supabase.auth.updateUser({
          data: {
            full_name: userInfo.data.user.name,
            avatar_url: userInfo.data.user.photo,
          },
        });
      }

      console.log('Google Sign In successful:', data.user?.id);
      onSuccess?.();
    } catch (error: any) {
      // Handle specific error codes
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled - don't show error
        setLoading(false);
        return;
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Sign in already in progress
        setLoading(false);
        return;
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services is not available');
      } else {
        console.error('Google Sign In error:', error);
        Alert.alert('Sign In Failed', error?.message ?? 'Unknown error occurred');
      }
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TouchableOpacity
      onPress={handleGoogleSignIn}
      disabled={loading || !configured}
      style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color="#4285F4" />
      ) : (
        <>
          <Text style={{ fontSize: 20, marginRight: 12 }}>🔵</Text>
          <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '600' }}>
            Continue with Google
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
