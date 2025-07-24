
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error Boundary component that catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 * 
 * This helps prevent the entire app from crashing when a single component encounters an error.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // In production, you could send error details to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error reporting service (e.g., Sentry, LogRocket)
      // errorReportingService.captureException(error, { extra: errorInfo });
    }
  }

  private handleReload = () => {
    // Clear error state and reload the page
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  private handleRetry = () => {
    // Clear error state to attempt re-rendering
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI provided as prop
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI with CLIMB-CADE styling
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4" 
             style={{ background: 'linear-gradient(228deg, rgba(206, 228, 210, 0.65) 35%, rgba(239, 115, 38, 0.65) 100%)' }}>
          <div className="retro-container max-w-md w-full text-center space-y-6">
            <div className="text-6xl mb-4">
              <AlertTriangle className="w-16 h-16 text-[#EF7326] mx-auto" />
            </div>
            
            <h1 className="retro-heading text-xl">Oops! Something went wrong</h1>
            
            <p className="retro-body text-sm">
              We encountered an unexpected error. Don't worry, your climbing data is safe!
            </p>

            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left bg-red-50 p-3 rounded border text-xs">
                <summary className="cursor-pointer font-semibold text-red-700">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap text-red-600">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex flex-col space-y-3">
              <Button 
                onClick={this.handleRetry}
                className="retro-button-primary w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button 
                onClick={this.handleReload}
                variant="outline"
                className="w-full"
              >
                Reload Page
              </Button>
            </div>

            <div className="text-center pt-4 border-t-2 border-[#1F1F1F]">
              <div className="flex items-center justify-center space-x-2">
                <svg width="16" height="16" viewBox="0 0 16 16" className="pixel-art">
                  <rect x="6" y="2" width="4" height="2" fill="#EF7326"/>
                  <rect x="4" y="4" width="8" height="2" fill="#EF7326"/>
                  <rect x="2" y="6" width="12" height="6" fill="#EF7326"/>
                  <rect x="7" y="4" width="2" height="2" fill="#FCFCF9"/>
                </svg>
                <span className="retro-label text-[#1F1F1F] text-sm">CLIMB-CADE</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
