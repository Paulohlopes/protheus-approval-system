import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  CircularProgress,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import SearchIcon from '@mui/icons-material/Search';
import type { LookupConfig } from '../../types/registration';
import { lookupService } from '../../services/lookupService';

interface LookupModalProps {
  open: boolean;
  onClose: () => void;
  config: LookupConfig;
  onSelect: (record: Record<string, any>) => void;
}

export const LookupModal: React.FC<LookupModalProps> = ({
  open,
  onClose,
  config,
  onSelect,
}) => {
  const [searchFilters, setSearchFilters] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 10,
    total: 0,
  });
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async (page = 0) => {
    setLoading(true);
    setError(null);

    try {
      const response = await lookupService.search(
        config,
        searchFilters,
        { page, limit: pagination.limit }
      );

      setResults(response.data);
      setPagination((prev) => ({
        ...prev,
        page: response.page,
        total: response.total,
      }));
      setHasSearched(true);
    } catch (err: any) {
      console.error('Error searching lookup:', err);
      setError(err.message || 'Erro ao buscar registros');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [config, searchFilters, pagination.limit]);

  const handleFilterChange = (field: string, value: string) => {
    setSearchFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(0);
    }
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    handleSearch(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPagination((prev) => ({
      ...prev,
      limit: parseInt(event.target.value, 10),
      page: 0,
    }));
    // Re-search with new limit
    setTimeout(() => handleSearch(0), 0);
  };

  const handleRowClick = (row: Record<string, any>) => {
    onSelect(row);
  };

  const handleClose = () => {
    // Reset state when closing
    setSearchFilters({});
    setResults([]);
    setError(null);
    setHasSearched(false);
    setPagination({ page: 0, limit: 10, total: 0 });
    onClose();
  };

  // Determine modal width
  const modalWidth = config.modalConfig?.width || 'md';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={modalWidth}
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' },
      }}
    >
      <DialogTitle>
        {config.modalConfig?.title || `Pesquisar em ${config.sourceTable}`}
      </DialogTitle>

      <DialogContent dividers>
        {/* Search Filters */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="flex-end">
            {config.searchFields.map((sf) => (
              <Grid item xs={12} sm={6} md={4} key={sf.field}>
                <TextField
                  label={sf.label}
                  value={searchFilters[sf.field] || ''}
                  onChange={(e) => handleFilterChange(sf.field, e.target.value)}
                  onKeyPress={handleKeyPress}
                  fullWidth
                  size="small"
                />
              </Grid>
            ))}
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                onClick={() => handleSearch(0)}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
              >
                Pesquisar
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Results Table */}
        {hasSearched && (
          <>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {config.searchFields.map((sf) => (
                      <TableCell
                        key={sf.field}
                        style={sf.width ? { width: sf.width } : undefined}
                      >
                        {sf.label}
                      </TableCell>
                    ))}
                    <TableCell width={60} align="center">
                      Ação
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={config.searchFields.length + 1}
                        align="center"
                        sx={{ py: 4 }}
                      >
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : results.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={config.searchFields.length + 1}
                        align="center"
                        sx={{ py: 4 }}
                      >
                        <Typography color="text.secondary">
                          Nenhum registro encontrado
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    results.map((row, index) => (
                      <TableRow
                        key={index}
                        hover
                        onClick={() => handleRowClick(row)}
                        sx={{ cursor: 'pointer' }}
                      >
                        {config.searchFields.map((sf) => (
                          <TableCell key={sf.field}>
                            {row[sf.field] ?? '-'}
                          </TableCell>
                        ))}
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(row);
                            }}
                            color="primary"
                            title="Selecionar"
                          >
                            <CheckIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
              component="div"
              count={pagination.total}
              page={pagination.page}
              rowsPerPage={pagination.limit}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 20, 50]}
              labelRowsPerPage="Registros por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
              }
            />
          </>
        )}

        {/* Initial state message */}
        {!hasSearched && !loading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 8,
            }}
          >
            <Typography color="text.secondary">
              Preencha os filtros e clique em Pesquisar
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
      </DialogActions>
    </Dialog>
  );
};
