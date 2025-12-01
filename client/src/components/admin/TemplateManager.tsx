import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Stack,
  Alert,
  CircularProgress,
  Tooltip,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Sync,
  Visibility,
  VisibilityOff,
  ExpandMore,
  ExpandLess,
  AddCircleOutline,
  KeyboardArrowUp,
  KeyboardArrowDown,
  VerticalAlignTop,
} from '@mui/icons-material';
import { adminService } from '../../services/adminService';
import { dataSourceService } from '../../services/dataSourceService';
import type { FormTemplate, FormField, DataSourceOption, FieldType, DataSourceType } from '../../types/registration';
import type { CreateFormTemplateDto } from '../../types/admin';

// Custom field types available
const CUSTOM_FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'string', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'boolean', label: 'Sim/Não' },
  { value: 'textarea', label: 'Texto Longo' },
  { value: 'select', label: 'Lista de Opções' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'autocomplete', label: 'Autocomplete (Busca)' },
  { value: 'multiselect', label: 'Seleção Múltipla' },
  { value: 'attachment', label: 'Anexos' },
];

// Data source types
const DATA_SOURCE_TYPES: { value: DataSourceType; label: string }[] = [
  { value: 'fixed', label: 'Lista Fixa' },
  { value: 'sql', label: 'Consulta SQL' },
  { value: 'sx5', label: 'Tabela SX5 (Genéricos)' },
];

// Field types that need data source configuration
const FIELD_TYPES_WITH_DATA_SOURCE: FieldType[] = ['select', 'radio', 'autocomplete', 'multiselect'];

// Allowed MIME types for attachments
const ALLOWED_MIME_TYPES = [
  { value: 'application/pdf', label: 'PDF' },
  { value: 'image/jpeg', label: 'JPEG' },
  { value: 'image/png', label: 'PNG' },
  { value: 'image/gif', label: 'GIF' },
  { value: 'application/msword', label: 'DOC' },
  { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'DOCX' },
  { value: 'application/vnd.ms-excel', label: 'XLS' },
  { value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'XLSX' },
];

interface CustomFieldFormData {
  fieldName: string;
  label: string;
  fieldType: FieldType;
  isRequired: boolean;
  fieldGroup: string;
  placeholder: string;
  helpText: string;
  // Data source configuration
  dataSourceType: DataSourceType | '';
  fixedOptions: string; // For fixed type, newline-separated value|label pairs
  sqlQuery: string;
  sqlKeyField: string; // Unique key field for React rendering
  sqlValueField: string;
  sqlLabelField: string;
  sx5Table: string;
  // Validation rules
  minLength: string;
  maxLength: string;
  regex: string;
  // Attachment config
  allowedTypes: string[];
  maxSize: string; // MB
  maxFiles: string;
}

// Memoized Field List Item component to prevent unnecessary re-renders
interface FieldListItemProps {
  field: FormField;
  templateId: string;
  index: number;
  totalFields: number;
  onToggleVisibility: (templateId: string, fieldId: string, isVisible: boolean) => void;
  onMoveField: (templateId: string, fieldId: string, direction: 'up' | 'down') => void;
  onEdit: (template: FormTemplate, field: FormField) => void;
  onDelete: (templateId: string, fieldId: string) => void;
  template: FormTemplate;
}

const FieldListItem = memo(({
  field,
  templateId,
  index,
  totalFields,
  onToggleVisibility,
  onMoveField,
  onEdit,
  onDelete,
  template
}: FieldListItemProps) => {
  return (
    <ListItem
      sx={{
        bgcolor: field.isCustomField ? 'primary.lighter' : 'background.paper',
        mb: 0.5,
        borderRadius: 1,
        border: field.isCustomField ? '1px solid' : 'none',
        borderColor: 'primary.light',
      }}
      secondaryAction={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title={field.isVisible ? 'Ocultar campo' : 'Mostrar campo'}>
            <IconButton
              size="small"
              onClick={() => onToggleVisibility(templateId, field.id, !field.isVisible)}
            >
              {field.isVisible ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Mover para cima">
            <span>
              <IconButton
                size="small"
                onClick={() => onMoveField(templateId, field.id, 'up')}
                disabled={index === 0}
              >
                <KeyboardArrowUp fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Mover para baixo">
            <span>
              <IconButton
                size="small"
                onClick={() => onMoveField(templateId, field.id, 'down')}
                disabled={index === totalFields - 1}
              >
                <KeyboardArrowDown fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Editar campo">
            <IconButton
              size="small"
              onClick={() => onEdit(template, field)}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          {field.isCustomField && (
            <Tooltip title="Deletar campo">
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete(templateId, field.id)}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      }
    >
      <Checkbox
        checked={field.isVisible}
        onChange={(e) => onToggleVisibility(templateId, field.id, e.target.checked)}
        size="small"
      />
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" fontWeight={field.isVisible ? 500 : 400}>
              {field.label}
            </Typography>
            {field.isRequired && (
              <Chip label="Obrigatório" size="small" color="error" variant="outlined" />
            )}
            {field.isCustomField && (
              <Chip label="Customizado" size="small" color="primary" variant="outlined" />
            )}
            {field.dataSourceType && (
              <Chip
                label={field.dataSourceType === 'sql' ? 'SQL' : field.dataSourceType === 'sx5' ? 'SX5' : 'Lista'}
                size="small"
                color="info"
                variant="outlined"
              />
            )}
          </Box>
        }
        secondary={
          <Typography variant="caption" color="text.secondary">
            {field.fieldName || field.sx3FieldName} • {field.fieldType}
            {field.fieldGroup && ` • ${field.fieldGroup}`}
          </Typography>
        }
      />
    </ListItem>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimization
  return prevProps.field.id === nextProps.field.id &&
         prevProps.field.isVisible === nextProps.field.isVisible &&
         prevProps.field.fieldOrder === nextProps.field.fieldOrder &&
         prevProps.field.label === nextProps.field.label &&
         prevProps.field.isRequired === nextProps.field.isRequired &&
         prevProps.index === nextProps.index &&
         prevProps.totalFields === nextProps.totalFields;
});

FieldListItem.displayName = 'FieldListItem';

const TemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [fieldsDialogOpen, setFieldsDialogOpen] = useState(false);
  const [customFieldDialogOpen, setCustomFieldDialogOpen] = useState(false);
  const [editFieldDialogOpen, setEditFieldDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState<string | null>(null);
  const [savingCustomField, setSavingCustomField] = useState(false);
  const [savingFieldEdit, setSavingFieldEdit] = useState(false);

  // Form state for create/edit template
  const [formData, setFormData] = useState<CreateFormTemplateDto>({
    label: '',
    description: '',
    tableName: '',
    isActive: true,
  });

  // State for SX5 tables options
  const [sx5Tables, setSx5Tables] = useState<DataSourceOption[]>([]);

  // Form state for custom field
  const [customFieldData, setCustomFieldData] = useState<CustomFieldFormData>({
    fieldName: '',
    label: '',
    fieldType: 'string',
    isRequired: false,
    fieldGroup: 'Campos Customizados',
    placeholder: '',
    helpText: '',
    // Data source
    dataSourceType: '',
    fixedOptions: '',
    sqlQuery: '',
    sqlKeyField: '',
    sqlValueField: '',
    sqlLabelField: '',
    sx5Table: '',
    // Validation
    minLength: '',
    maxLength: '',
    regex: '',
    // Attachment
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSize: '10',
    maxFiles: '5',
  });

  const resetCustomFieldForm = () => {
    setCustomFieldData({
      fieldName: '',
      label: '',
      fieldType: 'string',
      isRequired: false,
      fieldGroup: 'Campos Customizados',
      placeholder: '',
      helpText: '',
      dataSourceType: '',
      fixedOptions: '',
      sqlQuery: '',
      sqlKeyField: '',
      sqlValueField: '',
      sqlLabelField: '',
      sx5Table: '',
      minLength: '',
      maxLength: '',
      regex: '',
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      maxSize: '10',
      maxFiles: '5',
    });
  };

  // Load SX5 tables only when needed (lazy loading)
  const loadSx5Tables = useCallback(async () => {
    if (sx5Tables.length === 0) {
      try {
        const tables = await dataSourceService.getAvailableSx5Tables();
        setSx5Tables(tables);
      } catch (err) {
        console.error('Erro ao carregar tabelas SX5:', err);
      }
    }
  }, [sx5Tables.length]);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getTemplates(true);
      setTemplates(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleCreateTemplate = useCallback(async () => {
    try {
      await adminService.createTemplate(formData);
      setCreateDialogOpen(false);
      resetForm();
      await loadTemplates();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar template');
    }
  }, [formData, loadTemplates]);

  const handleDeleteTemplate = useCallback(async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este template?')) {
      return;
    }

    try {
      await adminService.deleteTemplate(id);
      await loadTemplates();
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar template');
    }
  }, [loadTemplates]);

  const handleSyncWithSx3 = useCallback(async (templateId: string) => {
    try {
      setSyncing(templateId);
      await adminService.syncTemplateWithSx3(templateId);
      await loadTemplates();
    } catch (err: any) {
      setError(err.message || 'Erro ao sincronizar com SX3');
    } finally {
      setSyncing(null);
    }
  }, [loadTemplates]);

  const handleToggleFieldVisibility = useCallback(async (
    templateId: string,
    fieldId: string,
    isVisible: boolean
  ) => {
    try {
      await adminService.updateTemplateField(templateId, fieldId, { isVisible });
      await loadTemplates();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar campo');
    }
  }, [loadTemplates]);

  const handleOpenCustomFieldDialog = useCallback((template: FormTemplate) => {
    setSelectedTemplate(template);
    resetCustomFieldForm();
    setCustomFieldDialogOpen(true);
  }, []);

  // Open edit field dialog
  const handleOpenEditFieldDialog = (template: FormTemplate, field: FormField) => {
    setSelectedTemplate(template);
    setSelectedField(field);

    // Convert field data to form data format
    const dataSourceConfig = field.dataSourceConfig as any;
    let fixedOptionsText = '';
    if (dataSourceConfig?.fixedOptions) {
      fixedOptionsText = dataSourceConfig.fixedOptions
        .map((opt: any) => `${opt.value}|${opt.label}`)
        .join('\n');
    }

    setCustomFieldData({
      fieldName: field.fieldName || field.sx3FieldName || '',
      label: field.label,
      fieldType: field.fieldType as FieldType,
      isRequired: field.isRequired,
      fieldGroup: field.fieldGroup || '',
      placeholder: field.placeholder || '',
      helpText: field.helpText || '',
      // Data source
      dataSourceType: (field.dataSourceType as DataSourceType) || '',
      fixedOptions: fixedOptionsText,
      sqlQuery: dataSourceConfig?.sqlQuery || '',
      sqlKeyField: dataSourceConfig?.keyField || '',
      sqlValueField: dataSourceConfig?.valueField || '',
      sqlLabelField: dataSourceConfig?.labelField || '',
      sx5Table: dataSourceConfig?.sx5Table || '',
      // Validation
      minLength: field.validationRules?.minLength?.toString() || '',
      maxLength: field.validationRules?.maxLength?.toString() || '',
      regex: field.validationRules?.regex || '',
      // Attachment
      allowedTypes: field.attachmentConfig?.allowedTypes || ['application/pdf', 'image/jpeg', 'image/png'],
      maxSize: field.attachmentConfig?.maxSize ? String(field.attachmentConfig.maxSize / (1024 * 1024)) : '10',
      maxFiles: field.attachmentConfig?.maxFiles?.toString() || '5',
    });

    // Load SX5 tables if field uses sx5 data source
    if (field.dataSourceType === 'sx5') {
      loadSx5Tables();
    }

    setEditFieldDialogOpen(true);
  };

  // Save edited field
  const handleSaveFieldEdit = async () => {
    if (!selectedTemplate || !selectedField) return;

    try {
      setSavingFieldEdit(true);

      // Build data source config
      let dataSourceType: DataSourceType | undefined;
      let dataSourceConfig: any = undefined;

      if (FIELD_TYPES_WITH_DATA_SOURCE.includes(customFieldData.fieldType) && customFieldData.dataSourceType) {
        dataSourceType = customFieldData.dataSourceType as DataSourceType;

        if (customFieldData.dataSourceType === 'fixed') {
          const fixedOptions = customFieldData.fixedOptions
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
              const [value, label] = line.split('|').map(s => s.trim());
              return { value: value || '', label: label || value || '' };
            })
            .filter(opt => opt.value);

          dataSourceConfig = { type: 'fixed', fixedOptions };
        } else if (customFieldData.dataSourceType === 'sql') {
          dataSourceConfig = {
            type: 'sql',
            sqlQuery: customFieldData.sqlQuery,
            keyField: customFieldData.sqlKeyField || undefined,
            valueField: customFieldData.sqlValueField,
            labelField: customFieldData.sqlLabelField,
          };
        } else if (customFieldData.dataSourceType === 'sx5') {
          dataSourceConfig = {
            type: 'sx5',
            sx5Table: customFieldData.sx5Table,
          };
        }
      }

      // Build validation rules
      const validationRules: any = {};
      if (customFieldData.minLength) {
        validationRules.minLength = parseInt(customFieldData.minLength, 10);
      }
      if (customFieldData.maxLength) {
        validationRules.maxLength = parseInt(customFieldData.maxLength, 10);
      }
      if (customFieldData.regex) {
        validationRules.regex = customFieldData.regex;
      }

      // Build attachment config
      let attachmentConfig: any = undefined;
      if (customFieldData.fieldType === 'attachment') {
        attachmentConfig = {
          allowedTypes: customFieldData.allowedTypes,
          maxSize: parseInt(customFieldData.maxSize, 10) * 1024 * 1024,
          maxFiles: parseInt(customFieldData.maxFiles, 10),
        };
      }

      await adminService.updateTemplateField(selectedTemplate.id, selectedField.id, {
        fieldType: customFieldData.fieldType,
        fieldGroup: customFieldData.fieldGroup || undefined,
        placeholder: customFieldData.placeholder || undefined,
        helpText: customFieldData.helpText || undefined,
        dataSourceType,
        dataSourceConfig: dataSourceConfig || undefined,
        validationRules: Object.keys(validationRules).length > 0 ? validationRules : undefined,
        attachmentConfig,
      });

      setEditFieldDialogOpen(false);
      setSelectedField(null);
      await loadTemplates();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar campo');
    } finally {
      setSavingFieldEdit(false);
    }
  };

  const handleCreateCustomField = async () => {
    if (!selectedTemplate) return;

    try {
      setSavingCustomField(true);

      // Build data source config for fields that need it
      let dataSourceType: DataSourceType | undefined;
      let dataSourceConfig: any = undefined;

      if (FIELD_TYPES_WITH_DATA_SOURCE.includes(customFieldData.fieldType) && customFieldData.dataSourceType) {
        dataSourceType = customFieldData.dataSourceType as DataSourceType;

        if (customFieldData.dataSourceType === 'fixed') {
          // Parse fixed options from text (format: value|label per line)
          const fixedOptions = customFieldData.fixedOptions
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
              const [value, label] = line.split('|').map(s => s.trim());
              return { value: value || '', label: label || value || '' };
            })
            .filter(opt => opt.value);

          dataSourceConfig = { type: 'fixed', fixedOptions };
        } else if (customFieldData.dataSourceType === 'sql') {
          dataSourceConfig = {
            type: 'sql',
            sqlQuery: customFieldData.sqlQuery,
            keyField: customFieldData.sqlKeyField || undefined,
            valueField: customFieldData.sqlValueField,
            labelField: customFieldData.sqlLabelField,
          };
        } else if (customFieldData.dataSourceType === 'sx5') {
          dataSourceConfig = {
            type: 'sx5',
            sx5Table: customFieldData.sx5Table,
          };
        }
      }

      // Build validation rules
      const validationRules: any = {};
      if (customFieldData.minLength) {
        validationRules.minLength = parseInt(customFieldData.minLength, 10);
      }
      if (customFieldData.maxLength) {
        validationRules.maxLength = parseInt(customFieldData.maxLength, 10);
      }
      if (customFieldData.regex) {
        validationRules.regex = customFieldData.regex;
      }

      // Build attachment config for attachment type
      let attachmentConfig: any = undefined;
      if (customFieldData.fieldType === 'attachment') {
        attachmentConfig = {
          allowedTypes: customFieldData.allowedTypes,
          maxSize: parseInt(customFieldData.maxSize, 10) * 1024 * 1024, // Convert MB to bytes
          maxFiles: parseInt(customFieldData.maxFiles, 10),
        };
      }

      await adminService.createCustomField(selectedTemplate.id, {
        fieldName: customFieldData.fieldName,
        label: customFieldData.label,
        fieldType: customFieldData.fieldType,
        isRequired: customFieldData.isRequired,
        fieldGroup: customFieldData.fieldGroup || 'Campos Customizados',
        placeholder: customFieldData.placeholder || undefined,
        helpText: customFieldData.helpText || undefined,
        dataSourceType,
        dataSourceConfig: dataSourceConfig ? dataSourceConfig : undefined,
        validationRules: Object.keys(validationRules).length > 0 ? validationRules : undefined,
        attachmentConfig,
      });

      setCustomFieldDialogOpen(false);
      resetCustomFieldForm();
      await loadTemplates();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar campo customizado');
    } finally {
      setSavingCustomField(false);
    }
  };

  const handleDeleteField = useCallback(async (templateId: string, fieldId: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este campo?')) {
      return;
    }

    try {
      await adminService.deleteTemplateField(templateId, fieldId);
      await loadTemplates();
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar campo');
    }
  }, [loadTemplates]);

  const saveFieldOrder = useCallback(async (templateId: string, fieldIds: string[]) => {
    try {
      await adminService.reorderTemplateFields(templateId, { fieldIds });
      await loadTemplates();
    } catch (err: any) {
      setError(err.message || 'Erro ao reordenar campos');
    }
  }, [loadTemplates]);

  const handleMoveField = useCallback(async (templateId: string, fieldId: string, direction: 'up' | 'down') => {
    const template = templates.find(t => t.id === templateId);
    if (!template?.fields) return;

    const sortedFields = [...template.fields].sort((a, b) => a.fieldOrder - b.fieldOrder);
    const currentIndex = sortedFields.findIndex(f => f.id === fieldId);

    if (direction === 'up' && currentIndex > 0) {
      const newOrder = [
        ...sortedFields.slice(0, currentIndex - 1),
        sortedFields[currentIndex],
        sortedFields[currentIndex - 1],
        ...sortedFields.slice(currentIndex + 1),
      ];
      await saveFieldOrder(templateId, newOrder.map(f => f.id));
    } else if (direction === 'down' && currentIndex < sortedFields.length - 1) {
      const newOrder = [
        ...sortedFields.slice(0, currentIndex),
        sortedFields[currentIndex + 1],
        sortedFields[currentIndex],
        ...sortedFields.slice(currentIndex + 2),
      ];
      await saveFieldOrder(templateId, newOrder.map(f => f.id));
    }
  }, [templates, saveFieldOrder]);

  const handleMoveVisibleFieldsToTop = useCallback(async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template?.fields) return;

    const sortedFields = [...template.fields].sort((a, b) => a.fieldOrder - b.fieldOrder);
    const visibleFields = sortedFields.filter(f => f.isVisible);
    const hiddenFields = sortedFields.filter(f => !f.isVisible);
    const newOrder = [...visibleFields, ...hiddenFields];

    await saveFieldOrder(templateId, newOrder.map(f => f.id));
  }, [templates, saveFieldOrder]);

  const toggleExpandTemplate = useCallback((templateId: string) => {
    setExpandedTemplates(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(templateId)) {
        newExpanded.delete(templateId);
      } else {
        newExpanded.add(templateId);
      }
      return newExpanded;
    });
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      label: '',
      description: '',
      tableName: '',
      isActive: true,
    });
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Templates de Formulários</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            resetForm();
            setCreateDialogOpen(true);
          }}
        >
          Novo Template
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Templates Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={50}></TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Tabela</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Campos</TableCell>
              <TableCell width={200}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    Nenhum template encontrado. Clique em "Novo Template" para criar um.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <React.Fragment key={template.id}>
                  <TableRow>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => toggleExpandTemplate(template.id)}
                      >
                        {expandedTemplates.has(template.id) ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {template.label}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={template.tableName} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {template.description || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={template.isActive ? 'Ativo' : 'Inativo'}
                        color={template.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {template.fields?.length || 0} campos
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Sincronizar com SX3">
                          <IconButton
                            size="small"
                            onClick={() => handleSyncWithSx3(template.id)}
                            disabled={syncing === template.id}
                          >
                            {syncing === template.id ? (
                              <CircularProgress size={20} />
                            ) : (
                              <Sync />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Deletar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Row - Fields */}
                  <TableRow>
                    <TableCell colSpan={7} sx={{ py: 0, borderBottom: 'none' }}>
                      <Collapse in={expandedTemplates.has(template.id)} timeout="auto">
                        <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2">
                              Campos do Template ({template.fields?.filter(f => f.isVisible).length || 0} visíveis de {template.fields?.length || 0})
                            </Typography>
                            <Stack direction="row" spacing={1}>
                              <Tooltip title="Mover campos visíveis para o topo">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<VerticalAlignTop />}
                                  onClick={() => handleMoveVisibleFieldsToTop(template.id)}
                                >
                                  Agrupar Visíveis
                                </Button>
                              </Tooltip>
                              <Button
                                size="small"
                                startIcon={<AddCircleOutline />}
                                onClick={() => handleOpenCustomFieldDialog(template)}
                              >
                                Adicionar Campo
                              </Button>
                            </Stack>
                          </Box>
                          {template.fields && template.fields.length > 0 ? (
                            <List dense>
                              {[...template.fields]
                                .sort((a, b) => a.fieldOrder - b.fieldOrder)
                                .map((field: FormField, index: number, arr: FormField[]) => (
                                  <FieldListItem
                                    key={field.id}
                                    field={field}
                                    templateId={template.id}
                                    index={index}
                                    totalFields={arr.length}
                                    onToggleVisibility={handleToggleFieldVisibility}
                                    onMoveField={handleMoveField}
                                    onEdit={handleOpenEditFieldDialog}
                                    onDelete={handleDeleteField}
                                    template={template}
                                  />
                                ))}
                            </List>
                          ) : (
                            <Box sx={{ textAlign: 'center', py: 2 }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Nenhum campo configurado.
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Sincronize com SX3 para importar campos do sistema ou adicione campos customizados.
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Template Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Template de Formulário</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nome"
              fullWidth
              required
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            />
            <TextField
              label="Nome da Tabela SX3"
              fullWidth
              required
              placeholder="Ex: SB1 (Produtos), SA1 (Clientes)"
              value={formData.tableName}
              onChange={(e) => setFormData({ ...formData, tableName: e.target.value.toUpperCase() })}
            />
            <TextField
              label="Descrição"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Template Ativo"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCreateTemplate}
            disabled={!formData.label || !formData.tableName}
          >
            Criar Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Custom Field Dialog */}
      <Dialog
        open={customFieldDialogOpen}
        onClose={() => setCustomFieldDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Adicionar Campo Customizado
          {selectedTemplate && (
            <Typography variant="body2" color="text.secondary">
              Template: {selectedTemplate.label}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Basic Info Section */}
            <Typography variant="subtitle2" color="primary">Informações Básicas</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Nome do Campo (ID)"
                fullWidth
                required
                placeholder="Ex: observacao, justificativa"
                value={customFieldData.fieldName}
                onChange={(e) => setCustomFieldData({
                  ...customFieldData,
                  fieldName: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')
                })}
                helperText="Identificador único do campo"
              />
              <TextField
                label="Rótulo (Label)"
                fullWidth
                required
                placeholder="Ex: Observação, Justificativa"
                value={customFieldData.label}
                onChange={(e) => setCustomFieldData({ ...customFieldData, label: e.target.value })}
                helperText="Nome exibido para o usuário"
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo do Campo</InputLabel>
                <Select
                  value={customFieldData.fieldType}
                  label="Tipo do Campo"
                  onChange={(e) => setCustomFieldData({
                    ...customFieldData,
                    fieldType: e.target.value as FieldType,
                    dataSourceType: '', // Reset data source when type changes
                  })}
                >
                  {CUSTOM_FIELD_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Grupo"
                fullWidth
                placeholder="Campos Customizados"
                value={customFieldData.fieldGroup}
                onChange={(e) => setCustomFieldData({ ...customFieldData, fieldGroup: e.target.value })}
                helperText="Agrupamento visual no formulário"
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Placeholder"
                fullWidth
                placeholder="Ex: Digite aqui..."
                value={customFieldData.placeholder}
                onChange={(e) => setCustomFieldData({ ...customFieldData, placeholder: e.target.value })}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={customFieldData.isRequired}
                    onChange={(e) => setCustomFieldData({ ...customFieldData, isRequired: e.target.checked })}
                  />
                }
                label="Campo Obrigatório"
              />
            </Box>

            <TextField
              label="Texto de Ajuda"
              fullWidth
              multiline
              rows={2}
              placeholder="Ex: Este campo é usado para..."
              value={customFieldData.helpText}
              onChange={(e) => setCustomFieldData({ ...customFieldData, helpText: e.target.value })}
            />

            {/* Data Source Section - Only for select, radio, autocomplete, multiselect */}
            {FIELD_TYPES_WITH_DATA_SOURCE.includes(customFieldData.fieldType) && (
              <>
                <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
                  Fonte de Dados
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Tipo da Fonte</InputLabel>
                  <Select
                    value={customFieldData.dataSourceType}
                    label="Tipo da Fonte"
                    onChange={(e) => {
                      const newType = e.target.value as DataSourceType | '';
                      setCustomFieldData({
                        ...customFieldData,
                        dataSourceType: newType,
                      });
                      // Load SX5 tables when sx5 is selected
                      if (newType === 'sx5') {
                        loadSx5Tables();
                      }
                    }}
                  >
                    <MenuItem value="">
                      <em>Selecione...</em>
                    </MenuItem>
                    {DATA_SOURCE_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Fixed Options */}
                {customFieldData.dataSourceType === 'fixed' && (
                  <TextField
                    label="Opções (uma por linha)"
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="valor1|Rótulo 1&#10;valor2|Rótulo 2&#10;valor3|Rótulo 3"
                    value={customFieldData.fixedOptions}
                    onChange={(e) => setCustomFieldData({ ...customFieldData, fixedOptions: e.target.value })}
                    helperText="Formato: valor|rótulo (se não houver |, o valor será usado como rótulo)"
                  />
                )}

                {/* SQL Query */}
                {customFieldData.dataSourceType === 'sql' && (
                  <>
                    <TextField
                      label="Consulta SQL"
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="SELECT codigo, descricao FROM tabela WHERE ativo = 1"
                      value={customFieldData.sqlQuery}
                      onChange={(e) => setCustomFieldData({ ...customFieldData, sqlQuery: e.target.value })}
                      helperText="Use apenas tabelas permitidas. A consulta será executada no banco do Protheus."
                    />
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                      <TextField
                        label="Campo Chave (Único)"
                        fullWidth
                        placeholder="Ex: R_E_C_N_O_"
                        value={customFieldData.sqlKeyField}
                        onChange={(e) => setCustomFieldData({ ...customFieldData, sqlKeyField: e.target.value })}
                        helperText="Coluna única para identificar cada registro"
                      />
                      <TextField
                        label="Campo do Valor"
                        fullWidth
                        placeholder="Ex: codigo"
                        value={customFieldData.sqlValueField}
                        onChange={(e) => setCustomFieldData({ ...customFieldData, sqlValueField: e.target.value })}
                        helperText="Coluna que será armazenada"
                      />
                      <TextField
                        label="Campo do Rótulo"
                        fullWidth
                        placeholder="Ex: descricao"
                        value={customFieldData.sqlLabelField}
                        onChange={(e) => setCustomFieldData({ ...customFieldData, sqlLabelField: e.target.value })}
                        helperText="Coluna que será exibida"
                      />
                    </Box>
                  </>
                )}

                {/* SX5 Table */}
                {customFieldData.dataSourceType === 'sx5' && (
                  <FormControl fullWidth>
                    <InputLabel>Tabela SX5</InputLabel>
                    <Select
                      value={customFieldData.sx5Table}
                      label="Tabela SX5"
                      onChange={(e) => setCustomFieldData({ ...customFieldData, sx5Table: e.target.value })}
                    >
                      <MenuItem value="">
                        <em>Selecione...</em>
                      </MenuItem>
                      {sx5Tables.map((table) => (
                        <MenuItem key={table.value} value={table.value}>
                          {table.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </>
            )}

            {/* Attachment Config Section */}
            {customFieldData.fieldType === 'attachment' && (
              <>
                <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
                  Configuração de Anexos
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Tipos de Arquivo Permitidos</InputLabel>
                  <Select
                    multiple
                    value={customFieldData.allowedTypes}
                    label="Tipos de Arquivo Permitidos"
                    onChange={(e) => setCustomFieldData({
                      ...customFieldData,
                      allowedTypes: e.target.value as string[],
                    })}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => {
                          const mimeType = ALLOWED_MIME_TYPES.find(m => m.value === value);
                          return <Chip key={value} label={mimeType?.label || value} size="small" />;
                        })}
                      </Box>
                    )}
                  >
                    {ALLOWED_MIME_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Checkbox checked={customFieldData.allowedTypes.includes(type.value)} />
                        <ListItemText primary={type.label} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Tamanho Máximo (MB)"
                    type="number"
                    fullWidth
                    value={customFieldData.maxSize}
                    onChange={(e) => setCustomFieldData({ ...customFieldData, maxSize: e.target.value })}
                    inputProps={{ min: 1, max: 50 }}
                  />
                  <TextField
                    label="Quantidade Máxima de Arquivos"
                    type="number"
                    fullWidth
                    value={customFieldData.maxFiles}
                    onChange={(e) => setCustomFieldData({ ...customFieldData, maxFiles: e.target.value })}
                    inputProps={{ min: 1, max: 20 }}
                  />
                </Box>
              </>
            )}

            {/* Validation Rules Section */}
            {['string', 'text', 'textarea'].includes(customFieldData.fieldType) && (
              <>
                <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
                  Regras de Validação (Opcional)
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Tamanho Mínimo"
                    type="number"
                    fullWidth
                    value={customFieldData.minLength}
                    onChange={(e) => setCustomFieldData({ ...customFieldData, minLength: e.target.value })}
                    inputProps={{ min: 0 }}
                  />
                  <TextField
                    label="Tamanho Máximo"
                    type="number"
                    fullWidth
                    value={customFieldData.maxLength}
                    onChange={(e) => setCustomFieldData({ ...customFieldData, maxLength: e.target.value })}
                    inputProps={{ min: 0 }}
                  />
                  <TextField
                    label="Regex"
                    fullWidth
                    placeholder="Ex: ^[A-Z]+$"
                    value={customFieldData.regex}
                    onChange={(e) => setCustomFieldData({ ...customFieldData, regex: e.target.value })}
                  />
                </Box>
              </>
            )}

            <Alert severity="info" sx={{ mt: 1 }}>
              Campos customizados são apenas para uso interno no sistema de aprovação.
              Eles não serão sincronizados com o Protheus.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomFieldDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCreateCustomField}
            disabled={!customFieldData.fieldName || !customFieldData.label || savingCustomField}
          >
            {savingCustomField ? <CircularProgress size={20} /> : 'Criar Campo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Field Dialog */}
      <Dialog
        open={editFieldDialogOpen}
        onClose={() => {
          setEditFieldDialogOpen(false);
          setSelectedField(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Configurar Campo
          {selectedField && (
            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Typography variant="body2" color="text.secondary" component="span">
                {selectedField.label} ({selectedField.fieldName || selectedField.sx3FieldName})
              </Typography>
              {!selectedField.isCustomField && (
                <Chip label="Campo do Protheus" size="small" />
              )}
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Field Info (read-only for Protheus fields) */}
            <Typography variant="subtitle2" color="primary">Informações do Campo</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Nome do Campo"
                fullWidth
                value={customFieldData.fieldName}
                disabled
                helperText={selectedField?.isCustomField ? '' : 'Campo do Protheus (não editável)'}
              />
              <TextField
                label="Rótulo"
                fullWidth
                value={customFieldData.label}
                disabled={!selectedField?.isCustomField}
                onChange={(e) => setCustomFieldData({ ...customFieldData, label: e.target.value })}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo do Campo</InputLabel>
                <Select
                  value={customFieldData.fieldType}
                  label="Tipo do Campo"
                  onChange={(e) => setCustomFieldData({
                    ...customFieldData,
                    fieldType: e.target.value as FieldType,
                    dataSourceType: '',
                  })}
                >
                  {CUSTOM_FIELD_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Grupo"
                fullWidth
                value={customFieldData.fieldGroup}
                onChange={(e) => setCustomFieldData({ ...customFieldData, fieldGroup: e.target.value })}
                helperText="Agrupamento visual no formulário"
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Placeholder"
                fullWidth
                value={customFieldData.placeholder}
                onChange={(e) => setCustomFieldData({ ...customFieldData, placeholder: e.target.value })}
              />
              <TextField
                label="Texto de Ajuda"
                fullWidth
                value={customFieldData.helpText}
                onChange={(e) => setCustomFieldData({ ...customFieldData, helpText: e.target.value })}
              />
            </Box>

            {/* Data Source Section */}
            {FIELD_TYPES_WITH_DATA_SOURCE.includes(customFieldData.fieldType) && (
              <>
                <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
                  Fonte de Dados
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Tipo da Fonte</InputLabel>
                  <Select
                    value={customFieldData.dataSourceType}
                    label="Tipo da Fonte"
                    onChange={(e) => {
                      const newType = e.target.value as DataSourceType | '';
                      setCustomFieldData({
                        ...customFieldData,
                        dataSourceType: newType,
                      });
                      // Load SX5 tables when sx5 is selected
                      if (newType === 'sx5') {
                        loadSx5Tables();
                      }
                    }}
                  >
                    <MenuItem value="">
                      <em>Nenhuma (usar opções do SX3)</em>
                    </MenuItem>
                    {DATA_SOURCE_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Fixed Options */}
                {customFieldData.dataSourceType === 'fixed' && (
                  <TextField
                    label="Opções (uma por linha)"
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="valor1|Rótulo 1&#10;valor2|Rótulo 2&#10;valor3|Rótulo 3"
                    value={customFieldData.fixedOptions}
                    onChange={(e) => setCustomFieldData({ ...customFieldData, fixedOptions: e.target.value })}
                    helperText="Formato: valor|rótulo (se não houver |, o valor será usado como rótulo)"
                  />
                )}

                {/* SQL Query */}
                {customFieldData.dataSourceType === 'sql' && (
                  <>
                    <TextField
                      label="Consulta SQL"
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="SELECT codigo, descricao FROM tabela WHERE ativo = 1"
                      value={customFieldData.sqlQuery}
                      onChange={(e) => setCustomFieldData({ ...customFieldData, sqlQuery: e.target.value })}
                      helperText="Use apenas tabelas permitidas. A consulta será executada no banco do Protheus."
                    />
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                      <TextField
                        label="Campo Chave (Único)"
                        fullWidth
                        placeholder="Ex: R_E_C_N_O_"
                        value={customFieldData.sqlKeyField}
                        onChange={(e) => setCustomFieldData({ ...customFieldData, sqlKeyField: e.target.value })}
                        helperText="Coluna única para identificar cada registro"
                      />
                      <TextField
                        label="Campo do Valor"
                        fullWidth
                        placeholder="Ex: codigo"
                        value={customFieldData.sqlValueField}
                        onChange={(e) => setCustomFieldData({ ...customFieldData, sqlValueField: e.target.value })}
                        helperText="Coluna que será armazenada"
                      />
                      <TextField
                        label="Campo do Rótulo"
                        fullWidth
                        placeholder="Ex: descricao"
                        value={customFieldData.sqlLabelField}
                        onChange={(e) => setCustomFieldData({ ...customFieldData, sqlLabelField: e.target.value })}
                        helperText="Coluna que será exibida"
                      />
                    </Box>
                  </>
                )}

                {/* SX5 Table */}
                {customFieldData.dataSourceType === 'sx5' && (
                  <FormControl fullWidth>
                    <InputLabel>Tabela SX5</InputLabel>
                    <Select
                      value={customFieldData.sx5Table}
                      label="Tabela SX5"
                      onChange={(e) => setCustomFieldData({ ...customFieldData, sx5Table: e.target.value })}
                    >
                      <MenuItem value="">
                        <em>Selecione...</em>
                      </MenuItem>
                      {sx5Tables.map((table) => (
                        <MenuItem key={table.value} value={table.value}>
                          {table.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </>
            )}

            {/* Attachment Config Section */}
            {customFieldData.fieldType === 'attachment' && (
              <>
                <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
                  Configuração de Anexos
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Tipos de Arquivo Permitidos</InputLabel>
                  <Select
                    multiple
                    value={customFieldData.allowedTypes}
                    label="Tipos de Arquivo Permitidos"
                    onChange={(e) => setCustomFieldData({
                      ...customFieldData,
                      allowedTypes: e.target.value as string[],
                    })}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => {
                          const mimeType = ALLOWED_MIME_TYPES.find(m => m.value === value);
                          return <Chip key={value} label={mimeType?.label || value} size="small" />;
                        })}
                      </Box>
                    )}
                  >
                    {ALLOWED_MIME_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Checkbox checked={customFieldData.allowedTypes.includes(type.value)} />
                        <ListItemText primary={type.label} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Tamanho Máximo (MB)"
                    type="number"
                    fullWidth
                    value={customFieldData.maxSize}
                    onChange={(e) => setCustomFieldData({ ...customFieldData, maxSize: e.target.value })}
                    inputProps={{ min: 1, max: 50 }}
                  />
                  <TextField
                    label="Quantidade Máxima de Arquivos"
                    type="number"
                    fullWidth
                    value={customFieldData.maxFiles}
                    onChange={(e) => setCustomFieldData({ ...customFieldData, maxFiles: e.target.value })}
                    inputProps={{ min: 1, max: 20 }}
                  />
                </Box>
              </>
            )}

            {/* Validation Rules Section */}
            {['string', 'text', 'textarea'].includes(customFieldData.fieldType) && (
              <>
                <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
                  Regras de Validação (Opcional)
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Tamanho Mínimo"
                    type="number"
                    fullWidth
                    value={customFieldData.minLength}
                    onChange={(e) => setCustomFieldData({ ...customFieldData, minLength: e.target.value })}
                    inputProps={{ min: 0 }}
                  />
                  <TextField
                    label="Tamanho Máximo"
                    type="number"
                    fullWidth
                    value={customFieldData.maxLength}
                    onChange={(e) => setCustomFieldData({ ...customFieldData, maxLength: e.target.value })}
                    inputProps={{ min: 0 }}
                  />
                  <TextField
                    label="Regex"
                    fullWidth
                    placeholder="Ex: ^[A-Z]+$"
                    value={customFieldData.regex}
                    onChange={(e) => setCustomFieldData({ ...customFieldData, regex: e.target.value })}
                  />
                </Box>
              </>
            )}

            {!selectedField?.isCustomField && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Este é um campo do Protheus. As configurações de tipo, fonte de dados e validações
                serão aplicadas apenas no sistema de aprovação, não afetando o Protheus.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEditFieldDialogOpen(false);
            setSelectedField(null);
          }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveFieldEdit}
            disabled={savingFieldEdit}
          >
            {savingFieldEdit ? <CircularProgress size={20} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplateManager;
