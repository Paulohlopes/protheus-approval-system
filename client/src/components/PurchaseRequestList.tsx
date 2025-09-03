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
  Tooltip,
  useMediaQuery,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { 
  Search, 
  Refresh, 
  Visibility, 
  ViewList, 
  ViewModule 
} from '@mui/icons-material';
import { PurchaseRequestCard } from './PurchaseRequestCard';
import { EmptyState } from './EmptyState';
import type { PurchaseRequest } from '../types/purchase';

interface PurchaseRequestListProps {
  requests: PurchaseRequest[];
  loading?: boolean;
  hasNext?: boolean;
  totalRecords?: number;
  currentPage?: number;
  pageSize?: number;
  onRefresh?: () => void;
  onViewDetails?: (request: PurchaseRequest) => void;
  onPageChange?: (page: number, pageSize: number) => void;
}

export const PurchaseRequestList: React.FC<PurchaseRequestListProps> = React.memo(({
  requests,
  loading = false,
  hasNext = false,
  totalRecords = 0,
  currentPage = 0,
  pageSize = 10,
  onRefresh,
  onViewDetails,
  onPageChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSolicitante, setFilterSolicitante] = useState('');
  const [filterNumero, setFilterNumero] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Filtrar dados baseado nos filtros (apenas localmente)
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesSearch = searchTerm === '' || 
        request.c1_descri.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.c1_produto.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSolicitante = filterSolicitante === '' ||
        request.c1_solicit.toLowerCase().includes(filterSolicitante.toLowerCase());
      
      const matchesNumero = filterNumero === '' ||
        request.c1_num.includes(filterNumero);
      
      return matchesSearch && matchesSolicitante && matchesNumero;
    });
  }, [requests, searchTerm, filterSolicitante, filterNumero]);

  const handleChangePage = (event: unknown, newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage + 1, pageSize); // API usa 1-based indexing
    }
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPageSize = parseInt(event.target.value, 10);
    if (onPageChange) {
      onPageChange(1, newPageSize); // Resetar para primeira página
    }
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
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* View Mode Toggle - apenas em desktop */}
            {!isMobile && (
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <ToggleButton value="table" aria-label="visualização em tabela">
                  <Tooltip title="Visualização em tabela">
                    <ViewList />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="cards" aria-label="visualização em cards">
                  <Tooltip title="Visualização em cards">
                    <ViewModule />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
            )}
            
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

      {/* Conteúdo - Tabela ou Cards baseado no modo e dispositivo */}
      {(isMobile || viewMode === 'cards') ? (
        <Box sx={{ p: 3 }}>
          {loading ? (
            <Typography>Carregando...</Typography>
          ) : filteredRequests.length === 0 ? (
            <EmptyState
              type={searchTerm || filterSolicitante || filterNumero ? 'no-results' : 'no-purchase-requests'}
              action={onRefresh ? {
                label: 'Atualizar',
                onClick: onRefresh,
              } : undefined}
              secondaryAction={searchTerm || filterSolicitante || filterNumero ? {
                label: 'Limpar filtros',
                onClick: () => {
                  setSearchTerm('');
                  setFilterSolicitante('');
                  setFilterNumero('');
                },
              } : undefined}
            />
          ) : (
            filteredRequests.map((request, index) => (
              <PurchaseRequestCard
                key={`${request.c1_num}-${request.c1_item}-${index}`}
                request={request}
                onViewDetails={onViewDetails}
              />
            ))
          )}
        </Box>
      ) : (
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
                .map((request, index) => (
                  <TableRow key={`${request.c1_num}-${request.c1_item}-${index}`} hover>
                    <TableCell>
                      <Chip label={request.c1_filial} size="small" color="primary" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {request.c1_num}
                      </Typography>
                    </TableCell>
                    <TableCell>{request.c1_item}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {request.c1_produto}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {request.c1_descri}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {request.c1_quant?.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>{request.c1_um}</TableCell>
                    <TableCell>{request.c1_solicit}</TableCell>
                    <TableCell>{formatDate(request.c1_emissao)}</TableCell>
                    <TableCell>{formatDate(request.c1_datprf)}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(request.c1_total)}
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
      )}

      {/* Paginação */}
      {(requests.length > 0 || hasNext) && (
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalRecords > 0 ? totalRecords : -1}
          rowsPerPage={pageSize}
          page={Math.max(0, currentPage - 1)} // API usa 1-based, componente usa 0-based
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => {
            if (count > 0) {
              return `${from}-${to} de ${count}`;
            } else if (hasNext) {
              return `${from}-${to} de ${totalRecords}+ registros`;
            } else {
              return `${from}-${to}`;
            }
          }}
        />
      )}
    </Paper>
  );
});