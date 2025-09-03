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
  Pagination,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  MoreVert,
  Search,
  FilterList,
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
import { DensityToggle, useDensity } from './DensityToggle';
import type { ProtheusDocument } from '../types/auth';

// Priority colors
const getPriorityColor = (priority: ProtheusDocument['priority']) => {
  switch (priority) {
    case 'urgent':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'success';
    default:
      return 'default';
  }
};

// Status colors
const getStatusColor = (status: ProtheusDocument['status']) => {
  switch (status) {
    case 'approved':
      return 'success';
    case 'rejected':
      return 'error';
    case 'expired':
      return 'error';
    case 'pending':
      return 'warning';
    default:
      return 'default';
  }
};

// Status labels
const getStatusLabel = (status: ProtheusDocument['status']) => {
  switch (status) {
    case 'approved':
      return 'Aprovado';
    case 'rejected':
      return 'Rejeitado';
    case 'expired':
      return 'Expirado';
    case 'pending':
      return 'Pendente';
    default:
      return status;
  }
};

// Priority labels
const getPriorityLabel = (priority: ProtheusDocument['priority']) => {
  switch (priority) {
    case 'urgent':
      return 'Urgente';
    case 'high':
      return 'Alta';
    case 'medium':
      return 'Média';
    case 'low':
      return 'Baixa';
    default:
      return priority;
  }
};

interface DocumentCardProps {
  document: ProtheusDocument;
  onApprove: (documentId: string) => void;
  onReject: (documentId: string) => void;
  loading?: boolean;
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
  densityStyles
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: document.currency || 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  return (
    <Card sx={{ mb: densityStyles.cardSpacing, position: 'relative' }}>
      <CardContent sx={{ p: densityStyles.cardPadding }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div" gutterBottom>
              {document.number}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {document.description}
            </Typography>
            <Typography variant="h6" color="primary" gutterBottom>
              {formatCurrency(document.value)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              label={getPriorityLabel(document.priority)}
              color={getPriorityColor(document.priority)}
              size={densityStyles.chipSize}
            />
            <Chip
              label={getStatusLabel(document.status)}
              color={getStatusColor(document.status)}
              size={densityStyles.chipSize}
            />
            <IconButton size="small">
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Solicitante
            </Typography>
            <Typography variant="body2">
              {document.requester.name}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Data da Solicitação
            </Typography>
            <Typography variant="body2">
              {formatDate(document.requestDate)}
            </Typography>
          </Grid>
          {document.dueDate && (
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Prazo
              </Typography>
              <Typography variant="body2">
                {formatDate(document.dueDate)}
              </Typography>
            </Grid>
          )}
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Tipo
            </Typography>
            <Typography variant="body2">
              {document.type.replace('_', ' ').toUpperCase()}
            </Typography>
          </Grid>
        </Grid>

        {document.status === 'pending' && (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => onApprove(document.id)}
              disabled={loading}
              size="small"
              aria-label={`Aprovar documento ${document.number} no valor de ${new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: document.currency || 'BRL'
              }).format(document.value)}`}
            >
              Aprovar
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              onClick={() => onReject(document.id)}
              disabled={loading}
              size="small"
              aria-label={`Rejeitar documento ${document.number} no valor de ${new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: document.currency || 'BRL'
              }).format(document.value)}`}
            >
              Rejeitar
            </Button>
          </Box>
        )}
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

  const handleApprove = (documentId: string) => {
    const document = documentsResponse?.data?.find(doc => doc.id === documentId);
    if (document) {
      setConfirmDialog({
        open: true,
        action: 'approve',
        document
      });
    }
  };

  const handleReject = (documentId: string) => {
    const document = documentsResponse?.data?.find(doc => doc.id === documentId);
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
        documentId: document.id,
        action: 'approve',
        approverId: user.id,
        comments: '',
      }, {
        onSuccess: () => {
          announce(`Documento ${document.number} aprovado com sucesso`);
        },
        onError: () => {
          announce(`Erro ao aprovar documento ${document.number}`);
        }
      });
    } else {
      rejectDocument.mutate({
        documentId: document.id,
        action: 'reject',
        approverId: user.id,
        comments: 'Rejeitado pelo aprovador',
      }, {
        onSuccess: () => {
          announce(`Documento ${document.number} rejeitado com sucesso`);
        },
        onError: () => {
          announce(`Erro ao rejeitar documento ${document.number}`);
        }
      });
    }

    setConfirmDialog({ open: false, action: 'approve', document: null });
  };

  const handleCloseDialog = () => {
    setConfirmDialog({ open: false, action: 'approve', document: null });
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setFilters({ ...filters, search: searchTerm });
  };

  const handleStatusFilter = (status: string) => {
    const newStatus = status === 'all' ? [] : [status];
    setFilters({ ...filters, status: newStatus });
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
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={filters.status?.[0] || 'all'}
                label="Status"
                onChange={(e) => handleStatusFilter(e.target.value)}
                aria-label="Filtro por status do documento"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="pending">Pendentes</MenuItem>
                <MenuItem value="approved">Aprovados</MenuItem>
                <MenuItem value="rejected">Rejeitados</MenuItem>
              </Select>
            </FormControl>

            <DensityToggle
              density={density}
              onDensityChange={setDensity}
            />

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
      ) : documentsResponse?.data && documentsResponse.data.length > 0 ? (
        <>
          {documentsResponse.data.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              onApprove={handleApprove}
              onReject={handleReject}
              loading={approveDocument.isPending || rejectDocument.isPending}
              densityStyles={densityStyles}
            />
          ))}
          
          {/* Pagination */}
          {documentsResponse.pagination && documentsResponse.pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={documentsResponse.pagination.totalPages}
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      ) : (
        <EmptyState
          type={searchTerm || filters.status?.length ? 'no-results' : 'no-documents'}
          action={{
            label: 'Atualizar',
            onClick: () => refetch(),
          }}
          secondaryAction={searchTerm || filters.status?.length ? {
            label: 'Limpar filtros',
            onClick: () => {
              setSearchTerm('');
              setFilters({ ...filters, search: '', status: [] });
            },
          } : undefined}
        />
      )}
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmAction}
        action={confirmDialog.action}
        documentNumber={confirmDialog.document?.number}
        documentValue={confirmDialog.document ? 
          new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: confirmDialog.document.currency || 'BRL'
          }).format(confirmDialog.document.value) : undefined
        }
        loading={approveDocument.isPending || rejectDocument.isPending}
      />
    </Box>
  );
};

export default DocumentList;