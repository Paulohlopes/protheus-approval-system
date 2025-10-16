import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import DocumentsTablePage from './pages/DocumentsTablePage';
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  return (
    <ErrorBoundary level="critical">
      <LanguageProvider>
        <Router>
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
      </Router>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
