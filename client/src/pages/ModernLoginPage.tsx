import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Avatar,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  useTheme,
  alpha,
  Link,
  Stack,
} from '@mui/material';
import {
  Business,
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  Security,
  Speed,
  VerifiedUser,
  CheckCircle,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

const ModernLoginPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});

  // Redirect if already authenticated
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      navigate('/documents');
    }
  }, [navigate]);

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};
    
    if (!email) {
      errors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email inválido';
    }
    
    if (!password) {
      errors.password = 'Senha é obrigatória';
    } else if (password.length < 4) {
      errors.password = 'Senha deve ter pelo menos 4 caracteres';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await login({ email, password });
      navigate('/documents');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const features = [
    {
      icon: <Security sx={{ fontSize: 24 }} />,
      title: 'Segurança Avançada',
      description: 'Proteção de dados com criptografia de ponta',
    },
    {
      icon: <Speed sx={{ fontSize: 24 }} />,
      title: 'Alta Performance',
      description: 'Interface rápida e responsiva',
    },
    {
      icon: <VerifiedUser sx={{ fontSize: 24 }} />,
      title: 'Aprovação Digital',
      description: 'Processo 100% digital e auditável',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 25%, ${theme.palette.secondary.main} 100%)`,
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background patterns */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          backgroundImage: `radial-gradient(circle at 20% 80%, ${theme.palette.common.white} 1px, transparent 1px),
                           radial-gradient(circle at 80% 20%, ${theme.palette.common.white} 1px, transparent 1px),
                           radial-gradient(circle at 40% 40%, ${theme.palette.common.white} 1px, transparent 1px)`,
          backgroundSize: '50px 50px, 80px 80px, 100px 100px',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', minHeight: '80vh', gap: 6 }}>
            {/* Left side - Features */}
            <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }}>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Box sx={{ mb: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.common.white, 0.2)} 0%, ${alpha(theme.palette.common.white, 0.1)} 100%)`,
                        backdropFilter: 'blur(20px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                      }}
                    >
                      <Business sx={{ fontSize: 36, color: theme.palette.common.white }} />
                    </Box>
                    <Box>
                      <Typography 
                        variant="h4" 
                        fontWeight={800}
                        sx={{ 
                          color: theme.palette.common.white,
                          lineHeight: 1.2,
                        }}
                      >
                        Protheus System
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: alpha(theme.palette.common.white, 0.8),
                          fontWeight: 400,
                        }}
                      >
                        Central de Aprovações
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography 
                    variant="h3" 
                    fontWeight={800}
                    sx={{ 
                      color: theme.palette.common.white,
                      mb: 2,
                      lineHeight: 1.2,
                    }}
                  >
                    Gerencie aprovações
                    <br />
                    de forma
                    <Box 
                      component="span"
                      sx={{
                        background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        color: 'transparent',
                        ml: 1,
                      }}
                    >
                      inteligente
                    </Box>
                  </Typography>
                  
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: alpha(theme.palette.common.white, 0.8),
                      fontWeight: 400,
                      lineHeight: 1.6,
                      mb: 4,
                    }}
                  >
                    Acelere seus processos de aprovação com nossa plataforma moderna e segura.
                  </Typography>
                </Box>

                <Stack spacing={3}>
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          p: 2,
                          borderRadius: 2,
                          background: alpha(theme.palette.common.white, 0.1),
                          backdropFilter: 'blur(20px)',
                          border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
                        }}
                      >
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            background: alpha(theme.palette.common.white, 0.15),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: theme.palette.common.white,
                          }}
                        >
                          {feature.icon}
                        </Box>
                        <Box>
                          <Typography variant="h6" fontWeight={600} color="white" sx={{ mb: 0.5 }}>
                            {feature.title}
                          </Typography>
                          <Typography variant="body2" color={alpha(theme.palette.common.white, 0.8)}>
                            {feature.description}
                          </Typography>
                        </Box>
                      </Box>
                    </motion.div>
                  ))}
                </Stack>
              </motion.div>
            </Box>

            {/* Right side - Login form */}
            <Box sx={{ flex: { xs: 1, md: 0.8 }, maxWidth: 480 }}>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <Card
                  sx={{
                    borderRadius: 4,
                    background: alpha(theme.palette.common.white, 0.95),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                      <Avatar
                        sx={{
                          width: 64,
                          height: 64,
                          mx: 'auto',
                          mb: 2,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        }}
                      >
                        <LoginIcon sx={{ fontSize: 32 }} />
                      </Avatar>
                      <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom>
                        Bem-vindo de volta!
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Faça login para acessar sua central de aprovações
                      </Typography>
                    </Box>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Alert 
                            severity="error" 
                            sx={{ 
                              mb: 3, 
                              borderRadius: 2,
                              '& .MuiAlert-message': {
                                fontSize: '0.875rem',
                              }
                            }}
                          >
                            {error}
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Box component="form" onSubmit={handleSubmit} noValidate>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={!!formErrors.email}
                        helperText={formErrors.email}
                        margin="normal"
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email color="action" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />

                      <TextField
                        fullWidth
                        label="Senha"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        error={!!formErrors.password}
                        helperText={formErrors.password}
                        margin="normal"
                        required
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
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />

                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={isLoading}
                        sx={{
                          mt: 3,
                          mb: 2,
                          py: 1.5,
                          borderRadius: 2,
                          fontSize: '1rem',
                          fontWeight: 600,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                          '&:hover': {
                            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                            transform: 'translateY(-2px)',
                            boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
                          },
                          '&:disabled': {
                            background: theme.palette.grey[400],
                          },
                        }}
                        startIcon={
                          isLoading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />
                        }
                      >
                        {isLoading ? 'Entrando...' : 'Entrar'}
                      </Button>

                      <Divider sx={{ my: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          ou
                        </Typography>
                      </Divider>

                      <Box sx={{ textAlign: 'center' }}>
                        <Link
                          href="#"
                          variant="body2"
                          sx={{
                            color: theme.palette.primary.main,
                            textDecoration: 'none',
                            fontWeight: 600,
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          Esqueceu sua senha?
                        </Link>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Trust indicators */}
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Stack direction="row" spacing={3} justifyContent="center" alignItems="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle sx={{ fontSize: 16, color: alpha(theme.palette.common.white, 0.8) }} />
                      <Typography variant="caption" color={alpha(theme.palette.common.white, 0.8)}>
                        Dados criptografados
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle sx={{ fontSize: 16, color: alpha(theme.palette.common.white, 0.8) }} />
                      <Typography variant="caption" color={alpha(theme.palette.common.white, 0.8)}>
                        Acesso seguro
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </motion.div>
            </Box>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default ModernLoginPage;