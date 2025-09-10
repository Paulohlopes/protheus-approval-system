import React, { useState } from 'react';
import { Box, Container, Typography, Fade, useTheme, alpha } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useDocuments } from '../hooks/useDocuments';
import { useDocumentStore } from '../stores/documentStore';
import { useDocumentActions, getCurrentApprovalStatus } from '../hooks/useDocumentActions';
import { getCurrentApprovalStatus as getStatus } from '../utils/documentHelpers';

// Import modern components
import ModernAppHeader from '../components/layout/ModernAppHeader';
import ModernStatCards from '../components/documents/ModernStatCards';
import ModernDocumentFilters from '../components/documents/ModernDocumentFilters';
import ModernDocumentCard from '../components/documents/ModernDocumentCard';
import BulkActionsBar from '../components/documents/BulkActionsBar';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { EmptyState } from '../components/EmptyState';
import { formatDocumentValue } from '../hooks/useDocumentActions';

const ModernDocumentsPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuthStore();
  const { filters, pagination, setFilters } = useDocumentStore();
  const [isLoading, setIsLoading] = useState(false);
  
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

  const { data: documentsResponse, refetch } = useDocuments(filters, pagination);

  // Calculate statistics
  const documents = documentsResponse?.documentos || [];
  const pendingDocuments = documents.filter(doc => {
    const currentStatus = getStatus(doc.alcada, user?.email);
    return currentStatus?.situacao_aprov === 'Pendente';
  });

  const approvedToday = documents.filter(doc => {
    const currentStatus = getStatus(doc.alcada, user?.email);
    return currentStatus?.situacao_aprov === 'Liberado';
  }).length;

  const rejectedToday = documents.filter(doc => {
    const currentStatus = getStatus(doc.alcada, user?.email);
    return currentStatus?.situacao_aprov === 'Rejeitado';
  }).length;

  const handleSearch = (searchTerm: string, numeroTerm: string, advancedFilters?: any) => {
    setIsLoading(true);
    setFilters({ 
      ...filters, 
      search: searchTerm,
      numero: numeroTerm,
      ...advancedFilters
    });
    // Simulate loading delay for smooth UX
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    refetch();
    setTimeout(() => setIsLoading(false), 800);
  };

  const getEmptyStateSecondaryAction = () => {
    if (!filters.search && !filters.numero) return undefined;
    
    return {
      label: 'Limpar busca',
      onClick: () => setFilters({ ...filters, search: '', numero: '' }),
    };
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 50%, ${alpha(theme.palette.background.default, 1)} 100%)`,
      }}
    >
      <ModernAppHeader />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Welcome section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ mb: 4 }}>
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
              Gerencie seus documentos de forma rápida e eficiente.
            </Typography>
          </Box>
        </motion.div>

        {/* Statistics Cards */}
        <ModernStatCards
          pendingCount={pendingDocuments.length}
          totalCount={documents.length}
          approvedToday={approvedToday}
          rejectedToday={rejectedToday}
          loading={isLoading}
        />

        {/* Filters */}
        <ModernDocumentFilters
          onSearch={handleSearch}
          onRefresh={handleRefresh}
          onToggleBulkActions={toggleBulkActions}
          showBulkActions={showBulkActions}
          hasPendingDocuments={pendingDocuments.length > 0}
          initialSearch={filters.search}
          initialNumero={filters.numero}
        />

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {showBulkActions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <BulkActionsBar
                selectedCount={selectedDocuments.size}
                totalPendingCount={pendingDocuments.length}
                allSelected={pendingDocuments.length > 0 && selectedDocuments.size === pendingDocuments.length}
                onSelectAll={() => handleSelectAll(pendingDocuments)}
                onBulkApprove={handleBulkApprove}
                onBulkReject={handleBulkReject}
                onCancel={toggleBulkActions}
                isProcessing={isProcessing}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Document List */}
        <Box sx={{ position: 'relative' }}>
          {isLoading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: alpha(theme.palette.background.default, 0.8),
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(4px)',
                borderRadius: 3,
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    border: `4px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    borderTop: `4px solid ${theme.palette.primary.main}`,
                    borderRadius: '50%',
                  }}
                />
              </motion.div>
            </Box>
          )}

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
                  const currentStatus = getStatus(document.alcada, user?.email);
                  const isPending = currentStatus?.situacao_aprov === 'Pendente';
                  
                  return (
                    <ModernDocumentCard
                      key={`${document.filial}-${document.numero.trim()}-${index}`}
                      document={document}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      loading={isProcessing}
                      userEmail={user?.email}
                      showSelection={showBulkActions}
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
                    onClick: handleRefresh,
                  }}
                  secondaryAction={getEmptyStateSecondaryAction()}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

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
      </Container>

      {/* Floating Action Button for quick actions */}
      <AnimatePresence>
        {pendingDocuments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1000,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                },
              }}
              onClick={toggleBulkActions}
            >
              <Typography variant="h6" fontWeight={700}>
                {pendingDocuments.length}
              </Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default ModernDocumentsPage;