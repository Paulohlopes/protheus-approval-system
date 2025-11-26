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
} from '@mui/icons-material';
import { adminService } from '../../services/adminService';
import type { FormTemplate, CreateFormTemplateDto, FormField } from '../../types/admin';

const TemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [fieldsDialogOpen, setFieldsDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState<string | null>(null);

  // Form state for create/edit
  const [formData, setFormData] = useState<CreateFormTemplateDto>({
    label: '',
    description: '',
    tableName: '',
    isActive: true,
  });

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
                          <Typography variant="subtitle2" gutterBottom>
                            Campos do Template
                          </Typography>
                          {template.fields && template.fields.length > 0 ? (
                            <List dense>
                              {template.fields
                                .sort((a, b) => a.fieldOrder - b.fieldOrder)
                                .map((field) => (
                                  <ListItem
                                    key={field.id}
                                    sx={{
                                      bgcolor: 'background.paper',
                                      mb: 0.5,
                                      borderRadius: 1,
                                    }}
                                    secondaryAction={
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
                                    }
                                  >
                                    <ListItemText
                                      primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <Typography variant="body2" fontWeight={500}>
                                            {field.label}
                                          </Typography>
                                          <Chip
                                            label={field.sx3FieldName}
                                            size="small"
                                            variant="outlined"
                                          />
                                          {field.isRequired && (
                                            <Chip
                                              label="Obrigatório"
                                              size="small"
                                              color="warning"
                                            />
                                          )}
                                        </Box>
                                      }
                                      secondary={`Tipo: ${field.fieldType} | Grupo: ${field.fieldGroup || 'Nenhum'}`}
                                    />
                                  </ListItem>
                                ))}
                            </List>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Nenhum campo configurado. Sincronize com SX3 para importar campos.
                            </Typography>
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
    </Box>
  );
};

export default TemplateManager;
