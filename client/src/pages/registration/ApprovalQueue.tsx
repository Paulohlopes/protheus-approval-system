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
  Tabs,
  Tab,
  Divider,
  Alert,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
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
  Edit,
  History,
  AccountTree,
  Group,
  ArrowDownward,
  Undo,
  AddCircle,
  EditNote,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { registrationService } from '../../services/registrationService';
import { toast } from '../../utils/toast';
import { useLanguage } from '../../contexts/LanguageContext';
import type { RegistrationRequest, RegistrationApproval, WorkflowLevel } from '../../types/registration';
import { RegistrationStatus, ApprovalAction } from '../../types/registration';
import { EmptyState } from '../../components/EmptyState';
import FieldChangeHistory from '../../components/FieldChangeHistory';

type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
type ActionDialogType = 'approve' | 'reject' | 'sendBack' | null;

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

export const ApprovalQueuePage = () => {
  const { user } = useAuthStore();
  const { t, language } = useLanguage();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionDialog, setActionDialog] = useState<ActionDialogType>(null);
  const [actionInput, setActionInput] = useState('');
  const [actionError, setActionError] = useState('');

  // Editable fields state
  const [reviewTab, setReviewTab] = useState(0);
  const [editableFields, setEditableFields] = useState<string[]>([]);
  const [fieldChanges, setFieldChanges] = useState<Record<string, any>>({});
  const [loadingEditableFields, setLoadingEditableFields] = useState(false);

  // Send back state
  const [sendBackTargetLevel, setSendBackTargetLevel] = useState<number>(0); // 0 = return to draft

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

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  // Load editable fields when a request is selected
  useEffect(() => {
    if (selectedRequest) {
      loadEditableFields(selectedRequest.id);
      setReviewTab(0);
      setFieldChanges({});
    } else {
      setEditableFields([]);
      setFieldChanges({});
    }
  }, [selectedRequest?.id]);

  const loadEditableFields = async (registrationId: string) => {
    try {
      setLoadingEditableFields(true);
      const { editableFields: fields } = await registrationService.getEditableFieldsInfo(registrationId);
      setEditableFields(fields || []);
    } catch (error) {
      console.error('Error loading editable fields:', error);
      setEditableFields([]);
    } finally {
      setLoadingEditableFields(false);
    }
  };

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
      toast.error(t.registration.errorLoadPending);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFieldChanges(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const isFieldEditable = (fieldName: string): boolean => {
    return editableFields.includes(fieldName);
  };

  const getFieldValue = (fieldName: string): any => {
    if (fieldName in fieldChanges) {
      return fieldChanges[fieldName];
    }
    const parsedFormData = parseFormData(selectedRequest?.formData);
    return parsedFormData[fieldName] ?? '';
  };

  const hasFieldChanges = (): boolean => {
    return Object.keys(fieldChanges).length > 0;
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
      // Pass field changes if any were made
      const changes = hasFieldChanges() ? fieldChanges : undefined;
      await registrationService.approveRegistration(selectedRequest.id, actionInput || undefined, changes);
      toast.success(t.registration.successApproved);
      handleCloseActionDialog();
      setSelectedRequest(null);
      setFieldChanges({});
      await loadPendingApprovals();
    } catch (error: any) {
      console.error('Error approving request:', error);
      // Check if it's a self-approval error (403 Forbidden)
      if (error?.response?.status === 403) {
        toast.error(t.registration.errorSelfApproval);
      } else {
        toast.error(t.registration.errorApprove);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    if (!actionInput.trim()) {
      setActionError(t.registration.rejectReasonRequired);
      return;
    }

    try {
      setActionLoading(true);
      await registrationService.rejectRegistration(selectedRequest.id, actionInput);
      toast.success(t.registration.successRejected);
      handleCloseActionDialog();
      setSelectedRequest(null);
      await loadPendingApprovals();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(t.registration.errorReject);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendBack = async () => {
    if (!selectedRequest) return;

    if (!actionInput.trim()) {
      setActionError(t.registration.sendBackReasonRequired);
      return;
    }

    try {
      setActionLoading(true);
      await registrationService.sendBackRegistration(
        selectedRequest.id,
        actionInput,
        sendBackTargetLevel,
      );
      toast.success(t.registration.successSentBack);
      handleCloseActionDialog();
      setSelectedRequest(null);
      setSendBackTargetLevel(0);
      await loadPendingApprovals();
    } catch (error: any) {
      console.error('Error sending back request:', error);
      if (error?.response?.status === 403) {
        toast.error(t.registration.errorSelfApproval);
      } else {
        toast.error(t.registration.errorSendBack);
      }
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <HowToReg fontSize="large" color="primary" />
          <Typography variant="h4" component="h1" fontWeight={600}>
            {t.registration.approvalQueueTitle}
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          {t.registration.approvalQueueSubtitle}
        </Typography>
      </Box>

      {/* Content */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        {requests.length === 0 ? (
          <EmptyState
            type="no-documents"
            title={t.registration.noPendingTitle}
            description={t.registration.noPendingDesc}
          />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>{t.registration.tableType}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t.registration.tableOperation}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t.registration.tableRequester}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t.registration.tableDate}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t.registration.tableLevel}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t.registration.tableStatus}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">{t.registration.tableActions}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((request) => {
                  const isAlteration = request.operationType === 'ALTERATION';
                  return (
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
                      <Chip
                        icon={isAlteration ? <EditNote sx={{ fontSize: 16 }} /> : <AddCircle sx={{ fontSize: 16 }} />}
                        label={isAlteration ? t.registration.operationAlteration : t.registration.operationNew}
                        size="small"
                        color={isAlteration ? 'warning' : 'success'}
                        variant="outlined"
                        sx={{ borderRadius: 1 }}
                      />
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
                        {formatDate(request.requestedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${t.registration.level} ${request.currentLevel}`}
                        size="small"
                        variant="outlined"
                        sx={{ borderRadius: 1 }}
                      />
                    </TableCell>
                    <TableCell>{getStatusChip(request.status)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title={t.registration.reviewRequest}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<RateReview />}
                          onClick={() => setSelectedRequest(request)}
                          sx={{ borderRadius: 2, textTransform: 'none' }}
                        >
                          {t.registration.review}
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                  );
                })}
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
                    {t.registration.reviewRequest}
                  </Typography>
                </Box>
                <IconButton onClick={() => setSelectedRequest(null)} size="small">
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
              {/* Tabs */}
              <Tabs
                value={reviewTab}
                onChange={(_, v) => setReviewTab(v)}
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
              {reviewTab === 0 && (
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">{t.registration.requester}:</Typography>
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
                          <Typography variant="body2" color="text.secondary">{t.registration.tableDate}:</Typography>
                          <Typography variant="body2">
                            {formatDateTime(selectedRequest.requestedAt)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">{t.registration.currentLevel}:</Typography>
                          <Chip
                            label={`${t.registration.level} ${selectedRequest.currentLevel}`}
                            size="small"
                            variant="outlined"
                            sx={{ borderRadius: 1 }}
                          />
                        </Box>
                      </Stack>
                    </Paper>
                  </Box>

                  {/* Editable Fields Alert */}
                  {editableFields.length > 0 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      {t.registration.editableFieldsHint || 'Voce pode editar os campos destacados abaixo antes de aprovar.'}
                    </Alert>
                  )}

                  {/* Form Data */}
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t.registration.formData}
                    </Typography>
                    {loadingEditableFields ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : (
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Stack spacing={2}>
                          {/* Combine formData keys with editable fields that may not be in formData */}
                          {(() => {
                            // Parse formData if it's a string (from backend serialization)
                            const parsedFormData = parseFormData(selectedRequest.formData);

                            const formDataKeys = Object.keys(parsedFormData);
                            const allKeys = [...new Set([...formDataKeys, ...editableFields])];

                            // Create a map of fieldName -> label from template fields
                            const fieldLabels: Record<string, string> = {};
                            selectedRequest.template?.fields?.forEach((field: any) => {
                              // Use fieldName if available, fallback to sx3FieldName for compatibility
                              const key = field.fieldName || field.sx3FieldName;
                              if (key) {
                                fieldLabels[key] = field.label || key;
                              }
                            });

                            return allKeys.map((key) => {
                              const value = parsedFormData[key];
                              const editable = isFieldEditable(key);
                              const currentValue = getFieldValue(key);
                              const wasChanged = key in fieldChanges;
                              const fieldLabel = fieldLabels[key] || key;

                              return (
                                <Box key={key}>
                                  {editable ? (
                                    <TextField
                                      label={fieldLabel}
                                      value={currentValue}
                                      onChange={(e) => handleFieldChange(key, e.target.value)}
                                      fullWidth
                                      size="small"
                                      sx={{
                                        '& .MuiOutlinedInput-root': {
                                          bgcolor: wasChanged ? 'warning.lighter' : 'primary.lighter',
                                          '& fieldset': {
                                            borderColor: wasChanged ? 'warning.main' : 'primary.main',
                                          },
                                        },
                                      }}
                                      InputProps={{
                                        endAdornment: (
                                          <Tooltip title={t.registration.editableField || 'Campo editavel'}>
                                            <Edit sx={{ fontSize: 16, color: 'primary.main', ml: 1 }} />
                                          </Tooltip>
                                        ),
                                      }}
                                    />
                                  ) : (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                      <Typography variant="body2" color="text.secondary">{fieldLabel}:</Typography>
                                      <Typography variant="body2" fontWeight={500}>{formatFieldValue(value)}</Typography>
                                    </Box>
                                  )}
                                </Box>
                              );
                            });
                          })()}
                        </Stack>
                      </Paper>
                    )}
                  </Box>

                  {/* Field Changes Summary */}
                  {hasFieldChanges() && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {t.registration.changesWillBeApplied || 'Alteracoes serao aplicadas ao aprovar:'}
                      </Typography>
                      <Box component="ul" sx={{ m: 0, pl: 2, mt: 1 }}>
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

                          return Object.entries(fieldChanges).map(([key, newValue]) => (
                            <li key={key}>
                              <Typography variant="body2">
                                <strong>{fieldLabels[key] || key}:</strong> {formatFieldValue(parsedFormData[key])} → {formatFieldValue(newValue)}
                              </Typography>
                            </li>
                          ));
                        })()}
                      </Box>
                    </Alert>
                  )}
                </Box>
              )}

              {/* Tab Panel: Workflow */}
              {reviewTab === 1 && (
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
                                              <Box key={group.id} sx={{ mb: 1 }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                                  • {group.name}
                                                </Typography>
                                                {group.members && group.members.length > 0 ? (
                                                  <Box sx={{ ml: 2, mt: 0.5 }}>
                                                    {group.members.map((member) => (
                                                      <Typography key={member.id} variant="caption" display="block" color="text.secondary">
                                                        - {member.name} ({member.email})
                                                      </Typography>
                                                    ))}
                                                  </Box>
                                                ) : (
                                                  <Typography variant="caption" display="block" color="text.disabled" sx={{ ml: 2 }}>
                                                    (Sem membros no grupo)
                                                  </Typography>
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
                                                  label={
                                                    approval.action === ApprovalAction.APPROVED
                                                      ? t.common.approved || 'Aprovado'
                                                      : approval.action === ApprovalAction.REJECTED
                                                      ? t.common.rejected || 'Rejeitado'
                                                      : t.common.pending || 'Pendente'
                                                  }
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
                                        /* Level not yet reached - show configured approvers count */
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
              {reviewTab === 2 && (
                <Box sx={{ p: 3 }}>
                  <FieldChangeHistory registrationId={selectedRequest.id} />
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
              <Button
                onClick={() => setSelectedRequest(null)}
                variant="outlined"
                disabled={actionLoading}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                {t.common.close}
              </Button>
              <Button
                onClick={() => handleOpenActionDialog('sendBack')}
                variant="contained"
                color="warning"
                startIcon={<Undo />}
                disabled={actionLoading}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                {t.registration.sendBack}
              </Button>
              <Button
                onClick={() => handleOpenActionDialog('reject')}
                variant="contained"
                color="error"
                startIcon={<Cancel />}
                disabled={actionLoading}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                {t.common.reject}
              </Button>
              <Button
                onClick={() => handleOpenActionDialog('approve')}
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                disabled={actionLoading}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                {t.common.approve}
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
            <Typography variant="h6">{t.registration.approveRequest}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t.registration.approveCommentHint}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder={t.registration.commentsOptional}
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
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            color="success"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {actionLoading ? t.registration.approving : t.common.approve}
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
            <Typography variant="h6">{t.registration.rejectRequest}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t.registration.rejectCommentHint}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder={t.registration.rejectReason}
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
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <Cancel />}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {actionLoading ? t.registration.rejecting : t.common.reject}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Back Dialog */}
      <Dialog
        open={actionDialog === 'sendBack'}
        onClose={handleCloseActionDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Undo color="warning" />
            <Typography variant="h6">{t.registration.sendBackRequest}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t.registration.sendBackCommentHint}
          </Typography>

          <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t.registration.sendBackTargetLevel}
            </Typography>
            <RadioGroup
              value={sendBackTargetLevel}
              onChange={(e) => setSendBackTargetLevel(Number(e.target.value))}
            >
              <FormControlLabel
                value={0}
                control={<Radio color="warning" />}
                label={t.registration.sendBackToDraft}
              />
              {selectedRequest && selectedRequest.currentLevel > 1 && (
                <FormControlLabel
                  value={selectedRequest.currentLevel - 1}
                  control={<Radio color="warning" />}
                  label={`${t.registration.sendBackToPreviousLevel} (${selectedRequest.currentLevel - 1})`}
                />
              )}
            </RadioGroup>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder={t.registration.sendBackReason}
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
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleSendBack}
            variant="contained"
            color="warning"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <Undo />}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {actionLoading ? t.registration.sendingBack : t.registration.sendBack}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
