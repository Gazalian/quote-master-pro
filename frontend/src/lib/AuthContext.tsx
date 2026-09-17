import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

interface AuthProviderProps {
  children: React.ReactNode;
  /**
   * Pass the app's React Query client so we can clear cached user data on
   * sign-out. Prevents the previously-leaky module-level cache problem where
   * one user's chat history could surface to the next signed-in user.
   */
  queryClient?: QueryClient;
}

export const AuthProvider = ({ children, queryClient }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setLoading(false);

        // Anything user-scoped must be flushed on logout / user switch.
        if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          queryClient?.clear();
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {/* No entrance animation here. This wrapper sits above every signed-in
          screen, so a fade made each one cost an extra half-second before it
          was readable — including on hard refresh. Transitions belong on the
          things that actually change, not on the whole app. */}
      <div className="min-h-app bg-background text-foreground">{children}</div>
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
