import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import ErrorBoundary from './components/ErrorBoundary';
import { LanguageProvider } from './contexts/LanguageContext';
import { CountryProvider } from './contexts/CountryContext';
import { useAuthStore } from './stores/authStore';
import { useInactivityLogout } from './hooks/useInactivityLogout';

// Lazy load dos componentes para otimização de bundle
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));
const MainLayout = lazy(() => import('./components/MainLayout'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DocumentsTablePage = lazy(() => import('./pages/DocumentsTablePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AllowedTablesPage = lazy(() => import('./pages/admin/AllowedTablesPage'));
const CountryManager = lazy(() => import('./pages/admin/CountryManager'));
const SelectRegistrationTypePage = lazy(() => import('./pages/registration/SelectType').then(m => ({ default: m.SelectRegistrationTypePage })));
const MyRequestsPage = lazy(() => import('./pages/registration/MyRequests').then(m => ({ default: m.MyRequestsPage })));
const DynamicFormPage = lazy(() => import('./pages/registration/DynamicForm').then(m => ({ default: m.DynamicFormPage })));
const EditDraftPage = lazy(() => import('./pages/registration/EditDraft').then(m => ({ default: m.EditDraftPage })));
const ApprovalQueuePage = lazy(() => import('./pages/registration/ApprovalQueue').then(m => ({ default: m.ApprovalQueuePage })));
const SearchRecordPage = lazy(() => import('./pages/registration/SearchRecord').then(m => ({ default: m.SearchRecordPage })));

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

// Component that handles auth initialization and inactivity logout
const AuthManager = ({ children }: { children: React.ReactNode }) => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  // Initialize auth state from secure storage on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Setup inactivity logout
  useInactivityLogout();

  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary level="critical">
      <LanguageProvider>
        <CountryProvider>
          <Router>
            <AuthManager>
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

              <Route
                path="/admin/allowed-tables"
                element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <MainLayout>
                        <AllowedTablesPage />
                      </MainLayout>
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />

              <Route
                path="/admin/countries"
                element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <MainLayout>
                        <CountryManager />
                      </MainLayout>
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />

              {/* Registration routes */}
              <Route
                path="/registration/new"
                element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <MainLayout>
                        <SelectRegistrationTypePage />
                      </MainLayout>
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />

              <Route
                path="/registration/new/:templateId"
                element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <MainLayout>
                        <DynamicFormPage />
                      </MainLayout>
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />

              <Route
                path="/registration/edit/:registrationId"
                element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <MainLayout>
                        <EditDraftPage />
                      </MainLayout>
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />

              <Route
                path="/registration/my-requests"
                element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <MainLayout>
                        <MyRequestsPage />
                      </MainLayout>
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />

              <Route
                path="/registration/approvals"
                element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <MainLayout>
                        <ApprovalQueuePage />
                      </MainLayout>
                    </ProtectedRoute>
                  </ErrorBoundary>
                }
              />

              <Route
                path="/registration/search/:templateId"
                element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <MainLayout>
                        <SearchRecordPage />
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
            </AuthManager>
          </Router>
        </CountryProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
