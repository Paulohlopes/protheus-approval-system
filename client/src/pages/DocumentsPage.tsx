import React from 'react';
import {
  AppBar,
  Box,
  Button,
  Toolbar,
  Typography,
  Avatar,
  Container,
  Paper,
  Grid,
} from '@mui/material';
import { Logout, Business, Assessment } from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import DocumentList from '../components/DocumentList';

const DocumentsPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Professional Header */}
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
          
          {/* Status do usuário */}
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

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ flexGrow: 1, py: 3 }}>
        {/* Page Header with Welcome Message */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={700} color="primary.main">
            Documentos para Aprovação
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Bem-vindo(a), {user?.email?.split('@')[0]}! Aqui estão os documentos aguardando sua aprovação.
          </Typography>
          
          {/* Quick Info Cards */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={4}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  bgcolor: 'grey.100',
                  border: '1px solid',
                  borderColor: 'grey.300'
                }}
              >
                <Typography variant="h5" fontWeight={600} color="text.primary">
                  Pendentes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Aguardando sua ação
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.300' }}>
                <Typography variant="h5" fontWeight={600} color="text.primary">
                  Total
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Documentos listados
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.100', border: '1px solid', borderColor: 'grey.300' }}>
                <Typography variant="h5" fontWeight={600} color="text.primary">
                  Hoje
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date().toLocaleDateString('pt-BR')}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Document List */}
        <DocumentList />
      </Container>
    </Box>
  );
};

export default DocumentsPage;