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
  Fade,
} from '@mui/material';
import {
  Business,
  Email,
  CheckCircle,
} from '@mui/icons-material';
import { protheusLoginSchema, type ProtheusLoginFormData } from '../schemas/loginSchema';

interface LoginFormProps {
  onSubmit: (data: ProtheusLoginFormData) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

const LoginForm: React.FC<LoginFormProps> = React.memo(({ onSubmit, loading, error }) => {
  const [emailValid, setEmailValid] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ProtheusLoginFormData>({
    resolver: zodResolver(protheusLoginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
    },
  });

  const emailValue = watch('email');

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(emailRegex.test(emailValue || ''));
  }, [emailValue]);

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
                Sistema Protheus
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aprovação de Documentos
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
                    placeholder="seu@email.com"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: emailValid && (
                        <InputAdornment position="end">
                          <Fade in={emailValid}>
                            <CheckCircle color="success" sx={{ fontSize: 20 }} />
                          </Fade>
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
                disabled={loading || !emailValid}
                sx={{
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} color="inherit" />
                    Entrando...
                  </Box>
                ) : (
                  'Entrar'
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