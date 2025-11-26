import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import {
  Add,
  Assignment,
  Visibility,
  Refresh,
  CheckCircle,
  Error as ErrorIcon,
  Schedule,
  Sync,
  SyncProblem,
} from '@mui/icons-material';
import { registrationService } from '../../services/registrationService';
import { toast } from '../../utils/toast';
import { useLanguage } from '../../contexts/LanguageContext';
import type { RegistrationRequest, RegistrationApproval } from '../../types/registration';
import { RegistrationStatus, ApprovalAction } from '../../types/registration';
import { EmptyState } from '../../components/EmptyState';

type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

export const MyRequestsPage = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [retrySyncDialogOpen, setRetrySyncDialogOpen] = useState(false);
  const [requestIdToRetry, setRequestIdToRetry] = useState<string | null>(null);
  const [retryLoading, setRetryLoading] = useState(false);

  const statusConfig: Record<RegistrationStatus, { label: string; color: ChipColor; icon: React.ReactNode }> = {
    DRAFT: { label: t.registration.statusDraft, color: 'default', icon: <Schedule fontSize="small" /> },
    PENDING_APPROVAL: { label: t.registration.statusPendingApproval, color: 'warning', icon: <Schedule fontSize="small" /> },
    IN_APPROVAL: { label: t.registration.statusInApproval, color: 'info', icon: <Schedule fontSize="small" /> },
    APPROVED: { label: t.registration.statusApproved, color: 'success', icon: <CheckCircle fontSize="small" /> },
    REJECTED: { label: t.registration.statusRejected, color: 'error', icon: <ErrorIcon fontSize="small" /> },
    SYNCING_TO_PROTHEUS: { label: t.registration.statusSyncing, color: 'info', icon: <Sync fontSize="small" /> },
    SYNCED: { label: t.registration.statusSynced, color: 'success', icon: <CheckCircle fontSize="small" /> },
    SYNC_FAILED: { label: t.registration.statusSyncFailed, color: 'error', icon: <SyncProblem fontSize="small" /> },
  };

  const approvalActionLabels: Record<string, string> = {
    PENDING: t.registration.actionPending,
    APPROVED: t.registration.actionApproved,
    REJECTED: t.registration.actionRejected,
  };

  useEffect(() => {
    loadMyRequests();
  }, []);

  const loadMyRequests = async () => {
    try {
      setLoading(true);
      const data = await registrationService.getMyRequests();
      setRequests(data);
    } catch (error: any) {
      console.error('Error loading requests:', error);

      if (error.response?.status === 401) {
        toast.error(t.registration.errorSessionExpired);
      } else if (error.response?.status === 403) {
        toast.error(t.registration.errorNoPermission);
      } else {
        toast.error(t.registration.errorLoadRequests);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetrySyncClick = (requestId: string) => {
    setRequestIdToRetry(requestId);
    setRetrySyncDialogOpen(true);
  };

  const handleRetrySync = async () => {
    if (!requestIdToRetry) return;

    try {
      setRetryLoading(true);
      await registrationService.retrySync(requestIdToRetry);
      toast.success(t.registration.successSyncStarted);
      setRetrySyncDialogOpen(false);
      await loadMyRequests();
    } catch (error) {
      console.error('Error retrying sync:', error);
      toast.error(t.registration.errorRetrySync);
    } finally {
      setRetryLoading(false);
      setRequestIdToRetry(null);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-BR');
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Assignment fontSize="large" color="primary" />
            <Typography variant="h4" component="h1" fontWeight={600}>
              {t.registration.myRequestsTitle}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/registration/new')}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {t.registration.newRequest}
          </Button>
        </Box>
        <Typography variant="body1" color="text.secondary">
          {t.registration.myRequestsSubtitle}
        </Typography>
      </Box>

      {/* Content */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        {requests.length === 0 ? (
          <EmptyState
            type="no-results"
            title={t.registration.noRequestsTitle}
            description={t.registration.noRequestsDesc}
            action={{
              label: t.registration.newRequest,
              onClick: () => navigate('/registration/new'),
            }}
          />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>{t.registration.tableType}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t.registration.tableDate}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t.registration.tableStatus}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t.registration.tableProtheus}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">{t.registration.tableActions}</TableCell>
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
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {request.template?.label || request.tableName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t.registration.level} {request.currentLevel}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(request.requestedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>{getStatusChip(request.status)}</TableCell>
                    <TableCell>
                      {request.protheusRecno ? (
                        <Chip
                          label={`RECNO: ${request.protheusRecno}`}
                          color="success"
                          size="small"
                          variant="outlined"
                          sx={{ borderRadius: 2 }}
                        />
                      ) : request.status === RegistrationStatus.SYNC_FAILED ? (
                        <Tooltip title={t.registration.retrySync}>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<Refresh />}
                            onClick={() => handleRetrySyncClick(request.id)}
                            sx={{ textTransform: 'none' }}
                          >
                            {t.registration.retry}
                          </Button>
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="text.disabled">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={t.common.viewDetails}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Details Dialog */}
      <Dialog
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        {selectedRequest && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Assignment color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  {t.registration.requestDetails}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {/* Request Info */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t.registration.generalInfo}
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">{t.registration.tableType}:</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {selectedRequest.template?.label || selectedRequest.tableName}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">{t.registration.tableDate}:</Typography>
                      <Typography variant="body2">
                        {formatDateTime(selectedRequest.requestedAt)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">{t.registration.tableStatus}:</Typography>
                      {getStatusChip(selectedRequest.status)}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">{t.registration.currentLevel}:</Typography>
                      <Typography variant="body2">{selectedRequest.currentLevel}</Typography>
                    </Box>
                    {selectedRequest.protheusRecno && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">RECNO Protheus:</Typography>
                        <Typography variant="body2" color="success.main" fontWeight={500}>
                          {selectedRequest.protheusRecno}
                        </Typography>
                      </Box>
                    )}
                    {selectedRequest.syncError && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">{t.errors.unknownError}:</Typography>
                        <Typography variant="body2" color="error.main">
                          {selectedRequest.syncError}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Paper>
              </Box>

              {/* Approval History */}
              {selectedRequest.approvals && selectedRequest.approvals.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t.registration.approvalHistory}
                  </Typography>
                  <Stack spacing={1}>
                    {selectedRequest.approvals.map((approval: RegistrationApproval) => (
                      <Paper key={approval.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" fontWeight={500}>
                            {t.registration.level} {approval.level}: {approval.approver?.name || approval.approverEmail}
                          </Typography>
                          <Chip
                            label={approvalActionLabels[approval.action] || approval.action}
                            size="small"
                            color={
                              approval.action === ApprovalAction.APPROVED
                                ? 'success'
                                : approval.action === ApprovalAction.REJECTED
                                ? 'error'
                                : 'default'
                            }
                            variant="outlined"
                            sx={{ borderRadius: 1 }}
                          />
                        </Box>
                        {approval.comments && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {approval.comments}
                          </Typography>
                        )}
                        {approval.actionAt && (
                          <Typography variant="caption" color="text.disabled">
                            {formatDateTime(approval.actionAt)}
                          </Typography>
                        )}
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Form Data */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t.registration.formData}
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack spacing={1}>
                    {Object.entries(selectedRequest.formData).map(([key, value]) => (
                      <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">{key}:</Typography>
                        <Typography variant="body2">{String(value)}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button
                onClick={() => setSelectedRequest(null)}
                variant="outlined"
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                {t.common.close}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Retry Sync Confirmation Dialog */}
      <Dialog
        open={retrySyncDialogOpen}
        onClose={() => {
          setRetrySyncDialogOpen(false);
          setRequestIdToRetry(null);
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Refresh color="primary" />
            <Typography variant="h6">{t.registration.retrySync}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t.registration.retrySyncQuestion}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => {
              setRetrySyncDialogOpen(false);
              setRequestIdToRetry(null);
            }}
            disabled={retryLoading}
            sx={{ textTransform: 'none' }}
          >
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleRetrySync}
            variant="contained"
            disabled={retryLoading}
            startIcon={retryLoading ? <CircularProgress size={16} /> : <Refresh />}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {retryLoading ? t.registration.retrying : t.registration.retry}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
