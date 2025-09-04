import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  Snackbar
} from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import AppLayout from '../components/AppLayout';
import { PurchaseRequestList } from '../components/PurchaseRequestList';
import { DocumentDetailsDialog } from '../components/DocumentDetailsDialog';
import { purchaseService } from '../services/purchaseService';
import type { PurchaseRequest } from '../types/purchase';

export const PurchaseRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hasNext, setHasNext] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  // Carregar solicitações na montagem do componente
  useEffect(() => {
    loadPurchaseRequests();
  }, [currentPage, pageSize]);

  const loadPurchaseRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await purchaseService.getPurchaseRequests({
        page: currentPage,
        pageSize: pageSize
      });
      
      setRequests(response.items || []);
      setHasNext(response.hasNext || false);
      setTotalRecords(response.remainingRecords || 0);
      
    } catch (error: any) {
      console.error('Erro ao carregar solicitações:', error);
      setError(error.message || 'Erro ao carregar solicitações de compra');
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

  const handleViewDetails = (request: PurchaseRequest) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedRequest(null);
  };


  return (
    <AppLayout>
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
        hasNext={hasNext}
        totalRecords={totalRecords + requests.length} // Total aproximado
        currentPage={currentPage}
        pageSize={pageSize}
        onRefresh={loadPurchaseRequests}
        onViewDetails={handleViewDetails}
        onPageChange={handlePageChange}
      />

      {/* Dialog de detalhes */}
      {selectedRequest && (
        <DocumentDetailsDialog
          open={detailsOpen}
          onClose={handleCloseDetails}
          title={`Solicitação de Compra - SC ${selectedRequest.c1_num}`}
          subtitle={`Item ${selectedRequest.c1_item} - ${selectedRequest.c1_descri}`}
          icon={<ShoppingCart sx={{ fontSize: 28, color: 'primary.main' }} />}
          sections={[
            {
              title: 'Informações Gerais',
              fields: [
                { label: 'Filial', value: selectedRequest.c1_filial },
                { label: 'Número SC', value: selectedRequest.c1_num, bold: true, color: 'primary' },
                { label: 'Item', value: selectedRequest.c1_item },
                { label: 'Solicitante', value: selectedRequest.c1_solicit },
                { label: 'Centro de Custo', value: selectedRequest.c1_cc }
              ]
            },
            {
              title: 'Produto',
              fields: [
                { label: 'Código', value: selectedRequest.c1_produto, type: 'monospace' },
                { label: 'Descrição', value: selectedRequest.c1_descri },
                { 
                  label: 'Quantidade', 
                  value: `${selectedRequest.c1_quant?.toLocaleString('pt-BR')} ${selectedRequest.c1_um}`
                },
                { label: 'Valor Total', value: selectedRequest.c1_total, type: 'currency', bold: true, color: 'primary' }
              ]
            },
            {
              title: 'Datas e Prazos',
              gridSize: 6,
              fields: [
                { label: 'Data de Emissão', value: selectedRequest.c1_emissao, type: 'date' },
                { label: 'Data de Necessidade', value: selectedRequest.c1_datprf, type: 'date' }
              ]
            },
            {
              title: 'Observações',
              gridSize: 6,
              fields: selectedRequest.c1_obs ? [
                { label: 'Observações', value: selectedRequest.c1_obs }
              ] : []
            }
          ]}
        />
      )}

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
    </AppLayout>
  );
};