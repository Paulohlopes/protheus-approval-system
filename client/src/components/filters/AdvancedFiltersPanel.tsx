import React, { useCallback, useMemo } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
} from '@mui/material';
import {
  Close,
  ExpandMore,
  FilterAlt,
  Clear,
} from '@mui/icons-material';
import ValueRangeFilter from './ValueRangeFilter';
import DateRangeFilter from './DateRangeFilter';
import SavedFilters from './SavedFilters';

export interface AdvancedFilters {
  minValue: string;
  maxValue: string;
  startDate: string;
  endDate: string;
  [key: string]: any;
}

interface AdvancedFiltersPanelProps {
  open: boolean;
  onClose: () => void;
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  onClearAll: () => void;
}

const AdvancedFiltersPanel: React.FC<AdvancedFiltersPanelProps> = ({
  open,
  onClose,
  filters,
  onFiltersChange,
  onClearAll,
}) => {
  const updateFilter = useCallback((key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  }, [filters, onFiltersChange]);

  const handleApplyPreset = useCallback((presetFilters: Record<string, any>) => {
    onFiltersChange({
      ...filters,
      ...presetFilters,
    });
  }, [filters, onFiltersChange]);

  const activeCount = useMemo((): number => {
    let count = 0;
    if (filters.minValue) count++;
    if (filters.maxValue) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    return count;
  }, [filters.minValue, filters.maxValue, filters.startDate, filters.endDate]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 400 },
          p: 0,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <FilterAlt color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Filtros Avançados
          </Typography>
          {activeCount > 0 && (
            <Badge badgeContent={activeCount} color="primary" />
          )}
        </Stack>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {/* Value Range Filter */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle2" fontWeight={600}>
              Faixa de Valores
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <ValueRangeFilter
              label="Valor do Documento"
              minValue={filters.minValue}
              maxValue={filters.maxValue}
              onMinChange={(value) => updateFilter('minValue', value)}
              onMaxChange={(value) => updateFilter('maxValue', value)}
            />
          </AccordionDetails>
        </Accordion>

        {/* Date Range Filter */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle2" fontWeight={600}>
              Período
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <DateRangeFilter
              label="Data de Emissão"
              startDate={filters.startDate}
              endDate={filters.endDate}
              onStartDateChange={(value) => updateFilter('startDate', value)}
              onEndDateChange={(value) => updateFilter('endDate', value)}
            />
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 2 }} />

        {/* Saved Filters */}
        <SavedFilters
          currentFilters={filters}
          onApplyPreset={handleApplyPreset}
        />
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Clear />}
            onClick={onClearAll}
            fullWidth
            disabled={activeCount === 0}
          >
            Limpar Tudo
          </Button>
          <Button variant="contained" onClick={onClose} fullWidth>
            Aplicar Filtros
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
};

export default React.memo(AdvancedFiltersPanel);
