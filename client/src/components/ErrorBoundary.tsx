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
import { useLanguage } from '../contexts/LanguageContext';

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

    // Check if error is related to browser extensions
    const isExtensionError = this.isExtensionRelatedError(error);

    // Log error
    logger.error('ErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      level: this.props.level || 'component',
      retryCount: this.retryCount,
      isExtensionError
    });

    if (isExtensionError) {
      logger.warn('Browser extension interference detected:', error.message);
    }

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to monitoring service (if configured)
    this.reportError(error, errorInfo);
  }

  private isExtensionRelatedError = (error: Error): boolean => {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorStack = error.stack?.toLowerCase() || '';

    return (
      errorMessage.includes('extension context invalidated') ||
      errorMessage.includes('message channel closed') ||
      errorMessage.includes('extension') ||
      errorMessage.includes('chrome-extension') ||
      errorMessage.includes('moz-extension') ||
      errorStack.includes('extension://') ||
      errorStack.includes('chrome-extension://') ||
      errorStack.includes('moz-extension://') ||
      // Common extension-related error patterns
      errorMessage.includes('script error') ||
      errorMessage.includes('non-error promise rejection')
    );
  };

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
            {t?.errorBoundary?.errorDetails || 'Error Details'}
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {t?.errorBoundary?.errorId || 'Error ID'}: {errorId}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="medium" gutterBottom>
              {t?.errorBoundary?.message || 'Message'}:
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
                {t?.errorBoundary?.stackTrace || 'Stack Trace'}:
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
                {t?.errorBoundary?.componentStack || 'Component Stack'}:
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
          <ErrorBoundaryContent
            level="critical"
            onRetry={this.handleRetry}
            onReload={this.handleReload}
            canRetry={canRetry}
            showDetails={this.state.showDetails}
            onToggleDetails={this.toggleDetails}
            renderErrorDetails={this.renderErrorDetails}
          />
        );

      case 'page':
        return (
          <ErrorBoundaryContent
            level="page"
            onRetry={this.handleRetry}
            onReload={this.handleReload}
            canRetry={canRetry}
            showDetails={this.state.showDetails}
            onToggleDetails={this.toggleDetails}
            renderErrorDetails={this.renderErrorDetails}
          />
        );

      default: // component level
        return (
          <ErrorBoundaryContent
            level="component"
            onRetry={this.handleRetry}
            onReload={this.handleReload}
            canRetry={canRetry}
            showDetails={this.state.showDetails}
            onToggleDetails={this.toggleDetails}
            renderErrorDetails={this.renderErrorDetails}
          />
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

// Functional component for rendering error content with translations
interface ErrorBoundaryContentProps {
  level: 'page' | 'component' | 'critical';
  onRetry: () => void;
  onReload: () => void;
  canRetry: boolean;
  showDetails: boolean;
  onToggleDetails: () => void;
  renderErrorDetails: () => React.ReactNode;
}

const ErrorBoundaryContent: React.FC<ErrorBoundaryContentProps> = ({
  level,
  onRetry,
  onReload,
  canRetry,
  showDetails,
  onToggleDetails,
  renderErrorDetails
}) => {
  const { t } = useLanguage();

  switch (level) {
    case 'critical':
      return (
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Box textAlign="center">
            <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 3 }} />
            <Typography variant="h3" component="h1" gutterBottom>
              {t?.errorBoundary?.criticalTitle || 'Oops! Algo deu errado'}
            </Typography>
            <Typography variant="h6" color="text.secondary" paragraph>
              {t?.errorBoundary?.criticalSubtitle || 'Uma falha crítica ocorreu no sistema. Nossa equipe foi notificada.'}
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={onReload}
                size="large"
              >
                {t?.errorBoundary?.reloadApp || 'Recarregar Aplicação'}
              </Button>
            </Stack>
          </Box>
        </Container>
      );

    case 'page':
      return (
        <Container maxWidth="sm" sx={{ py: 6 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>{t?.errorBoundary?.pageTitle || 'Erro na Página'}</AlertTitle>
            {t?.errorBoundary?.pageSubtitle || 'Não foi possível carregar esta página. Tente novamente ou volte para a página inicial.'}
          </Alert>

          <Stack direction="row" spacing={2} justifyContent="center">
            {canRetry && (
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={onRetry}
              >
                {t?.common?.tryAgain || 'Tentar Novamente'}
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={() => window.history.back()}
            >
              {t?.common?.back || 'Voltar'}
            </Button>
          </Stack>

          {(isDevelopment || config.dev.logLevel === 'debug') && (
            <Box sx={{ mt: 3 }}>
              <Button
                variant="text"
                startIcon={showDetails ? <ExpandLess /> : <ExpandMore />}
                onClick={onToggleDetails}
                size="small"
              >
                {showDetails ? (t?.common?.hideDetails || 'Ocultar') : (t?.common?.showDetails || 'Mostrar')} Detalhes
              </Button>
              {renderErrorDetails()}
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
                  onClick={onRetry}
                  title={t?.common?.tryAgain || 'Tentar novamente'}
                >
                  <Refresh fontSize="small" />
                </IconButton>
              )}
              {(isDevelopment || config.dev.logLevel === 'debug') && (
                <IconButton
                  size="small"
                  onClick={onToggleDetails}
                  title={t?.errorBoundary?.errorDetails || 'Detalhes do erro'}
                >
                  <BugReport fontSize="small" />
                </IconButton>
              )}
            </Stack>
          }
        >
          <AlertTitle>{t?.errorBoundary?.componentTitle || 'Componente com Error'}</AlertTitle>
          {t?.errorBoundary?.componentSubtitle || 'Este componente encontrou um problema e não pode ser exibido.'}
          {!canRetry && ` ${t?.common?.reload || 'Recarregue a página para tentar novamente.'}`}

          {renderErrorDetails()}
        </Alert>
      );
  }
};

export default ErrorBoundary;