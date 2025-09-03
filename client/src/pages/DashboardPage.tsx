import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  Button,
} from '@mui/material';
import { Refresh, TrendingUp } from '@mui/icons-material';
import AppLayout from '../components/AppLayout';
import DashboardStats from '../components/DashboardStats';
import DocumentList from '../components/DocumentList';
import { useAuthStore } from '../stores/authStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <AppLayout>
      <Box sx={{ flexGrow: 1 }}>
        {/* Welcome Section */}
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)' }}>
          <CardContent sx={{ color: 'white', py: 4 }}>
            <Grid container alignItems="center" spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
                  Bem-vindo, {user?.name || user?.username}!
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                  Sistema de Aprovação Protheus ERP
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.8 }}>
                  {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                  <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Dashboard Statistics */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom fontWeight={600}>
            Visão Geral
          </Typography>
          <DashboardStats />
        </Box>

        {/* Recent Documents Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2" fontWeight={600}>
              Documentos Pendentes
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => window.location.reload()}
            >
              Atualizar
            </Button>
          </Box>
          
          <DocumentList />
        </Box>

        {/* System Status */}
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Sistema Online</strong> - Conectado ao Protheus ERP em brsvcub050:3079
          </Typography>
        </Alert>

        {/* User Session Info */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Informações da Sessão
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Usuário
                </Typography>
                <Typography variant="body1">
                  {user?.username}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Nome
                </Typography>
                <Typography variant="body1">
                  {user?.name || 'Não informado'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body1" color="success.main">
                  Autenticado
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Última Atualização
                </Typography>
                <Typography variant="body1">
                  {format(new Date(), 'HH:mm:ss', { locale: ptBR })}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </AppLayout>
  );
};

export default DashboardPage;