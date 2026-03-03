/**
 * Fitbit OAuth Callback Page
 * Handles the OAuth callback from Fitbit and completes the connection
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { FitbitOAuthService } from '@/lib/fitbitOAuthService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function FitbitCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setErrorMessage(searchParams.get('error_description') || 'Authorization was denied');
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setErrorMessage('Missing authorization code or state');
        return;
      }

      try {
        await FitbitOAuthService.handleCallback(code, state);
        setStatus('success');
        
        // Redirect to settings after short delay
        setTimeout(() => {
          navigate('/settings', { replace: true });
        }, 2000);
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Failed to connect Fitbit');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {status === 'loading' && (
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-[#00B0B9]" />
              <h2 className="text-xl font-semibold">Connecting to Fitbit...</h2>
              <p className="text-muted-foreground">Please wait while we complete the connection</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <h2 className="text-xl font-semibold">Fitbit Connected!</h2>
              <p className="text-muted-foreground">Your Fitbit account is now connected to BisaFit</p>
              <p className="text-sm text-muted-foreground">Redirecting to settings...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 mx-auto text-red-500" />
              <h2 className="text-xl font-semibold">Connection Failed</h2>
              <p className="text-muted-foreground">{errorMessage}</p>
              <Button onClick={() => navigate('/settings')} variant="outline" className="w-full">
                Back to Settings
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
