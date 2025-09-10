import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
// import LoginPage from './pages/LoginPage';
import ModernLoginPage from './pages/ModernLoginPage';
// import DocumentsPage from './pages/DocumentsPage';
import FloatingDocumentsPage from './pages/FloatingDocumentsPage';

function App() {
  return (
    <ErrorBoundary level="critical">
      <Router>
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              <ErrorBoundary level="page">
                <ModernLoginPage />
              </ErrorBoundary>
            } 
          />
          
          {/* Protected routes */}
          <Route 
            path="/documents" 
            element={
              <ErrorBoundary level="page">
                <ProtectedRoute>
                  <FloatingDocumentsPage />
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
    </ErrorBoundary>
  );
}

export default App;
