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
  IconButton,
  Fade,
  Grow,
  Zoom,
  Collapse,
  InputAdornment,
  Tooltip,
  useTheme,
  useMediaQuery,
  Divider,
  Link,
} from '@mui/material';
import {
  Business,
  Email,
  Shield,
  Lock,
  LockOpen,
  CheckCircle,
  Error as ErrorIcon,
  Visibility,
  VisibilityOff,
  AdminPanelSettings,
  Person,
  ArrowForward,
  Security,
  VerifiedUser,
  Help,
} from '@mui/icons-material';
import { protheusLoginSchema, type ProtheusLoginFormData } from '../schemas/loginSchema';
import { keyframes } from '@mui/system';

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const float = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
`;

const gradientAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

interface LoginFormProps {
  onSubmit: (data: ProtheusLoginFormData) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

const LoginForm: React.FC<LoginFormProps> = React.memo(({ onSubmit, loading, error }) => {
  const [tabValue, setTabValue] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [emailValid, setEmailValid] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
    setValue,
  } = useForm<ProtheusLoginFormData>({
    resolver: zodResolver(protheusLoginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
    },
  });

  const emailValue = watch('email');

  useEffect(() => {
    setShowContent(true);
  }, []);

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(emailRegex.test(emailValue || ''));
  }, [emailValue]);

  const handleFormSubmit = async (data: ProtheusLoginFormData) => {
    console.log('LoginForm.handleFormSubmit - Submitting:', data);
    try {
      await onSubmit(data);
      console.log('LoginForm.handleFormSubmit - Submit successful');
    } catch (err: any) {
      console.error('LoginForm.handleFormSubmit - Submit error:', err);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    reset();
    setEmailValid(false);
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg,
          ${theme.palette.mode === 'dark' ? '#1a237e' : '#3f51b5'} 0%,
          ${theme.palette.mode === 'dark' ? '#311b92' : '#7986cb'} 50%,
          ${theme.palette.mode === 'dark' ? '#4527a0' : '#9fa8da'} 100%)`,
        backgroundSize: '400% 400%',
        animation: `${gradientAnimation} 15s ease infinite`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        py: { xs: 2, sm: 4 },
        px: 2,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          filter: 'blur(40px)',
          animation: `${float} 6s ease-in-out infinite`,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          filter: 'blur(40px)',
          animation: `${float} 8s ease-in-out infinite`,
          animationDelay: '2s',
        }}
      />

      <Container component="main" maxWidth="sm">
        <Zoom in={showContent} timeout={800}>
          <Paper
            elevation={24}
            sx={{
              width: '100%',
              maxWidth: { xs: '100%', sm: 480 },
              p: { xs: 2, sm: 4, md: 5 },
              borderRadius: { xs: 2, sm: 4 },
              backdropFilter: 'blur(20px)',
              background: theme.palette.mode === 'dark'
                ? 'rgba(18, 18, 18, 0.9)'
                : 'rgba(255, 255, 255, 0.95)',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[24],
              },
            }}
          >
            {/* Header */}
            <Fade in={showContent} timeout={1000}>
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
                    m: '0 auto 20px',
                    bgcolor: 'primary.main',
                    width: { xs: 60, sm: 72 },
                    height: { xs: 60, sm: 72 },
                    animation: `${pulse} 2s ease-in-out infinite`,
                    boxShadow: '0 4px 20px rgba(63, 81, 181, 0.4)',
                  }}
                >
                  <Business sx={{ fontSize: { xs: 32, sm: 40 } }} />
                </Avatar>

                <Typography
                  component="h1"
                  variant={isMobile ? "h5" : "h4"}
                  fontWeight={700}
                  sx={{
                    background: 'linear-gradient(45deg, #3f51b5 30%, #7986cb 90%)',
                    backgroundClip: 'text',
                    textFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textAlign: 'center',
                    mb: 1,
                  }}
                >
                  Sistema Protheus
                </Typography>

                <Typography
                  variant={isMobile ? "body2" : "subtitle1"}
                  color="text.secondary"
                  textAlign="center"
                  sx={{ mb: 2 }}
                >
                  Aprovação de Documentos
                </Typography>

                <Grow in={showContent} timeout={1200}>
                  <Alert
                    severity="info"
                    icon={<VerifiedUser />}
                    sx={{
                      width: '100%',
                      borderRadius: 2,
                      background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(45deg, rgba(33, 150, 243, 0.1), rgba(33, 150, 243, 0.05))'
                        : 'linear-gradient(45deg, rgba(33, 150, 243, 0.08), rgba(33, 150, 243, 0.03))',
                      border: '1px solid',
                      borderColor: 'info.light',
                      '& .MuiAlert-icon': {
                        animation: `${pulse} 3s ease-in-out infinite`,
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        Conexão segura e criptografada
                      </Typography>
                    </Box>
                  </Alert>
                </Grow>
              </Box>
            </Fade>

            {/* Login Type Tabs */}
            <Fade in={showContent} timeout={1400}>
              <Box sx={{ mb: 3 }}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  variant="fullWidth"
                  textColor="primary"
                  indicatorColor="primary"
                  sx={{
                    borderRadius: 2,
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.03)',
                    '& .MuiTab-root': {
                      fontWeight: 600,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(63, 81, 181, 0.08)',
                      },
                    },
                    '& .Mui-selected': {
                      color: 'primary.main',
                    },
                  }}
                >
                  <Tab
                    label="Login com E-mail"
                    icon={<Email sx={{ fontSize: 20 }} />}
                    iconPosition="start"
                  />
                  <Tab
                    label="Administrativo"
                    icon={<AdminPanelSettings sx={{ fontSize: 20 }} />}
                    iconPosition="start"
                    disabled
                  />
                </Tabs>
              </Box>
            </Fade>

            {/* Error Message */}
            <Collapse in={!!error} timeout={500}>
              <Alert
                severity="error"
                icon={<ErrorIcon />}
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  animation: error ? `${pulse} 0.5s ease` : 'none',
                }}
              >
                {error}
              </Alert>
            </Collapse>

            {/* Form */}
            <Fade in={showContent} timeout={1600}>
              <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
                <Stack spacing={3}>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="E-mail corporativo"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        placeholder="seu.nome@empresa.com"
                        error={!!errors.email}
                        helperText={errors.email?.message ||
                          (emailValid ? 'E-mail válido' : 'Digite seu e-mail corporativo')}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email
                                sx={{
                                  color: emailFocused ? 'primary.main' : 'text.secondary',
                                  transition: 'all 0.3s ease',
                                }}
                              />
                            </InputAdornment>
                          ),
                          endAdornment: emailValid && (
                            <InputAdornment position="end">
                              <Fade in={emailValid}>
                                <CheckCircle
                                  sx={{
                                    color: 'success.main',
                                    fontSize: 20,
                                  }}
                                />
                              </Fade>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            },
                            '&.Mui-focused': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 6px 20px rgba(63,81,181,0.15)',
                            },
                          },
                          '& .MuiFormHelperText-root': {
                            color: emailValid ? 'success.main' : undefined,
                            fontWeight: emailValid ? 500 : 400,
                          },
                        }}
                      />
                    )}
                  />

                  <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    <Tooltip title="Ajuda" placement="top">
                      <IconButton
                        size="small"
                        sx={{
                          color: 'text.secondary',
                          '&:hover': {
                            color: 'primary.main',
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <Help fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Link
                      href="#"
                      variant="body2"
                      sx={{
                        textDecoration: 'none',
                        color: 'primary.main',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Problemas para acessar?
                    </Link>
                  </Stack>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading || !emailValid}
                    endIcon={!loading && <ArrowForward />}
                    sx={{
                      mt: 3,
                      mb: 2,
                      py: { xs: 1.5, sm: 1.75 },
                      fontSize: { xs: '0.95rem', sm: '1.05rem' },
                      fontWeight: 600,
                      borderRadius: 2,
                      textTransform: 'none',
                      background: 'linear-gradient(45deg, #3f51b5 30%, #5c6bc0 90%)',
                      boxShadow: '0 3px 15px rgba(63,81,181,0.3)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #303f9f 30%, #3f51b5 90%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 25px rgba(63,81,181,0.4)',
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                      },
                      '&.Mui-disabled': {
                        background: 'rgba(0, 0, 0, 0.12)',
                      },
                    }}
                  >
                    {loading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CircularProgress size={22} color="inherit" />
                        <span>Validando credenciais...</span>
                      </Box>
                    ) : (
                      'Acessar Sistema'
                    )}
                  </Button>
                </Stack>
              </Box>
            </Fade>

            {/* Footer */}
            <Fade in={showContent} timeout={1800}>
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Divider sx={{ mb: 2 }}>
                  <Security sx={{ fontSize: 16, color: 'text.secondary' }} />
                </Divider>
                <Stack spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    Sistema integrado ao ERP Protheus
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Todos os direitos reservados © {new Date().getFullYear()}
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <Link
                      href="#"
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        textDecoration: 'none',
                        '&:hover': {
                          color: 'primary.main',
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Política de Privacidade
                    </Link>
                    <Typography variant="caption" color="text.secondary">•</Typography>
                    <Link
                      href="#"
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        textDecoration: 'none',
                        '&:hover': {
                          color: 'primary.main',
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Termos de Uso
                    </Link>
                  </Stack>
                </Stack>
              </Box>
            </Fade>
          </Paper>
        </Zoom>
      </Container>
    </Box>
  );
});

LoginForm.displayName = 'LoginForm';

export default LoginForm;