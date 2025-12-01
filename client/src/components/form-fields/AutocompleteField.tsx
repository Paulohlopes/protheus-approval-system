import React, { useState, useEffect, useCallback } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  FormControl,
  FormHelperText,
  Alert,
} from '@mui/material';
import { useDataSource } from './hooks/useDataSource';
import type { FormField, DataSourceOption } from '../../types/registration';
import debounce from 'lodash/debounce';

interface AutocompleteFieldProps {
  field: FormField;
  value: string | null;
  onChange: (value: string | null) => void;
  error?: string;
  disabled?: boolean;
  templateId?: string;
  dependencyValue?: string;
}

export const AutocompleteField: React.FC<AutocompleteFieldProps> = ({
  field,
  value,
  onChange,
  error,
  disabled,
  templateId,
  dependencyValue,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [localOptions, setLocalOptions] = useState<DataSourceOption[]>([]);

  const { options, loading, warning, fetchOptions } = useDataSource({
    templateId,
    fieldId: field.id,
    dataSourceType: field.dataSourceType,
    dataSourceConfig: field.dataSourceConfig,
  });

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (search: string) => {
      const filters: Record<string, string> = {};

      if (search) {
        filters.search = search;
      }

      // Add dependency filter
      if (field.validationRules?.dependsOn?.filterField && dependencyValue) {
        filters[field.validationRules.dependsOn.filterField] = dependencyValue;
      }

      const result = await fetchOptions(filters);
      setLocalOptions(result);
    }, 300),
    [fetchOptions, dependencyValue, field.validationRules?.dependsOn?.filterField],
  );

  // Fetch initial options
  useEffect(() => {
    debouncedSearch('');
    return () => {
      debouncedSearch.cancel();
    };
  }, [dependencyValue]); // eslint-disable-line react-hooks/exhaustive-deps

  // Search when input changes
  useEffect(() => {
    if (inputValue) {
      debouncedSearch(inputValue);
    }
  }, [inputValue, debouncedSearch]);

  // Update local options when options change
  useEffect(() => {
    setLocalOptions(options);
  }, [options]);

  const selectedOption = localOptions.find((opt) => opt.value === value) || null;

  return (
    <FormControl fullWidth error={!!error}>
      {warning && (
        <Alert severity="warning" sx={{ mb: 1, fontSize: '0.75rem' }}>
          {warning}
        </Alert>
      )}
      <Autocomplete
        value={selectedOption}
        onChange={(_, newValue) => onChange(newValue?.value || null)}
        inputValue={inputValue}
        onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
        options={localOptions}
        getOptionKey={(option) => option.key || option.value}
        getOptionLabel={(option) => option.label || option.value}
        isOptionEqualToValue={(option, val) => option.value === val.value}
        loading={loading}
        disabled={disabled}
        renderInput={(params) => (
          <TextField
            {...params}
            label={field.label}
            required={field.isRequired}
            error={!!error}
            placeholder={field.placeholder}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading && <CircularProgress color="inherit" size={20} />}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        noOptionsText="Nenhuma opção encontrada"
        loadingText="Carregando..."
      />
      {error && <FormHelperText>{error}</FormHelperText>}
      {field.helpText && !error && <FormHelperText>{field.helpText}</FormHelperText>}
    </FormControl>
  );
};
