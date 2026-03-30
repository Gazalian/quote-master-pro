import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

export default function AuthPage() {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate('/chat');
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background p-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-2xl border border-border/50">
        <div className="text-center mb-8">
          <div className="mx-auto mb-6">
            <img
              src="/otoqoute logo.png"
              alt="OtoQuote AI Logo"
              className="h-16 w-auto mx-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-[#0056D2] mb-2">
            Welcome to OtoQuote AI
          </h1>
          <p className="text-muted-foreground">Sign in to start generating professional quotes</p>
        </div>

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary))',
                },
              },
            },
            className: {
              anchor: 'text-primary hover:text-primary/80',
              button: 'bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg',
              input: 'bg-background border-input rounded-lg',
              label: 'text-foreground font-medium',
            }
          }}
          providers={[]} // We can add 'google', 'apple' later if needed
          redirectTo={window.location.origin}
        />
      </div>
    </div>
  );
}
