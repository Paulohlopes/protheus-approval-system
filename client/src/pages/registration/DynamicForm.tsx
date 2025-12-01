import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Divider,
  Stack,
  Alert,
  Grid,
} from '@mui/material';
import {
  Edit,
  Send,
  ArrowBack,
  Save,
} from '@mui/icons-material';
import { registrationService } from '../../services/registrationService';
import { toast } from '../../utils/toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { FieldRenderer } from '../../components/form-fields';
import type { FormTemplate, FormField, SupportedLanguage, FieldAttachment } from '../../types/registration';
import { getFieldLabel } from '../../types/registration';

type FormValue = string | number | boolean | string[] | null;

export const DynamicFormPage = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { language, t, formatMessage } = useLanguage();
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, FormValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Record<string, FieldAttachment[]>>({});
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Get localized field label
  const getLabel = (field: FormField): string => {
    return getFieldLabel(field, language as SupportedLanguage);
  };

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    if (!templateId) return;

    try {
      setLoading(true);
      const data = await registrationService.getTemplate(templateId);
      setTemplate(data);

      const visibleFields = (data.fields || [])
        .filter((f) => f.isVisible && f.isEnabled)
        .sort((a, b) => a.fieldOrder - b.fieldOrder);

      setFields(visibleFields);

      const initialData: Record<string, FormValue> = {};
      const initialAttachments: Record<string, FieldAttachment[]> = {};

      visibleFields.forEach((field) => {
        const fieldKey = field.fieldName || field.sx3FieldName || field.id;
        switch (field.fieldType) {
          case 'boolean':
          case 'checkbox':
            initialData[fieldKey] = false;
            break;
          case 'number':
            initialData[fieldKey] = null;
            break;
          case 'multiselect':
            initialData[fieldKey] = [];
            break;
          case 'attachment':
            initialAttachments[fieldKey] = [];
            break;
          default:
            initialData[fieldKey] = '';
        }
      });
      setFormData(initialData);
      setAttachments(initialAttachments);
      setErrors({});
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error(t.registration.errorLoadForm);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (fieldKey: string, value: FormValue) => {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
    if (errors[fieldKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };

  const handleAttachmentsChange = (fieldKey: string, newAttachments: FieldAttachment[]) => {
    setAttachments((prev) => ({
      ...prev,
      [fieldKey]: newAttachments,
    }));
    // Clear error if attachments were added
    if (newAttachments.length > 0 && errors[fieldKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };

  // Calculate dependency values for all fields
  const dependencyValues = useMemo(() => {
    const values: Record<string, any> = {};
    fields.forEach((field) => {
      const fieldKey = field.fieldName || field.sx3FieldName || field.id;
      values[fieldKey] = formData[fieldKey];
    });
    return values;
  }, [fields, formData]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      const fieldKey = field.fieldName || field.sx3FieldName || field.id;
      const value = formData[fieldKey];
      const label = getFieldLabel(field, language as SupportedLanguage);

      if (field.isRequired) {
        // Handle different field types for required validation
        if (field.fieldType === 'attachment') {
          const fieldAttachments = attachments[fieldKey] || [];
          if (fieldAttachments.length === 0) {
            newErrors[fieldKey] = formatMessage(t.validation.required, { field: label });
            return;
          }
        } else if (field.fieldType === 'multiselect') {
          if (!Array.isArray(value) || value.length === 0) {
            newErrors[fieldKey] = formatMessage(t.validation.required, { field: label });
            return;
          }
        } else if (value === null || value === undefined || value === '') {
          newErrors[fieldKey] = formatMessage(t.validation.required, { field: label });
          return;
        }
      }

      if (value !== null && value !== undefined && value !== '') {
        switch (field.fieldType) {
          case 'number':
            if (typeof value === 'string' && isNaN(Number(value))) {
              newErrors[fieldKey] = formatMessage(t.validation.invalidNumber, { field: label });
            }
            break;
          case 'date':
            if (typeof value === 'string') {
              const date = new Date(value);
              if (isNaN(date.getTime())) {
                newErrors[fieldKey] = formatMessage(t.validation.invalidDate, { field: label });
              }
            }
            break;
        }

        // Check max length from metadata
        if (field.metadata?.size && typeof value === 'string' && value.length > field.metadata.size) {
          newErrors[fieldKey] = formatMessage(t.validation.maxLength, { field: label, max: field.metadata.size });
        }

        // Check validation rules
        if (field.validationRules) {
          if (field.validationRules.minLength && typeof value === 'string' && value.length < field.validationRules.minLength) {
            newErrors[fieldKey] = `${label} deve ter pelo menos ${field.validationRules.minLength} caracteres`;
          }
          if (field.validationRules.maxLength && typeof value === 'string' && value.length > field.validationRules.maxLength) {
            newErrors[fieldKey] = `${label} deve ter no máximo ${field.validationRules.maxLength} caracteres`;
          }
          if (field.validationRules.regex && typeof value === 'string') {
            try {
              const regex = new RegExp(field.validationRules.regex);
              if (!regex.test(value)) {
                newErrors[fieldKey] = `${label} não corresponde ao formato esperado`;
              }
            } catch {
              // Invalid regex - skip validation
            }
          }
        }
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error(t.validation.fixErrors);
      return false;
    }

    return true;
  }, [fields, formData, attachments, language, t, formatMessage]);

  const renderField = (field: FormField) => {
    const fieldKey = field.fieldName || field.sx3FieldName || field.id;
    const value = formData[fieldKey];
    const fieldAttachments = attachments[fieldKey] || [];
    const errorMessage = errors[fieldKey];

    return (
      <FieldRenderer
        field={field}
        value={value}
        onChange={(newValue) => handleChange(fieldKey, newValue)}
        error={errorMessage}
        disabled={submitting || saving}
        templateId={templateId}
        registrationId={registrationId || undefined}
        dependencyValues={dependencyValues}
        attachments={fieldAttachments}
        onAttachmentsChange={(newAttachments) => handleAttachmentsChange(fieldKey, newAttachments)}
      />
    );
  };

  const prepareFormData = () => {
    const preparedData: Record<string, any> = {};
    fields.forEach((field) => {
      const fieldKey = field.fieldName || field.sx3FieldName || field.id;
      const value = formData[fieldKey];

      // Handle different field types
      if (field.fieldType === 'attachment') {
        // Attachments are stored separately, just track attachment IDs
        const fieldAttachments = attachments[fieldKey] || [];
        if (fieldAttachments.length > 0) {
          preparedData[fieldKey] = fieldAttachments.map(a => a.id);
        }
      } else if (field.fieldType === 'multiselect') {
        if (Array.isArray(value) && value.length > 0) {
          preparedData[fieldKey] = value;
        }
      } else if (value !== null && value !== undefined && value !== '') {
        preparedData[fieldKey] = value;
      }
    });
    return preparedData;
  };

  const handleSaveDraft = async () => {
    if (!templateId) return;

    try {
      setSaving(true);

      const preparedData = prepareFormData();

      const registration = await registrationService.createRegistration({
        templateId,
        formData: preparedData,
      });

      // Store registrationId for subsequent attachment uploads
      setRegistrationId(registration.id);

      toast.success(t.registration.successSaved);
      navigate('/registration/my-requests');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error(t.registration.errorSave);
    } finally {
      setSaving(false);
    }
  };

  // Create a draft registration to get a registrationId for attachments
  const ensureRegistrationId = async (): Promise<string> => {
    if (registrationId) return registrationId;

    if (!templateId) throw new Error('Template ID is required');

    const registration = await registrationService.createRegistration({
      templateId,
      formData: {},
    });

    setRegistrationId(registration.id);
    return registration.id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateId) return;

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const preparedData = prepareFormData();

      let regId = registrationId;

      // If we already have a registration (from draft), update it, otherwise create new
      if (regId) {
        await registrationService.updateRegistration(regId, { formData: preparedData });
      } else {
        const registration = await registrationService.createRegistration({
          templateId,
          formData: preparedData,
        });
        regId = registration.id;
      }

      await registrationService.submitRegistration(regId);

      toast.success(t.registration.successSubmitted);
      navigate('/registration/my-requests');
    } catch (error) {
      console.error('Error submitting registration:', error);
      toast.error(t.registration.errorSubmit);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!template) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{t.registration.errorTemplateNotFound}</Alert>
      </Container>
    );
  }

  const groupedFields: Record<string, FormField[]> = {};
  fields.forEach((field) => {
    const group = field.fieldGroup || t.common.general;
    if (!groupedFields[group]) {
      groupedFields[group] = [];
    }
    groupedFields[group].push(field);
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Edit fontSize="large" color="primary" />
          <Typography variant="h4" component="h1" fontWeight={600}>
            {template.label}
          </Typography>
        </Box>
        {template.description && (
          <Typography variant="body1" color="text.secondary">
            {template.description}
          </Typography>
        )}
      </Box>

      {/* Form */}
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3 }}
      >
        {Object.entries(groupedFields).map(([groupName, groupFields], groupIndex) => (
          <Box key={groupName} sx={{ mb: groupIndex < Object.entries(groupedFields).length - 1 ? 4 : 0 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              {groupName}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              {groupFields.map((field) => {
                // Full width for textarea, multiselect, attachment, and checkbox/boolean
                const fullWidthTypes = ['text', 'textarea', 'boolean', 'checkbox', 'multiselect', 'attachment'];
                const isFullWidth = fullWidthTypes.includes(field.fieldType);

                return (
                  <Grid
                    item
                    xs={12}
                    md={isFullWidth ? 12 : 6}
                    key={field.id}
                  >
                    {renderField(field)}
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        ))}

        <Divider sx={{ my: 3 }} />

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            disabled={submitting || saving}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {t.registration.formCancelButton}
          </Button>
          <Button
            variant="outlined"
            color="info"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
            onClick={handleSaveDraft}
            disabled={submitting || saving}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {saving ? t.registration.saving : t.registration.saveDraft}
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Send />}
            disabled={submitting || saving}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {submitting ? t.registration.formSubmitting : t.registration.formSubmitButton}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};
