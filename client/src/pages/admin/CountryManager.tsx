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
  Grid,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Public,
  Refresh,
  PlayArrow,
  Star,
  StarBorder,
  ExpandMore,
  Visibility,
  VisibilityOff,
  Storage,
  Api,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import countryService from '../../services/countryService';
import type { Country, CreateCountryDto, UpdateCountryDto, TestConnectionResult } from '../../types/country';

interface CountryFormData {
  code: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
  tableSuffix: string;
  dbHost: string;
  dbPort: number;
  dbDatabase: string;
  dbUsername: string;
  dbPassword: string;
  apiBaseUrl: string;
  apiUsername: string;
  apiPassword: string;
  apiTimeout: number;
  oauthUrl: string;
}

const initialFormData: CountryFormData = {
  code: '',
  name: '',
  isActive: true,
  isDefault: false,
  tableSuffix: '010',
  dbHost: '',
  dbPort: 1433,
  dbDatabase: '',
  dbUsername: '',
  dbPassword: '',
  apiBaseUrl: '',
  apiUsername: '',
  apiPassword: '',
  apiTimeout: 30000,
  oauthUrl: '',
};

const CountryManager: React.FC = () => {
  const { user } = useAuthStore();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [formData, setFormData] = useState<CountryFormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  // Password visibility
  const [showDbPassword, setShowDbPassword] = useState(false);
  const [showApiPassword, setShowApiPassword] = useState(false);

  // Test connection state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [countryToDelete, setCountryToDelete] = useState<Country | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch countries
  const fetchCountries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await countryService.findAll();
      setCountries(data);
    } catch (err: any) {
      console.error('Error fetching countries:', err);
      setError(err.response?.data?.message || 'Erro ao carregar países');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  // Open create dialog
  const handleCreate = () => {
    setDialogMode('create');
    setSelectedCountry(null);
    setFormData(initialFormData);
    setTestResult(null);
    setDialogOpen(true);
  };

  // Open edit dialog
  const handleEdit = (country: Country) => {
    setDialogMode('edit');
    setSelectedCountry(country);
    setFormData({
      code: country.code,
      name: country.name,
      isActive: country.isActive,
      isDefault: country.isDefault,
      tableSuffix: country.tableSuffix,
      dbHost: country.dbHost,
      dbPort: country.dbPort,
      dbDatabase: country.dbDatabase,
      dbUsername: country.dbUsername,
      dbPassword: '', // Don't show existing password
      apiBaseUrl: country.apiBaseUrl || '',
      apiUsername: country.apiUsername || '',
      apiPassword: '', // Don't show existing password
      apiTimeout: country.apiTimeout,
      oauthUrl: country.oauthUrl || '',
    });
    setTestResult(null);
    setDialogOpen(true);
  };

  // Save (create or update)
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (dialogMode === 'create') {
        const dto: CreateCountryDto = {
          code: formData.code.toUpperCase(),
          name: formData.name,
          isActive: formData.isActive,
          isDefault: formData.isDefault,
          tableSuffix: formData.tableSuffix,
          dbHost: formData.dbHost,
          dbPort: formData.dbPort,
          dbDatabase: formData.dbDatabase,
          dbUsername: formData.dbUsername,
          dbPassword: formData.dbPassword,
          apiBaseUrl: formData.apiBaseUrl || undefined,
          apiUsername: formData.apiUsername || undefined,
          apiPassword: formData.apiPassword || undefined,
          apiTimeout: formData.apiTimeout,
          oauthUrl: formData.oauthUrl || undefined,
        };
        await countryService.create(dto);
      } else if (selectedCountry) {
        const dto: UpdateCountryDto = {
          name: formData.name,
          isActive: formData.isActive,
          isDefault: formData.isDefault,
          tableSuffix: formData.tableSuffix,
          dbHost: formData.dbHost,
          dbPort: formData.dbPort,
          dbDatabase: formData.dbDatabase,
          dbUsername: formData.dbUsername,
          dbPassword: formData.dbPassword || undefined, // Only update if provided
          apiBaseUrl: formData.apiBaseUrl || undefined,
          apiUsername: formData.apiUsername || undefined,
          apiPassword: formData.apiPassword || undefined, // Only update if provided
          apiTimeout: formData.apiTimeout,
          oauthUrl: formData.oauthUrl || undefined,
        };
        await countryService.update(selectedCountry.id, dto);
      }

      setDialogOpen(false);
      fetchCountries();
    } catch (err: any) {
      console.error('Error saving country:', err);
      setError(err.response?.data?.message || 'Erro ao salvar país');
    } finally {
      setSaving(false);
    }
  };

  // Test connection
  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);

      const result = await countryService.testConnection({
        dbHost: formData.dbHost,
        dbPort: formData.dbPort,
        dbDatabase: formData.dbDatabase,
        dbUsername: formData.dbUsername,
        dbPassword: formData.dbPassword,
        tableSuffix: formData.tableSuffix,
      });

      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || 'Erro ao testar conexão',
      });
    } finally {
      setTesting(false);
    }
  };

  // Test existing country connection
  const handleTestExistingConnection = async (countryId: string) => {
    try {
      await countryService.testCountryConnection(countryId);
      fetchCountries();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao testar conexão');
    }
  };

  // Toggle active
  const handleToggleActive = async (country: Country) => {
    try {
      await countryService.toggleActive(country.id);
      fetchCountries();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao alterar status');
    }
  };

  // Set as default
  const handleSetDefault = async (country: Country) => {
    try {
      await countryService.setAsDefault(country.id);
      fetchCountries();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao definir padrão');
    }
  };

  // Delete
  const handleDeleteClick = (country: Country) => {
    setCountryToDelete(country);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!countryToDelete) return;

    try {
      setDeleting(true);
      await countryService.remove(countryToDelete.id);
      setDeleteDialogOpen(false);
      setCountryToDelete(null);
      fetchCountries();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao excluir país');
    } finally {
      setDeleting(false);
    }
  };

  // Connection status chip
  const getStatusChip = (country: Country) => {
    switch (country.connectionStatus) {
      case 'connected':
        return <Chip label="Conectado" color="success" size="small" />;
      case 'failed':
        return (
          <Tooltip title={country.connectionError || 'Erro de conexão'}>
            <Chip label="Erro" color="error" size="small" />
          </Tooltip>
        );
      default:
        return <Chip label="Não testado" color="default" size="small" />;
    }
  };

  // Check admin
  if (!user?.isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          <AlertTitle>Acesso Negado</AlertTitle>
          Apenas administradores podem gerenciar países/conexões ERP.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Public fontSize="large" color="primary" />
          <Typography variant="h4" component="h1" fontWeight={600}>
            Países / Conexões ERP
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Gerencie os países e suas conexões com o Protheus ERP
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
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchCountries}
            disabled={loading}
          >
            Atualizar
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
            Novo País
          </Button>
        </Box>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : countries.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Nenhum país cadastrado</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Código</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Sufixo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Host</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Conexão</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {countries.map((country) => (
                <TableRow key={country.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography fontWeight={600}>{country.code}</Typography>
                      {country.isDefault && (
                        <Tooltip title="País padrão">
                          <Star fontSize="small" color="primary" />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{country.name}</TableCell>
                  <TableCell>
                    <Chip label={country.tableSuffix} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {country.dbHost}:{country.dbPort}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={country.isActive ? 'Ativo' : 'Inativo'}
                      color={country.isActive ? 'success' : 'default'}
                      size="small"
                      onClick={() => handleToggleActive(country)}
                      sx={{ cursor: 'pointer' }}
                    />
                  </TableCell>
                  <TableCell align="center">{getStatusChip(country)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Testar Conexão">
                      <IconButton
                        size="small"
                        onClick={() => handleTestExistingConnection(country.id)}
                      >
                        <PlayArrow fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {!country.isDefault && (
                      <Tooltip title="Definir como Padrão">
                        <IconButton size="small" onClick={() => handleSetDefault(country)}>
                          <StarBorder fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => handleEdit(country)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(country)}
                      >
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Novo País / Conexão' : `Editar ${selectedCountry?.name}`}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {/* Basic Info */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Código"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="BR, AR, CL"
                  fullWidth
                  required
                  disabled={dialogMode === 'edit'}
                  inputProps={{ maxLength: 5 }}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Nome"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Brasil, Argentina"
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Sufixo das Tabelas"
                  value={formData.tableSuffix}
                  onChange={(e) => setFormData({ ...formData, tableSuffix: e.target.value })}
                  placeholder="010, 020, 030"
                  fullWidth
                  required
                  helperText="Ex: SA1010 = SA1 + 010"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                  }
                  label="Ativo"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    />
                  }
                  label="País Padrão"
                />
              </Grid>
            </Grid>

            {/* Database Connection */}
            <Accordion defaultExpanded sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Storage sx={{ mr: 1 }} />
                <Typography fontWeight={600}>Conexão com Banco de Dados (SQL Server)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      label="Host"
                      value={formData.dbHost}
                      onChange={(e) => setFormData({ ...formData, dbHost: e.target.value })}
                      placeholder="192.168.1.100"
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Porta"
                      type="number"
                      value={formData.dbPort}
                      onChange={(e) => setFormData({ ...formData, dbPort: parseInt(e.target.value) || 1433 })}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Database"
                      value={formData.dbDatabase}
                      onChange={(e) => setFormData({ ...formData, dbDatabase: e.target.value })}
                      placeholder="PROTHEUS"
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Usuário"
                      value={formData.dbUsername}
                      onChange={(e) => setFormData({ ...formData, dbUsername: e.target.value })}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Senha"
                      type={showDbPassword ? 'text' : 'password'}
                      value={formData.dbPassword}
                      onChange={(e) => setFormData({ ...formData, dbPassword: e.target.value })}
                      fullWidth
                      required={dialogMode === 'create'}
                      helperText={dialogMode === 'edit' ? 'Deixe em branco para manter a senha atual' : ''}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowDbPassword(!showDbPassword)} edge="end">
                              {showDbPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>

                {/* Test Connection Button */}
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={testing ? <CircularProgress size={16} /> : <PlayArrow />}
                    onClick={handleTestConnection}
                    disabled={testing || !formData.dbHost || !formData.dbDatabase || !formData.dbUsername || (!formData.dbPassword && dialogMode === 'create')}
                  >
                    Testar Conexão
                  </Button>

                  {testResult && (
                    <Alert
                      severity={testResult.success ? 'success' : 'error'}
                      sx={{ mt: 1 }}
                    >
                      {testResult.message}
                      {testResult.details?.serverVersion && (
                        <Typography variant="caption" display="block">
                          Versão: {testResult.details.serverVersion}
                        </Typography>
                      )}
                    </Alert>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* API Configuration (Optional) */}
            <Accordion sx={{ mt: 1 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Api sx={{ mr: 1 }} />
                <Typography fontWeight={600}>Configuração de API REST (Opcional)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="URL Base da API"
                      value={formData.apiBaseUrl}
                      onChange={(e) => setFormData({ ...formData, apiBaseUrl: e.target.value })}
                      placeholder="http://servidor:porta/rest"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Usuário API"
                      value={formData.apiUsername}
                      onChange={(e) => setFormData({ ...formData, apiUsername: e.target.value })}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Senha API"
                      type={showApiPassword ? 'text' : 'password'}
                      value={formData.apiPassword}
                      onChange={(e) => setFormData({ ...formData, apiPassword: e.target.value })}
                      fullWidth
                      helperText={dialogMode === 'edit' ? 'Deixe em branco para manter a senha atual' : ''}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowApiPassword(!showApiPassword)} edge="end">
                              {showApiPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Timeout (ms)"
                      type="number"
                      value={formData.apiTimeout}
                      onChange={(e) => setFormData({ ...formData, apiTimeout: parseInt(e.target.value) || 30000 })}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="URL OAuth"
                      value={formData.oauthUrl}
                      onChange={(e) => setFormData({ ...formData, oauthUrl: e.target.value })}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || !formData.code || !formData.name || !formData.dbHost || !formData.dbDatabase || !formData.dbUsername || (!formData.dbPassword && dialogMode === 'create')}
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
            Tem certeza que deseja excluir o país <strong>{countryToDelete?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta ação não pode ser desfeita. Todos os templates e solicitações associados a este país
            serão afetados.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleting}>
            {deleting ? <CircularProgress size={20} /> : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CountryManager;
