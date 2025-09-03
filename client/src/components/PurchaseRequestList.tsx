import React, { useState, useMemo } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Box,
  TextField,
  Grid,
  Button,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { Search, Refresh, Visibility } from '@mui/icons-material';
import type { PurchaseRequest } from '../types/purchase';

interface PurchaseRequestListProps {
  requests: PurchaseRequest[];
  loading?: boolean;
  onRefresh?: () => void;
  onViewDetails?: (request: PurchaseRequest) => void;
}

export const PurchaseRequestList: React.FC<PurchaseRequestListProps> = ({
  requests,
  loading = false,
  onRefresh,
  onViewDetails
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSolicitante, setFilterSolicitante] = useState('');
  const [filterNumero, setFilterNumero] = useState('');

  // Filtrar dados baseado nos filtros
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesSearch = searchTerm === '' || 
        request.C1_DESCRI.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.C1_PRODUTO.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSolicitante = filterSolicitante === '' ||
        request.C1_SOLICIT.toLowerCase().includes(filterSolicitante.toLowerCase());
      
      const matchesNumero = filterNumero === '' ||
        request.C1_NUM.includes(filterNumero);
      
      return matchesSearch && matchesSolicitante && matchesNumero;
    });
  }, [requests, searchTerm, filterSolicitante, filterNumero]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      // Assumindo formato YYYYMMDD do Protheus
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
    <Paper sx={{ width: '100%', mb: 2 }}>
      {/* Header com filtros */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            Solicitações de Compra ({filteredRequests.length})
          </Typography>
          
          {onRefresh && (
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={onRefresh}
              disabled={loading}
            >
              Atualizar
            </Button>
          )}
        </Box>

        {/* Filtros */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Buscar produto/descrição"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Solicitante"
              variant="outlined"
              size="small"
              value={filterSolicitante}
              onChange={(e) => setFilterSolicitante(e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Número SC"
              variant="outlined"
              size="small"
              value={filterNumero}
              onChange={(e) => setFilterNumero(e.target.value)}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Tabela */}
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Filial</TableCell>
              <TableCell>SC</TableCell>
              <TableCell>Item</TableCell>
              <TableCell>Produto</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell align="right">Qtd</TableCell>
              <TableCell>UM</TableCell>
              <TableCell>Solicitante</TableCell>
              <TableCell>Data Emissão</TableCell>
              <TableCell>Data Necessidade</TableCell>
              <TableCell align="right">Valor</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={12} align="center">
                  <Typography>Carregando...</Typography>
                </TableCell>
              </TableRow>
            ) : filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} align="center">
                  <Typography>Nenhuma solicitação encontrada</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((request, index) => (
                  <TableRow key={`${request.C1_NUM}-${request.C1_ITEM}-${index}`} hover>
                    <TableCell>
                      <Chip label={request.C1_FILIAL} size="small" color="primary" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {request.C1_NUM}
                      </Typography>
                    </TableCell>
                    <TableCell>{request.C1_ITEM}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {request.C1_PRODUTO}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {request.C1_DESCRI}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {request.C1_QUANT?.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>{request.C1_UM}</TableCell>
                    <TableCell>{request.C1_SOLICIT}</TableCell>
                    <TableCell>{formatDate(request.C1_EMISSAO)}</TableCell>
                    <TableCell>{formatDate(request.C1_DATPRF)}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(request.C1_TOTAL)}
                    </TableCell>
                    <TableCell align="center">
                      {onViewDetails && (
                        <Tooltip title="Ver detalhes">
                          <IconButton
                            size="small"
                            onClick={() => onViewDetails(request)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginação */}
      {filteredRequests.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredRequests.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
        />
      )}
    </Paper>
  );
};