import React from 'react';
import {
  AppBar,
  Box,
  Button,
  Toolbar,
  Typography,
  Avatar,
} from '@mui/material';
import { Logout, Business } from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';

const AppHeader: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AppBar position="static" sx={{ mb: 0 }}>
      <Toolbar sx={{ minHeight: 80 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.dark', mr: 2 }}>
            <Business />
          </Avatar>
          <Box>
            <Typography variant="h6" component="div" fontWeight={600}>
              Sistema Protheus
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.7)">
              Aprovação de Documentos
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
          <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.dark' }}>
            {user?.email?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="body2" color="inherit">
              {user?.email}
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.7)">
              Aprovador
            </Typography>
          </Box>
        </Box>
        
        <Button
          color="inherit"
          onClick={handleLogout}
          startIcon={<Logout />}
          variant="outlined"
          sx={{ borderColor: 'rgba(255,255,255,0.3)' }}
        >
          Sair
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;