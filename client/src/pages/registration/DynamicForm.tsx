import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { registrationService } from '../../services/registrationService';
import type { FormTemplate, FormField } from '../../types/registration';

export const DynamicFormPage = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
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

      // Initialize form data with empty values
      const initialData: Record<string, any> = {};
      visibleFields.forEach((field) => {
        initialData[field.sx3FieldName] = '';
      });
      setFormData(initialData);
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Erro ao carregar formulário');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const renderField = (field: FormField) => {
    const value = formData[field.sx3FieldName] || '';

    const commonProps = {
      id: field.sx3FieldName,
      required: field.isRequired,
      className: 'w-full border border-gray-300 rounded px-3 py-2',
    };

    switch (field.fieldType) {
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(field.sx3FieldName, e.target.value)}
            {...commonProps}
            step={field.metadata?.decimals ? `0.${'0'.repeat(field.metadata.decimals - 1)}1` : '1'}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleChange(field.sx3FieldName, e.target.value)}
            {...commonProps}
          />
        );

      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={value === true || value === 'true'}
            onChange={(e) => handleChange(field.sx3FieldName, e.target.checked)}
            className="w-5 h-5"
          />
        );

      case 'text':
        return (
          <textarea
            value={value}
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
            value={value}
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

    try {
      setSubmitting(true);

      // Create registration
      const registration = await registrationService.createRegistration({
        templateId,
        formData,
      });

      // Submit for approval
      await registrationService.submitRegistration(registration.id);

      alert('Solicitação enviada para aprovação com sucesso!');
      navigate('/registration/my-requests');
    } catch (error) {
      console.error('Error submitting registration:', error);
      alert('Erro ao enviar solicitação');
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
                  {field.metadata?.mask && (
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
