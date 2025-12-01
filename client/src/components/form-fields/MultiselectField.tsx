import React, { useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  FormHelperText,
  OutlinedInput,
  Box,
  Chip,
  CircularProgress,
} from '@mui/material';
import { useDataSource } from './hooks/useDataSource';
import type { FormField } from '../../types/registration';

interface MultiselectFieldProps {
  field: FormField;
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  disabled?: boolean;
  templateId?: string;
  dependencyValue?: string;
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export const MultiselectField: React.FC<MultiselectFieldProps> = ({
  field,
  value = [],
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

  const handleChange = (event: any) => {
    const newValue = event.target.value as string[];
    onChange(newValue);
  };

  const getLabel = (val: string): string => {
    const option = options.find((opt) => opt.value === val);
    return option?.label || val;
  };

  return (
    <FormControl fullWidth error={!!error} disabled={disabled}>
      <InputLabel id={`${field.id}-label`}>
        {field.label}
        {field.isRequired && ' *'}
      </InputLabel>
      <Select
        labelId={`${field.id}-label`}
        multiple
        value={value}
        onChange={handleChange}
        input={<OutlinedInput label={field.label} />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {(selected as string[]).map((val) => (
              <Chip key={val} label={getLabel(val)} size="small" />
            ))}
          </Box>
        )}
        MenuProps={MenuProps}
        endAdornment={
          loading ? (
            <CircularProgress size={20} sx={{ mr: 2 }} />
          ) : null
        }
      >
        {options.map((option) => (
          <MenuItem key={option.key || option.value} value={option.value}>
            <Checkbox checked={value.includes(option.value)} />
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Select>
      {error && <FormHelperText>{error}</FormHelperText>}
      {field.helpText && !error && <FormHelperText>{field.helpText}</FormHelperText>}
    </FormControl>
  );
};
