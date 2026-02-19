import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PlatformProvider } from "@/hooks/usePlatform";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SubscriptionGate } from "@/components/subscription/SubscriptionGate";
import { AppLanguageProvider } from "@/components/AppLanguageProvider";
import { LegalGate } from "@/components/legal";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import EmailVerification from "./pages/EmailVerification";
import Onboarding from "./pages/Onboarding";
import PlanPreview from "./pages/PlanPreview";
import PaywallPage from "./pages/PaywallPage";
import Home from "./pages/Home";
import Plan from "./pages/Plan";
import Workout from "./pages/Workout";
import WorkoutToday from "./pages/WorkoutToday";
import Nutrition from "./pages/Nutrition";
import Progress from "./pages/Progress";
import Store from "./pages/Store";
import Settings from "./pages/Settings";
import NotificationCenter from "./pages/NotificationCenter";
import ManageSubscription from "./pages/ManageSubscription";
import BillingPage from "./pages/BillingPage";
import AdminAnalytics from "./pages/AdminAnalytics";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

// Component to handle auth redirects
function AuthRedirectHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Listen for password recovery events and redirect appropriately
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      
      // If this is a password recovery event, redirect to reset password page
      if (event === 'PASSWORD_RECOVERY') {
        console.log('Password recovery event detected, redirecting to /reset-password');
        window.location.href = '/reset-password';
      }
    });

    // Also check URL hash on mount for recovery tokens
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery' && !window.location.pathname.includes('reset-password')) {
      console.log('Recovery token in URL, redirecting to /reset-password');
      // Preserve the hash when redirecting
      window.location.href = '/reset-password' + window.location.hash;
    }

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <PlatformProvider>
      <AuthProvider>
        <AuthRedirectHandler>
          <AppLanguageProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Public Legal Routes - No authentication required */}
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            
            {/* Email Verification - requires auth but not email verification */}
            <Route path="/verify-email" element={
              <ProtectedRoute requireVerifiedEmail={false}>
                <EmailVerification />
              </ProtectedRoute>
            } />
            
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } />
            <Route path="/plan-preview" element={
              <ProtectedRoute>
                <PlanPreview />
              </ProtectedRoute>
            } />
            <Route path="/paywall" element={
              <ProtectedRoute>
                <PaywallPage />
              </ProtectedRoute>
            } />
            {/* Premium features - gated by subscription */}
            <Route path="/home" element={
              <ProtectedRoute>
                <SubscriptionGate>
                  <Home />
                </SubscriptionGate>
              </ProtectedRoute>
            } />
            <Route path="/plan" element={
              <ProtectedRoute>
                <SubscriptionGate>
                  <Plan />
                </SubscriptionGate>
              </ProtectedRoute>
            } />
            <Route path="/workout/today" element={
              <ProtectedRoute>
                <SubscriptionGate>
                  <WorkoutToday />
                </SubscriptionGate>
              </ProtectedRoute>
            } />
            <Route path="/workout/:id" element={
              <ProtectedRoute>
                <SubscriptionGate>
                  <Workout />
                </SubscriptionGate>
              </ProtectedRoute>
            } />
            <Route path="/nutrition" element={
              <ProtectedRoute>
                <SubscriptionGate>
                  <Nutrition />
                </SubscriptionGate>
              </ProtectedRoute>
            } />
            <Route path="/progress" element={
              <ProtectedRoute>
                <SubscriptionGate>
                  <Progress />
                </SubscriptionGate>
              </ProtectedRoute>
            } />
            {/* Store & Settings - accessible without premium */}
            <Route path="/store" element={
              <ProtectedRoute>
                <Store />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <NotificationCenter />
              </ProtectedRoute>
            } />
            <Route path="/manage-subscription" element={
              <ProtectedRoute>
                <ManageSubscription />
              </ProtectedRoute>
            } />
            {/* Admin Analytics Dashboard */}
            <Route path="/admin/analytics" element={
              <ProtectedRoute>
                <AdminAnalytics />
              </ProtectedRoute>
              } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                {/* Legal Acceptance Gate - shows modal when user needs to accept updated docs */}
                <LegalGate />
              </BrowserRouter>
            </TooltipProvider>
          </AppLanguageProvider>
        </AuthRedirectHandler>
      </AuthProvider>
    </PlatformProvider>
  </QueryClientProvider>
);

export default App;
