import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../lib/supabase';

interface AppleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

function makeNonce(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function AppleSignInButton({ onSuccess, onError }: AppleSignInButtonProps) {
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAvailable);
    }
  }, []);

  // Only show on iOS
  if (Platform.OS !== 'ios') {
    return null;
  }

  if (!available) {
    return null;
  }

  async function handleAppleSignIn() {
    const nonce = makeNonce();
    setLoading(true);

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
        nonce,
      });

      if (!credential.identityToken) {
        throw new Error('Apple did not return an identity token');
      }

      // Sign in with Supabase using the Apple identity token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce,
      });

      if (error) throw error;

      // Apple only provides name/email on first authorization
      // Save it immediately if provided
      if (credential.fullName) {
        const parts = [
          credential.fullName.givenName,
          credential.fullName.middleName,
          credential.fullName.familyName,
        ].filter(Boolean);

        if (parts.length > 0) {
          await supabase.auth.updateUser({
            data: {
              full_name: parts.join(' '),
              given_name: credential.fullName.givenName,
              family_name: credential.fullName.familyName,
            },
          });
        }
      }

      console.log('Apple Sign In successful:', data.user?.id);
      onSuccess?.();
    } catch (error: any) {
      // User cancelled - don't show error
      if (error?.code === 'ERR_REQUEST_CANCELED') {
        setLoading(false);
        return;
      }
      
      console.error('Apple Sign In error:', error);
      Alert.alert('Sign In Failed', error?.message ?? 'Unknown error occurred');
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
        cornerRadius={12}
        style={{ width: '100%', height: 52 }}
        onPress={handleAppleSignIn}
      />
      {loading && (
        <View style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.3)',
          borderRadius: 12,
        }}>
          <ActivityIndicator color="#000" />
        </View>
      )}
    </View>
  );
}
