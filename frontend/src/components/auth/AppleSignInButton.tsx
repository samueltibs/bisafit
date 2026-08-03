import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export function AppleSignInButton() {
  const [loading, setLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  
  useEffect(() => {
    // Check if we're on iOS native platform
    const checkAvailability = async () => {
      try {
        if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
          setIsAvailable(true);
        }
      } catch (err) {
        console.warn('[AppleSignIn] Not available:', err);
      }
    };
    checkAvailability();
  }, []);

  if (!isAvailable) {
    return null;
  }

  const handleSignIn = async () => {
    setLoading(true);
    try {
      // Dynamic import to avoid crashing on non-iOS platforms
      const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');
      
      const response = await SignInWithApple.authorize({
        clientId: 'com.bisagroup.bisafit',
        redirectURI: 'https://bisafit.com/auth/callback',
        scopes: 'email name',
        state: 'bisafit-signin',
      });
      
      if (response?.response?.identityToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: response.response.identityToken,
          nonce: response.response.nonce,
        });
        if (error) throw error;
        toast.success('Signed in with Apple');
      }
    } catch (err: any) {
      console.error('[AppleSignIn] Error:', err);
      toast.error(err?.message || 'Apple sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSignIn} 
      disabled={loading} 
      variant="outline" 
      className="w-full bg-black text-white hover:bg-gray-900 border-black"
    >
      {loading ? 'Signing in...' : ' Sign in with Apple'}
    </Button>
  );
}
