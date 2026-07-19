import React from 'react';

interface State {
  hasError: boolean;
  message?: string;
}

/**
 * Top-level React error boundary. Wraps the entire app (including providers and
 * the router) so that ANY render/runtime error shows a recoverable screen
 * instead of a blank white page or a hard crash — critical on mobile where a
 * white screen reads as "the app crashed on open". Also logs the error so it's
 * visible in `adb logcat` / remote debugging.
 */
export class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Surface in device logs for debugging.
    console.error('[RootErrorBoundary] Uncaught error:', error, info);
  }

  private handleReload = () => {
    // Reset to a clean state; on native this reloads the bundled index.
    this.setState({ hasError: false, message: undefined });
    try {
      window.location.assign('/');
    } catch {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#0f172a',
          color: '#e2e8f0',
        }}
      >
        <div style={{ fontSize: '40px' }}>⚠️</div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Something went wrong</h1>
        <p style={{ fontSize: '14px', opacity: 0.8, maxWidth: '340px', margin: 0 }}>
          CareerBridge hit an unexpected error while loading. Please try again.
        </p>
        <button
          onClick={this.handleReload}
          style={{
            marginTop: '8px',
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: 600,
            color: '#0f172a',
            background: '#38bdf8',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
