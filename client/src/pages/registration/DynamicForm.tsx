import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  FormControl,
  FormLabel,
  FormControlLabel,
  Checkbox,
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
} from '@mui/icons-material';
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

      const visibleFields = (data.fields || [])
        .filter((f) => f.isVisible && f.isEnabled)
        .sort((a, b) => a.fieldOrder - b.fieldOrder);

      setFields(visibleFields);

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
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      const value = formData[field.sx3FieldName];

      if (field.isRequired) {
        if (value === null || value === undefined || value === '') {
          newErrors[field.sx3FieldName] = `${field.label} é obrigatório`;
          return;
        }
      }

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
    const errorMessage = errors[field.sx3FieldName];

    switch (field.fieldType) {
      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            label={field.label}
            value={value === null ? '' : String(value)}
            onChange={(e) => {
              const numValue = e.target.value === '' ? null : parseFloat(e.target.value);
              handleChange(field.sx3FieldName, numValue);
            }}
            required={field.isRequired}
            error={hasError}
            helperText={errorMessage || (field.metadata?.mask ? `Formato: ${field.metadata.mask}` : undefined)}
            inputProps={{
              step: field.metadata?.decimals ? `0.${'0'.repeat(field.metadata.decimals - 1)}1` : '1',
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        );

      case 'date':
        return (
          <TextField
            fullWidth
            type="date"
            label={field.label}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleChange(field.sx3FieldName, e.target.value)}
            required={field.isRequired}
            error={hasError}
            helperText={errorMessage}
            InputLabelProps={{ shrink: true }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        );

      case 'boolean':
        return (
          <FormControl error={hasError}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={value === true}
                  onChange={(e) => handleChange(field.sx3FieldName, e.target.checked)}
                  color="primary"
                />
              }
              label={field.label}
            />
            {hasError && (
              <Typography variant="caption" color="error">
                {errorMessage}
              </Typography>
            )}
          </FormControl>
        );

      case 'text':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            label={field.label}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleChange(field.sx3FieldName, e.target.value)}
            required={field.isRequired}
            error={hasError}
            helperText={errorMessage}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        );

      case 'string':
      default:
        return (
          <TextField
            fullWidth
            label={field.label}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleChange(field.sx3FieldName, e.target.value)}
            required={field.isRequired}
            error={hasError}
            helperText={errorMessage || (field.metadata?.mask ? `Formato: ${field.metadata.mask}` : undefined)}
            inputProps={{
              maxLength: field.metadata?.size || undefined,
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateId) return;

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const preparedData: Record<string, any> = {};
      fields.forEach((field) => {
        const value = formData[field.sx3FieldName];
        if (value !== null && value !== undefined && value !== '') {
          preparedData[field.sx3FieldName] = value;
        }
      });

      const registration = await registrationService.createRegistration({
        templateId,
        formData: preparedData,
      });

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
        <Alert severity="error">Template não encontrado</Alert>
      </Container>
    );
  }

  const groupedFields: Record<string, FormField[]> = {};
  fields.forEach((field) => {
    const group = field.fieldGroup || 'Geral';
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
              {groupFields.map((field) => (
                <Grid
                  item
                  xs={12}
                  md={field.fieldType === 'text' || field.fieldType === 'boolean' ? 12 : 6}
                  key={field.id}
                >
                  {renderField(field)}
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}

        <Divider sx={{ my: 3 }} />

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            disabled={submitting}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Send />}
            disabled={submitting}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {submitting ? 'Enviando...' : 'Enviar para Aprovação'}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};
