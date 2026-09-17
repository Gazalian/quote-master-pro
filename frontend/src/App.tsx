import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RouteLoader } from "@/components/RouteLoader";
// The landing page is imported statically, not lazily. It is the entry route
// for every first-time visitor, so code-splitting it only bought a spinner and
// a second network round trip before anything could paint. Everything behind
// it — auth, React Query, Supabase, the signed-in routes — stays in a lazy
// chunk that marketing traffic never downloads.
import LandingPage from "@/pages/LandingPage";

const AppShell = lazy(() => import("@/AppShell"));

const App = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/*"
          element={
            <Suspense fallback={<RouteLoader />}>
              <AppShell />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;
