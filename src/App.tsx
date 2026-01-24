import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SubscriptionGate } from "@/components/subscription/SubscriptionGate";
import { AnalyticsDebugPanel } from "@/components/debug/AnalyticsDebugPanel";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import PlanPreview from "./pages/PlanPreview";
import PaywallPage from "./pages/PaywallPage";
import Home from "./pages/Home";
import Plan from "./pages/Plan";
import Workout from "./pages/Workout";
import Nutrition from "./pages/Nutrition";
import Progress from "./pages/Progress";
import Store from "./pages/Store";
import Settings from "./pages/Settings";
import NotificationCenter from "./pages/NotificationCenter";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AnalyticsDebugPanel />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
