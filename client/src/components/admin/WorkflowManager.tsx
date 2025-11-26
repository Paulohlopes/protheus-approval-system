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
  ListItemSecondaryAction,
  Divider,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  Add,
  Delete,
  AccountTree,
  Person,
  ArrowDownward,
} from '@mui/icons-material';
import { adminService } from '../../services/adminService';
import type { FormTemplate, CreateWorkflowDto, Workflow } from '../../types/admin';

interface ApprovalStepForm {
  stepOrder: number;
  approverEmail: string;
  approverName: string;
  approverRole: string;
  isRequired: boolean;
}

const WorkflowManager: React.FC = () => {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [workflows, setWorkflows] = useState<Map<string, Workflow>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);

  // Form state for create workflow
  const [workflowData, setWorkflowData] = useState({
    name: '',
    description: '',
    isActive: true,
    requiresSequentialApproval: true,
  });

  const [approvalSteps, setApprovalSteps] = useState<ApprovalStepForm[]>([
    {
      stepOrder: 1,
      approverEmail: '',
      approverName: '',
      approverRole: '',
      isRequired: true,
    },
  ]);

  // Load templates and workflows on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load templates
      const templatesData = await adminService.getTemplates(false);
      setTemplates(templatesData);

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
        requiresSequentialApproval: workflowData.requiresSequentialApproval,
        steps: approvalSteps
          .filter((step) => step.approverEmail.trim() !== '')
          .map((step, index) => ({
            ...step,
            stepOrder: index + 1,
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

  const handleAddStep = () => {
    setApprovalSteps([
      ...approvalSteps,
      {
        stepOrder: approvalSteps.length + 1,
        approverEmail: '',
        approverName: '',
        approverRole: '',
        isRequired: true,
      },
    ]);
  };

  const handleRemoveStep = (index: number) => {
    if (approvalSteps.length <= 1) {
      alert('Deve haver pelo menos um aprovador no workflow');
      return;
    }
    const newSteps = approvalSteps.filter((_, i) => i !== index);
    setApprovalSteps(newSteps);
  };

  const handleUpdateStep = (index: number, field: keyof ApprovalStepForm, value: any) => {
    const newSteps = [...approvalSteps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setApprovalSteps(newSteps);
  };

  const resetForm = () => {
    setWorkflowData({
      name: '',
      description: '',
      isActive: true,
      requiresSequentialApproval: true,
    });
    setApprovalSteps([
      {
        stepOrder: 1,
        approverEmail: '',
        approverName: '',
        approverRole: '',
        isRequired: true,
      },
    ]);
    setSelectedTemplate(null);
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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Workflows de Aprovação
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure os fluxos de aprovação para cada tipo de formulário
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
                          Aprovação {workflow.requiresSequentialApproval ? 'Sequencial' : 'Paralela'}
                        </Typography>

                        <List dense sx={{ mt: 1 }}>
                          {workflow.steps
                            ?.sort((a, b) => a.stepOrder - b.stepOrder)
                            .map((step, index) => (
                              <React.Fragment key={step.id}>
                                <ListItem sx={{ py: 1, px: 0 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                    <Chip
                                      label={step.stepOrder}
                                      size="small"
                                      color="primary"
                                      sx={{ minWidth: 32 }}
                                    />
                                    <ListItemText
                                      primary={step.approverName || step.approverEmail}
                                      secondary={
                                        <Box component="span">
                                          {step.approverEmail}
                                          {step.approverRole && ` • ${step.approverRole}`}
                                          {step.isRequired && (
                                            <Chip
                                              label="Obrigatório"
                                              size="small"
                                              sx={{ ml: 1, height: 18 }}
                                            />
                                          )}
                                        </Box>
                                      }
                                    />
                                  </Box>
                                </ListItem>
                                {index < (workflow.steps?.length || 0) - 1 && (
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
                          requiresSequentialApproval: workflow.requiresSequentialApproval ?? true,
                        });
                        if (workflow.steps) {
                          setApprovalSteps(
                            workflow.steps.map((step) => ({
                              stepOrder: step.stepOrder,
                              approverEmail: step.approverEmail || '',
                              approverName: step.approverName || '',
                              approverRole: step.approverRole || '',
                              isRequired: step.isRequired ?? true,
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
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedTemplate && `Workflow para ${selectedTemplate.label}`}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Nome do Workflow"
              fullWidth
              required
              value={workflowData.name}
              onChange={(e) => setWorkflowData({ ...workflowData, name: e.target.value })}
            />
            <TextField
              label="Descrição"
              fullWidth
              multiline
              rows={2}
              value={workflowData.description}
              onChange={(e) => setWorkflowData({ ...workflowData, description: e.target.value })}
            />

            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={workflowData.requiresSequentialApproval}
                    onChange={(e) =>
                      setWorkflowData({ ...workflowData, requiresSequentialApproval: e.target.checked })
                    }
                  />
                }
                label="Aprovação Sequencial (aguarda aprovação anterior)"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={workflowData.isActive}
                    onChange={(e) => setWorkflowData({ ...workflowData, isActive: e.target.checked })}
                  />
                }
                label="Workflow Ativo"
              />
            </Box>

            <Divider />

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2">Etapas de Aprovação</Typography>
                <Button size="small" startIcon={<Add />} onClick={handleAddStep}>
                  Adicionar Etapa
                </Button>
              </Box>

              <Stack spacing={2}>
                {approvalSteps.map((step, index) => (
                  <Paper key={index} sx={{ p: 2 }} variant="outlined">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Chip label={`Etapa ${index + 1}`} size="small" color="primary" />
                      {approvalSteps.length > 1 && (
                        <IconButton size="small" color="error" onClick={() => handleRemoveStep(index)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="E-mail do Aprovador"
                          fullWidth
                          required
                          type="email"
                          value={step.approverEmail}
                          onChange={(e) => handleUpdateStep(index, 'approverEmail', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Nome do Aprovador"
                          fullWidth
                          value={step.approverName}
                          onChange={(e) => handleUpdateStep(index, 'approverName', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Cargo/Função"
                          fullWidth
                          value={step.approverRole}
                          onChange={(e) => handleUpdateStep(index, 'approverRole', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={step.isRequired}
                              onChange={(e) => handleUpdateStep(index, 'isRequired', e.target.checked)}
                            />
                          }
                          label="Aprovação Obrigatória"
                        />
                      </Grid>
                    </Grid>
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
              approvalSteps.some((step) => !step.approverEmail.trim())
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
