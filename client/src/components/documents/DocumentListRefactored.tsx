import React, { useEffect } from 'react';
import { Box, Alert, Button, Card, CardContent, Skeleton } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useDocuments, QUERY_KEYS } from '../../hooks/useDocuments';
import { useDocumentActions, getCurrentApprovalStatus, formatDocumentValue } from '../../hooks/useDocumentActions';
import { useDocumentStore } from '../../stores/documentStore';
import { useAuthStore } from '../../stores/authStore';
import DocumentCard from './DocumentCard';
import DocumentFilters from './DocumentFilters';
import BulkActionsBar from './BulkActionsBar';
import ConfirmationDialog from '../ConfirmationDialog';
import { EmptyState } from '../EmptyState';
import type { ProtheusDocument } from '../../types/auth';

const DocumentListRefactored: React.FC = () => {
  const { user } = useAuthStore();
  const { filters, pagination, setFilters, setPagination } = useDocumentStore();
  const queryClient = useQueryClient();
  
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

  // Invalidar cache quando filtros mudarem
  useEffect(() => {
    console.log('DocumentList - Filters changed, invalidating cache:', filters);
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.documents });
  }, [filters.search, filters.numero, queryClient]);

  const { data: documentsResponse, isLoading, error, refetch } = useDocuments(filters, pagination);

  const handleSearch = (searchTerm: string, numeroTerm: string) => {
    console.log('handleSearch - Updating filters with:', { search: searchTerm, numero: numeroTerm });
    setFilters({ 
      ...filters, 
      search: searchTerm,
      numero: numeroTerm
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setPagination({ page });
  };

  // Filtrar documentos pendentes
  const pendingDocuments = documentsResponse?.documentos?.filter(doc => {
    const currentStatus = getCurrentApprovalStatus(doc.alcada, user?.email);
    return currentStatus?.situacao_aprov === 'Pendente';
  }) || [];

  const getEmptyStateSecondaryAction = () => {
    if (!filters.search && !filters.numero) return undefined;
    
    return {
      label: 'Limpar busca',
      onClick: () => {
        setFilters({ ...filters, search: '', numero: '' });
      },
    };
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Erro ao carregar documentos: {error.message}
        <Button onClick={() => refetch()} sx={{ ml: 2 }}>
          Tentar novamente
        </Button>
      </Alert>
    );
  }

  return (
    <Box component="section" aria-label="Lista de documentos para aprovação">
      <DocumentFilters
        onSearch={handleSearch}
        onRefresh={handleRefresh}
        onToggleBulkActions={toggleBulkActions}
        showBulkActions={showBulkActions}
        hasPendingDocuments={pendingDocuments.length > 0}
        initialSearch={filters.search}
        initialNumero={filters.numero}
      />

      {showBulkActions && (
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
      )}

      {isLoading ? (
        <DocumentListSkeleton />
      ) : documentsResponse?.documentos && documentsResponse.documentos.length > 0 ? (
        <>
          {documentsResponse.documentos.map((document, index) => {
            const currentStatus = getCurrentApprovalStatus(document.alcada, user?.email);
            const isPending = currentStatus?.situacao_aprov === 'Pendente';
            
            return (
              <DocumentCard
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
              />
            );
          })}
        </>
      ) : (
        <EmptyState
          type={filters.search || filters.numero ? 'no-results' : 'no-documents'}
          action={{
            label: 'Atualizar',
            onClick: () => refetch(),
          }}
          secondaryAction={getEmptyStateSecondaryAction()}
        />
      )}
      
      <ConfirmationDialog
        open={confirmDialog.open}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmAction}
        action={confirmDialog.action}
        documentNumber={confirmDialog.document ? String(confirmDialog.document.numero).trim() : undefined}
        documentValue={formatDocumentValue(confirmDialog.document)}
        loading={isProcessing}
      />

      <ConfirmationDialog
        open={bulkConfirmDialog.open}
        onClose={handleCloseBulkDialog}
        onConfirm={(comments) => handleBulkConfirmAction(documentsResponse?.documentos || [], comments)}
        action={bulkConfirmDialog.action}
        documentNumber={`${bulkConfirmDialog.documentCount} documentos selecionados`}
        documentValue={`Operação em massa`}
        loading={isProcessing}
      />
    </Box>
  );
};

const DocumentListSkeleton: React.FC = () => {
  return (
    <Box>
      {[...Array(5)].map((_, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="40%" />
            <Box sx={{ mt: 2 }}>
              <Skeleton variant="rectangular" width={100} height={36} />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default DocumentListRefactored;