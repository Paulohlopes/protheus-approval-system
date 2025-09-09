import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import LoginDebug from './components/LoginDebug';
import DocumentsPage from './pages/DocumentsPage';
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
              
              <Route 
                path="/login-debug" 
                element={
                  <ErrorBoundary level="page">
                    <LoginDebug />
                  </ErrorBoundary>
                } 
              />
              
              {/* Protected routes */}
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
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/documents" replace />} />
              
              {/* Catch all - redirect to documents */}
              <Route path="*" element={<Navigate to="/documents" replace />} />
            </Routes>
          </div>
        </Router>
        <ShortcutsHelpDialog />
    </ErrorBoundary>
  );
}

export default App;
