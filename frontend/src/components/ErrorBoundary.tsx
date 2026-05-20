import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Wraps the route tree so a render error in one template / page doesn't
 * white-screen the entire app. In production it logs to console; swap for
 * Sentry / Logflare when you wire one up.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = (): void => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-card border border-destructive/30 rounded-2xl p-6 text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mb-4 break-words">
            {this.state.error.message}
          </p>
          <button
            onClick={() => {
              this.reset();
              window.location.assign('/');
            }}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Reload app
          </button>
        </div>
      </div>
    );
  }
}
