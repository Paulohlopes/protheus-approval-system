import React from 'react';
import {
  FormControl,
  FormControlLabel,
  Checkbox,
  FormHelperText,
} from '@mui/material';
import type { FormField } from '../../types/registration';

interface CheckboxFieldProps {
  field: FormField;
  value: boolean;
  onChange: (value: boolean) => void;
  error?: string;
  disabled?: boolean;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  field,
  value,
  onChange,
  error,
  disabled,
}) => {
  return (
    <FormControl error={!!error} fullWidth>
      <FormControlLabel
        control={
          <Checkbox
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
          />
        }
        label={
          <>
            {field.label}
            {field.isRequired && <span style={{ color: 'red' }}> *</span>}
          </>
        }
      />
      {error && <FormHelperText>{error}</FormHelperText>}
      {field.helpText && !error && <FormHelperText>{field.helpText}</FormHelperText>}
    </FormControl>
  );
};
