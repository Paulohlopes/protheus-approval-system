import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Tooltip,
  Stack,
  TablePagination,
  IconButton
} from '@mui/material';
import { 
  Visibility, 
  Refresh, 
  Business,
  Receipt
} from '@mui/icons-material';
import { EmptyState } from './EmptyState';
import type { PurchaseOrder } from '../types/purchase';
import { formatProtheusDate } from '../utils/dateFormatter';

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
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    onPageChange?.(newPage + 1, pageSize);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPageSize = parseInt(event.target.value, 10);
    onPageChange?.(1, newPageSize);
  };

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
    <Paper sx={{ width: '100%' }}>
      {/* Header com estatísticas */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
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
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Filial</TableCell>
              <TableCell>Número</TableCell>
              <TableCell>Item</TableCell>
              <TableCell>Fornecedor</TableCell>
              <TableCell>Produto</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell align="right">Quantidade</TableCell>
              <TableCell>UM</TableCell>
              <TableCell>Entrega</TableCell>
              <TableCell>Solicitante</TableCell>
              <TableCell>Comprador</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order, index) => (
              <TableRow key={`${order.c7_num}-${order.c7_item}-${index}`} hover>
                <TableCell>
                  <Chip
                    label="PC"
                    size="small"
                    color="primary"
                    icon={<Business />}
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {order.c7_filial}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {order.c7_num}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {order.c7_item}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {order.c7_fornece}
                    {order.c7_loja && `/${order.c7_loja}`}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {order.c7_produto}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title={order.c7_descri} arrow>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {order.c7_descri}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {order.c7_quant?.toLocaleString('pt-BR') || '0'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {order.c7_um}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatProtheusDate(order.c7_datprf)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {order.c7_solicit}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {order.usr_codigo || '-'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={600} color="primary.main">
                    {formatCurrency(order.c7_total)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    {onViewDetails && (
                      <Tooltip title="Ver detalhes">
                        <IconButton 
                          size="small" 
                          onClick={() => onViewDetails(order)}
                          color="primary"
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginação */}
      {onPageChange && (
        <TablePagination
          component="div"
          count={totalRecords > 0 ? totalRecords : orders.length}
          page={currentPage - 1}
          onPageChange={handlePageChange}
          rowsPerPage={pageSize}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
          labelRowsPerPage="Itens por página:"
        />
      )}
    </Paper>
  );
};