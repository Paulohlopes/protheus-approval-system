import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { useAuthStore } from '../stores/authStore';
import { useDocuments } from '../hooks/useDocuments';
import { useDocumentStore } from '../stores/documentStore';
import { getCurrentApprovalStatus } from '../utils/documentHelpers';
import AppHeader from '../components/layout/AppHeader';
import DocumentStats from '../components/documents/DocumentStats';
import DocumentListRefactored from '../components/documents/DocumentListRefactored';

const DocumentsPageRefactored: React.FC = () => {
  const { user } = useAuthStore();
  const { filters, pagination } = useDocumentStore();
  const { data: documentsResponse } = useDocuments(filters, pagination);

  // Calcular estatísticas
  const pendingCount = documentsResponse?.documentos?.filter(doc => {
    const currentStatus = getCurrentApprovalStatus(doc.alcada, user?.email);
    return currentStatus?.situacao_aprov === 'Pendente';
  }).length || 0;

  const totalCount = documentsResponse?.documentos?.length || 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppHeader />

      <Container maxWidth="xl" sx={{ flexGrow: 1, py: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={700} color="primary.main">
            Documentos para Aprovação
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Bem-vindo(a), {user?.email?.split('@')[0]}! Aqui estão os documentos aguardando sua aprovação.
          </Typography>
          
          <DocumentStats 
            pendingCount={pendingCount}
            totalCount={totalCount}
          />
        </Box>

        <DocumentListRefactored />
      </Container>
    </Box>
  );
};

export default DocumentsPageRefactored;