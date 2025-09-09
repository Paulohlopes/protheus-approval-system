import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Avatar,
  Tabs,
  Tab,
  Container,
  Stack,
} from '@mui/material';
import { Business, Email } from '@mui/icons-material';
import { protheusLoginSchema, type ProtheusLoginFormData } from '../schemas/loginSchema';

interface LoginFormProps {
  onSubmit: (data: ProtheusLoginFormData) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

const LoginForm: React.FC<LoginFormProps> = React.memo(({ onSubmit, loading, error }) => {
  const [tabValue, setTabValue] = useState(0);
  
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ProtheusLoginFormData>({
    resolver: zodResolver(protheusLoginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
    },
  });


  const handleFormSubmit = async (data: ProtheusLoginFormData) => {
    console.log('LoginForm.handleFormSubmit - Submitting:', data);
    try {
      await onSubmit(data);
      console.log('LoginForm.handleFormSubmit - Submit successful');
    } catch (err: any) {
      console.error('LoginForm.handleFormSubmit - Submit error:', err);
      // Error handling is managed by parent component
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    reset(); // Clear form when switching tabs
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            width: '100%',
            maxWidth: 480,
            p: 4,
            borderRadius: 2,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Avatar
              sx={{
                m: 1,
                bgcolor: 'primary.main',
                width: 56,
                height: 56,
              }}
            >
              <Business />
            </Avatar>
            <Typography component="h1" variant="h4" fontWeight={600} textAlign="center">
              Sistema de Aprovação
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" mt={1}>
              Entre com seu e-mail corporativo para acessar o sistema
            </Typography>
          </Box>


          {/* Login Type Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label="Login com E-mail" />
              <Tab label="Login Administrativo" disabled />
            </Tabs>
          </Box>

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ mt: 1 }}>
            <Stack spacing={3}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="E-mail"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    placeholder="seuemail@empresa.com"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    InputProps={{
                      startAdornment: (
                        <Email sx={{ color: 'text.secondary', mr: 1, ml: 0.5 }} />
                      ),
                    }}
                  />
                )}
              />


              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={20} color="inherit" />
                    Entrando no sistema...
                  </Box>
                ) : (
                  'Entrar no Sistema'
                )}
              </Button>
            </Stack>
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Sistema seguro de aprovação integrado ao Protheus
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
});

export default LoginForm;