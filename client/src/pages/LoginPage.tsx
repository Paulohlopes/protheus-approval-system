import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuthStore } from '../stores/authStore';
import LoginForm from '../components/LoginForm';
import type { ProtheusLoginFormData } from '../schemas/loginSchema';

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  const location = useLocation();
  
  // Get the intended destination or default to dashboard
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Clear any previous errors when component mounts
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, []);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleLogin = async (data: ProtheusLoginFormData): Promise<void> => {
    await login(data);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <LoginForm
        onSubmit={handleLogin}
        loading={isLoading}
        error={error}
      />
    </Box>
  );
};

export default LoginPage;