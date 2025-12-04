import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  AlertTitle,
  CircularProgress,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Storage,
  Search,
  Refresh,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { backendApi } from '../../services/api';

interface AllowedTable {
  id: string;
  tableName: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TableFormData {
  tableName: string;
  description: string;
  isActive: boolean;
}

const AllowedTablesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [tables, setTables] = useState<AllowedTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedTable, setSelectedTable] = useState<AllowedTable | null>(null);
  const [formData, setFormData] = useState<TableFormData>({
    tableName: '',
    description: '',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<AllowedTable | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch tables
  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await backendApi.get('/form-templates/allowed-tables');
      setTables(response.data);
    } catch (err: any) {
      console.error('Error fetching allowed tables:', err);
      setError(err.response?.data?.message || 'Erro ao carregar tabelas permitidas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // Filter tables by search term
  const filteredTables = tables.filter(table =>
    table.tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (table.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  // Open create dialog
  const handleCreate = () => {
    setDialogMode('create');
    setSelectedTable(null);
    setFormData({
      tableName: '',
      description: '',
      isActive: true,
    });
    setDialogOpen(true);
  };

  // Open edit dialog
  const handleEdit = (table: AllowedTable) => {
    setDialogMode('edit');
    setSelectedTable(table);
    setFormData({
      tableName: table.tableName,
      description: table.description || '',
      isActive: table.isActive,
    });
    setDialogOpen(true);
  };

  // Save (create or update)
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (dialogMode === 'create') {
        await backendApi.post('/form-templates/allowed-tables', formData);
      } else if (selectedTable) {
        await backendApi.put(`/form-templates/allowed-tables/${selectedTable.id}`, formData);
      }

      setDialogOpen(false);
      fetchTables();
    } catch (err: any) {
      console.error('Error saving allowed table:', err);
      setError(err.response?.data?.message || 'Erro ao salvar tabela');
    } finally {
      setSaving(false);
    }
  };

  // Toggle active status
  const handleToggleActive = async (table: AllowedTable) => {
    try {
      await backendApi.patch(`/form-templates/allowed-tables/${table.id}/toggle`);
      fetchTables();
    } catch (err: any) {
      console.error('Error toggling table status:', err);
      setError(err.response?.data?.message || 'Erro ao alterar status da tabela');
    }
  };

  // Delete confirmation
  const handleDeleteClick = (table: AllowedTable) => {
    setTableToDelete(table);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!tableToDelete) return;

    try {
      setDeleting(true);
      await backendApi.delete(`/form-templates/allowed-tables/${tableToDelete.id}`);
      setDeleteDialogOpen(false);
      setTableToDelete(null);
      fetchTables();
    } catch (err: any) {
      console.error('Error deleting allowed table:', err);
      setError(err.response?.data?.message || 'Erro ao excluir tabela');
    } finally {
      setDeleting(false);
    }
  };

  // Check if user is admin
  if (!user?.isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          <AlertTitle>Acesso Negado</AlertTitle>
          Você não tem permissão para acessar esta página. Apenas administradores podem gerenciar
          tabelas permitidas.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Storage fontSize="large" color="primary" />
          <Typography variant="h4" component="h1" fontWeight={600}>
            Tabelas Permitidas
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Gerencie as tabelas do Protheus permitidas para consultas de lookup
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Actions Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Buscar tabela..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchTables}
              disabled={loading}
            >
              Atualizar
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreate}
            >
              Nova Tabela
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredTables.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {searchTerm ? 'Nenhuma tabela encontrada para a busca' : 'Nenhuma tabela cadastrada'}
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Nome da Tabela</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Descrição</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTables.map((table) => (
                <TableRow key={table.id} hover>
                  <TableCell>
                    <Typography fontWeight={500} fontFamily="monospace">
                      {table.tableName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography color="text.secondary">
                      {table.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={table.isActive ? 'Ativa' : 'Inativa'}
                      color={table.isActive ? 'success' : 'default'}
                      size="small"
                      onClick={() => handleToggleActive(table)}
                      sx={{ cursor: 'pointer' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => handleEdit(table)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton size="small" color="error" onClick={() => handleDeleteClick(table)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Total count */}
      {!loading && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Typography variant="body2" color="text.secondary">
            {filteredTables.length} de {tables.length} tabelas
          </Typography>
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Nova Tabela Permitida' : 'Editar Tabela Permitida'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Nome da Tabela"
              value={formData.tableName}
              onChange={(e) => setFormData({ ...formData, tableName: e.target.value.toUpperCase() })}
              placeholder="Ex: SA1010, SB1010"
              fullWidth
              required
              disabled={dialogMode === 'edit'}
              helperText={dialogMode === 'edit' ? 'O nome da tabela não pode ser alterado' : 'Use o nome completo da tabela (ex: SA1010)'}
            />
            <TextField
              label="Descrição"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Cadastro de Clientes"
              fullWidth
              multiline
              rows={2}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Tabela ativa (disponível para consultas)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || !formData.tableName.trim()}
          >
            {saving ? <CircularProgress size={20} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir a tabela <strong>{tableToDelete?.tableName}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta ação não pode ser desfeita. Lookups que usam esta tabela podem parar de funcionar.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AllowedTablesPage;
