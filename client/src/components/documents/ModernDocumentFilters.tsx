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
  IconButton,
  Chip,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import {
  Search,
  Refresh,
  Clear,
  PlaylistAddCheck,
  FilterList,
  ExpandMore,
  TuneOutlined,
  CalendarToday,
  BusinessCenter,
  AttachMoney,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface ModernDocumentFiltersProps {
  onSearch: (searchTerm: string, numeroTerm: string, filters?: any) => void;
  onRefresh: () => void;
  onToggleBulkActions: () => void;
  showBulkActions: boolean;
  hasPendingDocuments: boolean;
  initialSearch?: string;
  initialNumero?: string;
}

const ModernDocumentFilters: React.FC<ModernDocumentFiltersProps> = ({
  onSearch,
  onRefresh,
  onToggleBulkActions,
  showBulkActions,
  hasPendingDocuments,
  initialSearch = '',
  initialNumero = '',
}) => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [numeroTerm, setNumeroTerm] = useState(initialNumero);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Advanced filters state
  const [documentType, setDocumentType] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [onlyPending, setOnlyPending] = useState(false);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const advancedFilters = showAdvancedFilters ? {
      documentType,
      dateRange,
      minValue,
      maxValue,
      onlyPending,
    } : undefined;
    onSearch(searchTerm, numeroTerm, advancedFilters);
  };

  const handleClear = () => {
    setSearchTerm('');
    setNumeroTerm('');
    setDocumentType('');
    setDateRange('');
    setMinValue('');
    setMaxValue('');
    setOnlyPending(false);
    onSearch('', '', {});
  };

  const hasActiveFilters = searchTerm || numeroTerm || documentType || dateRange || minValue || maxValue || onlyPending;
  const activeFilterCount = [searchTerm, numeroTerm, documentType, dateRange, minValue, maxValue, onlyPending].filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card 
        sx={{ 
          mb: 4,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
        }} 
        role="search" 
        aria-label="Filtros de busca de documentos"
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header com título e ações */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <Search sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} color="text.primary">
                  Busca e Filtros
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Encontre documentos rapidamente
                </Typography>
              </Box>
            </Box>
            
            <Stack direction="row" spacing={1}>
              <Button
                variant={showAdvancedFilters ? "contained" : "outlined"}
                size="small"
                startIcon={<TuneOutlined />}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                endIcon={
                  activeFilterCount > 0 && (
                    <Chip 
                      label={activeFilterCount} 
                      size="small" 
                      sx={{ 
                        height: 20, 
                        minWidth: 20,
                        '& .MuiChip-label': { px: 0.5, fontSize: '0.75rem' }
                      }} 
                    />
                  )
                }
              >
                Filtros Avançados
              </Button>
            </Stack>
          </Box>

          {/* Filtros principais */}
          <Box component="form" onSubmit={handleSearch}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Buscar por fornecedor, valor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Campo de busca geral"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: theme.palette.background.paper,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      },
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Número do documento"
                  value={numeroTerm}
                  onChange={(e) => setNumeroTerm(e.target.value)}
                  aria-label="Busca por número do documento"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                          #
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: theme.palette.background.paper,
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
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button
                    variant="contained"
                    startIcon={<Search />}
                    onClick={handleSearch}
                    aria-label="Buscar documentos"
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      minWidth: 120,
                    }}
                  >
                    Buscar
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={onRefresh}
                    aria-label="Atualizar lista de documentos"
                  >
                    Atualizar
                  </Button>
                  
                  <Button
                    variant={showBulkActions ? "contained" : "outlined"}
                    color={showBulkActions ? "secondary" : "primary"}
                    startIcon={<PlaylistAddCheck />}
                    onClick={onToggleBulkActions}
                    disabled={!hasPendingDocuments}
                  >
                    Seleção
                  </Button>
                  
                  {hasActiveFilters && (
                    <Button
                      variant="text"
                      color="error"
                      startIcon={<Clear />}
                      onClick={handleClear}
                      aria-label="Limpar busca"
                    >
                      Limpar
                    </Button>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </Box>

          {/* Filtros avançados */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Divider sx={{ my: 3 }} />
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Tipo de Documento</InputLabel>
                      <Select
                        value={documentType}
                        label="Tipo de Documento"
                        onChange={(e) => setDocumentType(e.target.value)}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="IP">Pedido de Compra</MenuItem>
                        <MenuItem value="SC">Solicitação de Compra</MenuItem>
                        <MenuItem value="CP">Contrato de Parceria</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Período</InputLabel>
                      <Select
                        value={dateRange}
                        label="Período"
                        onChange={(e) => setDateRange(e.target.value)}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="today">Hoje</MenuItem>
                        <MenuItem value="week">Esta semana</MenuItem>
                        <MenuItem value="month">Este mês</MenuItem>
                        <MenuItem value="custom">Personalizado</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Valor Mínimo"
                      value={minValue}
                      onChange={(e) => setMinValue(e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Valor Máximo"
                      value={maxValue}
                      onChange={(e) => setMaxValue(e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={onlyPending}
                          onChange={(e) => setOnlyPending(e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Mostrar apenas documentos pendentes"
                    />
                  </Grid>
                </Grid>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active filters chips */}
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Filtros ativos:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {searchTerm && (
                      <Chip
                        label={`Busca: "${searchTerm}"`}
                        onDelete={() => setSearchTerm('')}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {numeroTerm && (
                      <Chip
                        label={`Número: ${numeroTerm}`}
                        onDelete={() => setNumeroTerm('')}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {documentType && (
                      <Chip
                        label={`Tipo: ${documentType}`}
                        onDelete={() => setDocumentType('')}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {onlyPending && (
                      <Chip
                        label="Apenas pendentes"
                        onDelete={() => setOnlyPending(false)}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ModernDocumentFilters;