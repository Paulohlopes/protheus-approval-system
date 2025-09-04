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
import { DocumentListView } from '../components/DocumentListView';
import DocumentCard from '../components/DocumentCard';
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
      <DocumentListView<PurchaseRequest>
        items={requests}
        loading={loading}
        title="Solicitações de Compra"
        subtitle={`Página ${currentPage} de ${Math.ceil((totalRecords + requests.length) / pageSize)}`}
        columns={[
          { id: 'filial', label: 'Filial', field: 'c1_filial', format: 'chip', chipColor: 'primary' },
          { id: 'numero', label: 'SC', field: 'c1_num' },
          { id: 'item', label: 'Item', field: 'c1_item', align: 'center' },
          { id: 'produto', label: 'Produto', field: 'c1_produto', format: 'monospace' },
          { id: 'descricao', label: 'Descrição', field: 'c1_descri', width: 250 },
          { id: 'quantidade', label: 'Qtd', field: 'c1_quant', align: 'right', format: 'number' },
          { id: 'um', label: 'UM', field: 'c1_um', align: 'center' },
          { id: 'solicitante', label: 'Solicitante', field: 'c1_solicit' },
          { id: 'comprador', label: 'Comprador', field: 'c1_codcomp' },
          { id: 'emissao', label: 'Emissão', field: 'c1_emissao', format: 'date' },
          { id: 'necessidade', label: 'Necessidade', field: 'c1_datprf', format: 'date' },
          { id: 'valor', label: 'Valor Total', field: 'c1_total', align: 'right', format: 'currency' }
        ]}
        filters={[
          { id: 'numero', label: 'Número SC', gridSize: 3 },
          { id: 'solicitante', label: 'Solicitante', gridSize: 3 },
          { id: 'produto', label: 'Produto', gridSize: 3 }
        ]}
        getItemKey={(item, index) => `${item.c1_num}-${item.c1_item}-${index}`}
        CardComponent={({ item, onViewDetails }) => (
          <DocumentCard
            title={`SC ${item.c1_num} - Item ${item.c1_item}`}
            subtitle={item.c1_descri}
            badge={{
              label: item.c1_filial,
              color: 'primary'
            }}
            icon={<ShoppingCart />}
            sections={[
              {
                fields: [
                  { label: 'Produto', value: item.c1_produto, format: 'monospace' },
                  { label: 'Quantidade', value: `${item.c1_quant?.toLocaleString('pt-BR')} ${item.c1_um}` }
                ],
                direction: 'row'
              },
              {
                fields: [
                  { label: 'Solicitante', value: item.c1_solicit },
                  { label: 'Centro de Custo', value: item.c1_cc }
                ],
                direction: 'row'
              },
              {
                fields: [
                  { label: 'Comprador', value: item.c1_codcomp || 'N/A' }
                ]
              },
              {
                fields: [
                  { label: 'Emissão', value: item.c1_emissao, format: 'date' },
                  { label: 'Necessidade', value: item.c1_datprf, format: 'date' }
                ],
                direction: 'row'
              },
              {
                fields: [
                  { label: 'Valor Total', value: item.c1_total, format: 'currency', bold: true, color: 'primary' }
                ]
              }
            ]}
            onViewDetails={onViewDetails ? () => onViewDetails(item) : undefined}
          />
        )}
        hasNext={hasNext}
        totalRecords={totalRecords + requests.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onRefresh={loadPurchaseRequests}
        onViewDetails={handleViewDetails}
        emptyStateType="no-purchase-requests"
        emptyStateTitle="Nenhuma solicitação encontrada"
        emptyStateSubtitle="Não há solicitações de compra disponíveis"
        defaultViewMode="table"
        showViewToggle={true}
        showFilters={true}
        cardGridSizes={{ xs: 12, md: 6, lg: 4 }}
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
                { label: 'Centro de Custo', value: selectedRequest.c1_cc },
                { label: 'Comprador', value: selectedRequest.c1_codcomp || 'N/A' }
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