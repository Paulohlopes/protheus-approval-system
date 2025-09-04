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
import { Visibility, Business } from '@mui/icons-material';
import { formatProtheusDate } from '../utils/dateFormatter';
import type { PurchaseOrder } from '../types/purchase';

interface PurchaseOrderCardProps {
  order: PurchaseOrder;
  onViewDetails?: (order: PurchaseOrder) => void;
}

export const PurchaseOrderCard: React.FC<PurchaseOrderCardProps> = React.memo(({
  order,
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
              PC {order.c7_num}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Item {order.c7_item} - Filial {order.c7_filial}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label="PC"
              color="primary"
              size="small"
              icon={<Business />}
            />
            {onViewDetails && (
              <Tooltip title="Ver detalhes">
                <IconButton size="small" onClick={() => onViewDetails(order)}>
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
            {order.c7_produto}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {order.c7_descri}
          </Typography>
        </Box>

        {/* Fornecedor */}
        <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Fornecedor
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {order.c7_fornece}
            {order.c7_loja && ` / ${order.c7_loja}`}
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
                label={order.c7_quant?.toLocaleString('pt-BR')}
                color={getPriorityColor(order.c7_quant || 0)}
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
              {order.c7_um || 'UN'}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Valor Total
            </Typography>
            <Typography variant="body2" fontWeight="medium" color="primary">
              {formatCurrency(order.c7_total || 0)}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Condição Pagamento
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {order.c7_cond || 'N/A'}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Solicitante
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {order.c7_solicit}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Data Entrega
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatProtheusDate(order.c7_datprf)}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Data Emissão
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatProtheusDate(order.c7_emissao)}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Centro de Custo
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {order.c7_cc}
            </Typography>
          </Grid>
        </Grid>

        {/* CER se existir */}
        {(order.c7_cer || order.c7_itemcer) && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              CER
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {order.c7_cer}
              {order.c7_itemcer && ` - Item: ${order.c7_itemcer}`}
            </Typography>
          </Box>
        )}

        {/* Observações se existirem */}
        {order.c7_obs && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Observações
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {order.c7_obs}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

PurchaseOrderCard.displayName = 'PurchaseOrderCard';