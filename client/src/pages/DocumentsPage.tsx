import React from 'react';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { Home, Assignment } from '@mui/icons-material';
import AppLayout from '../components/AppLayout';
import DocumentList from '../components/DocumentList';

const DocumentsPage: React.FC = () => {
  return (
    <AppLayout>
      <Box sx={{ flexGrow: 1 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center' }}
            color="inherit"
            href="/dashboard"
          >
            <Home sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Assignment sx={{ mr: 0.5 }} fontSize="inherit" />
            Documentos
          </Box>
        </Breadcrumbs>

        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
            Documentos para Aprovação
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie todos os documentos pendentes de aprovação no sistema Protheus
          </Typography>
        </Box>

        {/* Document List */}
        <DocumentList />
      </Box>
    </AppLayout>
  );
};

export default DocumentsPage;