import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { envConfigured } from "@/lib/supabase";
import { EnvMissingScreen } from "@/components/EnvMissingScreen";

// Route-level code splitting. Landing page no longer pulls jspdf / dnd-kit /
// the chat page into its bundle.
const LandingPage   = lazy(() => import("@/pages/LandingPage"));
const AuthPage      = lazy(() => import("@/pages/AuthPage"));
const ChatPage      = lazy(() => import("@/pages/ChatPage"));
const QuotesPage    = lazy(() => import("@/pages/QuotesPage"));
const BrandPage     = lazy(() => import("@/pages/BrandPage"));
const ProfilePage   = lazy(() => import("@/pages/ProfilePage"));
const PriceLogPage  = lazy(() => import("@/pages/PriceLogPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Refetch strategy: lean on staleTime, not refetchOnWindowFocus.
      refetchOnWindowFocus: false,
      retry: (failureCount, err: any) => {
        // Don't retry 4xx — they won't get better.
        if (err?.status >= 400 && err?.status < 500) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
    },
  },
});

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) return <Loader />;
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App = () => {
  // Short-circuit before anything tries to use Supabase. Avoids the previous
  // failure mode where AuthProvider would sit in `loading: true` forever and
  // the UI would render a blank loader while the console spammed
  // ERR_NAME_NOT_RESOLVED against placeholder.supabase.co.
  if (!envConfigured) return <EnvMissingScreen />;

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider queryClient={queryClient}>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<Loader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthPage />} />

                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/quotes" element={<QuotesPage />} />
                  <Route path="/brand" element={<BrandPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/pricelog" element={<PriceLogPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
