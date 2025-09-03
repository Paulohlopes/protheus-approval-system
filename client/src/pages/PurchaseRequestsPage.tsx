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
import { ShoppingCart } from '@mui/icons-material';
import { PurchaseRequestList } from '../components/PurchaseRequestList';
import { purchaseService } from '../services/purchaseService';
import type { PurchaseRequest } from '../types/purchase';

export const PurchaseRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Carregar solicitações na montagem do componente
  useEffect(() => {
    loadPurchaseRequests();
  }, []);

  const loadPurchaseRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await purchaseService.getPurchaseRequests();
      setRequests(data);
      
    } catch (error: any) {
      console.error('Erro ao carregar solicitações:', error);
      setError(error.message || 'Erro ao carregar solicitações de compra');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request: PurchaseRequest) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedRequest(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      if (dateString.length === 8) {
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);
        return `${day}/${month}/${year}`;
      }
      return dateString;
    } catch {
      return dateString;
    }
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
          <ShoppingCart sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Solicitações de Compra
          </Typography>
        </Box>
        
        <Typography variant="body1" color="text.secondary">
          Visualize e gerencie todas as solicitações de compra do sistema.
        </Typography>
      </Box>

      {/* Lista de solicitações */}
      <PurchaseRequestList
        requests={requests}
        loading={loading}
        onRefresh={loadPurchaseRequests}
        onViewDetails={handleViewDetails}
      />

      {/* Dialog de detalhes */}
      <Dialog 
        open={detailsOpen} 
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detalhes da Solicitação - SC {selectedRequest?.c1_num}
        </DialogTitle>
        
        <DialogContent>
          {selectedRequest && (
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
                        {selectedRequest.c1_filial}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Número SC:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {selectedRequest.c1_num}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Item:
                      </Typography>
                      <Typography variant="body1">
                        {selectedRequest.c1_item}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Solicitante:
                      </Typography>
                      <Typography variant="body1">
                        {selectedRequest.c1_solicit}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Centro de Custo:
                      </Typography>
                      <Typography variant="body1">
                        {selectedRequest.c1_cc}
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
                        {selectedRequest.c1_produto}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Descrição:
                      </Typography>
                      <Typography variant="body1">
                        {selectedRequest.c1_descri}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Quantidade:
                      </Typography>
                      <Typography variant="body1">
                        {selectedRequest.c1_quant?.toLocaleString('pt-BR')} {selectedRequest.c1_um}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Valor Total:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold" color="primary.main">
                        {formatCurrency(selectedRequest.c1_total)}
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
                            {formatDate(selectedRequest.c1_emissao)}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Data de Necessidade:
                          </Typography>
                          <Typography variant="body1">
                            {formatDate(selectedRequest.c1_datprf)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    {selectedRequest.c1_obs && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Observações:
                        </Typography>
                        <Typography variant="body1">
                          {selectedRequest.c1_obs}
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