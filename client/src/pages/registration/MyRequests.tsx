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
  Tabs,
  Tab,
  Divider,
  Alert,
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
  AccountTree,
  Group,
  Person,
  Edit,
  ArrowDownward,
  Cancel,
  History,
  Close,
  Delete,
  Send,
} from '@mui/icons-material';
import { registrationService } from '../../services/registrationService';
import { toast } from '../../utils/toast';
import { useLanguage } from '../../contexts/LanguageContext';
import type { RegistrationRequest, RegistrationApproval, WorkflowLevel } from '../../types/registration';
import { RegistrationStatus, ApprovalAction } from '../../types/registration';
import { EmptyState } from '../../components/EmptyState';
import FieldChangeHistory from '../../components/FieldChangeHistory';

type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

// Helper function to parse formData if it's a string or nested object
const parseFormData = (formData: any): Record<string, any> => {
  if (!formData) return {};

  let parsed = formData;

  // If it's a string, parse it first
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return {};
    }
  }

  // Check if formData is nested inside another object with 'formData' key
  // This can happen with alteration registrations
  if (parsed && typeof parsed === 'object' && 'formData' in parsed && Object.keys(parsed).length === 1) {
    const nested = parsed.formData;
    if (typeof nested === 'string') {
      try {
        return JSON.parse(nested);
      } catch {
        return {};
      }
    }
    return nested || {};
  }

  return parsed;
};

// Helper function to format field values for display
const formatFieldValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }

  // Handle arrays (multiselect fields)
  if (Array.isArray(value)) {
    return value.map(item => {
      if (typeof item === 'object' && item !== null) {
        return item.label || item.value || JSON.stringify(item);
      }
      return String(item);
    }).join(', ');
  }

  // Handle objects (autocomplete fields with {value, label})
  if (typeof value === 'object') {
    // Check for common patterns
    if (value.label) return String(value.label);
    if (value.value) return String(value.value);
    if (value.name) return String(value.name);
    // Fallback to JSON for complex objects
    return JSON.stringify(value);
  }

  // Handle primitive values
  return String(value);
};

export const MyRequestsPage = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [retrySyncDialogOpen, setRetrySyncDialogOpen] = useState(false);
  const [requestIdToRetry, setRequestIdToRetry] = useState<string | null>(null);
  const [retryLoading, setRetryLoading] = useState(false);
  const [detailsTab, setDetailsTab] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestIdToDelete, setRequestIdToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [requestIdToSubmit, setRequestIdToSubmit] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

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

  const handleDeleteClick = (requestId: string) => {
    setRequestIdToDelete(requestId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!requestIdToDelete) return;

    try {
      setDeleteLoading(true);
      await registrationService.deleteRegistration(requestIdToDelete);
      toast.success(t.registration.successDeleted);
      setDeleteDialogOpen(false);
      await loadMyRequests();
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast.error(t.registration.errorDelete);
    } finally {
      setDeleteLoading(false);
      setRequestIdToDelete(null);
    }
  };

  const handleSubmitClick = (requestId: string) => {
    setRequestIdToSubmit(requestId);
    setSubmitDialogOpen(true);
  };

  const handleSubmitDraft = async () => {
    if (!requestIdToSubmit) return;

    try {
      setSubmitLoading(true);
      await registrationService.submitRegistration(requestIdToSubmit);
      toast.success(t.registration.successSubmitted);
      setSubmitDialogOpen(false);
      await loadMyRequests();
    } catch (error) {
      console.error('Error submitting draft:', error);
      toast.error(t.registration.errorSubmit);
    } finally {
      setSubmitLoading(false);
      setRequestIdToSubmit(null);
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
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title={t.common.viewDetails}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {request.status === RegistrationStatus.DRAFT && (
                          <>
                            <Tooltip title={t.registration.editDraft}>
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => navigate(`/registration/edit/${request.id}`)}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t.registration.submitDraft}>
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleSubmitClick(request.id)}
                              >
                                <Send />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t.registration.deleteDraft}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteClick(request.id)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Stack>
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
        onClose={() => {
          setSelectedRequest(null);
          setDetailsTab(0);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        {selectedRequest && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Assignment color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    {t.registration.requestDetails}
                  </Typography>
                </Box>
                <IconButton onClick={() => {
                  setSelectedRequest(null);
                  setDetailsTab(0);
                }} size="small">
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
              {/* Tabs */}
              <Tabs
                value={detailsTab}
                onChange={(_, v) => setDetailsTab(v)}
                sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab
                  icon={<Edit sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  label={t.registration.formData}
                  sx={{ textTransform: 'none' }}
                />
                <Tab
                  icon={<AccountTree sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  label={t.registration.workflowTab || 'Fluxo'}
                  sx={{ textTransform: 'none' }}
                />
                <Tab
                  icon={<History sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  label={t.registration.changeHistory || 'Historico'}
                  sx={{ textTransform: 'none' }}
                />
              </Tabs>

              {/* Tab Panel: Form Data */}
              {detailsTab === 0 && (
                <Box sx={{ p: 3 }}>
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

                  {/* Form Data */}
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t.registration.formData}
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Stack spacing={1}>
                        {(() => {
                          // Parse formData if it's a string
                          const parsedFormData = parseFormData(selectedRequest.formData);

                          // Create a map of fieldName -> label from template fields
                          const fieldLabels: Record<string, string> = {};
                          selectedRequest.template?.fields?.forEach((field: any) => {
                            const key = field.fieldName || field.sx3FieldName;
                            if (key) {
                              fieldLabels[key] = field.label || key;
                            }
                          });

                          return Object.entries(parsedFormData).map(([key, value]) => (
                            <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">{fieldLabels[key] || key}:</Typography>
                              <Typography variant="body2">{formatFieldValue(value)}</Typography>
                            </Box>
                          ));
                        })()}
                      </Stack>
                    </Paper>
                  </Box>
                </Box>
              )}

              {/* Tab Panel: Workflow */}
              {detailsTab === 1 && (
                <Box sx={{ p: 3 }}>
                  {(() => {
                    const workflow = selectedRequest.workflowSnapshot;
                    const approvals = selectedRequest.approvals || [];
                    const levels: WorkflowLevel[] = workflow?.levels || [];

                    const getApprovalsForLevel = (levelOrder: number): RegistrationApproval[] => {
                      return approvals.filter(a => a.level === levelOrder);
                    };

                    const getLevelStatus = (levelOrder: number): 'pending' | 'current' | 'completed' | 'rejected' => {
                      const levelApprovals = getApprovalsForLevel(levelOrder);
                      if (levelApprovals.length === 0) return 'pending';

                      const hasRejected = levelApprovals.some(a => a.action === ApprovalAction.REJECTED);
                      if (hasRejected) return 'rejected';

                      const allApproved = levelApprovals.every(a => a.action === ApprovalAction.APPROVED);
                      if (allApproved) return 'completed';

                      const hasPending = levelApprovals.some(a => a.action === ApprovalAction.PENDING);
                      if (hasPending && levelOrder === selectedRequest.currentLevel) return 'current';

                      return 'pending';
                    };

                    const getStatusColor = (status: string): ChipColor => {
                      switch (status) {
                        case 'completed': return 'success';
                        case 'current': return 'warning';
                        case 'rejected': return 'error';
                        default: return 'default';
                      }
                    };

                    const getStatusLabel = (status: string): string => {
                      switch (status) {
                        case 'completed': return t.registration.statusApproved || 'Aprovado';
                        case 'current': return t.registration.statusPendingApproval || 'Aguardando';
                        case 'rejected': return t.registration.statusRejected || 'Rejeitado';
                        default: return t.registration.statusPending || 'Pendente';
                      }
                    };

                    if (!workflow || levels.length === 0) {
                      return (
                        <Alert severity="info">
                          {t.registration.noWorkflowInfo || 'Informacoes do fluxo nao disponiveis'}
                        </Alert>
                      );
                    }

                    return (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          {t.registration.workflowTitle || 'Fluxo de Aprovacao'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          {workflow.name} {workflow.description && `- ${workflow.description}`}
                        </Typography>

                        <Stack spacing={0}>
                          {levels
                            .sort((a, b) => a.levelOrder - b.levelOrder)
                            .map((level, index) => {
                              const status = getLevelStatus(level.levelOrder);
                              const levelApprovals = getApprovalsForLevel(level.levelOrder);
                              const isLast = index === levels.length - 1;

                              return (
                                <Box key={level.id || index}>
                                  <Paper
                                    variant="outlined"
                                    sx={{
                                      p: 2,
                                      borderColor: status === 'current' ? 'warning.main' : status === 'completed' ? 'success.main' : status === 'rejected' ? 'error.main' : 'divider',
                                      borderWidth: status === 'current' ? 2 : 1,
                                      bgcolor: status === 'current' ? 'warning.lighter' : status === 'completed' ? 'success.lighter' : status === 'rejected' ? 'error.lighter' : 'background.paper',
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip
                                          label={level.levelOrder}
                                          size="small"
                                          color={getStatusColor(status)}
                                          sx={{ minWidth: 28, fontWeight: 600 }}
                                        />
                                        <Typography variant="subtitle2" fontWeight={600}>
                                          {level.levelName || `${t.registration.level || 'Nivel'} ${level.levelOrder}`}
                                        </Typography>
                                      </Box>
                                      <Chip
                                        label={getStatusLabel(status)}
                                        size="small"
                                        color={getStatusColor(status)}
                                        variant="outlined"
                                      />
                                    </Box>

                                    {/* Approvers info */}
                                    <Box sx={{ ml: 4.5 }}>
                                      {/* Individual Approvers */}
                                      {level.approvers && level.approvers.length > 0 && (
                                        <Box sx={{ mb: 1 }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                            <Person fontSize="small" color="action" />
                                            <Typography variant="caption" fontWeight={600} color="text.secondary">
                                              Aprovadores individuais:
                                            </Typography>
                                          </Box>
                                          <Box sx={{ ml: 3 }}>
                                            {level.approvers.map((approver) => (
                                              <Typography key={approver.id} variant="caption" display="block" color="text.secondary">
                                                • {approver.name} ({approver.email})
                                              </Typography>
                                            ))}
                                          </Box>
                                        </Box>
                                      )}

                                      {/* Approval Groups */}
                                      {level.approverGroups && level.approverGroups.length > 0 && (
                                        <Box sx={{ mb: 1 }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                            <Group fontSize="small" color="action" />
                                            <Typography variant="caption" fontWeight={600} color="text.secondary">
                                              Grupos de aprovacao:
                                            </Typography>
                                          </Box>
                                          <Box sx={{ ml: 3 }}>
                                            {level.approverGroups.map((group) => (
                                              <Box key={group.id} sx={{ mb: 0.5 }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                                  • {group.name}
                                                </Typography>
                                                {group.members && group.members.length > 0 && (
                                                  <Box sx={{ ml: 2 }}>
                                                    {group.members.map((member) => (
                                                      <Typography key={member.id} variant="caption" display="block" color="text.disabled">
                                                        - {member.name} ({member.email})
                                                      </Typography>
                                                    ))}
                                                  </Box>
                                                )}
                                              </Box>
                                            ))}
                                          </Box>
                                        </Box>
                                      )}

                                      {/* Fallback for old snapshots without enriched data */}
                                      {(!level.approvers || level.approvers.length === 0) &&
                                       (!level.approverGroups || level.approverGroups.length === 0) && (
                                        <>
                                          {level.approverGroupIds && level.approverGroupIds.length > 0 && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                              <Group fontSize="small" color="action" />
                                              <Typography variant="caption" color="text.secondary">
                                                {level.approverGroupIds.length} grupo(s) de aprovacao
                                              </Typography>
                                            </Box>
                                          )}
                                          {level.approverIds && level.approverIds.length > 0 && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                              <Person fontSize="small" color="action" />
                                              <Typography variant="caption" color="text.secondary">
                                                {level.approverIds.length} aprovador(es)
                                              </Typography>
                                            </Box>
                                          )}
                                        </>
                                      )}

                                      {level.editableFields && level.editableFields.length > 0 && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                          <Edit fontSize="small" color="action" />
                                          <Typography variant="caption" color="text.secondary">
                                            {level.editableFields.length} campo(s) editavel(is): {level.editableFields.join(', ')}
                                          </Typography>
                                        </Box>
                                      )}

                                      {/* Approval actions - show all approvers with their status */}
                                      {levelApprovals.length > 0 ? (
                                        <Box sx={{ mt: 1.5 }}>
                                          <Divider sx={{ mb: 1 }} />
                                          <Typography variant="caption" fontWeight={600} color="text.secondary">
                                            {t.registration.approvers || 'Aprovadores:'}
                                          </Typography>
                                          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                            {levelApprovals.map((approval) => (
                                              <Box
                                                key={approval.id}
                                                sx={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: 1,
                                                  p: 1,
                                                  bgcolor: approval.action === ApprovalAction.APPROVED ? 'success.lighter' : approval.action === ApprovalAction.REJECTED ? 'error.lighter' : 'grey.100',
                                                  borderRadius: 1,
                                                }}
                                              >
                                                {approval.action === ApprovalAction.APPROVED ? (
                                                  <CheckCircle fontSize="small" color="success" />
                                                ) : approval.action === ApprovalAction.REJECTED ? (
                                                  <Cancel fontSize="small" color="error" />
                                                ) : (
                                                  <Schedule fontSize="small" color="action" />
                                                )}
                                                <Box sx={{ flex: 1 }}>
                                                  <Typography variant="body2" fontWeight={500}>
                                                    {approval.approver?.name || approval.approverEmail}
                                                  </Typography>
                                                  {approval.approver?.email && approval.approver.name && (
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                      {approval.approver.email}
                                                    </Typography>
                                                  )}
                                                  {approval.actionAt && (
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                      {formatDateTime(approval.actionAt)}
                                                    </Typography>
                                                  )}
                                                  {approval.comments && (
                                                    <Typography variant="caption" display="block" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                                                      "{approval.comments}"
                                                    </Typography>
                                                  )}
                                                </Box>
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
                                                />
                                              </Box>
                                            ))}
                                          </Stack>
                                        </Box>
                                      ) : (
                                        /* Level not yet reached - show message */
                                        (level.approverIds?.length > 0 || level.approverGroupIds?.length > 0) && (
                                          <Box sx={{ mt: 1 }}>
                                            <Typography variant="caption" color="text.secondary">
                                              {t.registration.awaitingPreviousLevels || 'Aguardando niveis anteriores'}
                                            </Typography>
                                          </Box>
                                        )
                                      )}
                                    </Box>
                                  </Paper>

                                  {/* Connector arrow */}
                                  {!isLast && (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                                      <ArrowDownward color="action" />
                                    </Box>
                                  )}
                                </Box>
                              );
                            })}
                        </Stack>
                      </Box>
                    );
                  })()}
                </Box>
              )}

              {/* Tab Panel: History */}
              {detailsTab === 2 && (
                <Box sx={{ p: 3 }}>
                  <FieldChangeHistory registrationId={selectedRequest.id} />
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button
                onClick={() => {
                  setSelectedRequest(null);
                  setDetailsTab(0);
                }}
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

      {/* Delete Draft Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setRequestIdToDelete(null);
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Delete color="error" />
            <Typography variant="h6">{t.registration.deleteDraft}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t.registration.confirmDeleteDraft}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setRequestIdToDelete(null);
            }}
            disabled={deleteLoading}
            sx={{ textTransform: 'none' }}
          >
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={16} /> : <Delete />}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {deleteLoading ? t.registration.deleting : t.common.delete}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit Draft Confirmation Dialog */}
      <Dialog
        open={submitDialogOpen}
        onClose={() => {
          setSubmitDialogOpen(false);
          setRequestIdToSubmit(null);
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Send color="success" />
            <Typography variant="h6">{t.registration.submitDraft}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t.common.submitForApproval}?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => {
              setSubmitDialogOpen(false);
              setRequestIdToSubmit(null);
            }}
            disabled={submitLoading}
            sx={{ textTransform: 'none' }}
          >
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleSubmitDraft}
            variant="contained"
            color="success"
            disabled={submitLoading}
            startIcon={submitLoading ? <CircularProgress size={16} /> : <Send />}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {submitLoading ? t.common.sending : t.common.submit}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
