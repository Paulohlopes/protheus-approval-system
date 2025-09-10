import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  Button,
  Stack,
  Typography,
} from '@mui/material';
import {
  Search,
  Refresh,
  Clear,
  PlaylistAddCheck,
} from '@mui/icons-material';

interface DocumentFiltersProps {
  onSearch: (searchTerm: string, numeroTerm: string) => void;
  onRefresh: () => void;
  onToggleBulkActions: () => void;
  showBulkActions: boolean;
  hasPendingDocuments: boolean;
  initialSearch?: string;
  initialNumero?: string;
}

const DocumentFilters: React.FC<DocumentFiltersProps> = ({
  onSearch,
  onRefresh,
  onToggleBulkActions,
  showBulkActions,
  hasPendingDocuments,
  initialSearch = '',
  initialNumero = '',
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [numeroTerm, setNumeroTerm] = useState(initialNumero);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    onSearch(searchTerm, numeroTerm);
  };

  const handleClear = () => {
    setSearchTerm('');
    setNumeroTerm('');
    onSearch('', '');
  };

  const hasActiveFilters = searchTerm || numeroTerm;

  return (
    <Card sx={{ mb: 3, borderRadius: 2 }} role="search" aria-label="Filtros de busca de documentos">
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Box component="form" onSubmit={handleSearch}>
              <TextField
                fullWidth
                size="medium"
                placeholder="Buscar por fornecedor, valor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Campo de busca geral"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="medium"
              placeholder="Número do documento"
              value={numeroTerm}
              onChange={(e) => setNumeroTerm(e.target.value)}
              aria-label="Busca por número do documento"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography variant="body2" color="text.secondary">
                      #
                    </Typography>
                  </InputAdornment>
                ),
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(e);
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<Search />}
                onClick={handleSearch}
                aria-label="Buscar documentos"
                sx={{ borderRadius: 2 }}
              >
                Buscar
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={onRefresh}
                aria-label="Atualizar lista de documentos"
                sx={{ borderRadius: 2 }}
              >
                Atualizar
              </Button>
              
              <Button
                variant={showBulkActions ? "contained" : "outlined"}
                startIcon={<PlaylistAddCheck />}
                onClick={onToggleBulkActions}
                disabled={!hasPendingDocuments}
                sx={{ borderRadius: 2 }}
              >
                Seleção
              </Button>
              
              {hasActiveFilters && (
                <Button
                  variant="text"
                  startIcon={<Clear />}
                  onClick={handleClear}
                  aria-label="Limpar busca"
                  sx={{ borderRadius: 2 }}
                >
                  Limpar
                </Button>
              )}
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default DocumentFilters;