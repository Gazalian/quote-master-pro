/**
 * Everything behind the marketing page: auth, data fetching, toasts and the
 * signed-in routes.
 *
 * This is a separate lazy chunk on purpose. The landing page at `/` is what
 * every first-time visitor hits, and it needs none of this — no Supabase
 * client, no React Query, no Radix providers. Keeping the shell out of the
 * entry graph is what lets `/` paint without waiting on ~200 kB of app code
 * it will never call.
 */

import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigate, Route, Routes } from "react-router-dom";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { EnvMissingScreen } from "@/components/EnvMissingScreen";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { envConfigured } from "@/lib/supabase";
import { RouteLoader } from "@/components/RouteLoader";

type RetryableError = { status?: number };

const AuthPage = lazy(() => import("@/pages/AuthPage"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));
const QuotesPage = lazy(() => import("@/pages/QuotesPage"));
const BrandPage = lazy(() => import("@/pages/BrandPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const PriceLogPage = lazy(() => import("@/pages/PriceLogPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Refetch strategy: lean on staleTime, not refetchOnWindowFocus.
      refetchOnWindowFocus: false,
      retry: (failureCount, err: unknown) => {
        // Don't retry 4xx — they won't get better.
        const status = (err as RetryableError | undefined)?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) return <RouteLoader label="Signing you in" />;
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

/**
 * Routes are declared relative to the parent splat route in App.tsx, so they
 * carry no leading slash — `auth` here resolves to `/auth`.
 */
const AppShell = () => {
  // Short-circuit before anything tries to use Supabase. Avoids the failure
  // mode where AuthProvider sits in `loading: true` forever while the console
  // fills with ERR_NAME_NOT_RESOLVED against a placeholder host.
  if (!envConfigured) return <EnvMissingScreen />;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <AuthProvider queryClient={queryClient}>
          <Toaster />
          <Sonner />
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="auth" element={<AuthPage />} />

              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="chat" element={<ChatPage />} />
                <Route path="quotes" element={<QuotesPage />} />
                <Route path="brand" element={<BrandPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="pricelog" element={<PriceLogPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default AppShell;
