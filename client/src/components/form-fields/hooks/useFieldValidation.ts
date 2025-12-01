import { useState, useCallback } from 'react';
import { dataSourceService } from '../../../services/dataSourceService';
import type { ValidationRules } from '../../../types/registration';

interface UseFieldValidationOptions {
  templateId?: string;
  fieldId?: string;
  validationRules?: ValidationRules;
}

interface ValidationResult {
  valid: boolean;
  message?: string;
}

interface UseFieldValidationResult {
  validating: boolean;
  validationError: string | null;
  validate: (value: string) => Promise<ValidationResult>;
  clearValidation: () => void;
}

export function useFieldValidation({
  templateId,
  fieldId,
  validationRules,
}: UseFieldValidationOptions): UseFieldValidationResult {
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validate = useCallback(
    async (value: string): Promise<ValidationResult> => {
      setValidationError(null);

      // Basic validations (client-side)
      if (validationRules?.required && !value) {
        const error = 'Campo obrigatório';
        setValidationError(error);
        return { valid: false, message: error };
      }

      if (validationRules?.minLength && value.length < validationRules.minLength) {
        const error = `Mínimo ${validationRules.minLength} caracteres`;
        setValidationError(error);
        return { valid: false, message: error };
      }

      if (validationRules?.maxLength && value.length > validationRules.maxLength) {
        const error = `Máximo ${validationRules.maxLength} caracteres`;
        setValidationError(error);
        return { valid: false, message: error };
      }

      if (validationRules?.regex) {
        try {
          const regex = new RegExp(validationRules.regex);
          if (!regex.test(value)) {
            const error = 'Formato inválido';
            setValidationError(error);
            return { valid: false, message: error };
          }
        } catch {
          // Invalid regex, skip validation
        }
      }

      if (validationRules?.min !== undefined) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue < validationRules.min) {
          const error = `Valor mínimo: ${validationRules.min}`;
          setValidationError(error);
          return { valid: false, message: error };
        }
      }

      if (validationRules?.max !== undefined) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue > validationRules.max) {
          const error = `Valor máximo: ${validationRules.max}`;
          setValidationError(error);
          return { valid: false, message: error };
        }
      }

      // SQL validation (server-side)
      if (validationRules?.sqlValidation?.query && templateId && fieldId) {
        setValidating(true);
        try {
          const result = await dataSourceService.validateFieldValue(
            templateId,
            fieldId,
            value,
          );

          if (!result.valid) {
            const error = result.message || validationRules.sqlValidation.errorMessage || 'Valor inválido';
            setValidationError(error);
            return { valid: false, message: error };
          }
        } catch (err: any) {
          const error = err.response?.data?.message || 'Erro ao validar';
          setValidationError(error);
          return { valid: false, message: error };
        } finally {
          setValidating(false);
        }
      }

      return { valid: true };
    },
    [templateId, fieldId, validationRules],
  );

  const clearValidation = useCallback(() => {
    setValidationError(null);
  }, []);

  return {
    validating,
    validationError,
    validate,
    clearValidation,
  };
}
