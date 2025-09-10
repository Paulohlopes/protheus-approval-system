import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Toolbar,
  Typography,
  Avatar,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Container,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Logout,
  Business,
  Notifications,
  Settings,
  Person,
  Dashboard,
  Assignment,
  TrendingUp,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';

const ModernAppHeader: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
    navigate('/login');
  };

  const userInitials = user?.email?.split('@')[0].substring(0, 2).toUpperCase() || 'US';
  const userName = user?.email?.split('@')[0] || 'Usuário';

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ minHeight: 72, px: { xs: 0 } }}>
          {/* Logo e Nome da Empresa */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                border: `2px solid ${alpha(theme.palette.common.white, 0.2)}`,
              }}
            >
              <Business sx={{ color: 'white', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 800,
                  background: `linear-gradient(135deg, ${theme.palette.common.white} 0%, ${alpha(theme.palette.common.white, 0.9)} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  letterSpacing: '-0.5px',
                }}
              >
                Protheus System
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: alpha(theme.palette.common.white, 0.7),
                  fontWeight: 500,
                  letterSpacing: '0.5px',
                }}
              >
                Central de Aprovações
              </Typography>
            </Box>
          </Box>

          {/* Navegação Central */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, ml: 6, gap: 1 }}>
            <Button
              color="inherit"
              startIcon={<Dashboard />}
              onClick={() => navigate('/dashboard')}
              sx={{
                color: alpha(theme.palette.common.white, 0.9),
                '&:hover': {
                  background: alpha(theme.palette.common.white, 0.1),
                },
              }}
            >
              Dashboard
            </Button>
            <Button
              color="inherit"
              startIcon={<Assignment />}
              onClick={() => navigate('/documents')}
              sx={{
                color: alpha(theme.palette.common.white, 0.9),
                '&:hover': {
                  background: alpha(theme.palette.common.white, 0.1),
                },
              }}
            >
              Documentos
            </Button>
            <Button
              color="inherit"
              startIcon={<TrendingUp />}
              onClick={() => navigate('/reports')}
              sx={{
                color: alpha(theme.palette.common.white, 0.9),
                '&:hover': {
                  background: alpha(theme.palette.common.white, 0.1),
                },
              }}
            >
              Relatórios
            </Button>
          </Box>

          {/* Ações do Usuário */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Notificações */}
            <Tooltip title="Notificações">
              <IconButton
                color="inherit"
                onClick={handleNotificationOpen}
                sx={{
                  color: alpha(theme.palette.common.white, 0.9),
                  '&:hover': {
                    background: alpha(theme.palette.common.white, 0.1),
                  },
                }}
              >
                <Badge badgeContent={3} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Perfil do Usuário */}
            <Button
              onClick={handleProfileMenuOpen}
              sx={{
                ml: 1,
                px: 2,
                py: 1,
                borderRadius: 3,
                background: alpha(theme.palette.common.white, 0.1),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                '&:hover': {
                  background: alpha(theme.palette.common.white, 0.2),
                },
              }}
              endIcon={<KeyboardArrowDown />}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32,
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                    fontSize: '0.875rem',
                    fontWeight: 700,
                  }}
                >
                  {userInitials}
                </Avatar>
                <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.common.white,
                      fontWeight: 600,
                      lineHeight: 1.2,
                    }}
                  >
                    {userName}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: alpha(theme.palette.common.white, 0.7),
                      lineHeight: 1.2,
                    }}
                  >
                    Aprovador
                  </Typography>
                </Box>
              </Box>
            </Button>
          </Box>
        </Toolbar>
      </Container>

      {/* Menu do Perfil */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 200,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {user?.email}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Perfil de Aprovador
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/profile'); }}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          <ListItemText>Meu Perfil</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/settings'); }}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>Configurações</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>
            <Typography color="error">Sair</Typography>
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Menu de Notificações */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 320,
            maxHeight: 400,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Notificações
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleNotificationClose}>
          <Box>
            <Typography variant="body2" fontWeight={500}>
              3 novos documentos para aprovar
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Há 5 minutos
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleNotificationClose}>
          <Box>
            <Typography variant="body2" fontWeight={500}>
              Documento #12345 foi aprovado
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Há 1 hora
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleNotificationClose}>
          <Box>
            <Typography variant="body2" fontWeight={500}>
              Relatório mensal disponível
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Há 2 horas
            </Typography>
          </Box>
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default ModernAppHeader;