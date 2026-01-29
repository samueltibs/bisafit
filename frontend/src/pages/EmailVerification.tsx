/**
 * Email Verification Page
 * 
 * Shown to users who haven't verified their email address.
 * Provides option to resend verification email.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle2, RefreshCw, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function EmailVerification() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleResendEmail = async () => {
    if (!user?.email) return;
    
    setIsResending(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success('Verification email sent! Check your inbox.');
      
      // Start countdown
      setCountdown(60);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error: any) {
      console.error('Error resending email:', error);
      toast.error(error.message || 'Failed to resend email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      const { data: { user: refreshedUser }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      if (refreshedUser?.email_confirmed_at) {
        toast.success('Email verified! Redirecting...');
        navigate('/onboarding');
      } else {
        toast.error('Email not yet verified. Please check your inbox.');
      }
    } catch (error: any) {
      console.error('Error checking verification:', error);
      toast.error('Failed to check verification status.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Verify Your Email</CardTitle>
            <CardDescription className="mt-2">
              We've sent a verification link to
            </CardDescription>
            <p className="text-sm font-medium text-foreground mt-1">
              {user?.email}
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Click the verification link in the email to activate your account.
              Check your spam folder if you don't see it.
            </AlertDescription>
          </Alert>

          {emailSent && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                Verification email sent! Check your inbox.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button 
              onClick={handleCheckVerification}
              className="w-full"
              size="lg"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              I've Verified My Email
            </Button>

            <Button 
              onClick={handleResendEmail}
              disabled={isResending || countdown > 0}
              variant="outline"
              className="w-full"
              size="lg"
            >
              {isResending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <Button 
              onClick={handleSignOut}
              variant="ghost"
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Verification links expire after 24 hours. If your link has expired,
              click "Resend Verification Email" to get a new one.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
