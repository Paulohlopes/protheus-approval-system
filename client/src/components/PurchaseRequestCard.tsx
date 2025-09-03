import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { formatProtheusDate } from '../utils/dateFormatter';
import type { PurchaseRequest } from '../types/purchase';

interface PurchaseRequestCardProps {
  request: PurchaseRequest;
  onViewDetails?: (request: PurchaseRequest) => void;
}

export const PurchaseRequestCard: React.FC<PurchaseRequestCardProps> = React.memo(({
  request,
  onViewDetails
}) => {

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'aprovado':
      case 'liberado':
        return 'success';
      case 'rejeitado':
      case 'bloqueado':
        return 'error';
      case 'pendente':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (quantity: number) => {
    if (quantity > 100) return 'error';
    if (quantity > 50) return 'warning';
    return 'info';
  };

  return (
    <Card sx={{ mb: 2, position: 'relative' }}>
      <CardContent>
        {/* Header com número e ações */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" component="div" gutterBottom>
              SC {request.c1_num}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Item {request.c1_item}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={request.c1_aprovad || 'Pendente'}
              color={getStatusColor(request.c1_aprovad)}
              size="small"
            />
            {onViewDetails && (
              <Tooltip title="Ver detalhes">
                <IconButton size="small" onClick={() => onViewDetails(request)}>
                  <Visibility />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Produto */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Produto
          </Typography>
          <Typography variant="body1" fontWeight="medium" gutterBottom>
            {request.c1_produto}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {request.c1_descri}
          </Typography>
        </Box>

        {/* Grid de informações */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Quantidade
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              <Chip
                label={request.c1_quant?.toLocaleString('pt-BR')}
                color={getPriorityColor(request.c1_quant || 0)}
                size="small"
                variant="outlined"
              />
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Unidade
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {request.c1_um || 'UN'}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Valor Unit.
            </Typography>
            <Typography variant="body2" fontWeight="medium" color="primary">
              {formatCurrency(request.c1_vunit || 0)}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Valor Total
            </Typography>
            <Typography variant="body2" fontWeight="medium" color="primary">
              {formatCurrency(request.c1_total || 0)}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Solicitante
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {request.c1_solicit}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Data Necessidade
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatProtheusDate(request.c1_datprf)}
            </Typography>
          </Grid>
        </Grid>

        {/* Centro de Custo */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Centro de Custo
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {request.c1_cc} - {request.c1_desccc}
          </Typography>
        </Box>

        {/* Observações se existirem */}
        {request.c1_obs && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Observações
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {request.c1_obs}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

PurchaseRequestCard.displayName = 'PurchaseRequestCard';