import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-8 text-center">
          <div className="text-6xl mb-4">😵</div>
          <h1 className="text-xl font-semibold text-slate-800 mb-2">Something went wrong</h1>
          <p className="text-sm text-slate-500 mb-6 max-w-md">
            An unexpected error occurred. Please refresh the page to continue.
          </p>
          {this.state.error && (
            <pre className="text-xs text-left bg-slate-100 rounded-lg p-4 max-w-lg overflow-auto text-slate-600 mb-6">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
