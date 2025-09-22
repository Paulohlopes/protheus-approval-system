import React, { useState, useEffect } from 'react';
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
  Checkbox,
  FormControlLabel,
  Tooltip,
  Badge,
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
  SelectAll,
  PlaylistAddCheck,
  Close,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDocuments, useApproveDocument, useRejectDocument, QUERY_KEYS } from '../hooks/useDocuments';
import { useQueryClient } from '@tanstack/react-query';
import { useDocumentStore } from '../stores/documentStore';
import { useAuthStore } from '../stores/authStore';
import ConfirmationDialog from './ConfirmationDialog';
import { EmptyState } from './EmptyState';
import type { ProtheusDocument, DocumentApprovalLevel } from '../types/auth';
import { useLanguage } from '../contexts/LanguageContext';

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
const getTypeLabel = (type: ProtheusDocument['tipo'], t?: any) => {
  switch (type) {
    case 'IP':
      return t?.documentTypes?.IP || 'Pedido de Compra';
    case 'SC':
      return t?.documentTypes?.SC || 'Solicitação de Compra';
    case 'CP':
      return t?.documentTypes?.CP || 'Contrato de Parceria';
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
  isSelected?: boolean;
  onSelectChange?: (documentNumber: string, selected: boolean) => void;
  showSelection?: boolean;
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
  userEmail,
  isSelected,
  onSelectChange,
  showSelection
}) => {
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { t, formatMessage } = useLanguage();
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
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        transition: 'all 0.2s ease-in-out',
        bgcolor: 'background.paper',
        '&:hover': {
          boxShadow: 2,
          transform: 'translateY(-1px)',
        }
      }}
    >
      {/* HEADER COMPACTO - Sempre visível */}
      <CardContent sx={{ pb: 1 }}>
        {/* Primeira linha: Informações principais */}
        <Grid container alignItems="flex-start" spacing={2} sx={{ mb: 2 }}>
          {/* Checkbox de seleção (apenas para documentos pendentes se showSelection estiver ativo) */}
          {showSelection && isPending && (
            <Grid item xs="auto">
              <Checkbox
                checked={isSelected || false}
                onChange={(e) => onSelectChange?.(document.numero.trim(), e.target.checked)}
                color="primary"
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Grid>
          )}
          
          {/* Coluna 1: Número do documento e tipo/status */}
          <Grid item xs={12} sm={showSelection && isPending ? 3 : 3.5}>
            <Box>
              <Typography 
                variant={isMobile ? "subtitle1" : "h6"} 
                fontWeight={700} 
                gutterBottom 
                sx={{ 
                  color: 'text.primary', 
                  mb: 1.5,
                  fontSize: isMobile ? '1.1rem' : '1.25rem'
                }}
              >
                {document.numero.trim()}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, flexWrap: 'wrap' }}>
                {/* Tipo de Documento */}
                <Chip
                  label={getTypeLabel(document.tipo, t)}
                  color={getTypeColor(document.tipo)}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    fontWeight: 500,
                    fontSize: '0.7rem',
                    height: 22,
                    '& .MuiChip-label': {
                      px: 1
                    }
                  }}
                />
                
                {/* Status */}
                <Chip
                  label={currentStatus.situacao_aprov}
                  color={getStatusColor(currentStatus.situacao_aprov)}
                  size="small"
                  variant={isPending ? 'filled' : 'outlined'}
                  sx={{ 
                    fontWeight: 500,
                    fontSize: '0.7rem',
                    height: 22,
                    '& .MuiChip-label': {
                      px: 1
                    },
                    ...(isPending && {
                      bgcolor: 'warning.main',
                      color: 'warning.contrastText',
                    }),
                    ...(currentStatus.situacao_aprov === 'Liberado' && {
                      bgcolor: 'success.light',
                      color: 'success.contrastText',
                      borderColor: 'success.light',
                    }),
                    ...(currentStatus.situacao_aprov === 'Rejeitado' && {
                      bgcolor: 'error.light',
                      color: 'error.contrastText',
                      borderColor: 'error.light',
                    })
                  }}
                />
              </Box>
            </Box>
          </Grid>

          {/* Coluna 2: Fornecedor e Data */}
          <Grid item xs={12} sm={4.5}>
            <Box sx={{ pt: 0.5 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Business sx={{ fontSize: 18, color: 'action.active' }} />
                <Box component="span" sx={{ fontWeight: 500 }}>
                  {document.nome_fornecedor ? String(document.nome_fornecedor).trim() : 'N/A'}
                </Box>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarToday sx={{ fontSize: 18, color: 'action.active' }} />
                <Box component="span">
                  {t?.documentDetails?.issueDateShort || 'Emissão'}: {formatDate(document.Emissao)}
                </Box>
              </Typography>
            </Box>
          </Grid>

          {/* Coluna 3: Valor em destaque */}
          <Grid item xs={12} sm={4}>
            <Box sx={{ 
              textAlign: { xs: 'left', sm: 'right' },
              ...(isMobile && {
                mt: 1,
                mb: 1
              })
            }}>
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ 
                  display: 'block', 
                  mb: 0.25,
                  fontSize: '0.7rem',
                  fontWeight: 500
                }}
              >
                {t?.documents?.totalValue || 'Valor Total'}
              </Typography>
              <Typography 
                variant={isMobile ? "h6" : "h5"} 
                sx={{
                  color: 'text.primary',
                  fontWeight: 700,
                  fontSize: isMobile ? '1.25rem' : '1.5rem'
                }}
              >
                {formatCurrency(document.vl_tot_documento)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Segunda linha: Ações (separada das informações) */}
        {isPending && !showSelection && (
          <Box sx={{ 
            borderTop: '1px solid',
            borderColor: 'divider',
            pt: 2,
            mt: 2
          }}>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={1.5} 
              justifyContent={{ xs: 'stretch', sm: 'flex-end' }}
            >
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<CheckCircle />}
                onClick={() => onApprove(document.numero.trim())}
                disabled={loading}
                fullWidth={isMobile}
                sx={{ 
                  minWidth: { xs: 'auto', sm: 110 },
                  fontWeight: 500,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: 2,
                  }
                }}
              >
                {t?.common?.approve || 'Aprovar'}
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<Cancel />}
                onClick={() => onReject(document.numero.trim())}
                disabled={loading}
                fullWidth={isMobile}
                sx={{ 
                  minWidth: { xs: 'auto', sm: 110 },
                  fontWeight: 500,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: 1,
                    bgcolor: 'error.50'
                  }
                }}
              >
                {t?.common?.reject || 'Rejeitar'}
              </Button>
            </Stack>
          </Box>
        )}
        
        {/* Se não houver ações pendentes, apenas mostrar uma linha divisória sutil */}
        {!isPending && (
          <Box sx={{ 
            borderTop: '1px solid',
            borderColor: 'divider',
            mt: 2,
            opacity: 0.3
          }} />
        )}

        {/* Botão para expandir detalhes */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <Button
            variant="text"
            size="small"
            onClick={() => setExpanded(!expanded)}
            endIcon={<ExpandMore sx={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
          >
            {expanded ? (t?.common?.hideDetails || 'Ocultar Detalhes') : (t?.common?.viewDetails || 'Ver Detalhes')}
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
              {t?.documentDetails?.generalInfo || 'Informações Gerais'}
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    {t?.documentDetails?.branch || 'Filial'}
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {document.filial}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    {t?.documentDetails?.issueDate || 'Data de Emissão'}
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatDate(document.Emissao)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    {t?.documentDetails?.buyerInfo || 'Comprador'}
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {document.comprador}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    {t?.documentDetails?.paymentCondition || 'Condição de Pagamento'}
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {document.cond_pagamento}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    {t?.documentDetails?.supplierInfo || 'Fornecedor'}
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {document.cod_fornecedor}/{document.loja} - {document.nome_fornecedor ? String(document.nome_fornecedor).trim() : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>

        {/* Itens do documento */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">{formatMessage(t?.documentDetails?.itemsCount || 'Itens ({{count}})', { count: document.itens.length })}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t?.table?.item || 'Item'}</TableCell>
                    <TableCell>{t?.table?.product || 'Produto'}</TableCell>
                    <TableCell>{t?.table?.description || 'Descrição'}</TableCell>
                    <TableCell>{t?.table?.quantity || 'Qtd'}</TableCell>
                    <TableCell>{t?.table?.unit || 'Unidade'}</TableCell>
                    <TableCell>{t?.table?.price || 'Preço'}</TableCell>
                    <TableCell>{t?.table?.total || 'Total'}</TableCell>
                    <TableCell>{t?.documents?.costCenter || 'Centro de Custo'}</TableCell>
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

        {/* Alçada de Aprovação */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6">{t?.documents?.approvalHierarchy || 'Alçada de Aprovação'}</Typography>
              <Typography variant="body2" color="text.secondary">
                ({formatMessage(document.alcada.length === 1 ? (t?.documentDetails?.levelCount || '{{count}} nível') : (t?.documentDetails?.levelCountPlural || '{{count}} níveis'), { count: document.alcada.length })})
              </Typography>
              {(() => {
                const pendingCount = document.alcada.filter(n => n.situacao_aprov === 'Pendente').length;
                const approvedCount = document.alcada.filter(n => n.situacao_aprov === 'Liberado').length;
                const rejectedCount = document.alcada.filter(n => n.situacao_aprov === 'Rejeitado').length;
                
                return (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {approvedCount > 0 && (
                      <Chip 
                        label={`${approvedCount} aprovado${approvedCount > 1 ? 's' : ''}`}
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                    {pendingCount > 0 && (
                      <Chip 
                        label={formatMessage(pendingCount === 1 ? (t?.documentDetails?.pendingCount || '{{count}} pendente') : (t?.documentDetails?.pendingCountPlural || '{{count}} pendentes'), { count: pendingCount })}
                        size="small"
                        color="warning"
                        variant="filled"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                    {rejectedCount > 0 && (
                      <Chip 
                        label={`${rejectedCount} rejeitado${rejectedCount > 1 ? 's' : ''}`}
                        size="small"
                        color="error"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                );
              })()}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width="10%">Nível</TableCell>
                    <TableCell width="20%">Aprovador</TableCell>
                    <TableCell width="15%">Grupo</TableCell>
                    <TableCell width="12%">Status</TableCell>
                    <TableCell width="13%">Data Liberação</TableCell>
                    <TableCell width="30%">Observação do Aprovador</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {document.alcada.map((nivel, index) => {
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case 'Liberado': return 'success';
                        case 'Pendente': return 'warning';
                        case 'Aguardando nivel anterior': return 'info';
                        case 'Rejeitado': return 'error';
                        default: return 'default';
                      }
                    };

                    return (
                      <TableRow 
                        key={index}
                        sx={{
                          bgcolor: nivel.situacao_aprov === 'Pendente' ? 'warning.50' : 'inherit',
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color="primary">
                            Nível {nivel.nivel_aprov}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {nivel.CNOME || nivel.aprovador_aprov}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {nivel.CDESCGRUPO}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={nivel.situacao_aprov} 
                            size="small"
                            color={getStatusColor(nivel.situacao_aprov) as any}
                            variant={nivel.situacao_aprov === 'Pendente' ? 'filled' : 'outlined'}
                            sx={{ 
                              fontSize: '0.7rem',
                              height: 20,
                              fontWeight: 500
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {(() => {
                              if (!nivel.data_lib_aprov || nivel.data_lib_aprov === '') return '-';
                              // Se a data estiver no formato YYYYMMDD
                              if (nivel.data_lib_aprov.length === 8) {
                                const year = nivel.data_lib_aprov.substring(0, 4);
                                const month = nivel.data_lib_aprov.substring(4, 6);
                                const day = nivel.data_lib_aprov.substring(6, 8);
                                return `${day}/${month}/${year}`;
                              }
                              // Se a data já estiver formatada ou em outro formato
                              return nivel.data_lib_aprov;
                            })()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {nivel.observacao_aprov && nivel.observacao_aprov.trim() !== '' ? (
                            <Tooltip title={nivel.observacao_aprov} arrow placement="top">
                              <Box sx={{ 
                                bgcolor: nivel.situacao_aprov === 'Rejeitado' ? 'error.50' : 'info.50',
                                borderLeft: '3px solid',
                                borderColor: nivel.situacao_aprov === 'Rejeitado' ? 'error.main' : 'info.main',
                                p: 1,
                                borderRadius: 1,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  bgcolor: nivel.situacao_aprov === 'Rejeitado' ? 'error.100' : 'info.100',
                                }
                              }}>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    fontStyle: 'italic', 
                                    color: 'text.primary',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    lineHeight: 1.4
                                  }}
                                >
                                  {nivel.observacao_aprov}
                                </Typography>
                              </Box>
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" color="text.disabled">
                              -
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>

        </CardContent>
      </Collapse>
    </Card>
  );
});

interface DocumentListProps {
  selectedDocuments?: Set<string>;
  showBulkActions?: boolean;
  onSelectDocument?: (documentNumber: string, selected: boolean) => void;
  onSelectAll?: (pendingDocs: ProtheusDocument[]) => void;
  onToggleBulkActions?: () => void;
}

const DocumentList: React.FC<DocumentListProps> = ({
  selectedDocuments: externalSelectedDocuments,
  showBulkActions: externalShowBulkActions,
  onSelectDocument: externalOnSelectDocument,
  onSelectAll: externalOnSelectAll,
  onToggleBulkActions,
}) => {
  const { user } = useAuthStore();
  const { filters, pagination, setFilters, setPagination } = useDocumentStore();
  const queryClient = useQueryClient();
  const { t, formatMessage } = useLanguage();
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [numeroTerm, setNumeroTerm] = useState(filters.numero || '');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject';
    document: ProtheusDocument | null;
  }>({ open: false, action: 'approve', document: null });
  
  // Estados para seleção múltipla (usa externo se disponível, senão interno)
  const [internalShowBulkActions, setInternalShowBulkActions] = useState(false);
  const [internalSelectedDocuments, setInternalSelectedDocuments] = useState<Set<string>>(new Set());
  
  const showBulkActions = externalShowBulkActions !== undefined ? externalShowBulkActions : internalShowBulkActions;
  const selectedDocuments = externalSelectedDocuments || internalSelectedDocuments;
  
  // Estado para confirmação de ação em massa (apenas se usando modo interno)
  const [bulkConfirmDialog, setBulkConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject';
    documentCount: number;
  }>({ open: false, action: 'approve', documentCount: 0 });

  // Invalidar cache quando filtros mudarem
  useEffect(() => {
    console.log('DocumentList - Filters changed, invalidating cache:', filters);
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.documents });
  }, [filters.search, filters.numero, queryClient]);
  
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

  const handleConfirmAction = (comments?: string) => {
    if (!confirmDialog.document || !user) return;

    const document = confirmDialog.document;
    const action = confirmDialog.action;

    if (action === 'approve') {
      approveDocument.mutate({
        documentId: document.numero.trim(),
        action: 'approve',
        approverId: user.email || user.id,
        comments: comments || '',
        document: document,
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
        approverId: user.email || user.id,
        comments: comments || 'Rejeitado pelo aprovador',
        document: document,
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
    console.log('handleSearch - Updating filters with:', { search: searchTerm, numero: numeroTerm });
    setFilters({ 
      ...filters, 
      search: searchTerm,
      numero: numeroTerm
    });
  };


  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setPagination({ page });
  };

  // Funções para seleção múltipla
  const handleSelectDocument = (documentNumber: string, selected: boolean) => {
    if (externalOnSelectDocument) {
      externalOnSelectDocument(documentNumber, selected);
    } else {
      const newSelected = new Set(selectedDocuments);
      if (selected) {
        newSelected.add(documentNumber);
      } else {
        newSelected.delete(documentNumber);
      }
      setInternalSelectedDocuments(newSelected);
    }
  };

  const handleSelectAll = () => {
    const pendingDocs = documentsResponse?.documentos?.filter(doc => {
      const currentStatus = getCurrentApprovalStatus(doc.alcada, user?.email);
      return currentStatus?.situacao_aprov === 'Pendente';
    }) || [];
    
    if (externalOnSelectAll) {
      externalOnSelectAll(pendingDocs);
    } else {
      if (selectedDocuments.size === pendingDocs.length) {
        // Se todos estão selecionados, desmarcar todos
        setInternalSelectedDocuments(new Set());
      } else {
        // Selecionar todos os documentos pendentes
        setInternalSelectedDocuments(new Set(pendingDocs.map(doc => doc.numero.trim())));
      }
    }
  };

  const handleBulkApprove = () => {
    setBulkConfirmDialog({
      open: true,
      action: 'approve',
      documentCount: selectedDocuments.size
    });
  };

  const executeBulkApprove = (comments?: string) => {
    const documentsToApprove = Array.from(selectedDocuments);
    console.log(`Iniciando aprovação em massa de ${documentsToApprove.length} documentos`);
    
    // Processar documentos um por um usando a mesma lógica da aprovação individual
    let currentIndex = 0;
    
    const processNextDocument = () => {
      if (currentIndex >= documentsToApprove.length) {
        // Todos os documentos foram processados
        console.log('Aprovação em massa concluída');
        if (onToggleBulkActions) {
          onToggleBulkActions();
        } else {
          setInternalSelectedDocuments(new Set());
          setInternalShowBulkActions(false);
        }
        return;
      }
      
      const documentNumber = documentsToApprove[currentIndex];
      console.log(`Processando documento ${documentNumber}...`);
      
      // Encontrar o documento completo
      const document = documentsResponse?.documentos?.find(doc => doc.numero.trim() === documentNumber);
      if (!document || !user) {
        console.error(`Documento ${documentNumber} não encontrado ou usuário não autenticado`);
        currentIndex++;
        processNextDocument();
        return;
      }

      // Usar mutate diretamente como na aprovação individual - SEM Promise wrapper
      approveDocument.mutate({
        documentId: documentNumber,
        action: 'approve',
        approverId: user.email || user.id,
        comments: comments || 'Aprovado em massa',
        document: document,
      }, {
        onSuccess: () => {
          console.log(`✓ Documento ${documentNumber} aprovado com sucesso`);
          currentIndex++;
          // Adicionar delay e processar próximo documento
          setTimeout(processNextDocument, 500);
        },
        onError: (error) => {
          console.error(`✗ Erro ao aprovar documento ${documentNumber}:`, error.message);
          currentIndex++;
          // Continuar com próximo documento mesmo se falhar
          setTimeout(processNextDocument, 500);
        }
      });
    };
    
    // Iniciar processamento
    processNextDocument();
  };

  const handleBulkReject = () => {
    setBulkConfirmDialog({
      open: true,
      action: 'reject',
      documentCount: selectedDocuments.size
    });
  };

  const executeBulkReject = (comments?: string) => {
    const documentsToReject = Array.from(selectedDocuments);
    console.log(`Iniciando rejeição em massa de ${documentsToReject.length} documentos`);
    
    // Processar documentos um por um usando a mesma lógica da rejeição individual
    let currentIndex = 0;
    
    const processNextDocument = () => {
      if (currentIndex >= documentsToReject.length) {
        // Todos os documentos foram processados
        console.log('Rejeição em massa concluída');
        if (onToggleBulkActions) {
          onToggleBulkActions();
        } else {
          setInternalSelectedDocuments(new Set());
          setInternalShowBulkActions(false);
        }
        return;
      }
      
      const documentNumber = documentsToReject[currentIndex];
      console.log(`Processando documento ${documentNumber}...`);
      
      // Encontrar o documento completo
      const document = documentsResponse?.documentos?.find(doc => doc.numero.trim() === documentNumber);
      if (!document || !user) {
        console.error(`Documento ${documentNumber} não encontrado ou usuário não autenticado`);
        currentIndex++;
        processNextDocument();
        return;
      }

      // Usar mutate diretamente como na rejeição individual - SEM Promise wrapper
      rejectDocument.mutate({
        documentId: documentNumber,
        action: 'reject',
        approverId: user.email || user.id,
        comments: comments || 'Rejeitado em massa',
        document: document,
      }, {
        onSuccess: () => {
          console.log(`✓ Documento ${documentNumber} rejeitado com sucesso`);
          currentIndex++;
          // Adicionar delay e processar próximo documento
          setTimeout(processNextDocument, 500);
        },
        onError: (error) => {
          console.error(`✗ Erro ao rejeitar documento ${documentNumber}:`, error.message);
          currentIndex++;
          // Continuar com próximo documento mesmo se falhar
          setTimeout(processNextDocument, 500);
        }
      });
    };
    
    // Iniciar processamento
    processNextDocument();
  };

  const handleBulkConfirmAction = (comments?: string) => {
    if (bulkConfirmDialog.action === 'approve') {
      executeBulkApprove(comments);
    } else {
      executeBulkReject(comments);
    }
    setBulkConfirmDialog({ open: false, action: 'approve', documentCount: 0 });
  };

  const handleCloseBulkDialog = () => {
    setBulkConfirmDialog({ open: false, action: 'approve', documentCount: 0 });
  };

  const pendingDocuments = documentsResponse?.documentos?.filter(doc => {
    const currentStatus = getCurrentApprovalStatus(doc.alcada, user?.email);
    return currentStatus?.situacao_aprov === 'Pendente';
  }) || [];

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
            <Grid item xs={12} md={4}>
              <Box component="form" onSubmit={handleSearch}>
                <TextField
                  fullWidth
                  size="medium"
                  placeholder="Buscar por fornecedor, valor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Campo de busca geral"
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
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="medium"
                placeholder="Número do documento"
                value={numeroTerm}
                onChange={(e) => setNumeroTerm(e.target.value)}
                aria-label="Busca por número do documento"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography variant="body2" color="text.secondary">
                        #
                      </Typography>
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(e);
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={5}>
              <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<Search />}
                  onClick={handleSearch}
                  aria-label="Buscar documentos"
                  sx={{ borderRadius: 2 }}
                >
                  Buscar
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => refetch()}
                  aria-label="Atualizar lista de documentos"
                  sx={{ borderRadius: 2 }}
                >
                  Atualizar
                </Button>
                
                {/* Botão para ativar seleção múltipla e selecionar todos */}
                <Button
                  variant={showBulkActions ? "contained" : "outlined"}
                  startIcon={<PlaylistAddCheck />}
                  onClick={() => {
                    if (!showBulkActions) {
                      // Ativar modo seleção e selecionar todos os pendentes
                      if (onToggleBulkActions) {
                        onToggleBulkActions();
                        if (onSelectAll) {
                          onSelectAll(pendingDocuments);
                        }
                      } else {
                        setInternalShowBulkActions(true);
                        setInternalSelectedDocuments(new Set(pendingDocuments.map(doc => doc.numero.trim())));
                      }
                    } else {
                      // Desativar modo seleção
                      if (onToggleBulkActions) {
                        onToggleBulkActions();
                      } else {
                        setInternalShowBulkActions(false);
                        setInternalSelectedDocuments(new Set());
                      }
                    }
                  }}
                  disabled={pendingDocuments.length === 0}
                  sx={{ borderRadius: 2 }}
                >
                  {showBulkActions && selectedDocuments.size > 0 
                    ? `Selecionados (${selectedDocuments.size})` 
                    : 'Seleção'
                  }
                </Button>
                
                {(searchTerm || numeroTerm) && (
                  <Button
                    variant="text"
                    startIcon={<Clear />}
                    onClick={() => {
                      setSearchTerm('');
                      setNumeroTerm('');
                      setFilters({ ...filters, search: '', numero: '' });
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

      {/* Barra de ações em massa */}
      {showBulkActions && (
        <Card sx={{ mb: 3, borderRadius: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
          <CardContent>
            <Grid container alignItems="center" spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={pendingDocuments.length > 0 && selectedDocuments.size === pendingDocuments.length}
                        indeterminate={selectedDocuments.size > 0 && selectedDocuments.size < pendingDocuments.length}
                        onChange={handleSelectAll}
                        color="primary"
                      />
                    }
                    label="Selecionar todos"
                  />
                  {selectedDocuments.size > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      {selectedDocuments.size} de {pendingDocuments.length} selecionados
                    </Typography>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
                  <Button
                    variant="text"
                    startIcon={<Close />}
                    onClick={() => {
                      if (onToggleBulkActions) {
                        onToggleBulkActions();
                      } else {
                        setInternalShowBulkActions(false);
                        setInternalSelectedDocuments(new Set());
                      }
                    }}
                    sx={{ borderRadius: 2 }}
                  >
                    Cancelar
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

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
          {documentsResponse.documentos.map((document, index) => (
            <DocumentCard
              key={`${document.filial}-${document.numero.trim()}-${index}`}
              document={document}
              onApprove={handleApprove}
              onReject={handleReject}
              loading={approveDocument.isPending || rejectDocument.isPending}
              densityStyles={densityStyles}
              userEmail={user?.email}
              showSelection={showBulkActions}
              isSelected={selectedDocuments.has(document.numero.trim())}
              onSelectChange={handleSelectDocument}
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

      {/* Bulk Confirmation Dialog - apenas se usando modo interno */}
      {!externalSelectedDocuments && (
        <ConfirmationDialog
          open={bulkConfirmDialog.open}
          onClose={handleCloseBulkDialog}
          onConfirm={handleBulkConfirmAction}
          action={bulkConfirmDialog.action}
          documentNumber={`${bulkConfirmDialog.documentCount} documentos selecionados`}
          documentValue={`Operação em massa`}
          loading={approveDocument.isPending || rejectDocument.isPending}
        />
      )}
    </Box>
  );
};

export default DocumentList;