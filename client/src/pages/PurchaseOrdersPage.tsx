import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { Receipt, Business } from '@mui/icons-material';
import { PurchaseOrderList } from '../components/PurchaseOrderList';
import { purchaseService } from '../services/purchaseService';
import type { PurchaseOrder } from '../types/purchase';
import { formatProtheusDate } from '../utils/dateFormatter';

export const PurchaseOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hasNext, setHasNext] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  // Carregar pedidos na montagem do componente
  useEffect(() => {
    loadPurchaseOrders();
  }, [currentPage, pageSize]);

  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await purchaseService.getPurchaseOrders({
        page: currentPage,
        pageSize: pageSize
      });
      
      setOrders(response.items || []);
      setHasNext(response.hasNext || false);
      setTotalRecords(response.remainingRecords || 0);
      
    } catch (error: any) {
      console.error('Erro ao carregar pedidos:', error);
      setError(error.message || 'Erro ao carregar pedidos de compra');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number, newPageSize: number) => {
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setCurrentPage(1); // Reset para primeira página quando muda o tamanho
    } else {
      setCurrentPage(page);
    }
  };

  const handleViewDetails = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedOrder(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Receipt sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Pedidos de Compra
          </Typography>
        </Box>
        
        <Typography variant="body1" color="text.secondary">
          Visualize e gerencie todos os pedidos de compra do sistema.
        </Typography>
      </Box>

      {/* Lista de pedidos */}
      <PurchaseOrderList
        orders={orders}
        loading={loading}
        hasNext={hasNext}
        totalRecords={totalRecords + orders.length} // Total aproximado
        currentPage={currentPage}
        pageSize={pageSize}
        onRefresh={loadPurchaseOrders}
        onViewDetails={handleViewDetails}
        onPageChange={handlePageChange}
      />

      {/* Dialog de detalhes */}
      <Dialog 
        open={detailsOpen} 
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Business sx={{ mr: 1 }} />
            Detalhes do Pedido - PC {selectedOrder?.c7_num}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedOrder && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Informações Gerais
                    </Typography>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Filial:
                      </Typography>
                      <Typography variant="body1">
                        {selectedOrder.c7_filial}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Número PC:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {selectedOrder.c7_num}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Item:
                      </Typography>
                      <Typography variant="body1">
                        {selectedOrder.c7_item}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Solicitante:
                      </Typography>
                      <Typography variant="body1">
                        {selectedOrder.c7_solicit}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Centro de Custo:
                      </Typography>
                      <Typography variant="body1">
                        {selectedOrder.c7_cc}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Fornecedor
                    </Typography>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Código:
                      </Typography>
                      <Typography variant="body1" fontFamily="monospace">
                        {selectedOrder.c7_fornece}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Loja:
                      </Typography>
                      <Typography variant="body1">
                        {selectedOrder.c7_loja}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Condição Pagamento:
                      </Typography>
                      <Typography variant="body1">
                        {selectedOrder.c7_cond}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Comprador:
                      </Typography>
                      <Typography variant="body1">
                        {selectedOrder.usr_codigo || 'N/A'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Produto
                    </Typography>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Código:
                      </Typography>
                      <Typography variant="body1" fontFamily="monospace">
                        {selectedOrder.c7_produto}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Descrição:
                      </Typography>
                      <Typography variant="body1">
                        {selectedOrder.c7_descri}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Quantidade:
                      </Typography>
                      <Typography variant="body1">
                        {selectedOrder.c7_quant?.toLocaleString('pt-BR')} {selectedOrder.c7_um}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Valor Total:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold" color="primary.main">
                        {formatCurrency(selectedOrder.c7_total)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      CER
                    </Typography>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        CER:
                      </Typography>
                      <Typography variant="body1">
                        {selectedOrder.c7_cer || 'N/A'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Item CER:
                      </Typography>
                      <Typography variant="body1">
                        {selectedOrder.c7_itemcer || 'N/A'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Datas e Observações
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Data de Emissão:
                          </Typography>
                          <Typography variant="body1">
                            {formatProtheusDate(selectedOrder.c7_emissao)}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Data de Entrega:
                          </Typography>
                          <Typography variant="body1">
                            {formatProtheusDate(selectedOrder.c7_datprf)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    {selectedOrder.c7_obs && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Observações:
                        </Typography>
                        <Typography variant="body1">
                          {selectedOrder.c7_obs}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDetails}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para erros */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};