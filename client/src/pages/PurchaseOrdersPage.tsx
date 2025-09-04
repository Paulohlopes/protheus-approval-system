import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  Snackbar
} from '@mui/material';
import { Receipt } from '@mui/icons-material';
import AppLayout from '../components/AppLayout';
import { DocumentListView } from '../components/DocumentListView';
import DocumentCard from '../components/DocumentCard';
import { DocumentDetailsDialog } from '../components/DocumentDetailsDialog';
import { purchaseService } from '../services/purchaseService';
import type { PurchaseOrder } from '../types/purchase';

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


  return (
    <AppLayout>
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
      <DocumentListView<PurchaseOrder>
        items={orders}
        loading={loading}
        title="Pedidos de Compra"
        subtitle={`Página ${currentPage} de ${Math.ceil((totalRecords + orders.length) / pageSize)}`}
        columns={[
          { id: 'filial', label: 'Filial', field: 'c7_filial', format: 'chip', chipColor: 'primary' },
          { id: 'numero', label: 'PC', field: 'c7_num' },
          { id: 'item', label: 'Item', field: 'c7_item', align: 'center' },
          { id: 'fornecedor', label: 'Fornecedor', field: (item) => `${item.c7_fornece}/${item.c7_loja}` },
          { id: 'produto', label: 'Produto', field: 'c7_produto', format: 'monospace' },
          { id: 'descricao', label: 'Descrição', field: 'c7_descri', width: 250 },
          { id: 'quantidade', label: 'Qtd', field: 'c7_quant', align: 'right', format: 'number' },
          { id: 'um', label: 'UM', field: 'c7_um', align: 'center' },
          { id: 'emissao', label: 'Emissão', field: 'c7_emissao', format: 'date' },
          { id: 'entrega', label: 'Entrega', field: 'c7_datprf', format: 'date' },
          { id: 'valor', label: 'Valor Total', field: 'c7_total', align: 'right', format: 'currency' }
        ]}
        filters={[
          { id: 'numero', label: 'Número PC', gridSize: 3 },
          { id: 'fornecedor', label: 'Fornecedor', gridSize: 3 },
          { id: 'produto', label: 'Produto', gridSize: 3 }
        ]}
        getItemKey={(item, index) => `${item.c7_num}-${item.c7_item}-${index}`}
        CardComponent={({ item, onViewDetails }) => (
          <DocumentCard
            title={`PC ${item.c7_num} - Item ${item.c7_item}`}
            subtitle={item.c7_descri}
            badge={{
              label: item.c7_filial,
              color: 'primary'
            }}
            icon={<Receipt />}
            sections={[
              {
                fields: [
                  { label: 'Fornecedor', value: `${item.c7_fornece}/${item.c7_loja}` },
                  { label: 'Cond. Pagto', value: item.c7_cond }
                ],
                direction: 'row'
              },
              {
                fields: [
                  { label: 'Produto', value: item.c7_produto, format: 'monospace' },
                  { label: 'Quantidade', value: `${item.c7_quant?.toLocaleString('pt-BR')} ${item.c7_um}` }
                ],
                direction: 'row'
              },
              {
                fields: [
                  { label: 'Emissão', value: item.c7_emissao, format: 'date' },
                  { label: 'Entrega', value: item.c7_datprf, format: 'date' }
                ],
                direction: 'row'
              },
              {
                fields: [
                  { label: 'CER', value: item.c7_cer || 'N/A' },
                  { label: 'Item CER', value: item.c7_itemcer || 'N/A' }
                ],
                direction: 'row'
              },
              {
                fields: [
                  { label: 'Valor Total', value: item.c7_total, format: 'currency', bold: true, color: 'primary' }
                ]
              }
            ]}
            onViewDetails={onViewDetails ? () => onViewDetails(item) : undefined}
          />
        )}
        hasNext={hasNext}
        totalRecords={totalRecords + orders.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onRefresh={loadPurchaseOrders}
        onViewDetails={handleViewDetails}
        emptyStateType="no-purchase-orders"
        emptyStateTitle="Nenhum pedido encontrado"
        emptyStateSubtitle="Não há pedidos de compra disponíveis"
        defaultViewMode="table"
        showViewToggle={true}
        showFilters={true}
        cardGridSizes={{ xs: 12, md: 6, lg: 4 }}
      />

      {/* Dialog de detalhes */}
      {selectedOrder && (
        <DocumentDetailsDialog
          open={detailsOpen}
          onClose={handleCloseDetails}
          title={`Pedido de Compra - PC ${selectedOrder.c7_num}`}
          subtitle={`Item ${selectedOrder.c7_item} - ${selectedOrder.c7_descri}`}
          icon={<Receipt sx={{ fontSize: 28, color: 'primary.main' }} />}
          sections={[
            {
              title: 'Informações Gerais',
              fields: [
                { label: 'Filial', value: selectedOrder.c7_filial },
                { label: 'Número PC', value: selectedOrder.c7_num, bold: true, color: 'primary' },
                { label: 'Item', value: selectedOrder.c7_item },
                { label: 'Solicitante', value: selectedOrder.c7_solicit },
                { label: 'Centro de Custo', value: selectedOrder.c7_cc }
              ]
            },
            {
              title: 'Fornecedor',
              fields: [
                { label: 'Código', value: selectedOrder.c7_fornece, type: 'monospace' },
                { label: 'Loja', value: selectedOrder.c7_loja },
                { label: 'Condição de Pagamento', value: selectedOrder.c7_cond }
              ]
            },
            {
              title: 'Produto',
              fields: [
                { label: 'Código', value: selectedOrder.c7_produto, type: 'monospace' },
                { label: 'Descrição', value: selectedOrder.c7_descri },
                { 
                  label: 'Quantidade', 
                  value: `${selectedOrder.c7_quant?.toLocaleString('pt-BR')} ${selectedOrder.c7_um}`
                },
                { label: 'Valor Total', value: selectedOrder.c7_total, type: 'currency', bold: true, color: 'primary' }
              ]
            },
            {
              title: 'CER - Controle de Empenho de Recursos',
              fields: [
                { label: 'Número CER', value: selectedOrder.c7_cer || 'N/A' },
                { label: 'Item CER', value: selectedOrder.c7_itemcer || 'N/A' }
              ]
            },
            {
              title: 'Datas e Prazos',
              gridSize: 6,
              fields: [
                { label: 'Data de Emissão', value: selectedOrder.c7_emissao, type: 'date' },
                { label: 'Data de Entrega', value: selectedOrder.c7_datprf, type: 'date' }
              ]
            },
            {
              title: 'Observações',
              gridSize: 6,
              fields: selectedOrder.c7_obs ? [
                { label: 'Observações', value: selectedOrder.c7_obs }
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