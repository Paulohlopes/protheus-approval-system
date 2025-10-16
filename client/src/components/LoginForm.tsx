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
  Container,
  Stack,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Business,
  Person,
  Lock,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { protheusLoginSchema, type ProtheusLoginFormData } from '../schemas/loginSchema';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginFormProps {
  onSubmit: (data: ProtheusLoginFormData) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

const LoginForm: React.FC<LoginFormProps> = React.memo(({ onSubmit, loading, error }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formValid, setFormValid] = useState(false);
  const { t } = useLanguage();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ProtheusLoginFormData>({
    resolver: zodResolver(protheusLoginSchema),
    mode: 'onChange',
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const usernameValue = watch('username');
  const passwordValue = watch('password');

  useEffect(() => {
    setFormValid(!!usernameValue && !!passwordValue && !errors.username && !errors.password);
  }, [usernameValue, passwordValue, errors]);

  const handleFormSubmit = async (data: ProtheusLoginFormData) => {
    try {
      await onSubmit(data);
    } catch (err: any) {
      console.error('LoginForm.handleFormSubmit - Submit error:', err);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        overflow: 'auto',
      }}
    >
      <Container component="main" maxWidth="xs">
        <Paper
          elevation={8}
          sx={{
            p: 4,
            borderRadius: 2,
            backgroundColor: 'background.paper',
          }}
        >
          {/* Logo e Título */}
          <Stack spacing={2} alignItems="center" mb={4}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Business sx={{ fontSize: 32, color: 'white' }} />
            </Box>

            <Box textAlign="center">
              <Typography variant="h5" fontWeight={600} gutterBottom>
                {t?.login?.title || 'Sistema Protheus'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t?.login?.subtitle || 'Aprovação de Documentos'}
              </Typography>
            </Box>
          </Stack>

          {/* Mensagem de erro */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Formulário */}
          <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
            <Stack spacing={3}>
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={t?.login?.usernameLabel || 'Usuário'}
                    type="text"
                    autoComplete="username"
                    autoFocus
                    placeholder={t?.login?.usernamePlaceholder || 'seu.usuario'}
                    error={!!errors.username}
                    helperText={errors.username?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="action" />
                        </InputAdornment>
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
                    label={t?.login?.passwordLabel || 'Senha'}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder={t?.login?.passwordPlaceholder || '••••••••'}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
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
                disabled={loading || !formValid}
                sx={{
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} color="inherit" />
                    {t?.login?.loggingIn || 'Entrando...'}
                  </Box>
                ) : (
                  t?.login?.loginButton || 'Entrar'
                )}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
});

LoginForm.displayName = 'LoginForm';

export default LoginForm;