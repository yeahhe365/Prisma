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
        <div className="flex h-screen flex-col items-center justify-center bg-[var(--theme-bg-secondary)] p-8 text-center text-[var(--theme-text-primary)]">
          <div className="text-6xl mb-4">😵</div>
          <h1 className="mb-2 text-xl font-semibold">Something went wrong</h1>
          <p className="mb-6 max-w-md text-sm text-[var(--theme-text-secondary)]">
            An unexpected error occurred. Please refresh the page to continue.
          </p>
          {this.state.error && (
            <pre className="mb-6 max-w-lg overflow-auto rounded-lg border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] p-4 text-left text-xs text-[var(--theme-text-secondary)]">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-[var(--theme-bg-accent)] px-4 py-2 text-sm font-medium text-[var(--theme-text-accent)] transition-colors hover:bg-[var(--theme-bg-accent-hover)]"
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
