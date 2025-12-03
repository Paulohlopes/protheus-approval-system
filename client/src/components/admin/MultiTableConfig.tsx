import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Alert,
  Divider,
  Tooltip,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SyncIcon from '@mui/icons-material/Sync';
import TableChartIcon from '@mui/icons-material/TableChart';
import LinkIcon from '@mui/icons-material/Link';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import type {
  TemplateTable,
  CreateTemplateTableDto,
  TableRelationType,
  ForeignKeyConfig,
  ForeignKeyField,
} from '../../types/registration';
import { adminService } from '../../services/adminService';

interface MultiTableConfigProps {
  templateId: string;
  tables: TemplateTable[];
  onTablesChange: () => void;
}

export const MultiTableConfig: React.FC<MultiTableConfigProps> = ({
  templateId,
  tables,
  onTablesChange,
}) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TemplateTable | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateTemplateTableDto>({
    tableName: '',
    alias: '',
    label: '',
    relationType: undefined,
    parentTableId: undefined,
    foreignKeyConfig: undefined,
  });

  const resetForm = () => {
    setFormData({
      tableName: '',
      alias: '',
      label: '',
      relationType: undefined,
      parentTableId: undefined,
      foreignKeyConfig: undefined,
    });
    setError(null);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setAddDialogOpen(true);
  };

  const handleOpenEditDialog = (table: TemplateTable) => {
    setEditingTable(table);
    setFormData({
      tableName: table.tableName,
      alias: table.alias,
      label: table.label,
      relationType: table.relationType,
      parentTableId: table.parentTableId,
      foreignKeyConfig: table.foreignKeyConfig,
    });
    setEditDialogOpen(true);
  };

  const handleAddTable = async () => {
    if (!formData.tableName || !formData.alias || !formData.label) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    // Validate child table configuration
    if (formData.relationType === 'child') {
      if (!formData.parentTableId) {
        setError('Selecione a tabela pai');
        return;
      }
      if (!formData.foreignKeyConfig?.fields || formData.foreignKeyConfig.fields.length === 0) {
        setError('Configure pelo menos um par de campos de chave estrangeira');
        return;
      }
      // Validate all FK fields are filled
      const hasEmptyFk = formData.foreignKeyConfig.fields.some(
        (fk) => !fk.parentField || !fk.childField
      );
      if (hasEmptyFk) {
        setError('Preencha todos os campos de chave estrangeira');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      await adminService.addTableToTemplate(templateId, formData);
      setAddDialogOpen(false);
      resetForm();
      onTablesChange();
    } catch (err: any) {
      console.error('Error adding table:', err);
      setError(err.response?.data?.message || 'Erro ao adicionar tabela');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTable = async () => {
    if (!editingTable) return;

    setLoading(true);
    setError(null);

    try {
      await adminService.updateTemplateTable(templateId, editingTable.id, {
        alias: formData.alias,
        label: formData.label,
        relationType: formData.relationType,
        parentTableId: formData.parentTableId,
        foreignKeyConfig: formData.foreignKeyConfig,
      });
      setEditDialogOpen(false);
      setEditingTable(null);
      resetForm();
      onTablesChange();
    } catch (err: any) {
      console.error('Error updating table:', err);
      setError(err.response?.data?.message || 'Erro ao atualizar tabela');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('Tem certeza que deseja remover esta tabela? Todos os campos serão removidos.')) {
      return;
    }

    setLoading(true);
    try {
      await adminService.removeTableFromTemplate(templateId, tableId);
      onTablesChange();
    } catch (err: any) {
      console.error('Error removing table:', err);
      alert(err.response?.data?.message || 'Erro ao remover tabela');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTable = async (tableId: string) => {
    setLoading(true);
    try {
      await adminService.syncTableWithSx3(templateId, tableId);
      onTablesChange();
    } catch (err: any) {
      console.error('Error syncing table:', err);
      alert(err.response?.data?.message || 'Erro ao sincronizar tabela');
    } finally {
      setLoading(false);
    }
  };

  const getRelationTypeLabel = (type?: TableRelationType) => {
    switch (type) {
      case 'parent':
        return 'Cabeçalho (Pai)';
      case 'child':
        return 'Itens (Filho)';
      case 'independent':
        return 'Independente';
      default:
        return 'Não definido';
    }
  };

  const getRelationTypeColor = (type?: TableRelationType) => {
    switch (type) {
      case 'parent':
        return 'primary';
      case 'child':
        return 'secondary';
      case 'independent':
        return 'default';
      default:
        return 'default';
    }
  };

  // Potential parent tables: tables that are 'parent', 'independent', or have no relationType yet
  // Exclude tables that are already 'child' and exclude the table being edited
  const potentialParentTables = tables.filter(
    (t) => t.relationType !== 'child' && t.id !== editingTable?.id
  );

  // Helper to add a new FK field pair
  const addFkField = () => {
    setFormData((prev) => ({
      ...prev,
      foreignKeyConfig: {
        fields: [...(prev.foreignKeyConfig?.fields || []), { parentField: '', childField: '' }],
      },
    }));
  };

  // Helper to update a FK field
  const updateFkField = (index: number, field: 'parentField' | 'childField', value: string) => {
    setFormData((prev) => {
      const fields = [...(prev.foreignKeyConfig?.fields || [])];
      fields[index] = { ...fields[index], [field]: value };
      return {
        ...prev,
        foreignKeyConfig: { fields },
      };
    });
  };

  // Helper to remove a FK field pair
  const removeFkField = (index: number) => {
    setFormData((prev) => {
      const fields = [...(prev.foreignKeyConfig?.fields || [])];
      fields.splice(index, 1);
      return {
        ...prev,
        foreignKeyConfig: { fields },
      };
    });
  };

  const renderTableDialog = (isEdit: boolean) => {
    const dialogOpen = isEdit ? editDialogOpen : addDialogOpen;
    const handleClose = () => {
      isEdit ? setEditDialogOpen(false) : setAddDialogOpen(false);
      resetForm();
      setEditingTable(null);
    };
    const handleSubmit = isEdit ? handleUpdateTable : handleAddTable;

    return (
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEdit ? 'Editar Tabela' : 'Adicionar Tabela ao Template'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <TextField
              label="Nome da Tabela (SX3)"
              value={formData.tableName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  tableName: e.target.value.toUpperCase(),
                }))
              }
              disabled={isEdit}
              required
              helperText="Ex: DA0, DA1, SA1"
            />

            <TextField
              label="Alias (Identificador)"
              value={formData.alias}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  alias: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                }))
              }
              required
              helperText="Ex: header, items, main (usado no formData)"
            />

            <TextField
              label="Label (Exibição)"
              value={formData.label}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  label: e.target.value,
                }))
              }
              required
              helperText="Ex: Cabeçalho da Tabela de Preços"
            />

            <FormControl fullWidth>
              <InputLabel>Tipo de Relação</InputLabel>
              <Select
                value={formData.relationType || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    relationType: (e.target.value || undefined) as TableRelationType | undefined,
                    parentTableId: undefined,
                    foreignKeyConfig: undefined,
                  }))
                }
                label="Tipo de Relação"
              >
                <MenuItem value="">
                  <em>Não definido</em>
                </MenuItem>
                <MenuItem value="parent">Pai (Cabeçalho)</MenuItem>
                <MenuItem value="child">Filho (Itens)</MenuItem>
                <MenuItem value="independent">Independente</MenuItem>
              </Select>
            </FormControl>

            {formData.relationType === 'child' && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Configuração de Relacionamento
                </Typography>

                <FormControl fullWidth required>
                  <InputLabel>Tabela Pai</InputLabel>
                  <Select
                    value={formData.parentTableId || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        parentTableId: e.target.value || undefined,
                      }))
                    }
                    label="Tabela Pai"
                  >
                    <MenuItem value="">
                      <em>Selecione...</em>
                    </MenuItem>
                    {potentialParentTables.map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.label} ({t.tableName})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {potentialParentTables.length === 0 && (
                  <Alert severity="warning">
                    Nenhuma tabela disponível como pai. Adicione primeiro uma tabela com tipo "Pai" ou "Independente".
                  </Alert>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Campos de Chave Estrangeira (FK)
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={addFkField}
                  >
                    Adicionar Campo
                  </Button>
                </Box>

                {(!formData.foreignKeyConfig?.fields || formData.foreignKeyConfig.fields.length === 0) && (
                  <Alert severity="info" sx={{ py: 0.5 }}>
                    Clique em "Adicionar Campo" para configurar a chave estrangeira.
                  </Alert>
                )}

                {formData.foreignKeyConfig?.fields?.map((fk, index) => (
                  <Paper key={index} variant="outlined" sx={{ p: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <TextField
                          label={`Campo Pai ${index + 1}`}
                          value={fk.parentField}
                          onChange={(e) => updateFkField(index, 'parentField', e.target.value.toUpperCase())}
                          required
                          size="small"
                          placeholder="Ex: DA0_CODTAB"
                        />
                        <TextField
                          label={`Campo Filho ${index + 1}`}
                          value={fk.childField}
                          onChange={(e) => updateFkField(index, 'childField', e.target.value.toUpperCase())}
                          required
                          size="small"
                          placeholder="Ex: DA1_CODTAB"
                        />
                      </Box>
                      <Tooltip title="Remover">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeFkField(index)}
                        >
                          <RemoveCircleOutlineIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Paper>
                ))}

                <Typography variant="caption" color="text.secondary">
                  Configure os pares de campos que relacionam a tabela filho com a tabela pai.
                  Para chaves compostas, adicione múltiplos pares de campos.
                </Typography>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Salvando...' : isEdit ? 'Salvar' : 'Adicionar e Sincronizar'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TableChartIcon />
          Tabelas do Template ({tables.length})
        </Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
          variant="outlined"
          size="small"
        >
          Adicionar Tabela
        </Button>
      </Box>

      {tables.length === 0 ? (
        <Alert severity="info">
          Nenhuma tabela configurada. Adicione tabelas para criar um template multi-tabela.
        </Alert>
      ) : (
        <List>
          {tables.map((table) => (
            <ListItem
              key={table.id}
              divider
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 1,
                mb: 1,
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">{table.label}</Typography>
                    <Chip label={table.tableName} size="small" variant="outlined" />
                    <Chip
                      label={getRelationTypeLabel(table.relationType)}
                      size="small"
                      color={getRelationTypeColor(table.relationType) as any}
                    />
                    {table.parentTable && (
                      <Tooltip title={`Vinculado a: ${table.parentTable.label}`}>
                        <LinkIcon fontSize="small" color="action" />
                      </Tooltip>
                    )}
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Alias: <strong>{table.alias}</strong> | {table.fields?.length || 0} campos
                    </Typography>
                    {table.foreignKeyConfig?.fields && table.foreignKeyConfig.fields.length > 0 && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        FK: {table.foreignKeyConfig.fields.map((fk) => `${fk.childField} → ${fk.parentField}`).join(', ')}
                      </Typography>
                    )}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Tooltip title="Sincronizar com SX3">
                  <IconButton
                    onClick={() => handleSyncTable(table.id)}
                    disabled={loading}
                    size="small"
                  >
                    <SyncIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Editar">
                  <IconButton
                    onClick={() => handleOpenEditDialog(table)}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Remover">
                  <IconButton
                    onClick={() => handleDeleteTable(table.id)}
                    disabled={loading}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      {/* Add Dialog */}
      {renderTableDialog(false)}

      {/* Edit Dialog */}
      {renderTableDialog(true)}
    </Box>
  );
};
