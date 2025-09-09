import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
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
  Container,
  useTheme,
  useMediaQuery,
  Collapse,
  Avatar,
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
  Clear,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDocuments, useApproveDocument, useRejectDocument } from '../hooks/useDocuments';
import { useDocumentStore } from '../stores/documentStore';
import { useAuthStore } from '../stores/authStore';
import ConfirmationDialog from './ConfirmationDialog';
import { EmptyState } from './EmptyState';
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
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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

  const currentStatus = getCurrentApprovalStatus(document.alcada, userEmail);
  const isPending = currentStatus?.situacao_aprov === 'Pendente';

  return (
    <Card 
      sx={{ 
        mb: 2,
        border: isPending ? 2 : 1,
        borderColor: isPending ? 'warning.main' : 'divider',
        borderRadius: 2,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
        }
      }}
    >
      {/* HEADER COMPACTO - Sempre visível */}
      <CardContent sx={{ pb: 1 }}>
        <Grid container alignItems="center" spacing={2}>
          {/* Coluna 1: Tipo e Status */}
          <Grid item xs={12} sm={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Chip
                label={getTypeLabel(document.tipo)}
                color={getTypeColor(document.tipo)}
                size="small"
                sx={{ width: 'fit-content' }}
              />
              <Chip
                label={currentStatus.situacao_aprov}
                color={getStatusColor(currentStatus.situacao_aprov)}
                size="small"
                variant={isPending ? 'filled' : 'outlined'}
                sx={{ 
                  width: 'fit-content',
                  ...(isPending && {
                    background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
                    color: 'white',
                    fontWeight: 600,
                  })
                }}
              />
            </Box>
          </Grid>

          {/* Coluna 2: Info Principal */}
          <Grid item xs={12} sm={5}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {document.numero.trim()}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Business sx={{ fontSize: 16 }} />
              {document.nome_fornecedor.trim()}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarToday sx={{ fontSize: 16 }} />
              {formatDate(document.Emissao)}
            </Typography>
          </Grid>

          {/* Coluna 3: Valor e Ações */}
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography variant="h5" color="primary" fontWeight={700} gutterBottom>
                {formatCurrency(document.vl_tot_documento)}
              </Typography>
              
              {/* Ações de Aprovação - SEMPRE VISÍVEIS quando pendente */}
              {isPending && (
                <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<CheckCircle />}
                    onClick={() => onApprove(document.numero.trim())}
                    disabled={loading}
                    sx={{ 
                      minWidth: 100,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: 4,
                      }
                    }}
                  >
                    Aprovar
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<Cancel />}
                    onClick={() => onReject(document.numero.trim())}
                    disabled={loading}
                    sx={{ 
                      minWidth: 100,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: 4,
                      }
                    }}
                  >
                    Rejeitar
                  </Button>
                </Stack>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Botão para expandir detalhes */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            variant="text"
            size="small"
            onClick={() => setExpanded(!expanded)}
            endIcon={<ExpandMore sx={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
          >
            {expanded ? 'Ocultar Detalhes' : 'Ver Detalhes'}
          </Button>
        </Box>
      </CardContent>

      {/* DETALHES EXPANDÍVEIS */}
      <Collapse in={expanded} timeout="auto">
        <Divider />
        <CardContent>

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
      </Collapse>
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
  
  const densityStyles = {};
  
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
          console.log(`Documento ${document.numero.trim()} aprovado com sucesso`);
        },
        onError: () => {
          console.error(`Erro ao aprovar documento ${document.numero.trim()}`);
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
          console.log(`Documento ${document.numero.trim()} rejeitado com sucesso`);
        },
        onError: () => {
          console.error(`Erro ao rejeitar documento ${document.numero.trim()}`);
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
      {/* Enhanced Filters */}
      <Card sx={{ mb: 3, borderRadius: 2 }} role="search" aria-label="Filtros de busca de documentos">
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box component="form" onSubmit={handleSearch}>
                <TextField
                  fullWidth
                  size="medium"
                  placeholder="Buscar por número, fornecedor ou valor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Campo de busca por documentos"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => refetch()}
                  aria-label="Atualizar lista de documentos"
                  sx={{ borderRadius: 2 }}
                >
                  Atualizar
                </Button>
                {searchTerm && (
                  <Button
                    variant="text"
                    startIcon={<Clear />}
                    onClick={() => {
                      setSearchTerm('');
                      setFilters({ ...filters, search: '' });
                    }}
                    aria-label="Limpar busca"
                    sx={{ borderRadius: 2 }}
                  >
                    Limpar
                  </Button>
                )}
              </Stack>
            </Grid>
          </Grid>
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