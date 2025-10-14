import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a1a1a',
          color: '#fff',
          padding: '40px'
        }}>
          <h1 style={{ color: '#ef4444', marginBottom: '20px' }}>❌ Something went wrong</h1>
          <p style={{ marginBottom: '20px', fontSize: '16px' }}>The app encountered an error. Please check the console for details.</p>
          
          {this.state.error && (
            <div style={{
              background: '#2a2a2a',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '800px',
              overflow: 'auto',
              marginBottom: '20px'
            }}>
              <p style={{ color: '#fbbf24', fontWeight: 'bold', marginBottom: '10px' }}>Error:</p>
              <pre style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{this.state.error.toString()}</pre>
              
              {this.state.errorInfo && (
                <>
                  <p style={{ color: '#fbbf24', fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' }}>Stack Trace:</p>
                  <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap', opacity: 0.8 }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                </>
              )}
            </div>
          )}
          
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: '#646cff',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

