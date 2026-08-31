import * as React from 'react';
import { Button } from './Button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // In production, log without leaking tokens or credentials
    console.error('Unhandled Application Error:', error.message, errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          className="min-h-screen bg-surface-950 flex flex-col items-center justify-center p-6 text-center text-surface-50"
        >
          <div className="max-w-md space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 shadow-2xl">
              <AlertTriangle className="h-8 w-8 text-rose-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold font-display">Something went wrong</h1>
              <p className="text-sm text-surface-300 leading-relaxed">
                CineTheme encountered an unexpected rendering error.
              </p>
              {this.state.error && (
                <div className="rounded-lg bg-surface-900 border border-surface-750 p-3 text-xs text-rose-300 font-mono text-left overflow-auto max-h-32">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <div className="pt-2">
              <Button variant="primary" size="md" onClick={this.handleRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                <span>Reload Application</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
