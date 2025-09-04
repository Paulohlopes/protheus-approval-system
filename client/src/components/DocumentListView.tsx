import React, { useState, useMemo, useEffect } from 'react';
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
  CircularProgress,
  Stack
} from '@mui/material';
import { 
  Search, 
  Refresh, 
  Visibility, 
  ViewList, 
  ViewModule,
  FilterList,
  Clear
} from '@mui/icons-material';
import { EmptyState } from './EmptyState';

export interface DocumentColumn<T> {
  id: string;
  label: string;
  field: keyof T | ((item: T) => any);
  align?: 'left' | 'center' | 'right';
  format?: 'text' | 'currency' | 'date' | 'number' | 'chip' | 'monospace';
  width?: number | string;
  chipColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

export interface DocumentFilter {
  id: string;
  label: string;
  placeholder?: string;
  gridSize?: number;
  type?: 'text' | 'select' | 'date';
}

interface DocumentListViewProps<T> {
  // Dados
  items: T[];
  columns: DocumentColumn<T>[];
  
  // Identificação única
  getItemKey: (item: T, index: number) => string;
  
  // Componente Card para visualização em cards
  CardComponent: React.ComponentType<{ item: T; onViewDetails?: (item: T) => void }>;
  
  // Estados e controle
  loading?: boolean;
  title?: string;
  subtitle?: string;
  
  // Paginação
  hasNext?: boolean;
  totalRecords?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
  
  // Ações
  onRefresh?: () => void;
  onViewDetails?: (item: T) => void;
  
  // Filtros
  filters?: DocumentFilter[];
  onFilterChange?: (filterId: string, value: string) => void;
  
  // Estado vazio
  emptyStateType?: string;
  emptyStateTitle?: string;
  emptyStateSubtitle?: string;
  
  // Configurações
  defaultViewMode?: 'table' | 'cards';
  showViewToggle?: boolean;
  showFilters?: boolean;
  cardGridSizes?: { xs: number; sm?: number; md?: number; lg?: number; xl?: number };
}

export function DocumentListView<T>({
  items,
  columns,
  getItemKey,
  CardComponent,
  loading = false,
  title,
  subtitle,
  hasNext = false,
  totalRecords = 0,
  currentPage = 0,
  pageSize = 10,
  onPageChange,
  onRefresh,
  onViewDetails,
  filters = [],
  onFilterChange,
  emptyStateType = 'no-results',
  emptyStateTitle = 'Nenhum item encontrado',
  emptyStateSubtitle = 'Não há itens disponíveis no momento',
  defaultViewMode = 'table',
  showViewToggle = true,
  showFilters = true,
  cardGridSizes = { xs: 12, md: 6, lg: 4 }
}: DocumentListViewProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() => {
    // Se for mobile, sempre usar cards
    // Se não for mobile, usar o defaultViewMode passado como prop
    const initialMode = isMobile ? 'cards' : defaultViewMode;
    console.log('DocumentListView - Initial viewMode:', initialMode, 'isMobile:', isMobile, 'defaultViewMode:', defaultViewMode);
    return initialMode;
  });
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [localSearch, setLocalSearch] = useState('');

  // Atualizar viewMode quando o breakpoint mudar
  useEffect(() => {
    if (isMobile && viewMode === 'table') {
      setViewMode('cards');
    } else if (!isMobile && viewMode === 'cards' && defaultViewMode === 'table') {
      setViewMode('table');
    }
  }, [isMobile, viewMode, defaultViewMode]);

  // Aplicar filtros locais
  const filteredItems = useMemo(() => {
    if (!showFilters || filters.length === 0) return items;
    
    return items.filter(item => {
      // Busca geral (se houver campo de busca)
      if (localSearch) {
        const searchLower = localSearch.toLowerCase();
        const hasMatch = columns.some(col => {
          const value = typeof col.field === 'function' 
            ? col.field(item) 
            : item[col.field];
          return String(value).toLowerCase().includes(searchLower);
        });
        if (!hasMatch) return false;
      }
      
      // Filtros específicos
      return Object.entries(filterValues).every(([filterId, filterValue]) => {
        if (!filterValue) return true;
        const filter = filters.find(f => f.id === filterId);
        if (!filter) return true;
        
        const column = columns.find(col => col.id === filterId);
        if (!column) return true;
        
        const value = typeof column.field === 'function' 
          ? column.field(item) 
          : item[column.field];
        
        return String(value).toLowerCase().includes(filterValue.toLowerCase());
      });
    });
  }, [items, localSearch, filterValues, filters, columns, showFilters]);

  const handleFilterChange = (filterId: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [filterId]: value }));
    onFilterChange?.(filterId, value);
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    setFilterValues({});
    filters.forEach(filter => onFilterChange?.(filter.id, ''));
  };

  const hasActiveFilters = localSearch || Object.values(filterValues).some(v => v);

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

  const formatValue = (value: any, format?: string): string | React.ReactNode => {
    if (value === null || value === undefined) return '-';
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(Number(value) || 0);
      
      case 'number':
        return Number(value).toLocaleString('pt-BR');
      
      case 'date':
        // Assumindo formato YYYYMMDD do Protheus
        const dateStr = String(value);
        if (dateStr.length === 8) {
          const year = dateStr.substring(0, 4);
          const month = dateStr.substring(4, 6);
          const day = dateStr.substring(6, 8);
          return `${day}/${month}/${year}`;
        }
        return dateStr;
      
      case 'monospace':
        return (
          <Typography variant="body2" fontFamily="monospace">
            {String(value)}
          </Typography>
        );
      
      default:
        return String(value);
    }
  };

  // Loading state
  if (loading && items.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      {/* Header com filtros */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            {title && (
              <Typography variant="h6" component="div">
                {title} ({filteredItems.length})
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* View Mode Toggle */}
            {showViewToggle && !isMobile && (
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, newMode) => {
                  console.log('DocumentListView - Toggle onChange:', { currentMode: viewMode, newMode });
                  if (newMode) setViewMode(newMode);
                }}
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
            
            {/* Limpar filtros */}
            {hasActiveFilters && (
              <Tooltip title="Limpar filtros">
                <IconButton onClick={handleClearFilters} color="secondary">
                  <Clear />
                </IconButton>
              </Tooltip>
            )}
            
            {/* Refresh */}
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
        {showFilters && (
          <Grid container spacing={2}>
            {/* Busca geral */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Buscar..."
                variant="outlined"
                size="small"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            
            {/* Filtros específicos */}
            {filters.map(filter => (
              <Grid item xs={12} md={filter.gridSize || 4} key={filter.id}>
                <TextField
                  fullWidth
                  label={filter.label}
                  placeholder={filter.placeholder}
                  variant="outlined"
                  size="small"
                  value={filterValues[filter.id] || ''}
                  onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Conteúdo - Tabela ou Cards */}
      {filteredItems.length === 0 ? (
        <Box sx={{ p: 3 }}>
          <EmptyState
            type={hasActiveFilters ? 'no-results' : emptyStateType}
            title={hasActiveFilters ? 'Nenhum resultado encontrado' : emptyStateTitle}
            subtitle={hasActiveFilters ? 'Tente ajustar os filtros' : emptyStateSubtitle}
            action={onRefresh ? {
              label: 'Atualizar',
              onClick: onRefresh,
            } : undefined}
            secondaryAction={hasActiveFilters ? {
              label: 'Limpar filtros',
              onClick: handleClearFilters,
            } : undefined}
          />
        </Box>
      ) : (() => {
        const showCards = isMobile || viewMode === 'cards';
        console.log('DocumentListView - Renderização:', { isMobile, viewMode, showCards, filteredItemsLength: filteredItems.length });
        return showCards;
      })() ? (
        // Cards View
        <Box sx={{ p: 3 }}>
          <Grid container spacing={2}>
            {filteredItems.map((item, index) => (
              <Grid 
                item 
                key={getItemKey(item, index)}
                xs={cardGridSizes.xs}
                sm={cardGridSizes.sm}
                md={cardGridSizes.md}
                lg={cardGridSizes.lg}
                xl={cardGridSizes.xl}
              >
                <CardComponent
                  item={item}
                  onViewDetails={onViewDetails}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : (
        // Table View
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map(column => (
                  <TableCell 
                    key={column.id}
                    align={column.align || 'left'}
                    style={{ width: column.width }}
                  >
                    {column.label}
                  </TableCell>
                ))}
                {onViewDetails && (
                  <TableCell align="center" style={{ width: 80 }}>
                    Ações
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.map((item, index) => (
                <TableRow key={getItemKey(item, index)} hover>
                  {columns.map(column => {
                    const value = typeof column.field === 'function'
                      ? column.field(item)
                      : item[column.field];
                    
                    return (
                      <TableCell key={column.id} align={column.align || 'left'}>
                        {column.format === 'chip' ? (
                          <Chip 
                            label={formatValue(value, column.format)} 
                            size="small" 
                            color={column.chipColor || 'default'}
                            variant="outlined"
                          />
                        ) : (
                          formatValue(value, column.format)
                        )}
                      </TableCell>
                    );
                  })}
                  {onViewDetails && (
                    <TableCell align="center">
                      <Tooltip title="Ver detalhes">
                        <IconButton
                          size="small"
                          onClick={() => onViewDetails(item)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Paginação */}
      {(items.length > 0 || hasNext) && onPageChange && (
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalRecords > 0 ? totalRecords : -1}
          rowsPerPage={pageSize}
          page={Math.max(0, currentPage - 1)}
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
}