import React, { useEffect } from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  FormControlLabel,
  Switch,
  CircularProgress,
  Box,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale/pt-BR';

import { RadioField } from './RadioField';
import { CheckboxField } from './CheckboxField';
import { AutocompleteField } from './AutocompleteField';
import { MultiselectField } from './MultiselectField';
import { AttachmentField } from './AttachmentField';
import { useDataSource } from './hooks/useDataSource';

import type { FormField, FieldAttachment } from '../../types/registration';

interface FieldRendererProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  templateId?: string;
  registrationId?: string;
  dependencyValues?: Record<string, any>;
  attachments?: FieldAttachment[];
  onAttachmentsChange?: (attachments: FieldAttachment[]) => void;
}

export const FieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  value,
  onChange,
  error,
  disabled,
  templateId,
  registrationId,
  dependencyValues = {},
  attachments = [],
  onAttachmentsChange,
}) => {
  // Get dependency value if field has one
  const dependencyValue = field.validationRules?.dependsOn?.fieldName
    ? dependencyValues[field.validationRules.dependsOn.fieldName]
    : undefined;

  // For select fields, use data source
  const { options, loading, fetchOptions } = useDataSource({
    templateId,
    fieldId: field.id,
    dataSourceType: field.dataSourceType,
    dataSourceConfig: field.dataSourceConfig,
  });

  // Fetch options for select type
  useEffect(() => {
    // Only fetch if we have both dataSourceType AND proper configuration
    if (field.fieldType === 'select' && field.dataSourceType && field.dataSourceConfig) {
      const filters: Record<string, string> = {};
      if (field.validationRules?.dependsOn?.filterField && dependencyValue) {
        filters[field.validationRules.dependsOn.filterField] = String(dependencyValue);
      }
      fetchOptions(filters);
    }
  }, [field.fieldType, field.dataSourceType, field.dataSourceConfig, fetchOptions, dependencyValue, field.validationRules?.dependsOn?.filterField]);

  // Common props for TextField
  const commonProps = {
    fullWidth: true,
    label: field.label,
    required: field.isRequired,
    error: !!error,
    helperText: error || field.helpText,
    disabled: disabled || !field.isEnabled,
    placeholder: field.placeholder,
  };

  // Common props for FormControl (doesn't accept helperText, label, placeholder)
  const formControlProps = {
    fullWidth: true,
    required: field.isRequired,
    error: !!error,
    disabled: disabled || !field.isEnabled,
  };

  switch (field.fieldType) {
    case 'string':
    case 'text':
      return (
        <TextField
          {...commonProps}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          inputProps={{
            maxLength: field.validationRules?.maxLength,
          }}
        />
      );

    case 'textarea':
      return (
        <TextField
          {...commonProps}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          multiline
          rows={4}
          inputProps={{
            maxLength: field.validationRules?.maxLength,
          }}
        />
      );

    case 'number':
      return (
        <TextField
          {...commonProps}
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          inputProps={{
            min: field.validationRules?.min,
            max: field.validationRules?.max,
            step: field.metadata?.decimals ? Math.pow(10, -field.metadata.decimals) : 1,
          }}
        />
      );

    case 'date':
      return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
          <DatePicker
            label={field.label}
            value={value ? new Date(value) : null}
            onChange={(newValue) => onChange(newValue?.toISOString().split('T')[0] || null)}
            disabled={disabled || !field.isEnabled}
            slotProps={{
              textField: {
                fullWidth: true,
                required: field.isRequired,
                error: !!error,
                helperText: error || field.helpText,
              },
            }}
          />
        </LocalizationProvider>
      );

    case 'boolean':
      return (
        <FormControl error={!!error} fullWidth>
          <FormControlLabel
            control={
              <Switch
                checked={!!value}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled || !field.isEnabled}
              />
            }
            label={field.label}
          />
          {(error || field.helpText) && (
            <FormHelperText>{error || field.helpText}</FormHelperText>
          )}
        </FormControl>
      );

    case 'checkbox':
      return (
        <CheckboxField
          field={field}
          value={!!value}
          onChange={onChange}
          error={error}
          disabled={disabled || !field.isEnabled}
        />
      );

    case 'select':
      // If has data source with proper config, show loading or options
      if (field.dataSourceType && field.dataSourceConfig) {
        return (
          <FormControl {...formControlProps}>
            <InputLabel id={`${field.id}-label`}>{field.label}</InputLabel>
            <Select
              labelId={`${field.id}-label`}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              label={field.label}
              endAdornment={
                loading ? (
                  <CircularProgress size={20} sx={{ mr: 2 }} />
                ) : null
              }
            >
              <MenuItem value="">
                <em>Selecione...</em>
              </MenuItem>
              {options.map((option) => (
                <MenuItem key={option.key || option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {(error || field.helpText) && (
              <FormHelperText>{error || field.helpText}</FormHelperText>
            )}
          </FormControl>
        );
      }

      // Legacy: use metadata.options
      const legacyOptions = field.metadata?.options || [];
      return (
        <FormControl {...formControlProps}>
          <InputLabel id={`${field.id}-label`}>{field.label}</InputLabel>
          <Select
            labelId={`${field.id}-label`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            label={field.label}
          >
            <MenuItem value="">
              <em>Selecione...</em>
            </MenuItem>
            {legacyOptions.map((opt: string) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
          {(error || field.helpText) && (
            <FormHelperText>{error || field.helpText}</FormHelperText>
          )}
        </FormControl>
      );

    case 'radio':
      return (
        <RadioField
          field={field}
          value={value || ''}
          onChange={onChange}
          error={error}
          disabled={disabled || !field.isEnabled}
          templateId={templateId}
          dependencyValue={dependencyValue ? String(dependencyValue) : undefined}
        />
      );

    case 'autocomplete':
      return (
        <AutocompleteField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
          disabled={disabled || !field.isEnabled}
          templateId={templateId}
          dependencyValue={dependencyValue ? String(dependencyValue) : undefined}
        />
      );

    case 'multiselect':
      return (
        <MultiselectField
          field={field}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
          error={error}
          disabled={disabled || !field.isEnabled}
          templateId={templateId}
          dependencyValue={dependencyValue ? String(dependencyValue) : undefined}
        />
      );

    case 'attachment':
      if (!registrationId || !onAttachmentsChange) {
        return (
          <Box sx={{ color: 'error.main' }}>
            Campo de anexo requer registrationId e onAttachmentsChange
          </Box>
        );
      }
      return (
        <AttachmentField
          field={field}
          registrationId={registrationId}
          attachments={attachments}
          onAttachmentsChange={onAttachmentsChange}
          error={error}
          disabled={disabled || !field.isEnabled}
        />
      );

    default:
      return (
        <TextField
          {...commonProps}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
};
