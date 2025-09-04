import React, { useState } from 'react';
import {
  Paper,
  Button,
  Typography,
  Box,
  CircularProgress,
  Stack,
  Pagination,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Grid
} from '@mui/material';
import { 
  Refresh, 
  Receipt,
  ViewList,
  ViewModule
} from '@mui/icons-material';
import { EmptyState } from './EmptyState';
import { PurchaseOrderCard } from './PurchaseOrderCard';
import type { PurchaseOrder } from '../types/purchase';

interface PurchaseOrderListProps {
  orders: PurchaseOrder[];
  loading?: boolean;
  hasNext?: boolean;
  totalRecords?: number;
  currentPage?: number;
  pageSize?: number;
  onRefresh?: () => void;
  onViewDetails?: (order: PurchaseOrder) => void;
  onPageChange?: (page: number, pageSize: number) => void;
}

export const PurchaseOrderList: React.FC<PurchaseOrderListProps> = ({
  orders = [],
  loading = false,
  hasNext = false,
  totalRecords = 0,
  currentPage = 1,
  pageSize = 10,
  onRefresh,
  onViewDetails,
  onPageChange
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    onPageChange?.(newPage, pageSize);
  };

  const totalPages = Math.ceil(totalRecords / pageSize);

  if (loading && orders.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!loading && orders.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Nenhum pedido encontrado"
        subtitle="Não há pedidos de compra disponíveis no momento"
        action={
          onRefresh && (
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={onRefresh}
            >
              Atualizar
            </Button>
          )
        }
      />
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header com estatísticas e controles */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" component="h2">
              Pedidos de Compra
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {totalRecords > 0 ? `${totalRecords} pedidos encontrados` : `${orders.length} pedidos`}
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={1} alignItems="center">
            {/* Toggle View Mode */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => newMode && setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="cards" aria-label="visualização em cards">
                <Tooltip title="Visualização em Cards">
                  <ViewModule />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="list" aria-label="visualização em lista">
                <Tooltip title="Visualização em Lista">
                  <ViewList />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>

            {loading && <CircularProgress size={20} />}
            {onRefresh && (
              <Tooltip title="Atualizar lista">
                <IconButton onClick={onRefresh} disabled={loading}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Cards Layout */}
      {viewMode === 'cards' && (
        <Grid container spacing={2}>
          {orders.map((order, index) => (
            <Grid item xs={12} md={6} lg={4} key={`${order.c7_num}-${order.c7_item}-${index}`}>
              <PurchaseOrderCard
                order={order}
                onViewDetails={onViewDetails}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* List Layout - mantendo a opção para futuro uso */}
      {viewMode === 'list' && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            Visualização em lista será implementada em breve...
          </Typography>
        </Paper>
      )}

      {/* Paginação */}
      {onPageChange && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
};