import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid,
  Autocomplete,
  Checkbox,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Delete,
  AccountTree,
  ArrowDownward,
  Group,
  Person,
  Edit as EditIcon,
} from '@mui/icons-material';
import { adminService } from '../../services/adminService';
import type { FormTemplate } from '../../types/registration';
import type {
  CreateWorkflowDto,
  Workflow,
  WorkflowLevelDto,
  ApprovalGroup,
  UserOption
} from '../../types/admin';

interface LevelForm {
  levelOrder: number;
  levelName: string;
  approverIds: string[];
  approverGroupIds: string[];
  editableFields: string[];
  isParallel: boolean;
}

const WorkflowManager: React.FC = () => {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [workflows, setWorkflows] = useState<Map<string, Workflow>>(new Map());
  const [users, setUsers] = useState<UserOption[]>([]);
  const [groups, setGroups] = useState<ApprovalGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);

  // Form state for create workflow
  const [workflowData, setWorkflowData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  const [levels, setLevels] = useState<LevelForm[]>([
    {
      levelOrder: 1,
      levelName: '',
      approverIds: [],
      approverGroupIds: [],
      editableFields: [],
      isParallel: false,
    },
  ]);

  // Load templates, workflows, users, and groups on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [templatesData, usersData, groupsData] = await Promise.all([
        adminService.getTemplates(true),
        adminService.getUsers(),
        adminService.getApprovalGroups(false),
      ]);

      setTemplates(templatesData);
      setUsers(usersData);
      setGroups(groupsData);

      // Load workflows for each template
      const workflowsMap = new Map<string, Workflow>();
      await Promise.all(
        templatesData.map(async (template) => {
          try {
            const workflow = await adminService.getActiveWorkflow(template.id);
            if (workflow) {
              workflowsMap.set(template.id, workflow);
            }
          } catch (err) {
            // No workflow exists for this template
          }
        })
      );

      setWorkflows(workflowsMap);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async () => {
    if (!selectedTemplate) return;

    try {
      const createDto: CreateWorkflowDto = {
        templateId: selectedTemplate.id,
        name: workflowData.name,
        description: workflowData.description,
        isActive: workflowData.isActive,
        levels: levels.map((level, index) => ({
          levelOrder: index + 1,
          levelName: level.levelName || `Nível ${index + 1}`,
          approverIds: level.approverIds,
          approverGroupIds: level.approverGroupIds,
          editableFields: level.editableFields,
          isParallel: level.isParallel,
        })),
      };

      await adminService.createWorkflow(createDto);
      setCreateDialogOpen(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar workflow');
    }
  };

  const handleAddLevel = () => {
    setLevels([
      ...levels,
      {
        levelOrder: levels.length + 1,
        levelName: '',
        approverIds: [],
        approverGroupIds: [],
        editableFields: [],
        isParallel: false,
      },
    ]);
  };

  const handleRemoveLevel = (index: number) => {
    if (levels.length <= 1) {
      alert('Deve haver pelo menos um nível no workflow');
      return;
    }
    const newLevels = levels.filter((_, i) => i !== index);
    setLevels(newLevels);
  };

  const handleUpdateLevel = (index: number, field: keyof LevelForm, value: any) => {
    const newLevels = [...levels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    setLevels(newLevels);
  };

  const resetForm = () => {
    setWorkflowData({
      name: '',
      description: '',
      isActive: true,
    });
    setLevels([
      {
        levelOrder: 1,
        levelName: '',
        approverIds: [],
        approverGroupIds: [],
        editableFields: [],
        isParallel: false,
      },
    ]);
    setSelectedTemplate(null);
  };

  const getTemplateFields = () => {
    if (!selectedTemplate?.fields) return [];
    return selectedTemplate.fields
      .filter((f) => f.isVisible)
      .map((f) => ({
        name: f.sx3FieldName,
        label: f.label || f.sx3FieldName,
      }));
  };

  const getUserById = (id: string) => users.find((u) => u.id === id);
  const getGroupById = (id: string) => groups.find((g) => g.id === id);

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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Workflows de Aprovacao
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure os fluxos de aprovacao para cada tipo de formulario
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Workflows Grid */}
      <Grid container spacing={3}>
        {templates.map((template) => {
          const workflow = workflows.get(template.id);

          return (
            <Grid item xs={12} md={6} key={template.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <AccountTree color="primary" />
                    <Typography variant="h6">{template.label}</Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tabela: {template.tableName}
                  </Typography>

                  {workflow ? (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle2">{workflow.name}</Typography>
                          <Chip
                            label={workflow.isActive ? 'Ativo' : 'Inativo'}
                            size="small"
                            color={workflow.isActive ? 'success' : 'default'}
                          />
                        </Box>

                        {workflow.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {workflow.description}
                          </Typography>
                        )}

                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                          {workflow.levels?.length || 0} nivel(is) de aprovacao
                        </Typography>

                        <List dense sx={{ mt: 1 }}>
                          {workflow.levels
                            ?.sort((a, b) => a.levelOrder - b.levelOrder)
                            .map((level, index) => (
                              <React.Fragment key={level.id}>
                                <ListItem sx={{ py: 1, px: 0 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, width: '100%' }}>
                                    <Chip
                                      label={level.levelOrder}
                                      size="small"
                                      color="primary"
                                      sx={{ minWidth: 32, mt: 0.5 }}
                                    />
                                    <ListItemText
                                      primary={level.levelName || `Nivel ${level.levelOrder}`}
                                      secondaryTypographyProps={{ component: 'div' }}
                                      secondary={
                                        <Box>
                                          {level.approverGroupIds && level.approverGroupIds.length > 0 && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                              <Group fontSize="small" color="action" />
                                              <Typography variant="caption">
                                                {level.approverGroupIds.length} grupo(s)
                                              </Typography>
                                            </Box>
                                          )}
                                          {level.approverIds && level.approverIds.length > 0 && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                              <Person fontSize="small" color="action" />
                                              <Typography variant="caption">
                                                {level.approverIds.length} usuario(s)
                                              </Typography>
                                            </Box>
                                          )}
                                          {level.editableFields && level.editableFields.length > 0 && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                              <EditIcon fontSize="small" color="action" />
                                              <Typography variant="caption">
                                                {level.editableFields.length} campo(s) editavel(is)
                                              </Typography>
                                            </Box>
                                          )}
                                          {level.isParallel && (
                                            <Chip
                                              label="Paralelo"
                                              size="small"
                                              variant="outlined"
                                              sx={{ mt: 0.5, height: 18 }}
                                            />
                                          )}
                                        </Box>
                                      }
                                    />
                                  </Box>
                                </ListItem>
                                {index < (workflow.levels?.length || 0) - 1 && (
                                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 0.5 }}>
                                    <ArrowDownward fontSize="small" color="action" />
                                  </Box>
                                )}
                              </React.Fragment>
                            ))}
                        </List>
                      </Box>
                    </>
                  ) : (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Nenhum workflow configurado para este template
                    </Alert>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={workflow ? <AccountTree /> : <Add />}
                    onClick={() => {
                      setSelectedTemplate(template);
                      if (workflow) {
                        setWorkflowData({
                          name: workflow.name || '',
                          description: workflow.description || '',
                          isActive: workflow.isActive ?? true,
                        });
                        if (workflow.levels) {
                          setLevels(
                            workflow.levels.map((level) => ({
                              levelOrder: level.levelOrder,
                              levelName: level.levelName || '',
                              approverIds: level.approverIds || [],
                              approverGroupIds: level.approverGroupIds || [],
                              editableFields: level.editableFields || [],
                              isParallel: level.isParallel ?? false,
                            }))
                          );
                        }
                      }
                      setCreateDialogOpen(true);
                    }}
                  >
                    {workflow ? 'Editar Workflow' : 'Criar Workflow'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {templates.length === 0 && (
        <Alert severity="info">
          Nenhum template encontrado. Crie templates primeiro antes de configurar workflows.
        </Alert>
      )}

      {/* Create/Edit Workflow Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {selectedTemplate && `Workflow para ${selectedTemplate.label}`}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nome do Workflow"
                  fullWidth
                  required
                  value={workflowData.name}
                  onChange={(e) => setWorkflowData({ ...workflowData, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={workflowData.isActive}
                      onChange={(e) => setWorkflowData({ ...workflowData, isActive: e.target.checked })}
                    />
                  }
                  label="Workflow Ativo"
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Descricao"
                  fullWidth
                  multiline
                  rows={2}
                  value={workflowData.description}
                  onChange={(e) => setWorkflowData({ ...workflowData, description: e.target.value })}
                />
              </Grid>
            </Grid>

            <Divider />

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Niveis de Aprovacao
                </Typography>
                <Button size="small" startIcon={<Add />} onClick={handleAddLevel} variant="outlined">
                  Adicionar Nivel
                </Button>
              </Box>

              <Stack spacing={3}>
                {levels.map((level, index) => (
                  <Paper key={index} sx={{ p: 2 }} variant="outlined">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Chip label={`Nivel ${index + 1}`} size="small" color="primary" />
                      {levels.length > 1 && (
                        <IconButton size="small" color="error" onClick={() => handleRemoveLevel(index)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                      <Box sx={{ flexGrow: 1 }} />
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={level.isParallel}
                            onChange={(e) => handleUpdateLevel(index, 'isParallel', e.target.checked)}
                          />
                        }
                        label={
                          <Tooltip title="Se ativado, todos os aprovadores devem aprovar. Se desativado, apenas um aprovador e necessario.">
                            <Typography variant="body2">Aprovacao Paralela</Typography>
                          </Tooltip>
                        }
                      />
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Nome do Nivel"
                          fullWidth
                          placeholder="Ex: Gerente, Diretor, etc."
                          value={level.levelName}
                          onChange={(e) => handleUpdateLevel(index, 'levelName', e.target.value)}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Autocomplete
                          multiple
                          options={groups}
                          getOptionLabel={(option) => option.name}
                          value={groups.filter((g) => level.approverGroupIds.includes(g.id))}
                          onChange={(_, newValue) => {
                            handleUpdateLevel(index, 'approverGroupIds', newValue.map((g) => g.id));
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Grupos de Aprovacao"
                              placeholder="Selecione grupos..."
                            />
                          )}
                          renderOption={({ key, ...props }, option) => (
                            <li key={key} {...props}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Group fontSize="small" color="action" />
                                <Box>
                                  <Typography variant="body2">{option.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {option._count?.members || 0} membro(s)
                                  </Typography>
                                </Box>
                              </Box>
                            </li>
                          )}
                          renderTags={(value, getTagProps) =>
                            value.map((option, i) => (
                              <Chip
                                {...getTagProps({ index: i })}
                                key={option.id}
                                label={option.name}
                                size="small"
                                icon={<Group fontSize="small" />}
                              />
                            ))
                          }
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Autocomplete
                          multiple
                          options={users}
                          getOptionLabel={(option) => `${option.name} (${option.email})`}
                          value={users.filter((u) => level.approverIds.includes(u.id))}
                          onChange={(_, newValue) => {
                            handleUpdateLevel(index, 'approverIds', newValue.map((u) => u.id));
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Usuarios Aprovadores"
                              placeholder="Selecione usuarios..."
                            />
                          )}
                          renderOption={({ key, ...props }, option) => (
                            <li key={key} {...props}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Person fontSize="small" color="action" />
                                <Box>
                                  <Typography variant="body2">{option.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {option.email}
                                    {option.department && ` - ${option.department}`}
                                  </Typography>
                                </Box>
                              </Box>
                            </li>
                          )}
                          renderTags={(value, getTagProps) =>
                            value.map((option, i) => (
                              <Chip
                                {...getTagProps({ index: i })}
                                key={option.id}
                                label={option.name}
                                size="small"
                                icon={<Person fontSize="small" />}
                              />
                            ))
                          }
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Autocomplete
                          multiple
                          options={getTemplateFields()}
                          getOptionLabel={(option) => option.label}
                          value={getTemplateFields().filter((f) => level.editableFields.includes(f.name))}
                          onChange={(_, newValue) => {
                            handleUpdateLevel(index, 'editableFields', newValue.map((f) => f.name));
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Campos Editaveis"
                              placeholder="Selecione campos..."
                            />
                          )}
                          renderOption={({ key, ...props }, option, { selected }) => (
                            <li key={key} {...props}>
                              <Checkbox checked={selected} sx={{ mr: 1 }} />
                              <Box>
                                <Typography variant="body2">{option.label}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {option.name}
                                </Typography>
                              </Box>
                            </li>
                          )}
                          renderTags={(value, getTagProps) =>
                            value.map((option, i) => (
                              <Chip
                                {...getTagProps({ index: i })}
                                key={option.name}
                                label={option.label}
                                size="small"
                                icon={<EditIcon fontSize="small" />}
                              />
                            ))
                          }
                          disableCloseOnSelect
                        />
                      </Grid>
                    </Grid>

                    {(level.approverIds.length === 0 && level.approverGroupIds.length === 0) && (
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        Selecione pelo menos um grupo ou usuario aprovador para este nivel.
                      </Alert>
                    )}
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCreateDialogOpen(false);
            resetForm();
          }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateWorkflow}
            disabled={
              !workflowData.name ||
              levels.some((level) => level.approverIds.length === 0 && level.approverGroupIds.length === 0)
            }
          >
            Salvar Workflow
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowManager;
