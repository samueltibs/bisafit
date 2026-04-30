import { SignInWithApple } from '@capacitor-community/apple-sign-in';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';

export function AppleSignInButton() {
  const [loading, setLoading] = useState(false);
  
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
    return null;
  }

  const handleSignIn = async () => {
    setLoading(true);
    try {
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
      {loading ? 'Signing in...' : 'ï£¿ Sign in with Apple'}
    </Button>
  );
}
