import React, { useState, useEffect } from 'react';
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
  Chip,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Business, Person, Lock, Computer, Email } from '@mui/icons-material';
import { protheusLoginSchema, type ProtheusLoginFormData } from '../schemas/loginSchema';
import { useWindowsAuth } from '../hooks/useWindowsAuth';

interface LoginFormProps {
  onSubmit: (data: ProtheusLoginFormData) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

const LoginForm: React.FC<LoginFormProps> = React.memo(({ onSubmit, loading, error }) => {
  const [tabValue, setTabValue] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);
  const { windowsInfo, autoFillLogin, hasWindowsInfo } = useWindowsAuth();
  
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
      username: '',
      password: '',
    },
  });

  // Auto-preencher com informações do Windows
  useEffect(() => {
    const loginData = autoFillLogin();
    if (loginData?.username) {
      setValue('username', loginData.username);
    }
  }, []);

  const handleFormSubmit = async (data: ProtheusLoginFormData) => {
    try {
      await onSubmit(data);
    } catch (err) {
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
              Conecte-se ao Protheus ERP para acessar o sistema
            </Typography>
          </Box>

          {/* Windows User Info Display */}
          {hasWindowsInfo && windowsInfo && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Computer sx={{ color: 'primary.main' }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" fontWeight={500} color="primary.dark">
                    Usuário Windows Detectado
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Chip 
                      size="small" 
                      label={windowsInfo.username} 
                      icon={<Person />}
                      sx={{ bgcolor: 'primary.100', color: 'primary.dark' }}
                    />
                    {windowsInfo.email && (
                      <Chip 
                        size="small" 
                        label={windowsInfo.email} 
                        icon={<Email />}
                        sx={{ bgcolor: 'success.100', color: 'success.dark' }}
                      />
                    )}
                  </Stack>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Login Type Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label="Login Protheus" />
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
                name="username"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nome de usuário"
                    autoComplete="username"
                    autoFocus
                    error={!!errors.username}
                    helperText={errors.username?.message}
                    InputProps={{
                      startAdornment: (
                        <Person sx={{ color: 'text.secondary', mr: 1, ml: 0.5 }} />
                      ),
                    }}
                  />
                )}
              />

              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Senha"
                    type="password"
                    autoComplete="current-password"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    InputProps={{
                      startAdornment: (
                        <Lock sx={{ color: 'text.secondary', mr: 1, ml: 0.5 }} />
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
                    Conectando ao Protheus...
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
              Sistema seguro com autenticação OAuth2
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
});

export default LoginForm;