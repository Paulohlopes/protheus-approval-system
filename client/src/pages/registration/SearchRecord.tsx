import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
} from '@mui/material';
import {
  Search,
  Edit,
  ArrowBack,
  Clear,
  FilterList,
  Refresh,
} from '@mui/icons-material';
import { registrationService } from '../../services/registrationService';
import {
  protheusDataService,
  type SearchFilter,
} from '../../services/protheusDataService';

// Record from search result
interface SearchResultRecord {
  recno: string;
  data: Record<string, any>;
}
import { toast } from '../../utils/toast';
import { useLanguage } from '../../contexts/LanguageContext';
import type { FormTemplate, FormField, SupportedLanguage } from '../../types/registration';
import { getFieldLabel } from '../../types/registration';

interface FilterValue {
  field: string;
  operator: 'eq' | 'like' | 'gt' | 'lt' | 'gte' | 'lte' | 'ne';
  value: string;
}

export const SearchRecordPage = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  // State
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  // Search state
  const [filters, setFilters] = useState<FilterValue[]>([{ field: '', operator: 'like', value: '' }]);
  const [results, setResults] = useState<SearchResultRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [hasSearched, setHasSearched] = useState(false);

  // Load template
  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    if (!templateId) return;

    try {
      setLoading(true);
      const data = await registrationService.getTemplate(templateId);
      setTemplate(data);

      // Get visible fields for filtering
      const visibleFields = (data.fields || [])
        .filter((f) => f.isVisible && f.isEnabled)
        .sort((a, b) => a.fieldOrder - b.fieldOrder);

      setFields(visibleFields);
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error(t.registration.errorLoadForm);
    } finally {
      setLoading(false);
    }
  };

  const getLabel = (field: FormField): string => {
    return getFieldLabel(field, language as SupportedLanguage);
  };

  // Handle search
  const handleSearch = async () => {
    if (!template) return;

    try {
      setSearching(true);
      setHasSearched(true);

      // Build search filters
      const searchFilters: SearchFilter[] = filters
        .filter((f) => f.field && f.value)
        .map((f) => ({
          field: f.field,
          operator: f.operator,
          value: f.value,
        }));

      const result = await protheusDataService.searchRecords({
        tableName: template.tableName,
        filters: searchFilters,
        page: page + 1, // API uses 1-based pagination
        pageSize,
      });

      setResults(result.records || []);
      setTotal(result.total || 0);
    } catch (error: any) {
      console.error('Error searching records:', error);
      toast.error(error.response?.data?.message || t.registration.alteration.errorSearch);
    } finally {
      setSearching(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (index: number, key: keyof FilterValue, value: string) => {
    setFilters((prev) => {
      const newFilters = [...prev];
      newFilters[index] = { ...newFilters[index], [key]: value };
      return newFilters;
    });
  };

  const addFilter = () => {
    setFilters((prev) => [...prev, { field: '', operator: 'like', value: '' }]);
  };

  const removeFilter = (index: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== index));
  };

  const clearFilters = () => {
    setFilters([{ field: '', operator: 'like', value: '' }]);
    setResults([]);
    setTotal(0);
    setHasSearched(false);
  };

  // Handle pagination
  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Trigger search when page or pageSize changes (if already searched)
  useEffect(() => {
    if (hasSearched) {
      handleSearch();
    }
  }, [page, pageSize]);

  // Handle record selection for alteration
  const handleSelectRecord = async (record: SearchResultRecord) => {
    if (!templateId) return;

    try {
      setCreating(true);

      // Create alteration draft
      const registration = await protheusDataService.createAlterationDraft({
        templateId,
        originalRecno: record.recno,
      });

      toast.success(t.registration.alteration.draftCreated);

      // Navigate to edit page
      navigate(`/registration/edit/${registration.id}`);
    } catch (error: any) {
      console.error('Error creating alteration draft:', error);
      toast.error(error.response?.data?.message || t.registration.alteration.errorCreateDraft);
    } finally {
      setCreating(false);
    }
  };

  // Get display columns (first 5 visible fields + RECNO)
  const displayColumns = fields.slice(0, 5);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!template) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{t.registration.errorTemplateNotFound}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Search fontSize="large" color="primary" />
          <Typography variant="h4" component="h1" fontWeight={600}>
            {t.registration.alteration.searchTitle}
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          {t.registration.alteration.searchSubtitle.replace('{{template}}', template.label)}
        </Typography>
      </Box>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3, mb: 3 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterList color="action" />
          <Typography variant="h6" fontWeight={600}>
            {t.registration.alteration.filters}
          </Typography>
        </Box>

        <Stack spacing={2}>
          {filters.map((filter, index) => (
            <Grid container spacing={2} key={index} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t.registration.alteration.field}</InputLabel>
                  <Select
                    value={filter.field}
                    onChange={(e) => handleFilterChange(index, 'field', e.target.value)}
                    label={t.registration.alteration.field}
                  >
                    {fields.map((field) => (
                      <MenuItem key={field.sx3FieldName} value={field.sx3FieldName}>
                        {getLabel(field)} ({field.sx3FieldName})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t.registration.alteration.operator}</InputLabel>
                  <Select
                    value={filter.operator}
                    onChange={(e) => handleFilterChange(index, 'operator', e.target.value as FilterValue['operator'])}
                    label={t.registration.alteration.operator}
                  >
                    <MenuItem value="like">{t.registration.alteration.opContains}</MenuItem>
                    <MenuItem value="eq">{t.registration.alteration.opEquals}</MenuItem>
                    <MenuItem value="ne">{t.registration.alteration.opNotEquals}</MenuItem>
                    <MenuItem value="gt">{t.registration.alteration.opGreaterThan}</MenuItem>
                    <MenuItem value="lt">{t.registration.alteration.opLessThan}</MenuItem>
                    <MenuItem value="gte">{t.registration.alteration.opGreaterOrEqual}</MenuItem>
                    <MenuItem value="lte">{t.registration.alteration.opLessOrEqual}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label={t.registration.alteration.value}
                  value={filter.value}
                  onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {index === filters.length - 1 && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={addFilter}
                      sx={{ minWidth: 'auto' }}
                    >
                      +
                    </Button>
                  )}
                  {filters.length > 1 && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => removeFilter(index)}
                      sx={{ minWidth: 'auto' }}
                    >
                      -
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          ))}
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/registration/new')}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {t.common.back}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<Clear />}
            onClick={clearFilters}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {t.common.clearFilters}
          </Button>
          <Button
            variant="contained"
            startIcon={searching ? <CircularProgress size={16} color="inherit" /> : <Search />}
            onClick={handleSearch}
            disabled={searching}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {searching ? t.registration.alteration.searching : t.common.search}
          </Button>
        </Stack>
      </Paper>

      {/* Results */}
      {hasSearched && (
        <Paper
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
        >
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              {t.registration.alteration.results} ({total})
            </Typography>
            <Tooltip title={t.common.refresh}>
              <IconButton onClick={handleSearch} disabled={searching}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>RECNO</TableCell>
                  {displayColumns.map((field) => (
                    <TableCell key={field.sx3FieldName} sx={{ fontWeight: 600 }}>
                      {getLabel(field)}
                    </TableCell>
                  ))}
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {t.common.actions}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={displayColumns.length + 2} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {t.registration.alteration.noResults}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  results.map((record) => (
                    <TableRow key={record.recno} hover>
                      <TableCell>
                        <Chip label={record.recno} size="small" variant="outlined" />
                      </TableCell>
                      {displayColumns.map((field) => (
                        <TableCell key={field.sx3FieldName}>
                          {record.data?.[field.sx3FieldName] ?? '-'}
                        </TableCell>
                      ))}
                      <TableCell align="right">
                        <Tooltip title={t.registration.alteration.selectForAlteration}>
                          <span>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={creating ? <CircularProgress size={14} color="inherit" /> : <Edit />}
                              onClick={() => handleSelectRecord(record)}
                              disabled={creating}
                              sx={{ borderRadius: 2, textTransform: 'none' }}
                            >
                              {t.registration.alteration.select}
                            </Button>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {results.length > 0 && (
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={handlePageChange}
              rowsPerPage={pageSize}
              onRowsPerPageChange={handlePageSizeChange}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage={t.table.rowsPerPage}
            />
          )}
        </Paper>
      )}

      {/* Loading overlay */}
      {creating && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress />
            <Typography>{t.registration.alteration.creatingDraft}</Typography>
          </Paper>
        </Box>
      )}
    </Container>
  );
};
