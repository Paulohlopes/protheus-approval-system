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
  ListItemSecondaryAction,
  Avatar,
  Autocomplete,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Group,
  PersonAdd,
  PersonRemove,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import {
  approvalGroupService,
  type ApprovalGroup,
  type ApprovalGroupMember,
} from '../../services/approvalGroupService';
import { adminService } from '../../services/adminService';
import { useLanguage } from '../../contexts/LanguageContext';

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  department?: string;
}

const ApprovalGroupManager: React.FC = () => {
  const { t } = useLanguage();
  const [groups, setGroups] = useState<ApprovalGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ApprovalGroup | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  // Member management
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [addingMember, setAddingMember] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadGroups();
    loadUsers();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await approvalGroupService.getGroups(true);
      setGroups(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar grupos');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true,
    });
  };

  const handleCreateGroup = async () => {
    try {
      setError(null);
      await approvalGroupService.createGroup(formData);
      setCreateDialogOpen(false);
      resetForm();
      setSuccess('Grupo criado com sucesso');
      await loadGroups();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao criar grupo');
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup) return;

    try {
      setError(null);
      await approvalGroupService.updateGroup(selectedGroup.id, formData);
      setEditDialogOpen(false);
      setSelectedGroup(null);
      resetForm();
      setSuccess('Grupo atualizado com sucesso');
      await loadGroups();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao atualizar grupo');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja desativar este grupo?')) {
      return;
    }

    try {
      setError(null);
      await approvalGroupService.deleteGroup(id);
      setSuccess('Grupo desativado com sucesso');
      await loadGroups();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao desativar grupo');
    }
  };

  const handleAddMember = async () => {
    if (!selectedGroup || !selectedUser) return;

    try {
      setAddingMember(true);
      setError(null);
      await approvalGroupService.addMember(selectedGroup.id, selectedUser.id);
      setSelectedUser(null);
      setSuccess('Membro adicionado com sucesso');
      // Reload the group to update members
      const updatedGroup = await approvalGroupService.getGroup(selectedGroup.id);
      setSelectedGroup(updatedGroup);
      await loadGroups();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao adicionar membro');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedGroup) return;

    if (!window.confirm('Tem certeza que deseja remover este membro?')) {
      return;
    }

    try {
      setError(null);
      await approvalGroupService.removeMember(selectedGroup.id, userId);
      setSuccess('Membro removido com sucesso');
      // Reload the group to update members
      const updatedGroup = await approvalGroupService.getGroup(selectedGroup.id);
      setSelectedGroup(updatedGroup);
      await loadGroups();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao remover membro');
    }
  };

  const openEditDialog = (group: ApprovalGroup) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      isActive: group.isActive,
    });
    setEditDialogOpen(true);
  };

  const openMembersDialog = async (group: ApprovalGroup) => {
    try {
      const fullGroup = await approvalGroupService.getGroup(group.id);
      setSelectedGroup(fullGroup);
      setMembersDialogOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao carregar membros');
    }
  };

  const toggleExpand = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Get users not already in the selected group
  const availableUsers = selectedGroup?.members
    ? users.filter((u) => !selectedGroup.members?.some((m) => m.userId === u.id))
    : users;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Grupos de Aprovacao
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Novo Grupo
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Groups Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={40} />
              <TableCell>Nome</TableCell>
              <TableCell>Descricao</TableCell>
              <TableCell align="center">Membros</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Acoes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    Nenhum grupo cadastrado
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <React.Fragment key={group.id}>
                  <TableRow hover>
                    <TableCell>
                      <IconButton size="small" onClick={() => toggleExpand(group.id)}>
                        {expandedGroups.has(group.id) ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Group color="primary" />
                        <Typography fontWeight={500}>{group.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {group.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={group._count?.members || 0}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={group.isActive ? 'Ativo' : 'Inativo'}
                        color={group.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Gerenciar Membros">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => openMembersDialog(group)}
                        >
                          <PersonAdd />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => openEditDialog(group)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Desativar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteGroup(group.id)}
                          disabled={!group.isActive}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 0, borderBottom: 'none' }}>
                      <Collapse in={expandedGroups.has(group.id)} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2, pl: 6 }}>
                          {group.members && group.members.length > 0 ? (
                            <List dense>
                              {group.members.map((member) => (
                                <ListItem key={member.id}>
                                  <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                                    {member.user?.name?.charAt(0) || '?'}
                                  </Avatar>
                                  <ListItemText
                                    primary={member.user?.name}
                                    secondary={member.user?.email}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Nenhum membro neste grupo
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

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Criar Novo Grupo</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Nome do Grupo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Descricao"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              label="Ativo"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCreateGroup}
            disabled={!formData.name.trim()}
          >
            Criar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Grupo</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Nome do Grupo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Descricao"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              label="Ativo"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleUpdateGroup}
            disabled={!formData.name.trim()}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Members Dialog */}
      <Dialog
        open={membersDialogOpen}
        onClose={() => setMembersDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Membros: {selectedGroup?.name}
        </DialogTitle>
        <DialogContent>
          {/* Add Member */}
          <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
            <Autocomplete
              value={selectedUser}
              onChange={(_, value) => setSelectedUser(value)}
              options={availableUsers}
              getOptionLabel={(option) => `${option.name} (${option.email})`}
              renderInput={(params) => (
                <TextField {...params} label="Adicionar Usuario" size="small" />
              )}
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              onClick={handleAddMember}
              disabled={!selectedUser || addingMember}
              startIcon={addingMember ? <CircularProgress size={20} /> : <PersonAdd />}
            >
              Adicionar
            </Button>
          </Box>

          {/* Members List */}
          <Typography variant="subtitle2" gutterBottom>
            Membros Atuais ({selectedGroup?.members?.length || 0})
          </Typography>
          <List>
            {selectedGroup?.members?.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="Nenhum membro"
                  secondary="Adicione usuarios ao grupo"
                />
              </ListItem>
            ) : (
              selectedGroup?.members?.map((member) => (
                <ListItem key={member.id} divider>
                  <Avatar sx={{ mr: 2 }}>
                    {member.user?.name?.charAt(0) || '?'}
                  </Avatar>
                  <ListItemText
                    primary={member.user?.name}
                    secondary={
                      <>
                        {member.user?.email}
                        {member.user?.department && ` | ${member.user.department}`}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Remover">
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={() => handleRemoveMember(member.userId)}
                      >
                        <PersonRemove />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMembersDialogOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApprovalGroupManager;
