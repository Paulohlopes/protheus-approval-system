import React, { useEffect } from 'react';
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
  CircularProgress,
  Box,
} from '@mui/material';
import { useDataSource } from './hooks/useDataSource';
import type { FormField } from '../../types/registration';

interface RadioFieldProps {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  templateId?: string;
  dependencyValue?: string;
}

export const RadioField: React.FC<RadioFieldProps> = ({
  field,
  value,
  onChange,
  error,
  disabled,
  templateId,
  dependencyValue,
}) => {
  const { options, loading, fetchOptions } = useDataSource({
    templateId,
    fieldId: field.id,
    dataSourceType: field.dataSourceType,
    dataSourceConfig: field.dataSourceConfig,
  });

  // Fetch options on mount and when dependency changes
  useEffect(() => {
    const filters: Record<string, string> = {};
    if (field.validationRules?.dependsOn?.filterField && dependencyValue) {
      filters[field.validationRules.dependsOn.filterField] = dependencyValue;
    }
    fetchOptions(filters);
  }, [fetchOptions, dependencyValue, field.validationRules?.dependsOn?.filterField]);

  return (
    <FormControl component="fieldset" error={!!error} disabled={disabled} fullWidth>
      <FormLabel component="legend">
        {field.label}
        {field.isRequired && <span style={{ color: 'error.main' }}> *</span>}
      </FormLabel>

      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <span>Carregando opções...</span>
        </Box>
      ) : (
        <RadioGroup
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          row={options.length <= 4}
        >
          {options.map((option) => (
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={<Radio />}
              label={option.label}
            />
          ))}
        </RadioGroup>
      )}

      {error && <FormHelperText>{error}</FormHelperText>}
      {field.helpText && !error && <FormHelperText>{field.helpText}</FormHelperText>}
    </FormControl>
  );
};
