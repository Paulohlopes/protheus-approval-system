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
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Edit,
  Send,
  ArrowBack,
  Save,
  ExpandMore,
  Add,
  Delete,
  TableChart,
} from '@mui/icons-material';
import { registrationService } from '../../services/registrationService';
import { toast } from '../../utils/toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { FieldRenderer } from '../../components/form-fields';
import type { FormTemplate, FormField, SupportedLanguage, FieldAttachment, TemplateTable } from '../../types/registration';
import { getFieldLabel } from '../../types/registration';

type FormValue = string | number | boolean | string[] | null;

// Type for multi-table form data structure
interface MultiTableFormData {
  [tableAlias: string]: Record<string, FormValue> | Record<string, FormValue>[];
}

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

  // Multi-table specific state
  const [multiTableData, setMultiTableData] = useState<MultiTableFormData>({});
  const [childItems, setChildItems] = useState<Record<string, Record<string, FormValue>[]>>({});
  const [expandedTables, setExpandedTables] = useState<string[]>([]);

  // Get localized field label
  const getLabel = (field: FormField): string => {
    return getFieldLabel(field, language as SupportedLanguage);
  };

  // Initialize form data for a single field
  const getInitialFieldValue = (field: FormField): FormValue => {
    switch (field.fieldType) {
      case 'boolean':
      case 'checkbox':
        return false;
      case 'number':
        return null;
      case 'multiselect':
        return [];
      default:
        return '';
    }
  };

  // Initialize form data for a table's fields
  const initializeTableData = (tableFields: FormField[]): Record<string, FormValue> => {
    const data: Record<string, FormValue> = {};
    tableFields.forEach((field) => {
      const fieldKey = field.fieldName || field.sx3FieldName || field.id;
      data[fieldKey] = getInitialFieldValue(field);
    });
    return data;
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

      if (data.isMultiTable && data.tables && data.tables.length > 0) {
        // Multi-table template: organize fields by table
        const newMultiTableData: MultiTableFormData = {};
        const newChildItems: Record<string, Record<string, FormValue>[]> = {};
        const newAttachments: Record<string, FieldAttachment[]> = {};
        const expandedList: string[] = [];

        data.tables.forEach((table) => {
          const tableFields = (table.fields || [])
            .filter((f) => f.isVisible && f.isEnabled)
            .sort((a, b) => a.fieldOrder - b.fieldOrder);

          if (table.relationType === 'child') {
            // Child tables start with one empty row
            newChildItems[table.alias] = [initializeTableData(tableFields)];
          } else {
            // Parent/independent tables have a single record
            newMultiTableData[table.alias] = initializeTableData(tableFields);
          }

          // Initialize attachments for all fields
          tableFields.forEach((field) => {
            if (field.fieldType === 'attachment') {
              const fieldKey = `${table.alias}.${field.fieldName || field.sx3FieldName || field.id}`;
              newAttachments[fieldKey] = [];
            }
          });

          expandedList.push(table.id);
        });

        setMultiTableData(newMultiTableData);
        setChildItems(newChildItems);
        setAttachments(newAttachments);
        setExpandedTables(expandedList);
        setFields([]); // Fields are managed per table
      } else {
        // Single-table template: legacy behavior
        const visibleFields = (data.fields || [])
          .filter((f) => f.isVisible && f.isEnabled)
          .sort((a, b) => a.fieldOrder - b.fieldOrder);

        setFields(visibleFields);

        const initialData: Record<string, FormValue> = {};
        const initialAttachments: Record<string, FieldAttachment[]> = {};

        visibleFields.forEach((field) => {
          const fieldKey = field.fieldName || field.sx3FieldName || field.id;
          initialData[fieldKey] = getInitialFieldValue(field);
          if (field.fieldType === 'attachment') {
            initialAttachments[fieldKey] = [];
          }
        });
        setFormData(initialData);
        setAttachments(initialAttachments);
      }

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

  // Handle change for multi-table parent/independent tables
  const handleMultiTableChange = (tableAlias: string, fieldKey: string, value: FormValue) => {
    setMultiTableData((prev) => ({
      ...prev,
      [tableAlias]: {
        ...(prev[tableAlias] as Record<string, FormValue>),
        [fieldKey]: value,
      },
    }));
    const errorKey = `${tableAlias}.${fieldKey}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Handle change for child table items
  const handleChildItemChange = (tableAlias: string, itemIndex: number, fieldKey: string, value: FormValue) => {
    setChildItems((prev) => {
      const items = [...(prev[tableAlias] || [])];
      items[itemIndex] = {
        ...items[itemIndex],
        [fieldKey]: value,
      };
      return { ...prev, [tableAlias]: items };
    });
    const errorKey = `${tableAlias}[${itemIndex}].${fieldKey}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Add new item to child table
  const addChildItem = (table: TemplateTable) => {
    const tableFields = (table.fields || [])
      .filter((f) => f.isVisible && f.isEnabled)
      .sort((a, b) => a.fieldOrder - b.fieldOrder);

    setChildItems((prev) => ({
      ...prev,
      [table.alias]: [...(prev[table.alias] || []), initializeTableData(tableFields)],
    }));
  };

  // Remove item from child table
  const removeChildItem = (tableAlias: string, itemIndex: number) => {
    setChildItems((prev) => {
      const items = [...(prev[tableAlias] || [])];
      items.splice(itemIndex, 1);
      return { ...prev, [tableAlias]: items };
    });
  };

  // Toggle table expansion
  const toggleTableExpansion = (tableId: string) => {
    setExpandedTables((prev) =>
      prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId]
    );
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

  // Helper function to validate a single field
  const validateField = (
    field: FormField,
    value: FormValue,
    errorKeyPrefix: string,
    newErrors: Record<string, string>
  ) => {
    const fieldKey = field.fieldName || field.sx3FieldName || field.id;
    const label = getFieldLabel(field, language as SupportedLanguage);
    const errorKey = errorKeyPrefix ? `${errorKeyPrefix}.${fieldKey}` : fieldKey;

    if (field.isRequired) {
      if (field.fieldType === 'attachment') {
        const attachmentKey = errorKeyPrefix ? `${errorKeyPrefix}.${fieldKey}` : fieldKey;
        const fieldAttachments = attachments[attachmentKey] || [];
        if (fieldAttachments.length === 0) {
          newErrors[errorKey] = formatMessage(t.validation.required, { field: label });
          return;
        }
      } else if (field.fieldType === 'multiselect') {
        if (!Array.isArray(value) || value.length === 0) {
          newErrors[errorKey] = formatMessage(t.validation.required, { field: label });
          return;
        }
      } else if (value === null || value === undefined || value === '') {
        newErrors[errorKey] = formatMessage(t.validation.required, { field: label });
        return;
      }
    }

    if (value !== null && value !== undefined && value !== '') {
      switch (field.fieldType) {
        case 'number':
          if (typeof value === 'string' && isNaN(Number(value))) {
            newErrors[errorKey] = formatMessage(t.validation.invalidNumber, { field: label });
          }
          break;
        case 'date':
          if (typeof value === 'string') {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              newErrors[errorKey] = formatMessage(t.validation.invalidDate, { field: label });
            }
          }
          break;
      }

      if (field.metadata?.size && typeof value === 'string' && value.length > field.metadata.size) {
        newErrors[errorKey] = formatMessage(t.validation.maxLength, { field: label, max: field.metadata.size });
      }

      if (field.validationRules) {
        if (field.validationRules.minLength && typeof value === 'string' && value.length < field.validationRules.minLength) {
          newErrors[errorKey] = `${label} deve ter pelo menos ${field.validationRules.minLength} caracteres`;
        }
        if (field.validationRules.maxLength && typeof value === 'string' && value.length > field.validationRules.maxLength) {
          newErrors[errorKey] = `${label} deve ter no máximo ${field.validationRules.maxLength} caracteres`;
        }
        if (field.validationRules.regex && typeof value === 'string') {
          try {
            const regex = new RegExp(field.validationRules.regex);
            if (!regex.test(value)) {
              newErrors[errorKey] = `${label} não corresponde ao formato esperado`;
            }
          } catch {
            // Invalid regex - skip validation
          }
        }
      }
    }
  };

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Multi-table validation
    if (template?.isMultiTable && template.tables && template.tables.length > 0) {
      template.tables.forEach((table) => {
        const tableFields = (table.fields || [])
          .filter((f) => f.isVisible && f.isEnabled);

        if (table.relationType === 'child') {
          // Validate child table items
          const items = childItems[table.alias] || [];

          // Check if at least one item exists (if table is required)
          if (items.length === 0) {
            newErrors[`${table.alias}`] = `Adicione pelo menos um item em "${table.label}"`;
          }

          items.forEach((item, itemIndex) => {
            tableFields.forEach((field) => {
              const fieldKey = field.fieldName || field.sx3FieldName || field.id;
              const value = item[fieldKey];
              validateField(field, value, `${table.alias}[${itemIndex}]`, newErrors);
            });
          });
        } else {
          // Validate parent/independent table
          const tableData = multiTableData[table.alias] as Record<string, FormValue> || {};
          tableFields.forEach((field) => {
            const fieldKey = field.fieldName || field.sx3FieldName || field.id;
            const value = tableData[fieldKey];
            validateField(field, value, table.alias, newErrors);
          });
        }
      });
    } else {
      // Single-table validation (legacy)
      fields.forEach((field) => {
        const fieldKey = field.fieldName || field.sx3FieldName || field.id;
        const value = formData[fieldKey];
        validateField(field, value, '', newErrors);
      });
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error(t.validation.fixErrors);
      return false;
    }

    return true;
  }, [template, fields, formData, multiTableData, childItems, attachments, language, t, formatMessage]);

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

  // Render field for parent/independent table
  const renderTableField = (table: TemplateTable, field: FormField) => {
    const fieldKey = field.fieldName || field.sx3FieldName || field.id;
    const tableData = multiTableData[table.alias] as Record<string, FormValue> || {};
    const value = tableData[fieldKey];
    const attachmentKey = `${table.alias}.${fieldKey}`;
    const fieldAttachments = attachments[attachmentKey] || [];
    const errorKey = `${table.alias}.${fieldKey}`;
    const errorMessage = errors[errorKey];

    return (
      <FieldRenderer
        field={field}
        value={value}
        onChange={(newValue) => handleMultiTableChange(table.alias, fieldKey, newValue)}
        error={errorMessage}
        disabled={submitting || saving}
        templateId={templateId}
        registrationId={registrationId || undefined}
        dependencyValues={tableData}
        attachments={fieldAttachments}
        onAttachmentsChange={(newAttachments) => handleAttachmentsChange(attachmentKey, newAttachments)}
      />
    );
  };

  // Render field for child table item
  const renderChildItemField = (table: TemplateTable, field: FormField, itemIndex: number) => {
    const fieldKey = field.fieldName || field.sx3FieldName || field.id;
    const items = childItems[table.alias] || [];
    const item = items[itemIndex] || {};
    const value = item[fieldKey];
    const errorKey = `${table.alias}[${itemIndex}].${fieldKey}`;
    const errorMessage = errors[errorKey];

    return (
      <FieldRenderer
        field={field}
        value={value}
        onChange={(newValue) => handleChildItemChange(table.alias, itemIndex, fieldKey, newValue)}
        error={errorMessage}
        disabled={submitting || saving}
        templateId={templateId}
        registrationId={registrationId || undefined}
        dependencyValues={item}
      />
    );
  };

  // Render parent/independent table section
  const renderParentTable = (table: TemplateTable) => {
    const tableFields = (table.fields || [])
      .filter((f) => f.isVisible && f.isEnabled)
      .sort((a, b) => a.fieldOrder - b.fieldOrder);

    if (tableFields.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 1 }}>
          Nenhum campo configurado para esta tabela. Sincronize com o SX3 para importar os campos.
        </Alert>
      );
    }

    // Group fields by fieldGroup
    const groupedFields: Record<string, FormField[]> = {};
    tableFields.forEach((field) => {
      const group = field.fieldGroup || t.common.general;
      if (!groupedFields[group]) {
        groupedFields[group] = [];
      }
      groupedFields[group].push(field);
    });

    return (
      <>
        {Object.entries(groupedFields).map(([groupName, groupFields], groupIndex) => (
          <Box key={groupName} sx={{ mb: groupIndex < Object.entries(groupedFields).length - 1 ? 3 : 0 }}>
            {Object.keys(groupedFields).length > 1 && (
              <>
                <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 1, color: 'text.secondary' }}>
                  {groupName}
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </>
            )}
            <Grid container spacing={2}>
              {groupFields.map((field) => {
                const fullWidthTypes = ['text', 'textarea', 'boolean', 'checkbox', 'multiselect', 'attachment'];
                const isFullWidth = fullWidthTypes.includes(field.fieldType);

                return (
                  <Grid item xs={12} md={isFullWidth ? 12 : 6} key={field.id}>
                    {renderTableField(table, field)}
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        ))}
      </>
    );
  };

  // Render child table section with grid
  const renderChildTable = (table: TemplateTable) => {
    const tableFields = (table.fields || [])
      .filter((f) => f.isVisible && f.isEnabled)
      .sort((a, b) => a.fieldOrder - b.fieldOrder);

    const items = childItems[table.alias] || [];

    if (tableFields.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 1 }}>
          Nenhum campo configurado para esta tabela. Sincronize com o SX3 para importar os campos.
        </Alert>
      );
    }

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => addChildItem(table)}
            size="small"
          >
            Adicionar Item
          </Button>
        </Box>

        {items.length === 0 ? (
          <Alert severity="info">
            Nenhum item adicionado. Clique em "Adicionar Item" para incluir registros.
          </Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell width={50}>#</TableCell>
                  {tableFields.slice(0, 5).map((field) => (
                    <TableCell key={field.id}>
                      {getLabel(field)}
                      {field.isRequired && <span style={{ color: 'red' }}> *</span>}
                    </TableCell>
                  ))}
                  {tableFields.length > 5 && (
                    <TableCell>+{tableFields.length - 5} campos</TableCell>
                  )}
                  <TableCell width={60}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, itemIndex) => (
                  <TableRow key={itemIndex} hover>
                    <TableCell>{itemIndex + 1}</TableCell>
                    {tableFields.slice(0, 5).map((field) => (
                      <TableCell key={field.id} sx={{ minWidth: 150 }}>
                        {renderChildItemField(table, field, itemIndex)}
                      </TableCell>
                    ))}
                    {tableFields.length > 5 && (
                      <TableCell>
                        <Tooltip title="Editar todos os campos">
                          <IconButton size="small" color="primary">
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                    <TableCell>
                      <Tooltip title="Remover item">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeChildItem(table.alias, itemIndex)}
                          disabled={items.length === 1}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    );
  };

  const prepareFormData = () => {
    // For multi-table templates, return structured data
    if (template?.isMultiTable && template.tables && template.tables.length > 0) {
      const preparedData: Record<string, any> = {};

      template.tables.forEach((table) => {
        if (table.relationType === 'child') {
          // Child tables have multiple items
          preparedData[table.alias] = childItems[table.alias] || [];
        } else {
          // Parent/independent tables have single record
          preparedData[table.alias] = multiTableData[table.alias] || {};
        }
      });

      return preparedData;
    }

    // For single-table templates, use legacy format
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
        {/* Multi-table form */}
        {template.isMultiTable && template.tables && template.tables.length > 0 ? (
          <Box>
            {/* Render tables in order: parents first, then children */}
            {template.tables
              .sort((a, b) => {
                // Parents first, then independent, then children
                const order = { parent: 0, independent: 1, child: 2 };
                return (order[a.relationType || 'independent'] || 1) - (order[b.relationType || 'independent'] || 1);
              })
              .map((table, tableIndex) => (
                <Accordion
                  key={table.id}
                  expanded={expandedTables.includes(table.id)}
                  onChange={() => toggleTableExpansion(table.id)}
                  sx={{ mb: 2, '&:before': { display: 'none' } }}
                  elevation={0}
                  variant="outlined"
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    sx={{
                      bgcolor: table.relationType === 'parent' ? 'primary.50' : table.relationType === 'child' ? 'secondary.50' : 'grey.50',
                      borderBottom: expandedTables.includes(table.id) ? '1px solid' : 'none',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <TableChart color={table.relationType === 'parent' ? 'primary' : table.relationType === 'child' ? 'secondary' : 'action'} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {table.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {table.tableName}
                        </Typography>
                      </Box>
                      <Chip
                        label={
                          table.relationType === 'parent' ? 'Cabeçalho' :
                          table.relationType === 'child' ? 'Itens' : 'Independente'
                        }
                        size="small"
                        color={table.relationType === 'parent' ? 'primary' : table.relationType === 'child' ? 'secondary' : 'default'}
                        variant="outlined"
                      />
                      {table.relationType === 'child' && (
                        <Chip
                          label={`${(childItems[table.alias] || []).length} item(s)`}
                          size="small"
                          color="info"
                        />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 3 }}>
                    {table.relationType === 'child' ? renderChildTable(table) : renderParentTable(table)}
                  </AccordionDetails>
                </Accordion>
              ))}
          </Box>
        ) : (
          /* Single-table form (legacy) */
          <>
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
          </>
        )}

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
