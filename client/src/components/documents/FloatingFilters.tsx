import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Stack,
  Typography,
  Tooltip,
  Fab,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Badge,
  useTheme,
  alpha,
  useMediaQuery,
  Drawer,
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  Close,
  TuneOutlined,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  CalendarToday,
  AttachMoney,
  Business,
  Description,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingFiltersProps {
  onSearch: (searchTerm: string, numeroTerm: string, filters?: any) => void;
  onClearFilters: () => void;
  activeFilterCount?: number;
  alwaysVisible?: boolean;
}

const FloatingFilters: React.FC<FloatingFiltersProps> = ({
  onSearch,
  onClearFilters,
  activeFilterCount = 0,
  alwaysVisible = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  
  // Filter states
  const [quickSearch, setQuickSearch] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [valueRange, setValueRange] = useState({ min: '', max: '' });
  const [supplier, setSupplier] = useState('');

  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    // Auto-expand when there are active filters
    if (activeFilterCount > 0 && isMinimized) {
      setIsMinimized(false);
    }
  }, [activeFilterCount]);

  const handleQuickSearch = () => {
    const filters = {
      documentType,
      dateRange,
      valueRange: valueRange.min || valueRange.max ? valueRange : undefined,
      supplier,
    };
    onSearch(quickSearch, documentNumber, filters);
  };

  const handleClearAll = () => {
    setQuickSearch('');
    setDocumentNumber('');
    setDocumentType('');
    setDateRange('');
    setValueRange({ min: '', max: '' });
    setSupplier('');
    onClearFilters();
  };

  const hasActiveFilters = quickSearch || documentNumber || documentType || dateRange || 
                          valueRange.min || valueRange.max || supplier;

  // Mobile Drawer Version
  if (isMobile) {
    return (
      <>
        {/* FAB para abrir filtros no mobile */}
        <Fab
          color="primary"
          size="medium"
          sx={{
            position: 'fixed',
            top: 80,
            right: 16,
            zIndex: 1200,
            background: activeFilterCount > 0 
              ? `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`
              : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          }}
          onClick={() => setMobileDrawerOpen(true)}
        >
          <Badge badgeContent={activeFilterCount} color="error">
            <FilterList />
          </Badge>
        </Fab>

        {/* Drawer para mobile */}
        <Drawer
          anchor="right"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          PaperProps={{
            sx: {
              width: '85%',
              maxWidth: 360,
              background: theme.palette.background.paper,
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Filtros
              </Typography>
              <IconButton onClick={() => setMobileDrawerOpen(false)}>
                <Close />
              </IconButton>
            </Stack>

            <Stack spacing={2}>
              <TextField
                fullWidth
                size="small"
                placeholder="Busca rápida..."
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                size="small"
                placeholder="Número do documento"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Description fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Filtros avançados mobile */}
              {showAdvanced && (
                <>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo</InputLabel>
                    <Select
                      value={documentType}
                      label="Tipo"
                      onChange={(e) => setDocumentType(e.target.value)}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value="IP">Pedido de Compra</MenuItem>
                      <MenuItem value="SC">Solicitação de Compra</MenuItem>
                      <MenuItem value="CP">Contrato de Parceria</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
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
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Fornecedor"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Business fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </>
              )}

              <Button
                size="small"
                onClick={() => setShowAdvanced(!showAdvanced)}
                startIcon={<TuneOutlined />}
              >
                {showAdvanced ? 'Menos filtros' : 'Mais filtros'}
              </Button>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => {
                    handleQuickSearch();
                    setMobileDrawerOpen(false);
                  }}
                  startIcon={<Search />}
                >
                  Buscar
                </Button>
                {hasActiveFilters && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClearAll}
                    startIcon={<Clear />}
                  >
                    Limpar
                  </Button>
                )}
              </Stack>
            </Stack>
          </Box>
        </Drawer>
      </>
    );
  }

  // Desktop Floating Version
  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: isExpanded ? 0 : isMinimized ? -280 : -200 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed',
        top: 100,
        left: 0,
        zIndex: 1200,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          width: 320,
          borderRadius: '0 16px 16px 0',
          overflow: 'hidden',
          background: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        }}
      >
        {/* Header/Toggle */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
          onClick={() => {
            if (isMinimized) {
              setIsMinimized(false);
              setIsExpanded(true);
            } else {
              setIsExpanded(!isExpanded);
            }
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <FilterList sx={{ fontSize: 20 }} />
            <Typography variant="body2" fontWeight={600}>
              Filtros
            </Typography>
            {activeFilterCount > 0 && (
              <Chip
                label={activeFilterCount}
                size="small"
                sx={{
                  height: 20,
                  backgroundColor: theme.palette.error.main,
                  color: 'white',
                  fontWeight: 700,
                }}
              />
            )}
          </Stack>
          <IconButton
            size="small"
            sx={{ color: 'white' }}
            onClick={(e) => {
              e.stopPropagation();
              if (isExpanded) {
                setIsMinimized(true);
                setIsExpanded(false);
              } else {
                setIsExpanded(true);
                setIsMinimized(false);
              }
            }}
          >
            {isExpanded ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
          </IconButton>
        </Box>

        {/* Conteúdo dos filtros */}
        <Collapse in={isExpanded}>
          <Box sx={{ p: 2 }}>
            <Stack spacing={2}>
              {/* Busca rápida */}
              <TextField
                fullWidth
                size="small"
                placeholder="Busca rápida..."
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleQuickSearch();
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: quickSearch && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setQuickSearch('')}>
                        <Clear fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    background: theme.palette.background.paper,
                  },
                }}
              />

              {/* Número do documento */}
              <TextField
                fullWidth
                size="small"
                placeholder="Número do documento"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Description fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    background: theme.palette.background.paper,
                  },
                }}
              />

              {/* Toggle filtros avançados */}
              <Button
                size="small"
                variant={showAdvanced ? 'contained' : 'outlined'}
                onClick={() => setShowAdvanced(!showAdvanced)}
                startIcon={<TuneOutlined />}
                sx={{ borderRadius: 2 }}
              >
                Filtros Avançados
              </Button>

              {/* Filtros avançados */}
              <Collapse in={showAdvanced}>
                <Stack spacing={2}>
                  <FormControl fullWidth size="small">
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

                  <FormControl fullWidth size="small">
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

                  <Stack direction="row" spacing={1}>
                    <TextField
                      size="small"
                      placeholder="Valor min"
                      value={valueRange.min}
                      onChange={(e) => setValueRange({ ...valueRange, min: e.target.value })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                      }}
                    />
                    <TextField
                      size="small"
                      placeholder="Valor max"
                      value={valueRange.max}
                      onChange={(e) => setValueRange({ ...valueRange, max: e.target.value })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                      }}
                    />
                  </Stack>

                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Fornecedor"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Business fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>
              </Collapse>

              {/* Chips de filtros ativos */}
              {hasActiveFilters && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Filtros ativos:
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {quickSearch && (
                      <Chip
                        size="small"
                        label={`"${quickSearch}"`}
                        onDelete={() => setQuickSearch('')}
                        sx={{ mb: 0.5 }}
                      />
                    )}
                    {documentNumber && (
                      <Chip
                        size="small"
                        label={`#${documentNumber}`}
                        onDelete={() => setDocumentNumber('')}
                        sx={{ mb: 0.5 }}
                      />
                    )}
                    {documentType && (
                      <Chip
                        size="small"
                        label={documentType}
                        onDelete={() => setDocumentType('')}
                        sx={{ mb: 0.5 }}
                      />
                    )}
                    {dateRange && (
                      <Chip
                        size="small"
                        label={dateRange}
                        onDelete={() => setDateRange('')}
                        sx={{ mb: 0.5 }}
                      />
                    )}
                  </Stack>
                </Box>
              )}

              {/* Botões de ação */}
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  size="small"
                  fullWidth
                  onClick={handleQuickSearch}
                  startIcon={<Search />}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  }}
                >
                  Aplicar
                </Button>
                {hasActiveFilters && (
                  <Tooltip title="Limpar todos os filtros">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={handleClearAll}
                      sx={{
                        border: `1px solid ${theme.palette.error.main}`,
                        borderRadius: 1,
                      }}
                    >
                      <Clear />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Stack>
          </Box>
        </Collapse>

        {/* Mini mode indicator */}
        {isMinimized && (
          <Box
            sx={{
              position: 'absolute',
              right: -40,
              top: '50%',
              transform: 'translateY(-50%)',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              borderRadius: '0 8px 8px 0',
              p: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => {
              setIsMinimized(false);
              setIsExpanded(true);
            }}
          >
            <Badge badgeContent={activeFilterCount} color="error">
              <FilterList sx={{ color: 'white', fontSize: 20 }} />
            </Badge>
          </Box>
        )}
      </Paper>
    </motion.div>
  );
};

export default FloatingFilters;