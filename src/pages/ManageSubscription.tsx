/**
 * Manage Subscription Page
 * 
 * Placeholder screen until Stripe Customer Portal is integrated.
 */

import { ArrowLeft, Mail, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EMAIL_SUPPORT } from '@/lib/branding';

export default function ManageSubscription() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="ml-2 text-lg font-semibold">Manage Subscription</h1>
        </div>
      </header>

      <main className="container max-w-lg px-4 py-8">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
              Subscription management will be available in the mobile app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              You'll be able to view your plan details, update payment methods, and manage your subscription directly from the app.
            </p>
            
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm font-medium">Need help now?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Contact our support team and we'll assist you with any subscription questions.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 gap-2"
                onClick={() => window.location.href = `mailto:${EMAIL_SUPPORT}`}
              >
                <Mail className="h-4 w-4" />
                Contact Support
              </Button>
            </div>

            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
