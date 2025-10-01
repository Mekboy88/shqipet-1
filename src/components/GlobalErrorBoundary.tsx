import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorFallback from './ErrorFallback';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<any>;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class GlobalErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 2;
  
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('🚨 [GLOBAL-ERROR] Error caught by boundary:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 [GLOBAL-ERROR] Component stack:', errorInfo.componentStack);
    console.error('🚨 [GLOBAL-ERROR] Error details:', { error, errorInfo });
    
    this.setState({ errorInfo });
    
    // Report to error monitoring service if available
    if (typeof window !== 'undefined' && 'gtag' in window && typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false
      });
    }
  }

  handleReset = () => {
    console.log('🔄 [GLOBAL-ERROR] Resetting error boundary');
    this.retryCount = 0;
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || ErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.handleReset}
          componentStack={this.state.errorInfo?.componentStack}
        />
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;