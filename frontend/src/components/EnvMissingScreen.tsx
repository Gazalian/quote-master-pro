/**
 * Full-screen recovery surface for the "env not configured" state.
 *
 * Replaces the previous infinite-spinner / blank-page behaviour. We render
 * this *before* AuthProvider / React Query touch anything, so a misconfigured
 * deploy is visible and self-explanatory instead of mysteriously silent.
 */
export const EnvMissingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background p-6">
    <div className="w-full max-w-lg bg-card border border-destructive/30 rounded-2xl p-6 shadow-md">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-foreground leading-tight">App not configured</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Supabase credentials are missing — the frontend can't connect to your project.
          </p>
        </div>
      </div>

      <div className="bg-secondary/50 rounded-xl p-4 mb-4">
        <p className="text-xs font-semibold text-foreground mb-2">Missing env vars:</p>
        <ul className="text-xs font-mono text-foreground space-y-1">
          <li>• <code>VITE_SUPABASE_URL</code></li>
          <li>• <code>VITE_SUPABASE_ANON_KEY</code></li>
        </ul>
      </div>

      <div className="space-y-3 text-sm text-foreground">
        <p className="font-semibold">To fix locally:</p>
        <ol className="list-decimal pl-5 space-y-1.5 text-[13px] text-muted-foreground">
          <li>
            Add both variables to <code className="bg-secondary px-1 rounded text-foreground">.env.local</code> in
            the project root.
          </li>
          <li>
            Copy the URL and <em>anon</em> key from your Supabase project's API settings.
          </li>
          <li>
            Restart the dev server — Vite reads <code className="bg-secondary px-1 rounded text-foreground">.env</code> files
            only at startup.
          </li>
        </ol>

        <p className="font-semibold pt-2">In production:</p>
        <p className="text-[13px] text-muted-foreground">
          Set both variables in your hosting provider (Vercel → Project Settings → Environment
          Variables) and trigger a fresh deploy.
        </p>
      </div>

      <div className="mt-5 pt-4 border-t border-border/50 text-[11px] text-muted-foreground">
        Any stored auth tokens for this app have been cleared to prevent a refresh loop.
        Once the env is set, you'll need to sign in again.
      </div>
    </div>
  </div>
);
