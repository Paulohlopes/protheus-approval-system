import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import ErrorBoundary from './components/ErrorBoundary';
import { LanguageProvider } from './contexts/LanguageContext';

// Lazy loaded components
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));
const MainLayout = lazy(() => import('./components/MainLayout'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DocumentsTablePage = lazy(() => import('./pages/DocumentsTablePage'));

// Loading fallback component
const LoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
    }}
  >
    <CircularProgress size={60} />
  </Box>
);

function App() {
  return (
    <ErrorBoundary level="critical">
      <LanguageProvider>
        <Router>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route
                path="/login"
                element={
                  <ErrorBoundary level="page">
                    <LoginPage />
                  </ErrorBoundary>
                }
              />

              {/* Protected routes with layout */}
              <Route
                path="/documents"
                element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <MainLayout>
                        <DocumentsTablePage />
                      </MainLayout>
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/documents" replace />} />

              {/* Catch all - redirect to documents */}
              <Route path="*" element={<Navigate to="/documents" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
