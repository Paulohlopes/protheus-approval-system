import React, { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Stack,
} from '@mui/material';
import {
  CloudUpload,
  Description,
  Warning,
  Info,
  Error as ErrorIcon,
  CheckCircle,
  TableChart,
} from '@mui/icons-material';
import { adminService } from '../../services/adminService';
import type { TemplateExportDto, TemplateImportValidation, TemplateImportWarning } from '../../types/admin';
import type { Country } from '../../types/registration';

interface ImportTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  countries: Country[];
}

const ImportTemplateDialog: React.FC<ImportTemplateDialogProps> = ({
  open,
  onClose,
  onImportSuccess,
  countries,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<TemplateExportDto | null>(null);
  const [validation, setValidation] = useState<TemplateImportValidation | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<string>('');
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReset = useCallback(() => {
    setFile(null);
    setImportData(null);
    setValidation(null);
    setSelectedCountryId('');
    setOverwriteExisting(false);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setValidation(null);
    setImportData(null);

    // Validate file type
    if (!selectedFile.name.endsWith('.json')) {
      setError('Por favor, selecione um arquivo JSON válido');
      return;
    }

    setFile(selectedFile);

    try {
      // Read and parse file
      const text = await selectedFile.text();
      const data = JSON.parse(text) as TemplateExportDto;

      // Basic validation of structure
      if (!data.template || !data.exportVersion) {
        setError('Arquivo JSON inválido. Certifique-se de que é um arquivo de exportação de template.');
        return;
      }

      setImportData(data);

      // Validate with backend
      setValidating(true);
      const validationResult = await adminService.validateTemplateImport(data);
      setValidation(validationResult);

      // Auto-select country if available
      if (data.template.countryCode) {
        const matchingCountry = countries.find(c => c.code === data.template.countryCode);
        if (matchingCountry) {
          setSelectedCountryId(matchingCountry.id);
        }
      }
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError('Arquivo JSON inválido. Verifique o formato do arquivo.');
      } else {
        setError(err.message || 'Erro ao processar arquivo');
      }
      setFile(null);
    } finally {
      setValidating(false);
    }
  }, [countries]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      // Create a synthetic event to reuse handleFileSelect logic
      const syntheticEvent = {
        target: { files: [droppedFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(syntheticEvent);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleImport = useCallback(async () => {
    if (!importData) return;

    try {
      setLoading(true);
      setError(null);

      await adminService.importTemplate(importData, {
        overwriteExisting,
        countryId: selectedCountryId || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        onImportSuccess();
        handleClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao importar template');
    } finally {
      setLoading(false);
    }
  }, [importData, overwriteExisting, selectedCountryId, onImportSuccess, handleClose]);

  const getWarningIcon = (type: TemplateImportWarning['type']) => {
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

  const canImport = importData && validation?.valid && !loading && !validating;
  // Always show country selector - all templates need a database connection
  const needsCountry = !!importData;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Importar Template</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Success Message */}
          {success && (
            <Alert severity="success" icon={<CheckCircle />}>
              Template importado com sucesso!
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* File Drop Zone */}
          {!importData && !success && (
            <Paper
              variant="outlined"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              sx={{
                p: 4,
                textAlign: 'center',
                border: '2px dashed',
                borderColor: 'divider',
                bgcolor: 'grey.50',
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
                accept=".json"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Arraste um arquivo JSON ou clique para selecionar
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Selecione um arquivo de template exportado anteriormente
              </Typography>
            </Paper>
          )}

          {/* Loading Validation */}
          {validating && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} sx={{ mr: 2 }} />
              <Typography>Validando arquivo...</Typography>
            </Box>
          )}

          {/* Template Preview */}
          {importData && !validating && !success && (
            <>
              {/* File Info */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Description color="primary" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={500}>
                      {importData.template.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {file?.name}
                    </Typography>
                  </Box>
                  <Button size="small" onClick={handleReset}>
                    Trocar arquivo
                  </Button>
                </Box>

                {/* Template Details */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Tabela
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      {importData.template.isMultiTable ? (
                        <Chip
                          icon={<TableChart fontSize="small" />}
                          label="Multi-tabela"
                          size="small"
                          color="primary"
                        />
                      ) : (
                        <Chip label={importData.template.tableName || 'N/A'} size="small" />
                      )}
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      País de Origem
                    </Typography>
                    <Typography variant="body2">
                      {importData.template.countryCode || 'Não especificado'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Campos
                    </Typography>
                    <Typography variant="body2">
                      {importData.fields?.length || 0} campos
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Data da Exportação
                    </Typography>
                    <Typography variant="body2">
                      {importData.exportDate
                        ? new Date(importData.exportDate).toLocaleString('pt-BR')
                        : 'N/A'}
                    </Typography>
                  </Box>
                </Box>

                {importData.template.description && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Descrição
                    </Typography>
                    <Typography variant="body2">
                      {importData.template.description}
                    </Typography>
                  </Box>
                )}
              </Paper>

              {/* Validation Warnings */}
              {validation && validation.warnings.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Avisos da Validação
                  </Typography>
                  <List dense>
                    {validation.warnings.map((warning, index) => (
                      <ListItem key={index}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {getWarningIcon(warning.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={warning.message}
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: warning.type === 'error' ? 'error' : 'text.primary',
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Import Options */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Opções de Importação
                </Typography>

                {needsCountry && (
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>País / Conexão de Destino</InputLabel>
                    <Select
                      value={selectedCountryId}
                      label="País / Conexão de Destino"
                      onChange={(e) => setSelectedCountryId(e.target.value)}
                      disabled={countries.length === 0}
                    >
                      {countries.length === 0 ? (
                        <MenuItem value="" disabled>
                          Nenhum país/conexão cadastrado
                        </MenuItem>
                      ) : (
                        countries.map((country) => (
                          <MenuItem key={country.id} value={country.id}>
                            {country.name} ({country.code})
                          </MenuItem>
                        ))
                      )}
                    </Select>
                    {countries.length === 0 && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        Cadastre um país/conexão em Administração → Países antes de importar
                      </Typography>
                    )}
                  </FormControl>
                )}

                {validation?.templateExists && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={overwriteExisting}
                        onChange={(e) => setOverwriteExisting(e.target.checked)}
                        color="warning"
                      />
                    }
                    label={
                      <Typography variant="body2" color="warning.main">
                        Sobrescrever template existente (isso irá deletar o template atual e criar um novo)
                      </Typography>
                    }
                  />
                )}

                {validation?.templateExists && !overwriteExisting && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    Um template para esta tabela já existe. Marque a opção acima para sobrescrever.
                  </Alert>
                )}
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={!canImport || (validation?.templateExists && !overwriteExisting) || (needsCountry && !selectedCountryId)}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'Importando...' : 'Importar Template'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportTemplateDialog;
