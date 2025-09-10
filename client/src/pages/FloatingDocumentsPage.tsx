import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Chip,
  Stack,
  useTheme,
  alpha,
  Fade,
  Zoom,
  useScrollTrigger,
  AppBar,
  Toolbar,
  useMediaQuery,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useDocuments } from '../hooks/useDocuments';
import { useDocumentStore } from '../stores/documentStore';
import { useDocumentActions } from '../hooks/useDocumentActions';
import { getCurrentApprovalStatus } from '../utils/documentHelpers';

// Import components
import ModernAppHeader from '../components/layout/ModernAppHeader';
import ModernStatCards from '../components/documents/ModernStatCards';
import ModernDocumentCard from '../components/documents/ModernDocumentCard';
import FloatingActionBar from '../components/documents/FloatingActionBar';
import FloatingFilters from '../components/documents/FloatingFilters';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { EmptyState } from '../components/EmptyState';
import { formatDocumentValue } from '../hooks/useDocumentActions';

// Sticky header component
const StickyHeader: React.FC<{
  title: string;
  subtitle: string;
  pendingCount: number;
  selectedCount: number;
  show: boolean;
}> = ({ title, subtitle, pendingCount, selectedCount, show }) => {
  const theme = useTheme();
  
  return (
    <Zoom in={show}>
      <AppBar
        position="fixed"
        sx={{
          top: 0,
          background: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(20px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          zIndex: 1100,
        }}
      >
        <Toolbar sx={{ minHeight: 60 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight={700} color="text.primary">
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            {pendingCount > 0 && (
              <Chip
                label={`${pendingCount} pendentes`}
                color="warning"
                size="small"
                variant="filled"
              />
            )}
            {selectedCount > 0 && (
              <Chip
                label={`${selectedCount} selecionados`}
                color="primary"
                size="small"
                variant="filled"
              />
            )}
          </Stack>
        </Toolbar>
      </AppBar>
    </Zoom>
  );
};

const FloatingDocumentsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuthStore();
  const { filters, pagination, setFilters } = useDocumentStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Scroll trigger for sticky header
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 200,
  });

  const {
    confirmDialog,
    bulkConfirmDialog,
    selectedDocuments,
    handleApprove,
    handleReject,
    handleConfirmAction,
    handleCloseDialog,
    handleSelectDocument,
    handleSelectAll,
    handleBulkApprove,
    handleBulkReject,
    handleCloseBulkDialog,
    handleBulkConfirmAction,
    isProcessing,
  } = useDocumentActions();

  const { data: documentsResponse, refetch } = useDocuments(filters, pagination);

  // Calculate statistics
  const documents = documentsResponse?.documentos || [];
  const pendingDocuments = documents.filter(doc => {
    const currentStatus = getCurrentApprovalStatus(doc.alcada, user?.email);
    return currentStatus?.situacao_aprov === 'Pendente';
  });

  const approvedToday = documents.filter(doc => {
    const currentStatus = getCurrentApprovalStatus(doc.alcada, user?.email);
    return currentStatus?.situacao_aprov === 'Liberado';
  }).length;

  const rejectedToday = documents.filter(doc => {
    const currentStatus = getCurrentApprovalStatus(doc.alcada, user?.email);
    return currentStatus?.situacao_aprov === 'Rejeitado';
  }).length;

  // Auto-show bulk actions when documents are selected
  useEffect(() => {
    if (selectedDocuments.size > 0 && !showBulkActions) {
      setShowBulkActions(true);
    }
  }, [selectedDocuments.size]);

  const handleSearch = (searchTerm: string, numeroTerm: string, advancedFilters?: any) => {
    setIsLoading(true);
    setFilters({ 
      ...filters, 
      search: searchTerm,
      numero: numeroTerm,
      ...advancedFilters
    });
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleClearFilters = () => {
    setFilters({ search: '', numero: '' });
  };

  const handleApproveAll = () => {
    if (selectedDocuments.size === 0) {
      // Se nenhum está selecionado, selecionar todos os pendentes primeiro
      handleSelectAll(pendingDocuments);
      setTimeout(() => handleBulkApprove(), 100);
    } else {
      handleBulkApprove();
    }
  };

  const handleRejectAll = () => {
    if (selectedDocuments.size === 0) {
      handleSelectAll(pendingDocuments);
      setTimeout(() => handleBulkReject(), 100);
    } else {
      handleBulkReject();
    }
  };

  const handleClearSelection = () => {
    selectedDocuments.clear();
    setShowBulkActions(false);
    // Force re-render
    handleSelectDocument('', false);
  };

  const activeFilterCount = [
    filters.search,
    filters.numero,
    filters.documentType,
    filters.dateRange,
    filters.minValue,
    filters.maxValue,
    filters.supplier,
  ].filter(Boolean).length;

  return (
    <Box
      ref={containerRef}
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${theme.palette.background.default} 100%)`,
        pb: isMobile ? 12 : 4,
      }}
    >
      {/* Main Header */}
      <ModernAppHeader />

      {/* Sticky Header - aparece ao scrollar */}
      <StickyHeader
        title="Central de Aprovações"
        subtitle={`${user?.email?.split('@')[0]} • ${documents.length} documentos`}
        pendingCount={pendingDocuments.length}
        selectedCount={selectedDocuments.size}
        show={trigger}
      />

      {/* Floating Filters - sempre visível */}
      <FloatingFilters
        onSearch={handleSearch}
        onClearFilters={handleClearFilters}
        activeFilterCount={activeFilterCount}
        alwaysVisible
      />

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ pt: 4, px: { xs: 2, md: 3 } }}>
        {/* Welcome section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ mb: 4, ml: { md: '60px' } }}> {/* Compensar espaço do filtro flutuante */}
            <Typography 
              variant="h3" 
              component="h1" 
              fontWeight={800}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                mb: 1,
              }}
            >
              Central de Aprovações
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                fontWeight: 400,
                maxWidth: 600,
              }}
            >
              Bem-vindo(a), <strong>{user?.email?.split('@')[0]}</strong>! 
              {pendingDocuments.length > 0 
                ? ` Você tem ${pendingDocuments.length} documento${pendingDocuments.length > 1 ? 's' : ''} aguardando aprovação.`
                : ' Todos os documentos foram processados.'}
            </Typography>
          </Box>
        </motion.div>

        {/* Statistics Cards */}
        <Box sx={{ ml: { md: '60px' } }}>
          <ModernStatCards
            pendingCount={pendingDocuments.length}
            totalCount={documents.length}
            approvedToday={approvedToday}
            rejectedToday={rejectedToday}
            loading={isLoading}
          />
        </Box>

        {/* Quick Stats Bar */}
        {pendingDocuments.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              ml: { md: '60px' },
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.light, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              borderRadius: 2,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap">
              <Typography variant="body1" fontWeight={600} color="warning.dark">
                ⚠️ {pendingDocuments.length} documento{pendingDocuments.length > 1 ? 's' : ''} aguardando sua aprovação
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Selecione os documentos abaixo ou use as ações rápidas
              </Typography>
            </Stack>
          </Paper>
        )}

        {/* Document List */}
        <Box sx={{ position: 'relative', ml: { md: '60px' } }}>
          <AnimatePresence mode="wait">
            {documents.length > 0 ? (
              <motion.div
                key="documents"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {documents.map((document, index) => {
                  const currentStatus = getCurrentApprovalStatus(document.alcada, user?.email);
                  const isPending = currentStatus?.situacao_aprov === 'Pendente';
                  
                  return (
                    <ModernDocumentCard
                      key={`${document.filial}-${document.numero.trim()}-${index}`}
                      document={document}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      loading={isProcessing}
                      userEmail={user?.email}
                      showSelection={showBulkActions && isPending}
                      isSelected={selectedDocuments.has(document.numero.trim())}
                      onSelectChange={handleSelectDocument}
                      currentStatus={currentStatus}
                      isPending={isPending}
                      index={index}
                    />
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
              >
                <EmptyState
                  type={filters.search || filters.numero ? 'no-results' : 'no-documents'}
                  action={{
                    label: 'Atualizar',
                    onClick: () => refetch(),
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Container>

      {/* Floating Action Bar - sempre visível quando há seleção ou documentos pendentes */}
      <FloatingActionBar
        selectedCount={selectedDocuments.size}
        totalPendingCount={pendingDocuments.length}
        onApproveAll={handleApproveAll}
        onRejectAll={handleRejectAll}
        onClearSelection={handleClearSelection}
        onSelectAll={() => handleSelectAll(pendingDocuments)}
        visible={showBulkActions || pendingDocuments.length > 0}
        isProcessing={isProcessing}
      />

      {/* Confirmation Dialogs */}
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
        documentNumber={`${bulkConfirmDialog.documentCount} documentos selecionados`}
        documentValue="Operação em massa"
        loading={isProcessing}
      />

      {/* Scroll to top indicator */}
      <AnimatePresence>
        {trigger && (
          <Zoom in={true}>
            <Box
              sx={{
                position: 'fixed',
                bottom: isMobile ? 100 : 24,
                right: 24,
                zIndex: 1000,
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                '&:hover': {
                  transform: 'scale(1.1)',
                },
              }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              ↑
            </Box>
          </Zoom>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default FloatingDocumentsPage;