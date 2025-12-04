import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CloudUpload,
  Download,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Info,
  ArrowBack,
  ArrowForward,
  Description,
  Send,
} from '@mui/icons-material';
import { registrationService } from '../../services/registrationService';
import { useCountry } from '../../contexts/CountryContext';
import type {
  FormTemplate,
  BulkValidationResult,
  BulkImportResult,
  BulkImportError,
  BulkImportWarning,
} from '../../types/registration';

const steps = ['Selecionar Template', 'Upload do Arquivo', 'Validação', 'Confirmação'];

const BulkImport: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCountry } = useCountry();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stepper state
  const [activeStep, setActiveStep] = useState(0);

  // Template selection
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // File upload
  const [file, setFile] = useState<File | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  // Validation
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<BulkValidationResult | null>(null);

  // Import
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);

  // Error
  const [error, setError] = useState<string | null>(null);

  // Load templates with bulk import enabled
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const data = await registrationService.getBulkEnabledTemplates();
        setTemplates(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar templates');
      } finally {
        setLoadingTemplates(false);
      }
    };
    loadTemplates();
  }, []);

  // Get selected template
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  // Download template file
  const handleDownloadTemplate = async (format: 'xlsx' | 'csv') => {
    if (!selectedTemplateId) return;

    try {
      setDownloadingTemplate(true);
      const blob = await registrationService.downloadBulkTemplate(selectedTemplateId, format);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `template-${selectedTemplate?.label || 'bulk'}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Erro ao baixar template');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setValidationResult(null);
      setImportResult(null);
      setError(null);
    }
  };

  // Handle file drop
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      const fileName = droppedFile.name.toLowerCase();
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
        setFile(droppedFile);
        setValidationResult(null);
        setImportResult(null);
        setError(null);
      } else {
        setError('Formato de arquivo não suportado. Use .xlsx, .xls ou .csv');
      }
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  // Validate file
  const handleValidate = async () => {
    if (!selectedTemplateId || !file) return;

    try {
      setValidating(true);
      setError(null);
      const result = await registrationService.validateBulkFile(selectedTemplateId, file);
      setValidationResult(result);

      if (result.valid) {
        setActiveStep(2);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao validar arquivo');
    } finally {
      setValidating(false);
    }
  };

  // Import file
  const handleImport = async () => {
    if (!selectedTemplateId || !file) return;

    try {
      setImporting(true);
      setError(null);
      const result = await registrationService.createBulkRegistration(
        selectedTemplateId,
        file,
        selectedCountry?.id,
      );
      setImportResult(result);

      if (result.success) {
        setActiveStep(3);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao importar dados');
    } finally {
      setImporting(false);
    }
  };

  // Submit registration
  const handleSubmit = async () => {
    if (!importResult?.registrationId) return;

    try {
      await registrationService.submitRegistration(importResult.registrationId);
      navigate('/registration/my-requests');
    } catch (err: any) {
      setError(err.message || 'Erro ao submeter solicitação');
    }
  };

  // Navigation
  const handleNext = () => {
    if (activeStep === 0 && selectedTemplateId) {
      setActiveStep(1);
    } else if (activeStep === 1 && file) {
      handleValidate();
    } else if (activeStep === 2 && validationResult?.valid) {
      handleImport();
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(0, prev - 1));
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return !!selectedTemplateId;
      case 1:
        return !!file;
      case 2:
        return validationResult?.valid === true;
      default:
        return false;
    }
  };

  // Render warning/error icon
  const getMessageIcon = (type: BulkImportWarning['type'] | 'error') => {
    switch (type) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'info':
      default:
        return <Info color="info" />;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5">Importação em Lote</Typography>
        </Box>

        {/* Stepper */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Step Content */}
        <Paper sx={{ p: 3 }}>
          {/* Step 0: Template Selection */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Selecione o Template
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Escolha o template de cadastro que deseja usar para importação em lote.
              </Typography>

              {loadingTemplates ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : templates.length === 0 ? (
                <Alert severity="info">
                  Nenhum template com importação em lote habilitada.
                  Entre em contato com o administrador para habilitar essa funcionalidade.
                </Alert>
              ) : (
                <FormControl fullWidth>
                  <InputLabel>Template</InputLabel>
                  <Select
                    value={selectedTemplateId}
                    label="Template"
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                  >
                    {templates.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        <Box>
                          <Typography>{template.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {template.tableName || 'Multi-tabela'} - {template.fields?.length || 0} campos
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          )}

          {/* Step 1: File Upload */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Upload do Arquivo
              </Typography>

              {/* Download Template Buttons */}
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    1. Baixe o modelo de planilha
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    Use o modelo para garantir que os dados estejam no formato correto.
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      startIcon={downloadingTemplate ? <CircularProgress size={20} /> : <Download />}
                      onClick={() => handleDownloadTemplate('xlsx')}
                      disabled={downloadingTemplate}
                    >
                      Baixar Excel (.xlsx)
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={downloadingTemplate ? <CircularProgress size={20} /> : <Download />}
                      onClick={() => handleDownloadTemplate('csv')}
                      disabled={downloadingTemplate}
                    >
                      Baixar CSV
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              {/* File Drop Zone */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    2. Faça upload do arquivo preenchido
                  </Typography>

                  <Paper
                    variant="outlined"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    sx={{
                      p: 4,
                      textAlign: 'center',
                      border: '2px dashed',
                      borderColor: file ? 'success.main' : 'divider',
                      bgcolor: file ? 'success.lighter' : 'grey.50',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'primary.lighter',
                      },
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />

                    {file ? (
                      <Box>
                        <CheckCircle color="success" sx={{ fontSize: 48, mb: 2 }} />
                        <Typography variant="h6" color="success.main" gutterBottom>
                          Arquivo selecionado
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <Description />
                          <Typography>{file.name}</Typography>
                          <Chip
                            label={`${(file.size / 1024).toFixed(1)} KB`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Clique para trocar o arquivo
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                          Arraste um arquivo ou clique para selecionar
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Formatos aceitos: .xlsx, .xls, .csv
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Step 2: Validation */}
          {activeStep === 2 && validationResult && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Resultado da Validação
              </Typography>

              {/* Summary */}
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Card variant="outlined" sx={{ flex: 1 }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4">{validationResult.totalRows}</Typography>
                    <Typography color="text.secondary">Linhas Total</Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ flex: 1 }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {validationResult.validRows}
                    </Typography>
                    <Typography color="text.secondary">Linhas Válidas</Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ flex: 1 }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main">
                      {validationResult.errors.length}
                    </Typography>
                    <Typography color="text.secondary">Erros</Typography>
                  </CardContent>
                </Card>
              </Stack>

              {/* Warnings */}
              {validationResult.warnings.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Avisos ({validationResult.warnings.length})
                  </Typography>
                  <List dense disablePadding>
                    {validationResult.warnings.map((warning, idx) => (
                      <ListItem key={idx} disablePadding>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {getMessageIcon(warning.type)}
                        </ListItemIcon>
                        <ListItemText primary={warning.message} />
                      </ListItem>
                    ))}
                  </List>
                </Alert>
              )}

              {/* Errors */}
              {validationResult.errors.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Erros ({validationResult.errors.length})
                  </Typography>
                  <TableContainer sx={{ maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Linha</TableCell>
                          <TableCell>Campo</TableCell>
                          <TableCell>Erro</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {validationResult.errors.slice(0, 50).map((error, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{error.row}</TableCell>
                            <TableCell>{error.fieldLabel || error.field}</TableCell>
                            <TableCell>{error.message}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {validationResult.errors.length > 50 && (
                    <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                      Mostrando 50 de {validationResult.errors.length} erros
                    </Typography>
                  )}
                </Alert>
              )}

              {/* Preview */}
              {validationResult.preview && validationResult.valid && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Preview dos Dados (primeiras 10 linhas)
                    </Typography>
                    <TableContainer sx={{ maxHeight: 400 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            {validationResult.preview.headers.map((header) => (
                              <TableCell key={header}>{header}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {validationResult.preview.rows.map((row, idx) => (
                            <TableRow key={idx}>
                              {validationResult.preview!.headers.map((header) => (
                                <TableCell key={header}>
                                  {String(row[header] ?? '')}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}

              {!validationResult.valid && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Corrija os erros no arquivo e faça upload novamente.
                </Alert>
              )}
            </Box>
          )}

          {/* Step 3: Confirmation */}
          {activeStep === 3 && importResult && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircle color="success" sx={{ fontSize: 80, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Importação Concluída!
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Sua solicitação foi criada com sucesso.
              </Typography>

              <Card variant="outlined" sx={{ maxWidth: 400, mx: 'auto', mb: 3 }}>
                <CardContent>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="text.secondary">Tracking:</Typography>
                      <Typography fontWeight={600}>{importResult.trackingNumber}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="text.secondary">Itens:</Typography>
                      <Typography>{importResult.itemCount}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="text.secondary">Status:</Typography>
                      <Chip label="Rascunho" size="small" color="default" />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/registration/${importResult.registrationId}`)}
                >
                  Ver Detalhes
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Send />}
                  onClick={handleSubmit}
                >
                  Submeter para Aprovação
                </Button>
              </Stack>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0 || activeStep === 3}
              onClick={handleBack}
              startIcon={<ArrowBack />}
            >
              Voltar
            </Button>

            {activeStep < 3 && (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!canProceed() || validating || importing}
                endIcon={
                  validating || importing ? (
                    <CircularProgress size={20} />
                  ) : (
                    <ArrowForward />
                  )
                }
              >
                {activeStep === 1
                  ? 'Validar'
                  : activeStep === 2
                  ? 'Importar'
                  : 'Próximo'}
              </Button>
            )}

            {activeStep === 3 && (
              <Button
                variant="outlined"
                onClick={() => navigate('/registration/my-requests')}
              >
                Ir para Minhas Solicitações
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default BulkImport;
