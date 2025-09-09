import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Grid,
  Skeleton,
  Alert,
  TextField,
  InputAdornment,
  Button,
  Stack,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  MoreVert,
  Search,
  Refresh,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDocuments, useApproveDocument, useRejectDocument } from '../hooks/useDocuments';
import { useDocumentStore } from '../stores/documentStore';
import { useAuthStore } from '../stores/authStore';
import { useLiveRegion } from '../hooks/useLiveRegion';
import ConfirmationDialog from './ConfirmationDialog';
import { EmptyState } from './EmptyState';
import { useDensity } from './DensityToggle';
import type { ProtheusDocument, DocumentApprovalLevel } from '../types/auth';

// Type colors
const getTypeColor = (type: ProtheusDocument['tipo']) => {
  switch (type) {
    case 'IP':
      return 'primary';
    case 'SC':
      return 'info';
    case 'CP':
      return 'warning';
    default:
      return 'default';
  }
};

// Type labels
const getTypeLabel = (type: ProtheusDocument['tipo']) => {
  switch (type) {
    case 'IP':
      return 'Pedido de Compra';
    case 'SC':
      return 'Solicitação de Compra';
    case 'CP':
      return 'Contrato de Parceria';
    default:
      return type;
  }
};

// Status colors from approval level
const getStatusColor = (situacao: string) => {
  switch (situacao) {
    case 'Liberado':
      return 'success';
    case 'Pendente':
      return 'warning';
    case 'Aguardando nivel anterior':
      return 'info';
    case 'Rejeitado':
      return 'error';
    default:
      return 'default';
  }
};

// Get current approval status
const getCurrentApprovalStatus = (alcada: DocumentApprovalLevel[], userEmail?: string) => {
  const currentLevel = alcada.find(level => 
    level.CIDENTIFICADOR === userEmail?.split('@')[0] ||
    level.CNOME === userEmail?.split('@')[0]
  );
  return currentLevel || alcada[0];
};

interface DocumentCardProps {
  document: ProtheusDocument;
  onApprove: (documentNumber: string) => void;
  onReject: (documentNumber: string) => void;
  loading?: boolean;
  userEmail?: string;
}

interface DocumentCardWithDensityProps extends DocumentCardProps {
  densityStyles: {
    cardSpacing: number;
    cardPadding: number;
    textSpacing: number;
    chipSize: 'small' | 'medium';
    avatarSize: number;
  };
}

const DocumentCard: React.FC<DocumentCardWithDensityProps> = React.memo(({ 
  document, 
  onApprove, 
  onReject, 
  loading,
  densityStyles,
  userEmail
}) => {
  const formatCurrency = (value: string) => {
    // Remove pontos e converte vírgula para ponto
    const numValue = parseFloat(value.replace(/\./g, '').replace(',', '.'));
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const formatDate = (date: string) => {
    // Date comes in format YYYYMMDD, convert to DD/MM/YYYY
    if (date.length === 8) {
      const year = date.substring(0, 4);
      const month = date.substring(4, 6);
      const day = date.substring(6, 8);
      return `${day}/${month}/${year}`;
    }
    // If date is already formatted or in another format
    if (date.includes('/')) {
      return date;
    }
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  return (
    <Card sx={{ mb: densityStyles.cardSpacing, position: 'relative' }}>
      <CardContent sx={{ p: densityStyles.cardPadding }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div" gutterBottom>
              Documento: {document.numero.trim()}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Fornecedor: {document.nome_fornecedor.trim()}
            </Typography>
            <Typography variant="h6" color="primary" gutterBottom>
              {formatCurrency(document.vl_tot_documento)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              label={getTypeLabel(document.tipo)}
              color={getTypeColor(document.tipo)}
              size={densityStyles.chipSize}
            />
            {(() => {
              const currentStatus = getCurrentApprovalStatus(document.alcada, userEmail);
              return (
                <Chip
                  label={currentStatus.situacao_aprov}
                  color={getStatusColor(currentStatus.situacao_aprov)}
                  size={densityStyles.chipSize}
                />
              );
            })()}
            <IconButton size="small">
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Comprador
            </Typography>
            <Typography variant="body2">
              {document.comprador}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Data de Emissão
            </Typography>
            <Typography variant="body2">
              {formatDate(document.Emissao)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Condição de Pagamento
            </Typography>
            <Typography variant="body2">
              {document.cond_pagamento}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Filial
            </Typography>
            <Typography variant="body2">
              {document.filial}
            </Typography>
          </Grid>
        </Grid>

        {(() => {
          const currentStatus = getCurrentApprovalStatus(document.alcada, userEmail);
          return currentStatus?.situacao_aprov === 'Pendente' ? (
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => onApprove(document.numero.trim())}
                disabled={loading}
                size="small"
                aria-label={`Aprovar documento ${document.numero.trim()} no valor de ${formatCurrency(document.vl_tot_documento)}`}
              >
                Aprovar
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Cancel />}
                onClick={() => onReject(document.numero.trim())}
                disabled={loading}
                size="small"
                aria-label={`Rejeitar documento ${document.numero.trim()} no valor de ${formatCurrency(document.vl_tot_documento)}`}
              >
                Rejeitar
              </Button>
            </Box>
          ) : null;
        })()}
      </CardContent>
    </Card>
  );
});

const DocumentList: React.FC = () => {
  const { user } = useAuthStore();
  const { filters, pagination, setFilters, setPagination } = useDocumentStore();
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject';
    document: ProtheusDocument | null;
  }>({ open: false, action: 'approve', document: null });
  
  const { message, announce, liveRegionProps } = useLiveRegion({ politeness: 'assertive' });
  const { density, setDensity, styles: densityStyles } = useDensity('documents-density');
  
  const { data: documentsResponse, isLoading, error, refetch } = useDocuments(filters, pagination);
  const approveDocument = useApproveDocument();
  const rejectDocument = useRejectDocument();

  const handleApprove = (documentNumber: string) => {
    const document = documentsResponse?.documentos?.find(doc => doc.numero.trim() === documentNumber);
    if (document) {
      setConfirmDialog({
        open: true,
        action: 'approve',
        document
      });
    }
  };

  const handleReject = (documentNumber: string) => {
    const document = documentsResponse?.documentos?.find(doc => doc.numero.trim() === documentNumber);
    if (document) {
      setConfirmDialog({
        open: true,
        action: 'reject',
        document
      });
    }
  };

  const handleConfirmAction = () => {
    if (!confirmDialog.document || !user) return;

    const document = confirmDialog.document;
    const action = confirmDialog.action;

    if (action === 'approve') {
      approveDocument.mutate({
        documentId: document.numero.trim(),
        action: 'approve',
        approverId: user.id,
        comments: '',
      }, {
        onSuccess: () => {
          announce(`Documento ${document.numero.trim()} aprovado com sucesso`);
        },
        onError: () => {
          announce(`Erro ao aprovar documento ${document.numero.trim()}`);
        }
      });
    } else {
      rejectDocument.mutate({
        documentId: document.numero.trim(),
        action: 'reject',
        approverId: user.id,
        comments: 'Rejeitado pelo aprovador',
      }, {
        onSuccess: () => {
          announce(`Documento ${document.numero.trim()} rejeitado com sucesso`);
        },
        onError: () => {
          announce(`Erro ao rejeitar documento ${document.numero.trim()}`);
        }
      });
    }

    setConfirmDialog({ open: false, action: 'approve', document: null });
  };

  const handleCloseDialog = () => {
    setConfirmDialog({ open: false, action: 'approve', document: null });
  };

  const formatDocumentValue = (document: ProtheusDocument | null): string | undefined => {
    if (!document) return undefined;
    
    const numValue = parseFloat(document.vl_tot_documento.replace(/\./g, '').replace(',', '.'));
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setFilters({ ...filters, search: searchTerm });
  };


  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setPagination({ page });
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
      {/* Live Region para anúncios de acessibilidade */}
      <div {...liveRegionProps}>
        {message}
      </div>
      {/* Filters */}
      <Card sx={{ mb: 3 }} role="search" aria-label="Filtros de busca de documentos">
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Box component="form" onSubmit={handleSearch} sx={{ flex: 1, minWidth: 200 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Campo de busca por documentos"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search aria-hidden="true" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <IconButton 
              onClick={() => refetch()}
              aria-label="Atualizar lista de documentos"
              title="Atualizar lista de documentos"
            >
              <Refresh />
            </IconButton>
          </Stack>
        </CardContent>
      </Card>

      {/* Document List */}
      {isLoading ? (
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
      ) : documentsResponse?.documentos && documentsResponse.documentos.length > 0 ? (
        <>
          {documentsResponse.documentos.map((document) => (
            <DocumentCard
              key={document.numero}
              document={document}
              onApprove={handleApprove}
              onReject={handleReject}
              loading={approveDocument.isPending || rejectDocument.isPending}
              densityStyles={densityStyles}
              userEmail={user?.email}
            />
          ))}
          
          {/* Pagination - if needed in the future */}
        </>
      ) : (
        <EmptyState
          type={searchTerm ? 'no-results' : 'no-documents'}
          action={{
            label: 'Atualizar',
            onClick: () => refetch(),
          }}
          secondaryAction={searchTerm ? {
            label: 'Limpar busca',
            onClick: () => {
              setSearchTerm('');
              setFilters({ ...filters, search: '' });
            },
          } : undefined
        />
      )}
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmAction}
        action={confirmDialog.action}
        documentNumber={confirmDialog.document?.numero.trim()}
        documentValue={formatDocumentValue(confirmDialog.document)}
        loading={approveDocument.isPending || rejectDocument.isPending}
      />
    </Box>
  );
};

export default DocumentList;