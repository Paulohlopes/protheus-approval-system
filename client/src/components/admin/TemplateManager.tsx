import React, { useState, useEffect } from 'react';
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
import type { FormTemplate, FormField } from '../../types/registration';
import type { CreateFormTemplateDto } from '../../types/admin';

// Custom field types available
const CUSTOM_FIELD_TYPES = [
  { value: 'string', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'boolean', label: 'Sim/Não' },
  { value: 'select', label: 'Lista de Opções' },
  { value: 'textarea', label: 'Texto Longo' },
];

interface CustomFieldFormData {
  fieldName: string;
  label: string;
  fieldType: string;
  isRequired: boolean;
  fieldGroup: string;
  placeholder: string;
  helpText: string;
  options: string; // For select type, comma-separated options
}

const TemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [fieldsDialogOpen, setFieldsDialogOpen] = useState(false);
  const [customFieldDialogOpen, setCustomFieldDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState<string | null>(null);
  const [savingCustomField, setSavingCustomField] = useState(false);

  // Form state for create/edit template
  const [formData, setFormData] = useState<CreateFormTemplateDto>({
    label: '',
    description: '',
    tableName: '',
    isActive: true,
  });

  // Form state for custom field
  const [customFieldData, setCustomFieldData] = useState<CustomFieldFormData>({
    fieldName: '',
    label: '',
    fieldType: 'string',
    isRequired: false,
    fieldGroup: 'Campos Customizados',
    placeholder: '',
    helpText: '',
    options: '',
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
      options: '',
    });
  };

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
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
  };

  const handleCreateTemplate = async () => {
    try {
      await adminService.createTemplate(formData);
      setCreateDialogOpen(false);
      resetForm();
      await loadTemplates();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar template');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este template?')) {
      return;
    }

    try {
      await adminService.deleteTemplate(id);
      await loadTemplates();
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar template');
    }
  };

  const handleSyncWithSx3 = async (templateId: string) => {
    try {
      setSyncing(templateId);
      await adminService.syncTemplateWithSx3(templateId);
      await loadTemplates();
    } catch (err: any) {
      setError(err.message || 'Erro ao sincronizar com SX3');
    } finally {
      setSyncing(null);
    }
  };

  const handleToggleFieldVisibility = async (
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
  };

  const handleOpenCustomFieldDialog = (template: FormTemplate) => {
    setSelectedTemplate(template);
    resetCustomFieldForm();
    setCustomFieldDialogOpen(true);
  };

  const handleCreateCustomField = async () => {
    if (!selectedTemplate) return;

    try {
      setSavingCustomField(true);

      // Build metadata for select type
      const metadata: any = {};
      if (customFieldData.fieldType === 'select' && customFieldData.options) {
        metadata.options = customFieldData.options.split(',').map(opt => opt.trim()).filter(Boolean);
      }

      await adminService.createCustomField(selectedTemplate.id, {
        fieldName: customFieldData.fieldName,
        label: customFieldData.label,
        fieldType: customFieldData.fieldType,
        isRequired: customFieldData.isRequired,
        fieldGroup: customFieldData.fieldGroup || 'Campos Customizados',
        placeholder: customFieldData.placeholder || undefined,
        helpText: customFieldData.helpText || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
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

  const handleDeleteField = async (templateId: string, fieldId: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este campo?')) {
      return;
    }

    try {
      await adminService.deleteTemplateField(templateId, fieldId);
      await loadTemplates();
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar campo');
    }
  };

  const handleMoveField = async (templateId: string, fieldId: string, direction: 'up' | 'down') => {
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
  };

  const handleMoveVisibleFieldsToTop = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template?.fields) return;

    const sortedFields = [...template.fields].sort((a, b) => a.fieldOrder - b.fieldOrder);
    const visibleFields = sortedFields.filter(f => f.isVisible);
    const hiddenFields = sortedFields.filter(f => !f.isVisible);
    const newOrder = [...visibleFields, ...hiddenFields];

    await saveFieldOrder(templateId, newOrder.map(f => f.id));
  };

  const saveFieldOrder = async (templateId: string, fieldIds: string[]) => {
    try {
      await adminService.reorderTemplateFields(templateId, { fieldIds });
      await loadTemplates();
    } catch (err: any) {
      setError(err.message || 'Erro ao reordenar campos');
    }
  };

  const toggleExpandTemplate = (templateId: string) => {
    const newExpanded = new Set(expandedTemplates);
    if (newExpanded.has(templateId)) {
      newExpanded.delete(templateId);
    } else {
      newExpanded.add(templateId);
    }
    setExpandedTemplates(newExpanded);
  };

  const resetForm = () => {
    setFormData({
      label: '',
      description: '',
      tableName: '',
      isActive: true,
    });
  };

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
                              {template.fields
                                .sort((a, b) => a.fieldOrder - b.fieldOrder)
                                .map((field: any) => (
                                  <ListItem
                                    key={field.id}
                                    sx={{
                                      bgcolor: field.isCustomField ? 'primary.lighter' : 'background.paper',
                                      mb: 0.5,
                                      borderRadius: 1,
                                      border: field.isCustomField ? '1px solid' : 'none',
                                      borderColor: 'primary.light',
                                    }}
                                    secondaryAction={
                                      <Stack direction="row" spacing={0.5} alignItems="center">
                                        <Tooltip title="Mover para cima">
                                          <IconButton
                                            size="small"
                                            onClick={() => handleMoveField(template.id, field.id, 'up')}
                                          >
                                            <KeyboardArrowUp fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Mover para baixo">
                                          <IconButton
                                            size="small"
                                            onClick={() => handleMoveField(template.id, field.id, 'down')}
                                          >
                                            <KeyboardArrowDown fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                        <FormControlLabel
                                          control={
                                            <Switch
                                            checked={field.isVisible}
                                            onChange={(e) =>
                                              handleToggleFieldVisibility(
                                                template.id,
                                                field.id,
                                                e.target.checked
                                              )
                                            }
                                            size="small"
                                          />
                                        }
                                        label="Visível"
                                      />
                                        {field.isCustomField && (
                                          <Tooltip title="Deletar campo">
                                            <IconButton
                                              size="small"
                                              color="error"
                                              onClick={() => handleDeleteField(template.id, field.id)}
                                            >
                                              <Delete fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                        )}
                                      </Stack>
                                    }
                                  >
                                    <ListItemText
                                      primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <Typography variant="body2" fontWeight={500}>
                                            {field.label}
                                          </Typography>
                                          <Chip
                                            label={field.fieldName || field.sx3FieldName}
                                            size="small"
                                            variant="outlined"
                                          />
                                          {field.isCustomField && (
                                            <Chip
                                              label="Customizado"
                                              size="small"
                                              color="primary"
                                            />
                                          )}
                                          {field.isRequired && (
                                            <Chip
                                              label="Obrigatório"
                                              size="small"
                                              color="warning"
                                            />
                                          )}
                                        </Box>
                                      }
                                      secondary={`Tipo: ${field.fieldType} | Grupo: ${field.fieldGroup || 'Nenhum'}${field.helpText ? ` | ${field.helpText}` : ''}`}
                                    />
                                  </ListItem>
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
        maxWidth="sm"
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
              helperText="Identificador único do campo (sem espaços ou caracteres especiais)"
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
            <FormControl fullWidth>
              <InputLabel>Tipo do Campo</InputLabel>
              <Select
                value={customFieldData.fieldType}
                label="Tipo do Campo"
                onChange={(e) => setCustomFieldData({ ...customFieldData, fieldType: e.target.value })}
              >
                {CUSTOM_FIELD_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {customFieldData.fieldType === 'select' && (
              <TextField
                label="Opções"
                fullWidth
                placeholder="Ex: Opção 1, Opção 2, Opção 3"
                value={customFieldData.options}
                onChange={(e) => setCustomFieldData({ ...customFieldData, options: e.target.value })}
                helperText="Separe as opções por vírgula"
              />
            )}
            <TextField
              label="Grupo"
              fullWidth
              placeholder="Campos Customizados"
              value={customFieldData.fieldGroup}
              onChange={(e) => setCustomFieldData({ ...customFieldData, fieldGroup: e.target.value })}
              helperText="Agrupamento visual do campo no formulário"
            />
            <TextField
              label="Placeholder"
              fullWidth
              placeholder="Ex: Digite aqui..."
              value={customFieldData.placeholder}
              onChange={(e) => setCustomFieldData({ ...customFieldData, placeholder: e.target.value })}
            />
            <TextField
              label="Texto de Ajuda"
              fullWidth
              multiline
              rows={2}
              placeholder="Ex: Este campo é usado para..."
              value={customFieldData.helpText}
              onChange={(e) => setCustomFieldData({ ...customFieldData, helpText: e.target.value })}
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
    </Box>
  );
};

export default TemplateManager;
