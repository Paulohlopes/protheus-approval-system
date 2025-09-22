import React, { useState, useEffect } from 'react';
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
  Stack,
  Chip,
  Fab,
  Zoom,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
} from '@mui/material';
import {
  Logout,
  Business,
  CheckCircle,
  Cancel,
  KeyboardArrowUp,
  Close,
  Dashboard,
  ViewList,
} from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { useDocuments } from '../hooks/useDocuments';
import { useDocumentStore } from '../stores/documentStore';
import { useDocumentActions } from '../hooks/useDocumentActions';
import { getCurrentApprovalStatus } from '../utils/documentHelpers';
import DocumentList from '../components/DocumentList';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { formatDocumentValue } from '../hooks/useDocumentActions';
import LanguageSelector from '../components/LanguageSelector';
import { useLanguage } from '../contexts/LanguageContext';

const DocumentsPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { filters, pagination } = useDocumentStore();
  const [scrolled, setScrolled] = useState(false);
  const { t, formatMessage } = useLanguage();

  // Use document actions hook
  const {
    confirmDialog,
    bulkConfirmDialog,
    selectedDocuments,
    showBulkActions,
    handleApprove,
    handleReject,
    handleConfirmAction,
    handleCloseDialog,
    handleSelectDocument,
    handleSelectAll,
    toggleBulkActions,
    handleBulkApprove,
    handleBulkReject,
    handleCloseBulkDialog,
    handleBulkConfirmAction,
    isProcessing,
  } = useDocumentActions();

  // Get documents data
  const { data: documentsResponse, refetch } = useDocuments(filters, pagination);
  
  // Calculate statistics
  const documents = documentsResponse?.documentos || [];
  const pendingDocuments = documents.filter(doc => {
    const currentStatus = getCurrentApprovalStatus(doc.alcada, user?.email);
    return currentStatus?.situacao_aprov === 'Pendente';
  });

  // Handle scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
                {t?.header?.title?.split(' - ')[0] || 'Sistema Protheus'}
              </Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.7)">
                {t?.documents?.title || 'Aprovação de Documentos'}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />

          {/* Language Selector and Toggle View Buttons */}
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mr: 3 }}>
            <LanguageSelector />
            <ToggleButtonGroup
              value="cards"
              exclusive
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}
            >
              <ToggleButton value="cards">
                <Dashboard fontSize="small" />
              </ToggleButton>
              <ToggleButton value="table" onClick={() => navigate('/documents-table')}>
                <ViewList fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />

          {/* Status do usuário */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 3, mr: 3 }}>
            <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.dark' }}>
              {user?.email?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" color="inherit">
                {user?.email}
              </Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.7)">
                {t?.documents?.approvers?.slice(0, -2) || 'Aprovador'}
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
            {t?.common?.logout || 'Sair'}
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ flexGrow: 1, py: 3 }}>
        {/* Page Header with Welcome Message */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={700} color="primary.main">
            {t?.documents?.title || 'Documentos para Aprovação'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {user?.email?.split('@')[0]}, {t?.messages?.noDocuments ? 'bem-vindo(a)! Aqui estão os documentos aguardando sua aprovação.' : 'bem-vindo(a)! Aqui estão os documentos aguardando sua aprovação.'}
          </Typography>
          
          {/* Quick Info Cards com dados reais */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={3}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  bgcolor: pendingDocuments.length > 0 ? 'warning.50' : 'grey.100',
                  border: '1px solid',
                  borderColor: pendingDocuments.length > 0 ? 'warning.300' : 'grey.300'
                }}
              >
                <Typography variant="h4" fontWeight={700} color="warning.dark">
                  {pendingDocuments.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {`${t?.documents?.title?.split(' ')[0] || 'Documentos'} ${t?.status?.pending || 'Pendentes'}`}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.300' }}>
                <Typography variant="h4" fontWeight={700} color="primary.main">
                  {documents.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {`Total de ${t?.documents?.title?.split(' ')[0] || 'Documentos'}`}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50', border: '1px solid', borderColor: 'success.300' }}>
                <Typography variant="h4" fontWeight={700} color="success.dark">
                  {documents.filter(doc => getCurrentApprovalStatus(doc.alcada, user?.email)?.situacao_aprov === 'Liberado').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t?.status?.approved || 'Aprovados'}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.100', border: '1px solid', borderColor: 'grey.300' }}>
                <Typography variant="h4" fontWeight={700} color="text.primary">
                  {new Date().toLocaleDateString('pt-BR')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t?.table?.item ? 'Data Atual' : 'Data Atual'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

        </Box>

        {/* Document List */}
        <DocumentList 
          selectedDocuments={selectedDocuments}
          showBulkActions={showBulkActions}
          onSelectDocument={handleSelectDocument}
          onSelectAll={handleSelectAll}
          onToggleBulkActions={toggleBulkActions}
        />
      </Container>

      {/* Barra Flutuante Fixa (bottom) - Só aparece quando há seleção */}
      {selectedDocuments.size > 0 && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            borderTop: '3px solid',
            borderColor: 'primary.main',
            bgcolor: 'background.paper',
            zIndex: 1200,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
          }}
        >
          <Container maxWidth="xl">
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip
                  label={`${selectedDocuments.size} ${t?.common?.selected || 'documento(s) selecionado(s)'}`}
                  color="primary"
                  variant="filled"
                  sx={{ fontWeight: 600 }}
                />
                <Typography variant="body2" color="text.secondary">
                  de {pendingDocuments.length} {t?.documents?.title?.split(' ')[0]?.toLowerCase() || 'documentos'} {t?.status?.pending?.toLowerCase() || 'pendentes'}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  startIcon={<CheckCircle />}
                  onClick={handleBulkApprove}
                  disabled={isProcessing}
                  sx={{ minWidth: 150 }}
                >
                  {t?.common?.approve || 'Aprovar'} {t?.common?.all || 'Todos'}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="large"
                  startIcon={<Cancel />}
                  onClick={handleBulkReject}
                  disabled={isProcessing}
                  sx={{ minWidth: 150 }}
                >
                  {t?.common?.reject || 'Rejeitar'} {t?.common?.all || 'Todos'}
                </Button>
                <IconButton
                  color="default"
                  onClick={toggleBulkActions}
                  sx={{ ml: 1 }}
                >
                  <Close />
                </IconButton>
              </Stack>
            </Stack>
          </Container>
        </Paper>
      )}

      {/* FAB Scroll to Top */}
      <Zoom in={scrolled}>
        <Fab
          color="primary"
          size="medium"
          sx={{
            position: 'fixed',
            bottom: selectedDocuments.size > 0 ? 100 : 24,
            right: 24,
            zIndex: 1100,
          }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <KeyboardArrowUp />
        </Fab>
      </Zoom>

      {/* Diálogos de Confirmação */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmAction}
        action={confirmDialog.action}
        documentNumber={confirmDialog.document?.numero.trim()}
        documentValue={formatDocumentValue(confirmDialog.document)}
        loading={isProcessing}
      />

      <ConfirmationDialog
        open={bulkConfirmDialog.open}
        onClose={handleCloseBulkDialog}
        onConfirm={(comments) => handleBulkConfirmAction(documents, comments)}
        action={bulkConfirmDialog.action}
        documentNumber={`${bulkConfirmDialog.documentCount} documentos`}
        documentValue="Operação em massa"
        loading={isProcessing}
      />
    </Box>
  );
};

export default DocumentsPage;