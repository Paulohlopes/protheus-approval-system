import React, { useCallback, useMemo } from 'react';
import {
  Box,
  TextField,
  Typography,
  Stack,
  Button,
  Chip,
} from '@mui/material';
import { CalendarToday } from '@mui/icons-material';

interface DateRangeFilterProps {
  label?: string;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onQuickSelect?: (days: number) => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  label = 'Período',
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onQuickSelect,
}) => {
  const quickOptions = useMemo(() => [
    { label: 'Hoje', days: 0 },
    { label: 'Últimos 7 dias', days: 7 },
    { label: 'Últimos 30 dias', days: 30 },
    { label: 'Últimos 90 dias', days: 90 },
  ], []);

  const handleQuickSelect = useCallback((days: number) => {
    const end = new Date();
    const start = new Date();

    if (days === 0) {
      // Today only
      const today = end.toISOString().split('T')[0];
      onStartDateChange(today);
      onEndDateChange(today);
    } else {
      start.setDate(start.getDate() - days);
      onStartDateChange(start.toISOString().split('T')[0]);
      onEndDateChange(end.toISOString().split('T')[0]);
    }

    if (onQuickSelect) {
      onQuickSelect(days);
    }
  }, [onStartDateChange, onEndDateChange, onQuickSelect]);

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        {label}
      </Typography>

      {/* Quick Select Options */}
      <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
        {quickOptions.map((option) => (
          <Chip
            key={option.days}
            label={option.label}
            size="small"
            onClick={() => handleQuickSelect(option.days)}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
              },
            }}
          />
        ))}
      </Stack>

      {/* Date Inputs */}
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          type="date"
          size="small"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
          sx={{ flex: 1 }}
        />
        <Typography variant="body2" color="text.secondary">
          até
        </Typography>
        <TextField
          type="date"
          size="small"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
          inputProps={{
            min: startDate, // End date can't be before start date
          }}
          sx={{ flex: 1 }}
        />
      </Stack>
    </Box>
  );
};

export default React.memo(DateRangeFilter);
