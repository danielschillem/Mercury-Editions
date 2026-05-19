import React from 'react';
import Icon from './Icons';

const isDev = import.meta.env.DEV;

/**
 * Error Boundary component pour capturer les erreurs React
 * et afficher une interface de secours
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Log l'erreur (pourrait être envoyé à un service de monitoring)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // En production, pourrait envoyer à Sentry, LogRocket, etc.
    if (typeof window !== 'undefined' && window.reportError) {
      window.reportError(error);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Interface de secours personnalisée
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">
              <Icon name="alert-triangle" size={48} />
            </div>
            <h2 className="error-boundary-title">
              Oups ! Une erreur s'est produite
            </h2>
            <p className="error-boundary-message">
              Nous sommes désolés, quelque chose s'est mal passé. 
              Veuillez réessayer ou rafraîchir la page.
            </p>
            
            {isDev && this.state.error && (
              <details className="error-boundary-details">
                <summary>Détails techniques</summary>
                <pre>{this.state.error.toString()}</pre>
                {this.state.errorInfo && (
                  <pre>{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}
            
            <div className="error-boundary-actions">
              <button 
                className="error-boundary-btn error-boundary-btn-primary"
                onClick={this.handleRetry}
              >
                <Icon name="rotate-ccw" size={16} />
                Réessayer
              </button>
              <button 
                className="error-boundary-btn error-boundary-btn-secondary"
                onClick={this.handleReload}
              >
                <Icon name="refresh-cw" size={16} />
                Rafraîchir la page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC pour envelopper un composant avec ErrorBoundary
 */
export function withErrorBoundary(Component, fallback = null) {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * Hook pour déclencher manuellement une erreur (pour tests)
 */
export function useErrorTrigger() {
  const [shouldThrow, setShouldThrow] = React.useState(false);
  
  if (shouldThrow) {
    throw new Error('Error triggered manually for testing');
  }
  
  return () => setShouldThrow(true);
}

export default ErrorBoundary;
