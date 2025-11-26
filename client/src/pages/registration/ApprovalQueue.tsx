import { useState, useEffect } from 'react';
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
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  CircularProgress,
  Tooltip,
  TextField,
  Avatar,
} from '@mui/material';
import {
  HowToReg,
  RateReview,
  CheckCircle,
  Cancel,
  Close,
  Error as ErrorIcon,
  Schedule,
  Sync,
  SyncProblem,
  Person,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { registrationService } from '../../services/registrationService';
import { toast } from '../../utils/toast';
import type { RegistrationRequest } from '../../types/registration';
import { RegistrationStatus } from '../../types/registration';
import { EmptyState } from '../../components/EmptyState';

type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
type ActionDialogType = 'approve' | 'reject' | null;

const statusConfig: Record<RegistrationStatus, { label: string; color: ChipColor; icon: React.ReactNode }> = {
  DRAFT: { label: 'Rascunho', color: 'default', icon: <Schedule fontSize="small" /> },
  PENDING_APPROVAL: { label: 'Aguardando Aprovação', color: 'warning', icon: <Schedule fontSize="small" /> },
  IN_APPROVAL: { label: 'Em Aprovação', color: 'info', icon: <Schedule fontSize="small" /> },
  APPROVED: { label: 'Aprovado', color: 'success', icon: <CheckCircle fontSize="small" /> },
  REJECTED: { label: 'Rejeitado', color: 'error', icon: <ErrorIcon fontSize="small" /> },
  SYNCING_TO_PROTHEUS: { label: 'Sincronizando', color: 'info', icon: <Sync fontSize="small" /> },
  SYNCED: { label: 'Sincronizado', color: 'success', icon: <CheckCircle fontSize="small" /> },
  SYNC_FAILED: { label: 'Falha na Sincronização', color: 'error', icon: <SyncProblem fontSize="small" /> },
};

export const ApprovalQueuePage = () => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionDialog, setActionDialog] = useState<ActionDialogType>(null);
  const [actionInput, setActionInput] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        console.error('User not authenticated');
        setRequests([]);
        return;
      }
      const data = await registrationService.getPendingApprovals(user.id);
      setRequests(data);
    } catch (error) {
      console.error('Error loading pending approvals:', error);
      toast.error('Erro ao carregar aprovações pendentes. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenActionDialog = (type: ActionDialogType) => {
    setActionDialog(type);
    setActionInput('');
    setActionError('');
  };

  const handleCloseActionDialog = () => {
    setActionDialog(null);
    setActionInput('');
    setActionError('');
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);
      await registrationService.approveRegistration(selectedRequest.id, actionInput || undefined);
      toast.success('Solicitação aprovada com sucesso!');
      handleCloseActionDialog();
      setSelectedRequest(null);
      await loadPendingApprovals();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Erro ao aprovar solicitação. Por favor, tente novamente.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    if (!actionInput.trim()) {
      setActionError('O motivo da rejeição é obrigatório');
      return;
    }

    try {
      setActionLoading(true);
      await registrationService.rejectRegistration(selectedRequest.id, actionInput);
      toast.success('Solicitação rejeitada');
      handleCloseActionDialog();
      setSelectedRequest(null);
      await loadPendingApprovals();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Erro ao rejeitar solicitação. Por favor, tente novamente.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusChip = (status: RegistrationStatus) => {
    const config = statusConfig[status];
    return (
      <Chip
        icon={config.icon as React.ReactElement}
        label={config.label}
        color={config.color}
        size="small"
        variant="outlined"
        sx={{ borderRadius: 2, fontWeight: 500 }}
      />
    );
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <HowToReg fontSize="large" color="primary" />
          <Typography variant="h4" component="h1" fontWeight={600}>
            Fila de Aprovação
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Revise e aprove ou rejeite as solicitações de cadastro pendentes
        </Typography>
      </Box>

      {/* Content */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        {requests.length === 0 ? (
          <EmptyState
            type="no-documents"
            title="Nenhuma solicitação pendente"
            description="Parabéns! Você não tem solicitações aguardando aprovação no momento."
          />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Solicitante</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Data</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Nível</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((request) => (
                  <TableRow
                    key={request.id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {request.template?.label || request.tableName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main' }}>
                          <Person sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography variant="body2">
                          {request.requestedBy?.name || request.requestedByEmail}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(request.requestedAt).toLocaleDateString('pt-BR')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`Nível ${request.currentLevel}`}
                        size="small"
                        variant="outlined"
                        sx={{ borderRadius: 1 }}
                      />
                    </TableCell>
                    <TableCell>{getStatusChip(request.status)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Revisar solicitação">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<RateReview />}
                          onClick={() => setSelectedRequest(request)}
                          sx={{ borderRadius: 2, textTransform: 'none' }}
                        >
                          Revisar
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Review Dialog */}
      <Dialog
        open={!!selectedRequest && !actionDialog}
        onClose={() => setSelectedRequest(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        {selectedRequest && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <RateReview color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Revisar Solicitação
                  </Typography>
                </Box>
                <IconButton onClick={() => setSelectedRequest(null)} size="small">
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {/* Request Info */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Informações Gerais
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Tipo:</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {selectedRequest.template?.label || selectedRequest.tableName}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Solicitante:</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                          <Person sx={{ fontSize: 14 }} />
                        </Avatar>
                        <Typography variant="body2">
                          {selectedRequest.requestedBy?.name || selectedRequest.requestedByEmail}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Data:</Typography>
                      <Typography variant="body2">
                        {new Date(selectedRequest.requestedAt).toLocaleString('pt-BR')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Nível Atual:</Typography>
                      <Chip
                        label={`Nível ${selectedRequest.currentLevel}`}
                        size="small"
                        variant="outlined"
                        sx={{ borderRadius: 1 }}
                      />
                    </Box>
                  </Stack>
                </Paper>
              </Box>

              {/* Form Data */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Dados do Formulário
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack spacing={1}>
                    {Object.entries(selectedRequest.formData).map(([key, value]) => (
                      <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">{key}:</Typography>
                        <Typography variant="body2" fontWeight={500}>{String(value)}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
              <Button
                onClick={() => setSelectedRequest(null)}
                variant="outlined"
                disabled={actionLoading}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Fechar
              </Button>
              <Button
                onClick={() => handleOpenActionDialog('reject')}
                variant="contained"
                color="error"
                startIcon={<Cancel />}
                disabled={actionLoading}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Rejeitar
              </Button>
              <Button
                onClick={() => handleOpenActionDialog('approve')}
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                disabled={actionLoading}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Aprovar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Approve Dialog */}
      <Dialog
        open={actionDialog === 'approve'}
        onClose={handleCloseActionDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="success" />
            <Typography variant="h6">Aprovar Solicitação</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Adicione comentários opcionais sobre a aprovação.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Comentários (opcional)..."
            value={actionInput}
            onChange={(e) => setActionInput(e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleCloseActionDialog}
            disabled={actionLoading}
            sx={{ textTransform: 'none' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            color="success"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {actionLoading ? 'Aprovando...' : 'Aprovar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={actionDialog === 'reject'}
        onClose={handleCloseActionDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Cancel color="error" />
            <Typography variant="h6">Rejeitar Solicitação</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Por favor, informe o motivo da rejeição.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Motivo da rejeição..."
            value={actionInput}
            onChange={(e) => {
              setActionInput(e.target.value);
              if (actionError) setActionError('');
            }}
            error={!!actionError}
            helperText={actionError}
            required
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleCloseActionDialog}
            disabled={actionLoading}
            sx={{ textTransform: 'none' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <Cancel />}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {actionLoading ? 'Rejeitando...' : 'Rejeitar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
