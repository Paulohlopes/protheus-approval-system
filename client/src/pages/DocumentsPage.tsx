import React from 'react';
import {
  Box,
  Typography,
} from '@mui/material';
import AppLayout from '../components/AppLayout';
import DocumentList from '../components/DocumentList';

const DocumentsPage: React.FC = () => {
  return (
    <AppLayout>
      <Box sx={{ flexGrow: 1 }}>

        {/* Page Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
            Documentos para Aprovação
          </Typography>
        </Box>

        {/* Document List */}
        <DocumentList />
      </Box>
    </AppLayout>
  );
};

export default DocumentsPage;