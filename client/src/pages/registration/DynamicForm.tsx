import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { registrationService } from '../../services/registrationService';
import { toast } from '../../utils/toast';
import type { FormTemplate, FormField } from '../../types/registration';

type FormValue = string | number | boolean | null;

export const DynamicFormPage = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, FormValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    if (!templateId) return;

    try {
      setLoading(true);
      const data = await registrationService.getTemplate(templateId);
      setTemplate(data);

      // Filter visible and enabled fields
      const visibleFields = (data.fields || [])
        .filter((f) => f.isVisible && f.isEnabled)
        .sort((a, b) => a.fieldOrder - b.fieldOrder);

      setFields(visibleFields);

      // Initialize form data with appropriate default values based on field type
      const initialData: Record<string, FormValue> = {};
      visibleFields.forEach((field) => {
        switch (field.fieldType) {
          case 'boolean':
            initialData[field.sx3FieldName] = false;
            break;
          case 'number':
            initialData[field.sx3FieldName] = null;
            break;
          default:
            initialData[field.sx3FieldName] = '';
        }
      });
      setFormData(initialData);
      setErrors({});
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Erro ao carregar formulário. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (fieldName: string, value: FormValue) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    // Clear error when field is modified
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Validate form before submission
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      const value = formData[field.sx3FieldName];

      // Required field validation
      if (field.isRequired) {
        if (value === null || value === undefined || value === '') {
          newErrors[field.sx3FieldName] = `${field.label} é obrigatório`;
          return;
        }
      }

      // Type-specific validation
      if (value !== null && value !== undefined && value !== '') {
        switch (field.fieldType) {
          case 'number':
            if (typeof value === 'string' && isNaN(Number(value))) {
              newErrors[field.sx3FieldName] = `${field.label} deve ser um número válido`;
            }
            break;
          case 'date':
            if (typeof value === 'string') {
              const date = new Date(value);
              if (isNaN(date.getTime())) {
                newErrors[field.sx3FieldName] = `${field.label} deve ser uma data válida`;
              }
            }
            break;
        }

        // Max length validation for strings
        if (field.metadata?.size && typeof value === 'string' && value.length > field.metadata.size) {
          newErrors[field.sx3FieldName] = `${field.label} deve ter no máximo ${field.metadata.size} caracteres`;
        }
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error('Por favor, corrija os erros no formulário');
      return false;
    }

    return true;
  }, [fields, formData]);

  const renderField = (field: FormField) => {
    const value = formData[field.sx3FieldName];
    const hasError = !!errors[field.sx3FieldName];

    const commonProps = {
      id: field.sx3FieldName,
      name: field.sx3FieldName,
      'aria-required': field.isRequired,
      'aria-invalid': hasError,
      'aria-describedby': hasError ? `${field.sx3FieldName}-error` : undefined,
      className: `w-full border rounded px-3 py-2 ${
        hasError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
      } focus:outline-none focus:ring-2`,
    };

    switch (field.fieldType) {
      case 'number':
        return (
          <input
            type="number"
            value={value === null ? '' : String(value)}
            onChange={(e) => {
              const numValue = e.target.value === '' ? null : parseFloat(e.target.value);
              handleChange(field.sx3FieldName, numValue);
            }}
            {...commonProps}
            step={field.metadata?.decimals ? `0.${'0'.repeat(field.metadata.decimals - 1)}1` : '1'}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleChange(field.sx3FieldName, e.target.value)}
            {...commonProps}
          />
        );

      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => handleChange(field.sx3FieldName, e.target.checked)}
            className={`w-5 h-5 ${hasError ? 'border-red-500' : ''}`}
            aria-required={field.isRequired}
            aria-invalid={hasError}
          />
        );

      case 'text':
        return (
          <textarea
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleChange(field.sx3FieldName, e.target.value)}
            {...commonProps}
            rows={4}
          />
        );

      case 'string':
      default:
        return (
          <input
            type="text"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleChange(field.sx3FieldName, e.target.value)}
            {...commonProps}
            maxLength={field.metadata?.size || undefined}
          />
        );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateId) return;

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      // Prepare form data - convert types as needed
      const preparedData: Record<string, any> = {};
      fields.forEach((field) => {
        const value = formData[field.sx3FieldName];
        if (value !== null && value !== undefined && value !== '') {
          preparedData[field.sx3FieldName] = value;
        }
      });

      // Create registration
      const registration = await registrationService.createRegistration({
        templateId,
        formData: preparedData,
      });

      // Submit for approval
      await registrationService.submitRegistration(registration.id);

      toast.success('Solicitação enviada para aprovação com sucesso!');
      navigate('/registration/my-requests');
    } catch (error) {
      console.error('Error submitting registration:', error);
      toast.error('Erro ao enviar solicitação. Por favor, tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Carregando formulário...</div>;
  }

  if (!template) {
    return <div className="p-6">Template não encontrado</div>;
  }

  // Group fields by fieldGroup
  const groupedFields: Record<string, FormField[]> = {};
  fields.forEach((field) => {
    const group = field.fieldGroup || 'Geral';
    if (!groupedFields[group]) {
      groupedFields[group] = [];
    }
    groupedFields[group].push(field);
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{template.label}</h1>
        {template.description && (
          <p className="text-gray-600 mt-1">{template.description}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        {Object.entries(groupedFields).map(([groupName, groupFields]) => (
          <div key={groupName} className="mb-8">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b">{groupName}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupFields.map((field) => (
                <div
                  key={field.id}
                  className={field.fieldType === 'text' ? 'md:col-span-2' : ''}
                >
                  <label htmlFor={field.sx3FieldName} className="block text-sm font-medium mb-1">
                    {field.label}
                    {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderField(field)}
                  {errors[field.sx3FieldName] && (
                    <p
                      id={`${field.sx3FieldName}-error`}
                      className="text-xs text-red-500 mt-1"
                      role="alert"
                    >
                      {errors[field.sx3FieldName]}
                    </p>
                  )}
                  {field.metadata?.mask && !errors[field.sx3FieldName] && (
                    <p className="text-xs text-gray-500 mt-1">Formato: {field.metadata.mask}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex gap-3 justify-end pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            disabled={submitting}
          >
            {submitting ? 'Enviando...' : 'Enviar para Aprovação'}
          </button>
        </div>
      </form>
    </div>
  );
};
