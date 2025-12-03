import React, { useState, useEffect } from 'react';
import {
  TextField,
  IconButton,
  InputAdornment,
  FormControl,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { LookupModal } from './LookupModal';
import type { FormField, LookupConfig } from '../../types/registration';
import { lookupService } from '../../services/lookupService';

interface LookupFieldProps {
  field: FormField;
  value: string | null;
  onChange: (value: string | null) => void;
  onReturnFieldsChange?: (fields: Record<string, any>) => void;
  error?: string;
  disabled?: boolean;
  templateId?: string;
}

export const LookupField: React.FC<LookupFieldProps> = ({
  field,
  value,
  onChange,
  onReturnFieldsChange,
  error,
  disabled,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const [loading, setLoading] = useState(false);

  const lookupConfig = field.lookupConfig as LookupConfig | undefined;

  // Fetch display value when value changes
  useEffect(() => {
    const fetchDisplayValue = async () => {
      if (!value || !lookupConfig) {
        setDisplayValue('');
        return;
      }

      setLoading(true);
      try {
        const response = await lookupService.getRecord(lookupConfig, value);
        if (response.found && response.data) {
          setDisplayValue(response.data[lookupConfig.displayField] || value);
        } else {
          setDisplayValue(value);
        }
      } catch (err) {
        console.error('Error fetching lookup display value:', err);
        setDisplayValue(value);
      } finally {
        setLoading(false);
      }
    };

    fetchDisplayValue();
  }, [value, lookupConfig]);

  const handleSelect = (record: Record<string, any>) => {
    if (!lookupConfig) return;

    // Set main value
    const newValue = record[lookupConfig.valueField];
    onChange(newValue);
    setDisplayValue(record[lookupConfig.displayField] || newValue);

    // Fill return fields
    if (onReturnFieldsChange && lookupConfig.returnFields) {
      const returnData: Record<string, any> = {};
      lookupConfig.returnFields.forEach((rf) => {
        returnData[rf.targetField] = record[rf.sourceField];
      });
      onReturnFieldsChange(returnData);
    }

    setModalOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setDisplayValue('');

    // Clear return fields
    if (onReturnFieldsChange && lookupConfig?.returnFields) {
      const clearedData: Record<string, any> = {};
      lookupConfig.returnFields.forEach((rf) => {
        clearedData[rf.targetField] = null;
      });
      onReturnFieldsChange(clearedData);
    }
  };

  if (!lookupConfig) {
    return (
      <FormControl fullWidth error>
        <TextField
          label={field.label}
          value=""
          disabled
          error
          helperText="Configuração de lookup não encontrada"
        />
      </FormControl>
    );
  }

  return (
    <FormControl fullWidth error={!!error}>
      <TextField
        label={field.label}
        value={displayValue}
        required={field.isRequired}
        error={!!error}
        disabled={disabled}
        placeholder={field.placeholder || 'Clique na lupa para pesquisar'}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              {loading && <CircularProgress size={20} sx={{ mr: 1 }} />}
              <IconButton
                onClick={() => setModalOpen(true)}
                disabled={disabled}
                size="small"
                title="Pesquisar"
              >
                <SearchIcon />
              </IconButton>
              {value && (
                <IconButton
                  onClick={handleClear}
                  disabled={disabled}
                  size="small"
                  title="Limpar"
                >
                  <ClearIcon />
                </IconButton>
              )}
            </InputAdornment>
          ),
        }}
        onClick={() => !disabled && setModalOpen(true)}
        sx={{
          cursor: disabled ? 'default' : 'pointer',
          '& .MuiInputBase-input': {
            cursor: disabled ? 'default' : 'pointer',
          },
        }}
      />
      {error && <FormHelperText>{error}</FormHelperText>}
      {field.helpText && !error && <FormHelperText>{field.helpText}</FormHelperText>}

      <LookupModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        config={lookupConfig}
        onSelect={handleSelect}
      />
    </FormControl>
  );
};
