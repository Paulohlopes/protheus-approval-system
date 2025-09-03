import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DocumentsPage from './pages/DocumentsPage';
import { PurchaseRequestsPage } from './pages/PurchaseRequestsPage';
import { PurchaseOrdersPage } from './pages/PurchaseOrdersPage';
import { useAppShortcuts } from './hooks/useKeyboardShortcuts';
import { useShortcutsHelp } from './components/KeyboardShortcutsHelp';

function App() {
  const { showHelp, ShortcutsHelpDialog } = useShortcutsHelp();
  useAppShortcuts(showHelp);

  return (
    <ErrorBoundary level="critical">
      <Router>
          <div>
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
              
              {/* Protected routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } 
              />
              
              <Route 
                path="/documents" 
                element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <DocumentsPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } 
              />
              
              <Route 
                path="/purchase-requests" 
                element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <PurchaseRequestsPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } 
              />
              
              <Route 
                path="/purchase-orders" 
                element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <PurchaseOrdersPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } 
              />
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Catch all - redirect to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Router>
        <ShortcutsHelpDialog />
    </ErrorBoundary>
  );
}

export default App;
