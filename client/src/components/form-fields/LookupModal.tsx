import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
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
  InputAdornment,
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
  title?: string;
}

export const LookupModal: React.FC<LookupModalProps> = ({
  open,
  onClose,
  config,
  onSelect,
  title,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Record<string, any>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 10,
    total: 0,
  });
  const [hasSearched, setHasSearched] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSearchTerm('');
      setResults([]);
      setColumns([]);
      setError(null);
      setHasSearched(false);
      setPagination({ page: 0, limit: 10, total: 0 });
    }
  }, [open]);

  const handleSearch = useCallback(async (page = 0) => {
    if (!config.sqlQuery) {
      setError('Consulta SQL não configurada para este lookup');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await lookupService.search(
        config,
        searchTerm,
        { page, limit: pagination.limit }
      );

      setResults(response.data || []);
      setPagination((prev) => ({
        ...prev,
        page: response.page,
        total: response.total,
      }));
      setHasSearched(true);

      // Extract columns from first result
      if (response.data && response.data.length > 0) {
        const cols = Object.keys(response.data[0]);
        setColumns(cols);
      } else if (!columns.length) {
        // If no results and no columns yet, try to infer from config
        const inferredCols: string[] = [];
        if (config.valueField) inferredCols.push(config.valueField);
        if (config.displayField && config.displayField !== config.valueField) {
          inferredCols.push(config.displayField);
        }
        setColumns(inferredCols);
      }
    } catch (err: any) {
      console.error('Error searching lookup:', err);
      setError(err.message || 'Erro ao buscar registros');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [config, searchTerm, pagination.limit, columns.length]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(0);
    }
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    handleSearch(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLimit = parseInt(event.target.value, 10);
    setPagination((prev) => ({
      ...prev,
      limit: newLimit,
      page: 0,
    }));
  };

  const handleRowClick = (row: Record<string, any>) => {
    onSelect(row);
  };

  const handleClose = () => {
    onClose();
  };

  // Get display columns - either all columns or specific ones
  const displayColumns = config.showAllColumns
    ? columns
    : columns.filter(col =>
        col === config.valueField ||
        col === config.displayField ||
        (config.searchableFields && config.searchableFields.includes(col))
      );

  // If no specific columns, show all
  const columnsToShow = displayColumns.length > 0 ? displayColumns : columns;

  // Modal title
  const modalTitle = title || config.modalTitle || 'Pesquisar';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' },
      }}
    >
      <DialogTitle>{modalTitle}</DialogTitle>

      <DialogContent dividers>
        {/* Search Input */}
        <Box sx={{ mb: 3 }}>
          <TextField
            label="Pesquisar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            fullWidth
            size="small"
            placeholder="Digite para pesquisar..."
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => handleSearch(0)}
                    disabled={loading}
                    edge="end"
                  >
                    {loading ? <CircularProgress size={20} /> : <SearchIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            autoFocus
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Pressione Enter ou clique na lupa para pesquisar
          </Typography>
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
                    {columnsToShow.map((col) => (
                      <TableCell key={col}>
                        {col}
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
                        colSpan={columnsToShow.length + 1}
                        align="center"
                        sx={{ py: 4 }}
                      >
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : results.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columnsToShow.length + 1}
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
                        {columnsToShow.map((col) => (
                          <TableCell key={col}>
                            {row[col] ?? '-'}
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
              Digite um termo de pesquisa e pressione Enter
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
