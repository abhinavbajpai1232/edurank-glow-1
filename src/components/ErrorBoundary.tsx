import React, { ReactNode, ErrorInfo } from 'react';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorCount: number;
}

/**
 * Global Error Boundary for unhandled React errors
 * Prevents entire app crash and provides recovery options
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error);
      console.error('Error info:', errorInfo);
    }

    // TODO: Send to error tracking service (Sentry, etc.)
  }

  resetError = () => {
    const { errorCount } = this.state;
    if (errorCount > 3) {
      // Prevent infinite loop of errors
      window.location.href = '/';
      return;
    }
    this.setState({
      hasError: false,
      error: undefined,
      errorCount: errorCount + 1,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="max-w-md w-full glass-card rounded-2xl p-8">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-center mb-3">
              Oops! Something went wrong
            </h1>
            
            <p className="text-muted-foreground text-center mb-6">
              We encountered an unexpected error. Don't worry, we're here to help!
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-xs text-destructive font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button
                onClick={this.resetError}
                className="w-full"
                variant="default"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              <Button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.href = '/';
                }}
                variant="outline"
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-6">
              Error attempt: {this.state.errorCount}/3
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Async error boundary handler for async operations
 */
export const withAsyncErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P) => (
    <ErrorBoundary>
      <Component {...props} />
    </ErrorBoundary>
  );
};
