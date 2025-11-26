import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import ErrorBoundary from './components/ErrorBoundary';
import { LanguageProvider } from './contexts/LanguageContext';

// Lazy load dos componentes para otimização de bundle
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));
const MainLayout = lazy(() => import('./components/MainLayout'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DocumentsTablePage = lazy(() => import('./pages/DocumentsTablePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

// Componente de loading para Suspense
const LoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      bgcolor: 'background.default',
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

              <Route
                path="/admin"
                element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <MainLayout>
                        <AdminPage />
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
