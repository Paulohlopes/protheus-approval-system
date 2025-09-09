import React, { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert } from '@mui/material';
import { useAuthStore } from '../stores/authStore';

const LoginDebug: React.FC = () => {
  const [email, setEmail] = useState('');
  const { login, isLoading, error, isAuthenticated, user } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('LoginDebug - Attempting login with email:', email);
    try {
      await login({ email });
    } catch (err) {
      console.error('LoginDebug - Login error:', err);
    }
  };

  if (isAuthenticated && user) {
    return (
      <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Typography variant="h5" gutterBottom color="success.main">
          Login Bem Sucedido!
        </Typography>
        <Typography variant="body1">
          <strong>Email:</strong> {user.email}
        </Typography>
        <Typography variant="body1">
          <strong>Nome:</strong> {user.name}
        </Typography>
        <Typography variant="body1">
          <strong>Username:</strong> {user.username}
        </Typography>
        <Typography variant="body1">
          <strong>ID:</strong> {user.id}
        </Typography>
        <Button 
          onClick={() => window.location.href = '/documents'} 
          variant="contained" 
          sx={{ mt: 2 }}
        >
          Ir para Documentos
        </Button>
      </Paper>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper sx={{ p: 4, maxWidth: 400 }}>
        <Typography variant="h4" gutterBottom textAlign="center">
          Login Debug
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </Box>

        <Box sx={{ mt: 3, fontSize: '0.8rem', color: 'text.secondary' }}>
          <Typography variant="caption" display="block">
            Debug Info:
          </Typography>
          <Typography variant="caption" display="block">
            isLoading: {isLoading ? 'true' : 'false'}
          </Typography>
          <Typography variant="caption" display="block">
            isAuthenticated: {isAuthenticated ? 'true' : 'false'}
          </Typography>
          <Typography variant="caption" display="block">
            error: {error || 'none'}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginDebug;