import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Stack,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh,
  BugReport,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { config, logger, isDevelopment } from '../config/environment';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  level?: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    errorId: ''
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error
    logger.error('ErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      level: this.props.level || 'component',
      retryCount: this.retryCount
    });

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to monitoring service (if configured)
    this.reportError(error, errorInfo);
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In production, you might want to send this to an error tracking service
      // like Sentry, LogRocket, or custom endpoint
      
      if (config.dev.logLevel === 'debug' || isDevelopment) {
        console.group('🚨 Error Boundary Report');
        console.error('Error:', error);
        console.error('Error Info:', errorInfo);
        console.error('Error ID:', this.state.errorId);
        console.error('Props:', this.props);
        console.groupEnd();
      }

      // Example: Send to monitoring service
      // await api.post('/api/errors', {
      //   message: error.message,
      //   stack: error.stack,
      //   componentStack: errorInfo.componentStack,
      //   url: window.location.href,
      //   userAgent: navigator.userAgent,
      //   timestamp: new Date().toISOString(),
      //   errorId: this.state.errorId
      // });
    } catch (reportingError) {
      logger.error('Failed to report error:', reportingError);
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        showDetails: false
      });
      
      logger.info(`Retrying component render (attempt ${this.retryCount})`);
    } else {
      logger.warn('Maximum retry attempts reached');
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  private renderErrorDetails = () => {
    const { error, errorInfo, errorId } = this.state;
    
    if (!error || !errorInfo) return null;

    return (
      <Collapse in={this.state.showDetails}>
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2, 
            mt: 2, 
            bgcolor: 'grey.50',
            border: '1px solid',
            borderColor: 'grey.300'
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Error Details
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Error ID: {errorId}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="medium" gutterBottom>
              Message:
            </Typography>
            <Typography 
              variant="body2" 
              component="pre" 
              sx={{ 
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                bgcolor: 'grey.100',
                p: 1,
                borderRadius: 1
              }}
            >
              {error.message}
            </Typography>
          </Box>

          {isDevelopment && error.stack && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                Stack Trace:
              </Typography>
              <Typography 
                variant="body2" 
                component="pre" 
                sx={{ 
                  fontSize: '0.65rem',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  bgcolor: 'grey.100',
                  p: 1,
                  borderRadius: 1,
                  maxHeight: 200,
                  overflow: 'auto'
                }}
              >
                {error.stack}
              </Typography>
            </Box>
          )}

          {isDevelopment && errorInfo.componentStack && (
            <Box>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                Component Stack:
              </Typography>
              <Typography 
                variant="body2" 
                component="pre" 
                sx={{ 
                  fontSize: '0.65rem',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  bgcolor: 'grey.100',
                  p: 1,
                  borderRadius: 1,
                  maxHeight: 150,
                  overflow: 'auto'
                }}
              >
                {errorInfo.componentStack}
              </Typography>
            </Box>
          )}
        </Paper>
      </Collapse>
    );
  };

  private renderErrorUI = () => {
    const { level = 'component' } = this.props;
    const canRetry = this.retryCount < this.maxRetries;

    // Different layouts based on error level
    switch (level) {
      case 'critical':
        return (
          <Container maxWidth="md" sx={{ py: 8 }}>
            <Box textAlign="center">
              <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 3 }} />
              <Typography variant="h3" component="h1" gutterBottom>
                Oops! Algo deu errado
              </Typography>
              <Typography variant="h6" color="text.secondary" paragraph>
                Uma falha crítica ocorreu no sistema. Nossa equipe foi notificada.
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleReload}
                  size="large"
                >
                  Recarregar Aplicação
                </Button>
              </Stack>
            </Box>
          </Container>
        );

      case 'page':
        return (
          <Container maxWidth="sm" sx={{ py: 6 }}>
            <Alert severity="error" sx={{ mb: 3 }}>
              <AlertTitle>Erro na Página</AlertTitle>
              Não foi possível carregar esta página. Tente novamente ou volte para a página inicial.
            </Alert>
            
            <Stack direction="row" spacing={2} justifyContent="center">
              {canRetry && (
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleRetry}
                >
                  Tentar Novamente
                </Button>
              )}
              <Button
                variant="outlined"
                onClick={() => window.history.back()}
              >
                Voltar
              </Button>
            </Stack>

            {(isDevelopment || config.dev.logLevel === 'debug') && (
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="text"
                  startIcon={this.state.showDetails ? <ExpandLess /> : <ExpandMore />}
                  onClick={this.toggleDetails}
                  size="small"
                >
                  {this.state.showDetails ? 'Ocultar' : 'Mostrar'} Detalhes
                </Button>
                {this.renderErrorDetails()}
              </Box>
            )}
          </Container>
        );

      default: // component level
        return (
          <Alert 
            severity="error" 
            sx={{ m: 2 }}
            action={
              <Stack direction="row" spacing={1}>
                {canRetry && (
                  <IconButton
                    size="small"
                    onClick={this.handleRetry}
                    title="Tentar novamente"
                  >
                    <Refresh fontSize="small" />
                  </IconButton>
                )}
                {(isDevelopment || config.dev.logLevel === 'debug') && (
                  <IconButton
                    size="small"
                    onClick={this.toggleDetails}
                    title="Detalhes do erro"
                  >
                    <BugReport fontSize="small" />
                  </IconButton>
                )}
              </Stack>
            }
          >
            <AlertTitle>Componente com Error</AlertTitle>
            Este componente encontrou um problema e não pode ser exibido.
            {!canRetry && ' Recarregue a página para tentar novamente.'}
            
            {this.renderErrorDetails()}
          </Alert>
        );
    }
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return this.renderErrorUI();
    }

    return this.props.children;
  }
}

// Higher-Order Component for easy wrapping
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook for triggering error boundary from functional components
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: string) => {
    logger.error('Manual error trigger:', error, errorInfo);
    
    // This will trigger the nearest error boundary
    throw error;
  };
};

export default ErrorBoundary;