import React, { useState, memo } from 'react';
import {
  Card,
  CardContent,
  Grid,
  Box,
  Typography,
  Chip,
  Button,
  Stack,
  Checkbox,
  Collapse,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Business,
  CalendarToday,
  ExpandMore,
  Description,
  Person,
} from '@mui/icons-material';
import type { ProtheusDocument, DocumentApprovalLevel } from '../../types/auth';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getTypeColor, getTypeLabel, getStatusColor, getDocumentNumber } from '../../utils/documentHelpers';
import { useLanguage } from '../../contexts/LanguageContext';

interface DocumentCardProps {
  document: ProtheusDocument;
  onApprove: (document: ProtheusDocument) => void;
  onReject: (document: ProtheusDocument) => void;
  loading?: boolean;
  userEmail?: string;
  isSelected?: boolean;
  onSelectChange?: (documentNumber: string, selected: boolean) => void;
  showSelection?: boolean;
  currentStatus: DocumentApprovalLevel;
  isPending: boolean;
}

const DocumentCard: React.FC<DocumentCardProps> = memo(({ 
  document, 
  onApprove, 
  onReject, 
  loading,
  userEmail,
  isSelected,
  onSelectChange,
  showSelection,
  currentStatus,
  isPending,
}) => {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLanguage();

  return (
    <Card 
      sx={{ 
        mb: 2,
        border: isPending ? 2 : 1,
        borderColor: isPending ? 'grey.400' : 'divider',
        borderRadius: 2,
        transition: 'all 0.2s ease-in-out',
        bgcolor: isPending ? 'grey.50' : 'background.paper',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
        }
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Grid container alignItems="center" spacing={2}>
          {showSelection && isPending && (
            <Grid item xs="auto">
              <Checkbox
                checked={isSelected || false}
                onChange={(e) => onSelectChange?.(getDocumentNumber(document), e.target.checked)}
                color="primary"
                size="small"
              />
            </Grid>
          )}
          
          <Grid item xs={12} sm={showSelection && isPending ? 2 : 3}>
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
                    bgcolor: 'warning.light',
                    color: 'warning.dark',
                    fontWeight: 600,
                  })
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={12} sm={5}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {getDocumentNumber(document)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Business sx={{ fontSize: 16 }} />
              {document.nome_fornecedor ? String(document.nome_fornecedor).trim() : 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarToday sx={{ fontSize: 16 }} />
              {formatDate(document.Emissao)}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography variant="h5" color="primary" fontWeight={700} gutterBottom>
                {formatCurrency(document.vl_tot_documento)}
              </Typography>
              
              {isPending && (
                <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<CheckCircle />}
                    onClick={() => onApprove(document)}
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
                    onClick={() => onReject(document)}
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

      <Collapse in={expanded} timeout="auto">
        <Divider />
        <CardContent>
          <DocumentDetails 
            document={document} 
            onApprove={() => onApprove(document)}
            onReject={() => onReject(document)}
            isPending={isPending}
            loading={loading}
          />
        </CardContent>
      </Collapse>
    </Card>
  );
});

interface DocumentDetailsProps {
  document: ProtheusDocument;
  onApprove: () => void;
  onReject: () => void;
  isPending: boolean;
  loading?: boolean;
}

const DocumentDetails: React.FC<DocumentDetailsProps> = ({ 
  document, 
  onApprove, 
  onReject, 
  isPending, 
  loading 
}) => {
  return (
    <>
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
                  {document.cod_fornecedor}/{document.loja} - {document.nome_fornecedor ? String(document.nome_fornecedor).trim() : 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person fontSize="small" />
            {t?.documents?.approvalHierarchy || 'Alçada de Aprovação'}
          </Typography>
          <Box sx={{ pl: 2 }}>
            {document.alcada.map((nivel, index) => (
              <Box key={index} sx={{ mb: 1, p: 1, bgcolor: nivel.situacao_aprov === 'Pendente' ? 'warning.light' : 'transparent', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight={500}>
                  Nível {nivel.nivel_aprov} - {nivel.avaliado_aprov}
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
                  Aprovador: {nivel.CNOME || nivel.aprovador_aprov}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Grupo: {nivel.CDESCGRUPO} | Status: {nivel.situacao_aprov}
                </Typography>
                {nivel.data_lib_aprov && nivel.data_lib_aprov.trim() !== '' && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Liberado em: {nivel.data_lib_aprov}
                  </Typography>
                )}
                {nivel.observacao_aprov && nivel.observacao_aprov.trim() !== '' && (
                  <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Observação do Aprovador:
                    </Typography>
                    <Typography variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
                      {nivel.observacao_aprov}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Grid>
      </Grid>

      <DocumentItems items={document.itens} />

      {isPending && (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            onClick={onApprove}
            disabled={loading}
            size="large"
            aria-label={`Aprovar documento ${getDocumentNumber(document)} no valor de ${formatCurrency(document.vl_tot_documento)}`}
          >
            Aprovar Documento
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Cancel />}
            onClick={onReject}
            disabled={loading}
            size="large"
            aria-label={`Rejeitar documento ${getDocumentNumber(document)} no valor de ${formatCurrency(document.vl_tot_documento)}`}
          >
            Rejeitar Documento
          </Button>
        </Box>
      )}

      {!isPending && (
        <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Este documento não está pendente de sua aprovação
          </Typography>
        </Box>
      )}
    </>
  );
};

interface DocumentItemsProps {
  items: ProtheusDocument['itens'];
}

const DocumentItems: React.FC<DocumentItemsProps> = ({ items }) => {
  return (
    <Accordion sx={{ mb: 2 }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography variant="h6">Itens ({items.length})</Typography>
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
                <TableCell>{t?.documents?.costCenter || 'Centro de Custo'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => (
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
                  <TableCell>$ {item.preco}</TableCell>
                  <TableCell>$ {item.total}</TableCell>
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
        
        {items.some(item => item.observacao) && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Observações dos Itens:</Typography>
            {items.filter(item => item.observacao).map((item, index) => (
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
  );
};

export default DocumentCard;