import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      errorInfo
    });
    
    // Log the error to console as well
    console.error('React ErrorBoundary caught an error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{
          margin: '20px',
          padding: '20px',
          border: '1px solid #ff6b6b',
          borderRadius: '5px',
          backgroundColor: '#ffe5e5',
          color: '#d63031',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h2>Something went wrong 😢</h2>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
            <summary>Show Error Details</summary>
            <p style={{ fontWeight: 'bold' }}>{this.state.error?.toString()}</p>
            <p>Component Stack:</p>
            <pre style={{ 
              padding: '10px', 
              backgroundColor: '#f8f8f8', 
              border: '1px solid #ddd',
              borderRadius: '3px',
              overflowX: 'auto'
            }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0984e3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
