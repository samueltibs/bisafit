import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PlatformProvider } from "@/hooks/usePlatform";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SubscriptionGate } from "@/components/subscription/SubscriptionGate";
import { AnalyticsDebugPanel } from "@/components/debug/AnalyticsDebugPanel";
import { OverlayDebugPanel } from "@/components/debug/OverlayDebugPanel";
import { IOSScrollDebugPanel } from "@/components/debug/IOSScrollDebugPanel";
import { AppLanguageProvider } from "@/components/AppLanguageProvider";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
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
import AdminAnalytics from "./pages/AdminAnalytics";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <PlatformProvider>
      <AuthProvider>
        <AppLanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
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
            <Route path="*" element={<NotFound />} />
          </Routes>
            <AnalyticsDebugPanel />
            <OverlayDebugPanel />
            <IOSScrollDebugPanel />
          </BrowserRouter>
        </TooltipProvider>
      </AppLanguageProvider>
    </AuthProvider>
  </PlatformProvider>
  </QueryClientProvider>
);

export default App;
