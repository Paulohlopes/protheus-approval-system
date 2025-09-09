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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  MoreVert,
  Search,
  Refresh,
  ExpandMore,
  Person,
  Business,
  CalendarToday,
  AttachMoney,
  Description,
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
    if (!value || typeof value !== 'string') {
      return 'R$ 0,00';
    }
    // Remove pontos e converte vírgula para ponto
    const numValue = parseFloat(value.replace(/\./g, '').replace(',', '.'));
    if (isNaN(numValue)) {
      return 'R$ 0,00';
    }
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
        {/* Header com informações principais */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" component="div" gutterBottom sx={{ fontWeight: 600 }}>
              {getTypeLabel(document.tipo)} - {document.numero.trim()}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Business fontSize="small" color="action" />
              <Typography variant="body1" color="text.primary">
                {document.nome_fornecedor.trim()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttachMoney fontSize="small" color="primary" />
              <Typography variant="h5" color="primary" sx={{ fontWeight: 600 }}>
                {formatCurrency(document.vl_tot_documento)}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexDirection: 'column' }}>
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
          </Box>
        </Box>

        {/* Informações gerais */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Description fontSize="small" />
              Informações Gerais
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Filial
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {document.filial}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Data de Emissão
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatDate(document.Emissao)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Comprador
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {document.comprador}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Condição de Pagamento
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {document.cond_pagamento}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Fornecedor
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {document.cod_fornecedor}/{document.loja} - {document.nome_fornecedor.trim()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person fontSize="small" />
              Alçada de Aprovação
            </Typography>
            <Box sx={{ pl: 2 }}>
              {document.alcada.map((nivel, index) => (
                <Box key={index} sx={{ mb: 1, p: 1, bgcolor: nivel.situacao_aprov === 'Pendente' ? 'warning.light' : 'transparent', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight={500}>
                    Nível {nivel.nivel_aprov} - {nivel.avaliado_aprov}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Grupo: {nivel.CDESCGRUPO} | Status: {nivel.situacao_aprov}
                  </Typography>
                  {nivel.data_lib_aprov && nivel.data_lib_aprov.trim() !== '' && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Liberado em: {nivel.data_lib_aprov}
                    </Typography>
                  )}
                  {nivel.observacao_aprov && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Obs: {nivel.observacao_aprov}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>

        {/* Itens do documento */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">Itens ({document.itens.length})</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Produto</TableCell>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Qtd</TableCell>
                    <TableCell>Unidade</TableCell>
                    <TableCell>Preço</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Centro de Custo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {document.itens.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.item}</TableCell>
                      <TableCell>{item.produto}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }}>
                          {item.descr_produto}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.quantidade}</TableCell>
                      <TableCell>{item.unidade_medida}</TableCell>
                      <TableCell>R$ {item.preco}</TableCell>
                      <TableCell>R$ {item.total}</TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {item.centro_custo} - {item.descr_cc}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Informações adicionais dos itens */}
            {document.itens.some(item => item.observacao) && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Observações dos Itens:</Typography>
                {document.itens.filter(item => item.observacao).map((item, index) => (
                  <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Item {item.item}: {item.observacao}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Botões de ação */}
        {(() => {
          const currentStatus = getCurrentApprovalStatus(document.alcada, userEmail);
          return currentStatus?.situacao_aprov === 'Pendente' ? (
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => onApprove(document.numero.trim())}
                disabled={loading}
                size="large"
                aria-label={`Aprovar documento ${document.numero.trim()} no valor de ${formatCurrency(document.vl_tot_documento)}`}
              >
                Aprovar Documento
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Cancel />}
                onClick={() => onReject(document.numero.trim())}
                disabled={loading}
                size="large"
                aria-label={`Rejeitar documento ${document.numero.trim()} no valor de ${formatCurrency(document.vl_tot_documento)}`}
              >
                Rejeitar Documento
              </Button>
            </Box>
          ) : (
            <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Este documento não está pendente de sua aprovação
              </Typography>
            </Box>
          );
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

  const getEmptyStateSecondaryAction = () => {
    if (!searchTerm) return undefined;
    
    return {
      label: 'Limpar busca',
      onClick: () => {
        setSearchTerm('');
        setFilters({ ...filters, search: '' });
      },
    };
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
          secondaryAction={getEmptyStateSecondaryAction()}
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