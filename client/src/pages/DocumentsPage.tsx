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
  Badge,
  alpha,
  useTheme,
  Card,
  CardContent,
  TextField,
  InputAdornment,
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
  Notifications,
  Language,
  Person,
  TrendingUp,
  Schedule,
  Assignment,
  Search,
  Refresh,
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
  const { filters, pagination, setFilters } = useDocumentStore();
  const [scrolled, setScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { t, formatMessage } = useLanguage();
  const theme = useTheme();

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

  // Funções de busca e filtro
  const handleSearch = () => {
    setFilters({
      ...filters,
      search: searchTerm.trim()
    });
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFilters({
      ...filters,
      search: ''
    });
  };

  // Sincronizar searchTerm com os filtros do store
  useEffect(() => {
    setSearchTerm(filters.search || '');
  }, [filters.search]);


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Modern Professional Header */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(45deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 100%)`,
            pointerEvents: 'none',
          }
        }}
      >
        <Toolbar
          sx={{
            minHeight: 84,
            px: { xs: 2, sm: 3 },
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Brand Section with Enhanced Design */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            mr: 3,
            position: 'relative',
          }}>
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${alpha(theme.palette.common.white, 0.2)} 0%, ${alpha(theme.palette.common.white, 0.05)} 100%)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                mr: 2,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.3)}`,
                }
              }}
            >
              <Business sx={{
                fontSize: 28,
                color: theme.palette.common.white,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              }} />
            </Box>
            <Box>
              <Typography
                variant="h5"
                component="div"
                fontWeight={700}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.common.white} 0%, ${alpha(theme.palette.common.white, 0.8)} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  textShadow: `0 2px 4px ${alpha(theme.palette.common.black, 0.3)}`,
                  letterSpacing: '-0.5px',
                }}
              >
                {t?.header?.title?.split(' - ')[0] || 'Sistema Protheus'}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: alpha(theme.palette.common.white, 0.85),
                  fontWeight: 500,
                  letterSpacing: '0.5px',
                }}
              >
                {t?.documents?.title || 'Aprovação de Documentos'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Enhanced Navigation Controls */}
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mr: 3 }}>
            {/* Language Selector with Enhanced Styling */}
            <Box
              sx={{
                '& .MuiSelect-select': {
                  color: theme.palette.common.white,
                },
                '& .MuiSvgIcon-root': {
                  color: alpha(theme.palette.common.white, 0.7),
                },
              }}
            >
              <LanguageSelector />
            </Box>

            {/* Modern Toggle Buttons */}
            <ToggleButtonGroup
              value="cards"
              exclusive
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.common.white, 0.15),
                borderRadius: '12px',
                border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                backdropFilter: 'blur(10px)',
                '& .MuiToggleButton-root': {
                  color: alpha(theme.palette.common.white, 0.7),
                  border: 'none',
                  borderRadius: '10px !important',
                  margin: '2px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.common.white, 0.25),
                    color: theme.palette.common.white,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.2)}`,
                  },
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.15),
                    transform: 'scale(1.05)',
                  }
                }
              }}
            >
              <ToggleButton value="cards">
                <Dashboard fontSize="small" />
              </ToggleButton>
              <ToggleButton value="table" onClick={() => navigate('/documents-table')}>
                <ViewList fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Divider
            orientation="vertical"
            flexItem
            sx={{
              bgcolor: alpha(theme.palette.common.white, 0.2),
              mx: 2,
              height: '40px',
              alignSelf: 'center',
            }}
          />

          {/* Enhanced User Profile Section */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            ml: 2,
            mr: 3,
            p: 1.5,
            borderRadius: '16px',
            background: alpha(theme.palette.common.white, 0.1),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.common.white, 0.15)}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: alpha(theme.palette.common.white, 0.15),
              transform: 'translateY(-1px)',
            }
          }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                mr: 2,
                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                border: `2px solid ${alpha(theme.palette.common.white, 0.3)}`,
                fontSize: '1.1rem',
                fontWeight: 600,
                boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.2)}`,
              }}
            >
              {user?.email?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{
                  color: theme.palette.common.white,
                  lineHeight: 1.2,
                }}
              >
                {user?.email?.split('@')[0]}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: alpha(theme.palette.common.white, 0.75),
                  fontSize: '0.75rem',
                  fontWeight: 500,
                }}
              >
                {t?.documents?.approvers?.slice(0, -2) || 'Aprovador'}
              </Typography>
            </Box>
          </Box>

          {/* Enhanced Logout Button */}
          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<Logout />}
            variant="outlined"
            sx={{
              borderColor: alpha(theme.palette.common.white, 0.3),
              color: theme.palette.common.white,
              borderRadius: '12px',
              px: 2.5,
              py: 1,
              fontWeight: 600,
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                borderColor: alpha(theme.palette.common.white, 0.5),
                bgcolor: alpha(theme.palette.common.white, 0.1),
                transform: 'translateY(-1px)',
                boxShadow: `0 6px 20px ${alpha(theme.palette.common.black, 0.2)}`,
              }
            }}
          >
            {t?.common?.logout || 'Sair'}
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ flexGrow: 1, py: 4 }}>
        {/* Enhanced Page Header */}
        <Box sx={{ mb: 5 }}>
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'flex-end' },
            mb: 3,
          }}>
            <Box>
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                fontWeight={800}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  letterSpacing: '-1px',
                  mb: 1,
                }}
              >
                {t?.documents?.title || 'Documentos para Aprovação'}
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{
                  fontWeight: 400,
                  lineHeight: 1.6,
                  maxWidth: 600,
                }}
              >
                Olá, <strong>{user?.email?.split('@')[0]}</strong>! Aqui estão os documentos aguardando sua aprovação.
              </Typography>
            </Box>

            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mt: { xs: 2, md: 0 },
            }}>
              <Chip
                icon={<Schedule />}
                label={new Date().toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
                variant="outlined"
                sx={{
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  fontWeight: 500,
                }}
              />
            </Box>
          </Box>

        </Box>

        {/* Controles de Busca e Ações */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Stack spacing={2}>
            {/* Barra de Busca */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                placeholder={t?.searchPlaceholders?.general || 'Buscar por fornecedor, valor...'}
                variant="outlined"
                size="medium"
                sx={{
                  flexGrow: 1,
                  minWidth: 280,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={handleClearSearch}
                        edge="end"
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Botões de Ação */}
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<Search />}
                  onClick={handleSearch}
                  sx={{
                    minWidth: 120,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                  }}
                >
                  {t?.common?.search || 'Buscar'}
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => refetch()}
                  sx={{
                    minWidth: 120,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                  }}
                >
                  {t?.common?.refresh || 'Atualizar'}
                </Button>

                <Button
                  variant={showBulkActions ? "contained" : "outlined"}
                  startIcon={showBulkActions ? <Close /> : <Assignment />}
                  onClick={toggleBulkActions}
                  sx={{
                    minWidth: 120,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                  }}
                >
                  {showBulkActions ? (t?.common?.close || 'Fechar') : (t?.common?.selectAll || 'Seleção')}
                </Button>
              </Stack>
            </Box>

            {/* Estatísticas rápidas */}
            {documents.length > 0 && (
              <Box sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                pt: 1,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}>
                <Chip
                  icon={<TrendingUp />}
                  label={formatMessage(t?.table?.displayedRows || '{{from}}-{{to}} de {{count}}', {
                    from: 1,
                    to: documents.length,
                    count: documents.length
                  })}
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 500 }}
                />
                <Chip
                  icon={<Schedule />}
                  label={`${pendingDocuments.length} ${t?.documentPage?.pendingDocuments || 'pendentes'}`}
                  color="warning"
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 500 }}
                />
              </Box>
            )}
          </Stack>
        </Paper>

        {/* Document List */}
        <DocumentList
          selectedDocuments={selectedDocuments}
          showBulkActions={showBulkActions}
          onSelectDocument={handleSelectDocument}
          onSelectAll={handleSelectAll}
          onToggleBulkActions={toggleBulkActions}
          hideSearchBar={true}
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
                  label={formatMessage(t?.documentPage?.selectedDocuments || '{{count}} documento(s) selecionado(s)', { count: selectedDocuments.size })}
                  color="primary"
                  variant="filled"
                  sx={{ fontWeight: 600 }}
                />
                <Typography variant="body2" color="text.secondary">
                  de {pendingDocuments.length} {t?.documentPage?.pendingDocuments || 'documentos pendentes'}
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
                  {t?.documentActions?.approveAll || 'Aprovar Todos'}
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
                  {t?.documentActions?.rejectAll || 'Rejeitar Todos'}
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
        documentNumber={formatMessage(t?.documentPage?.bulkDocuments || '{{count}} documentos', { count: bulkConfirmDialog.documentCount })}
        documentValue={t?.documentPage?.massOperation || 'Operação em massa'}
        loading={isProcessing}
      />
    </Box>
  );
};

export default DocumentsPage;