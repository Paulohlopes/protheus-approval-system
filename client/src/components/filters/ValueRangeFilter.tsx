import React, { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  InputAdornment,
  Stack,
} from '@mui/material';
import { AttachMoney } from '@mui/icons-material';

interface ValueRangeFilterProps {
  label?: string;
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  currency?: string;
}

const ValueRangeFilter: React.FC<ValueRangeFilterProps> = ({
  label = 'Valor',
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  currency = '$',
}) => {
  const formatNumber = (value: string): string => {
    // Remove non-numeric characters except comma and dot
    const cleaned = value.replace(/[^\d,\.]/g, '');
    return cleaned;
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    onMinChange(formatted);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    onMaxChange(formatted);
  };

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          size="small"
          placeholder="Mínimo"
          value={minValue}
          onChange={handleMinChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Typography variant="body2" color="text.secondary">
                  {currency}
                </Typography>
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1 }}
        />
        <Typography variant="body2" color="text.secondary">
          até
        </Typography>
        <TextField
          size="small"
          placeholder="Máximo"
          value={maxValue}
          onChange={handleMaxChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Typography variant="body2" color="text.secondary">
                  {currency}
                </Typography>
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1 }}
        />
      </Stack>
    </Box>
  );
};

export default ValueRangeFilter;
