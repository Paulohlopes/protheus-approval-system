import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Toolbar,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Checkbox,
  Chip,
  Button,
  Stack,
  Collapse,
  Grid,
  Tooltip,
  Menu,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Divider,
  alpha,
  useTheme,
  Avatar,
  LinearProgress,
  Badge,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
  ListItemText,
  Fade,
  Container,
  AppBar,
  Toolbar as MuiToolbar,
} from '@mui/material';
import {
  Search,
  FilterList,
  GetApp,
  Refresh,
  ViewColumn,
  KeyboardArrowDown,
  KeyboardArrowRight,
  CheckCircle,
  Cancel,
  MoreVert,
  PictureAsPdf,
  TableChart,
  Description,
  Business,
  CalendarToday,
  AttachMoney,
  Person,
  Group,
  TrendingUp,
  Warning,
  Check,
  Clear,
  Logout,
  Dashboard,
  ViewList,
} from '@mui/icons-material';
import { useDocuments } from '../hooks/useDocuments';
import { useDocumentActions } from '../hooks/useDocumentActions';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { getCurrentApprovalStatus } from '../utils/documentHelpers';
import ConfirmationDialog from '../components/ConfirmationDialog';
import type { ProtheusDocument } from '../types/auth';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, doc?: ProtheusDocument) => string | React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  visible?: boolean;
  group?: 'basic' | 'financial' | 'approval' | 'details';
}

const columns: Column[] = [
  {
    id: 'select',
    label: '',
    minWidth: 50,
    align: 'center',
    sortable: false,
    filterable: false,
    visible: true,
  },
  {
    id: 'numero',
    label: 'Número',
    minWidth: 120,
    sortable: true,
    filterable: true,
    visible: true,
    group: 'basic',
    format: (value: string) => (
      <Typography variant="body2" fontWeight={600}>
        {value.trim()}
      </Typography>
    ),
  },
  {
    id: 'tipo',
    label: 'Tipo',
    minWidth: 130,
    sortable: true,
    filterable: true,
    visible: true,
    group: 'basic',
    format: (value: string) => {
      const getTypeInfo = (type: string) => {
        switch (type) {
          case 'IP': return { label: 'Pedido de Compra', color: 'primary' };
          case 'SC': return { label: 'Solicitação', color: 'info' };
          case 'CP': return { label: 'Contrato', color: 'warning' };
          default: return { label: type, color: 'default' };
        }
      };
      const info = getTypeInfo(value);
      return (
        <Chip
          label={info.label}
          size="small"
          color={info.color as any}
          variant="outlined"
        />
      );
    },
  },
  {
    id: 'status',
    label: 'Status',
    minWidth: 140,
    sortable: true,
    filterable: true,
    visible: true,
    group: 'approval',
    format: (value: any, doc?: ProtheusDocument) => {
      if (!doc) return '-';
      const status = getCurrentApprovalStatus(doc.alcada, doc.userEmail);
      const getStatusInfo = (situacao: string) => {
        switch (situacao) {
          case 'Liberado': return { color: 'success', icon: <CheckCircle fontSize="small" /> };
          case 'Pendente': return { color: 'warning', icon: <Warning fontSize="small" /> };
          case 'Rejeitado': return { color: 'error', icon: <Cancel fontSize="small" /> };
          default: return { color: 'default', icon: null };
        }
      };
      const info = getStatusInfo(status?.situacao_aprov || '');
      return (
        <Chip
          label={status?.situacao_aprov}
          size="small"
          color={info.color as any}
          icon={info.icon as any}
          variant={status?.situacao_aprov === 'Pendente' ? 'filled' : 'outlined'}
        />
      );
    },
  },
  {
    id: 'nome_fornecedor',
    label: 'Fornecedor',
    minWidth: 200,
    sortable: true,
    filterable: true,
    visible: true,
    group: 'basic',
    format: (value: string) => (
      <Stack direction="row" alignItems="center" spacing={1}>
        <Business fontSize="small" color="action" />
        <Typography variant="body2">
          {value ? String(value).trim() : 'N/A'}
        </Typography>
      </Stack>
    ),
  },
  {
    id: 'vl_tot_documento',
    label: 'Valor Total',
    minWidth: 140,
    align: 'right',
    sortable: true,
    filterable: true,
    visible: true,
    group: 'financial',
    format: (value: string) => {
      const numValue = parseFloat(value.replace(/\./g, '').replace(',', '.'));
      return (
        <Typography variant="body2" fontWeight={600} color="primary">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(numValue)}
        </Typography>
      );
    },
  },
  {
    id: 'Emissao',
    label: 'Emissão',
    minWidth: 110,
    sortable: true,
    filterable: true,
    visible: true,
    group: 'basic',
    format: (value: string) => {
      if (value.length === 8) {
        const year = value.substring(0, 4);
        const month = value.substring(4, 6);
        const day = value.substring(6, 8);
        return (
          <Stack direction="row" alignItems="center" spacing={1}>
            <CalendarToday fontSize="small" color="action" />
            <Typography variant="body2">
              {`${day}/${month}/${year}`}
            </Typography>
          </Stack>
        );
      }
      return value;
    },
  },
  {
    id: 'comprador',
    label: 'Comprador',
    minWidth: 150,
    sortable: true,
    filterable: true,
    visible: false,
    group: 'details',
    format: (value: string) => (
      <Stack direction="row" alignItems="center" spacing={1}>
        <Person fontSize="small" color="action" />
        <Typography variant="body2">{value}</Typography>
      </Stack>
    ),
  },
  {
    id: 'cond_pagamento',
    label: 'Cond. Pagamento',
    minWidth: 130,
    sortable: true,
    filterable: true,
    visible: false,
    group: 'financial',
  },
  {
    id: 'filial',
    label: 'Filial',
    minWidth: 80,
    sortable: true,
    filterable: true,
    visible: false,
    group: 'basic',
  },
  {
    id: 'aprovadores',
    label: 'Aprovadores',
    minWidth: 200,
    sortable: false,
    filterable: false,
    visible: true,
    group: 'approval',
    format: (value: any, doc?: ProtheusDocument) => {
      if (!doc) return '-';
      const pending = doc.alcada.filter(a => a.situacao_aprov === 'Pendente').length;
      const approved = doc.alcada.filter(a => a.situacao_aprov === 'Liberado').length;
      const total = doc.alcada.length;

      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinearProgress
            variant="determinate"
            value={(approved / total) * 100}
            sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
          />
          <Typography variant="caption" color="text.secondary">
            {approved}/{total}
          </Typography>
        </Box>
      );
    },
  },
  {
    id: 'actions',
    label: 'Ações',
    minWidth: 150,
    align: 'center',
    sortable: false,
    filterable: false,
    visible: true,
  },
];

const DocumentsTablePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const theme = useTheme();

  // Estados
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<string>('numero');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [selected, setSelected] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.filter(col => col.visible).map(col => col.id)
  );
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
  const [groupBy, setGroupBy] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Hooks
  const { data: documentsResponse, refetch, isLoading } = useDocuments({}, { page: 1, limit: 1000 });
  const {
    confirmDialog,
    bulkConfirmDialog,
    handleApprove,
    handleReject,
    handleConfirmAction,
    handleCloseDialog,
    handleBulkApprove,
    handleBulkReject,
    handleBulkConfirmAction,
    handleCloseBulkDialog,
    isProcessing,
  } = useDocumentActions();

  const documents = documentsResponse?.documentos || [];

  // Filtrar e ordenar documentos
  const processedDocuments = useMemo(() => {
    let filtered = [...documents];

    // Aplicar busca
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.nome_fornecedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.comprador?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtros específicos
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(doc => {
          const docValue = (doc as any)[key];
          return String(docValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    // Ordenar
    filtered.sort((a, b) => {
      const aValue = (a as any)[orderBy];
      const bValue = (b as any)[orderBy];

      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

    // Agrupar se necessário
    if (groupBy) {
      // Implementar agrupamento aqui se necessário
    }

    return filtered;
  }, [documents, searchTerm, filters, orderBy, order, groupBy]);

  // Handlers
  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = processedDocuments
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map(doc => doc.numero.trim());
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (documentNumber: string) => {
    const selectedIndex = selected.indexOf(documentNumber);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, documentNumber);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleToggleRow = (documentNumber: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(documentNumber)) {
      newExpanded.delete(documentNumber);
    } else {
      newExpanded.add(documentNumber);
    }
    setExpandedRows(newExpanded);
  };

  const handleColumnToggle = (columnId: string) => {
    setVisibleColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleExportExcel = () => {
    const exportData = processedDocuments.map(doc => ({
      'Número': doc.numero.trim(),
      'Tipo': doc.tipo,
      'Fornecedor': doc.nome_fornecedor,
      'Valor Total': doc.vl_tot_documento,
      'Emissão': doc.Emissao,
      'Comprador': doc.comprador,
      'Filial': doc.filial,
      'Condição Pagamento': doc.cond_pagamento,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Documentos');
    XLSX.writeFile(wb, `documentos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Relatório de Documentos', 14, 22);

    doc.setFontSize(11);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 32);
    doc.text(`Total de documentos: ${processedDocuments.length}`, 14, 38);

    const tableData = processedDocuments.map(doc => [
      doc.numero.trim(),
      doc.tipo,
      doc.nome_fornecedor || 'N/A',
      doc.vl_tot_documento,
      doc.Emissao,
      doc.comprador,
    ]);

    (doc as any).autoTable({
      head: [['Número', 'Tipo', 'Fornecedor', 'Valor', 'Emissão', 'Comprador']],
      body: tableData,
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [63, 81, 181] },
    });

    doc.save(`documentos_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isSelected = (documentNumber: string) => selected.indexOf(documentNumber) !== -1;

  const formatDocumentValue = (document: ProtheusDocument | null): string | undefined => {
    if (!document) return undefined;

    const numValue = parseFloat(document.vl_tot_documento.replace(/\./g, '').replace(',', '.'));
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <AppBar position="static" elevation={0}>
        <MuiToolbar sx={{ minHeight: 70 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.dark' }}>
              <Business />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Sistema Protheus - Tabela Avançada
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Visualização completa de documentos
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <ToggleButtonGroup
              value="table"
              exclusive
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}
            >
              <ToggleButton value="cards" onClick={() => navigate('/documents')}>
                <Dashboard fontSize="small" />
              </ToggleButton>
              <ToggleButton value="table">
                <ViewList fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>

            <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />

            <Chip
              avatar={<Avatar sx={{ bgcolor: 'primary.dark' }}>{user?.email?.charAt(0).toUpperCase()}</Avatar>}
              label={user?.email}
              sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
            />

            <Button
              color="inherit"
              onClick={handleLogout}
              startIcon={<Logout />}
              variant="outlined"
              sx={{ borderColor: 'rgba(255,255,255,0.3)' }}
            >
              Sair
            </Button>
          </Stack>
        </MuiToolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth={false} sx={{ py: 3, flexGrow: 1 }}>
        <Paper sx={{ width: '100%', mb: 2 }}>
          {/* Toolbar */}
          <Toolbar
            sx={{
              pl: { sm: 2 },
              pr: { xs: 1, sm: 1 },
              ...(selected.length > 0 && {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              }),
            }}
          >
            {selected.length > 0 ? (
              <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1" component="div">
                {selected.length} selecionado(s)
              </Typography>
            ) : (
              <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div">
                Documentos para Aprovação
              </Typography>
            )}

            {selected.length > 0 ? (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<CheckCircle />}
                  onClick={() => handleBulkApprove()}
                >
                  Aprovar
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<Cancel />}
                  onClick={() => handleBulkReject()}
                >
                  Rejeitar
                </Button>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: 250 }}
                />

                <Tooltip title="Filtros">
                  <IconButton onClick={(e) => setFilterMenuAnchor(e.currentTarget)}>
                    <Badge badgeContent={Object.keys(filters).length} color="error">
                      <FilterList />
                    </Badge>
                  </IconButton>
                </Tooltip>

                <Tooltip title="Colunas">
                  <IconButton onClick={(e) => setColumnMenuAnchor(e.currentTarget)}>
                    <ViewColumn />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Exportar Excel">
                  <IconButton onClick={handleExportExcel}>
                    <TableChart />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Exportar PDF">
                  <IconButton onClick={handleExportPDF}>
                    <PictureAsPdf />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Atualizar">
                  <IconButton onClick={() => refetch()}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Stack>
            )}
          </Toolbar>

          {/* Table */}
          <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      indeterminate={selected.length > 0 && selected.length < processedDocuments.length}
                      checked={processedDocuments.length > 0 && selected.length === processedDocuments.length}
                      onChange={handleSelectAllClick}
                    />
                  </TableCell>
                  <TableCell width={50} />
                  {columns
                    .filter(column => visibleColumns.includes(column.id) && column.id !== 'select')
                    .map(column => (
                      <TableCell
                        key={column.id}
                        align={column.align}
                        style={{ minWidth: column.minWidth }}
                        sortDirection={orderBy === column.id ? order : false}
                      >
                        {column.sortable ? (
                          <TableSortLabel
                            active={orderBy === column.id}
                            direction={orderBy === column.id ? order : 'asc'}
                            onClick={() => handleRequestSort(column.id)}
                          >
                            {column.label}
                          </TableSortLabel>
                        ) : (
                          column.label
                        )}
                      </TableCell>
                    ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + 2} align="center">
                      <LinearProgress />
                    </TableCell>
                  </TableRow>
                ) : (
                  processedDocuments
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((document) => {
                      const isItemSelected = isSelected(document.numero.trim());
                      const isExpanded = expandedRows.has(document.numero.trim());
                      const currentStatus = getCurrentApprovalStatus(document.alcada, user?.email);
                      const isPending = currentStatus?.situacao_aprov === 'Pendente';

                      return (
                        <React.Fragment key={document.numero.trim()}>
                          <TableRow
                            hover
                            role="checkbox"
                            aria-checked={isItemSelected}
                            tabIndex={-1}
                            selected={isItemSelected}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                color="primary"
                                checked={isItemSelected}
                                onChange={() => handleClick(document.numero.trim())}
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => handleToggleRow(document.numero.trim())}
                              >
                                {isExpanded ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
                              </IconButton>
                            </TableCell>
                            {columns
                              .filter(column => visibleColumns.includes(column.id) && column.id !== 'select')
                              .map(column => {
                                if (column.id === 'actions') {
                                  return (
                                    <TableCell key={column.id} align={column.align}>
                                      {isPending && (
                                        <Stack direction="row" spacing={1} justifyContent="center">
                                          <Tooltip title="Aprovar">
                                            <IconButton
                                              size="small"
                                              color="success"
                                              onClick={() => handleApprove(document.numero.trim())}
                                            >
                                              <CheckCircle fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                          <Tooltip title="Rejeitar">
                                            <IconButton
                                              size="small"
                                              color="error"
                                              onClick={() => handleReject(document.numero.trim())}
                                            >
                                              <Cancel fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                          <Tooltip title="Mais">
                                            <IconButton size="small">
                                              <MoreVert fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                        </Stack>
                                      )}
                                    </TableCell>
                                  );
                                }

                                const value = column.id === 'status'
                                  ? currentStatus
                                  : column.id === 'aprovadores'
                                  ? document.alcada
                                  : (document as any)[column.id];

                                return (
                                  <TableCell key={column.id} align={column.align}>
                                    {column.format
                                      ? column.format(value, { ...document, userEmail: user?.email })
                                      : value}
                                  </TableCell>
                                );
                              })}
                          </TableRow>

                          {/* Linha expandida com detalhes */}
                          <TableRow>
                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={visibleColumns.length + 2}>
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Box sx={{ margin: 2 }}>
                                  <Typography variant="h6" gutterBottom component="div">
                                    Detalhes do Documento
                                  </Typography>
                                  <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                      <Paper variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                          Informações Gerais
                                        </Typography>
                                        <Grid container spacing={1}>
                                          <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">
                                              Filial
                                            </Typography>
                                            <Typography variant="body2">{document.filial}</Typography>
                                          </Grid>
                                          <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">
                                              Condição Pagamento
                                            </Typography>
                                            <Typography variant="body2">{document.cond_pagamento}</Typography>
                                          </Grid>
                                        </Grid>
                                      </Paper>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                      <Paper variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                          Itens ({document.itens.length})
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          {document.itens.map(item => item.descr_produto).slice(0, 3).join(', ')}
                                          {document.itens.length > 3 && '...'}
                                        </Typography>
                                      </Paper>
                                    </Grid>

                                    <Grid item xs={12}>
                                      <Paper variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                          Alçada de Aprovação
                                        </Typography>
                                        <Stack direction="row" spacing={2} flexWrap="wrap">
                                          {document.alcada.map((nivel, index) => (
                                            <Chip
                                              key={index}
                                              label={`${nivel.CNOME || nivel.aprovador_aprov} - ${nivel.situacao_aprov}`}
                                              size="small"
                                              color={
                                                nivel.situacao_aprov === 'Liberado' ? 'success' :
                                                nivel.situacao_aprov === 'Pendente' ? 'warning' :
                                                nivel.situacao_aprov === 'Rejeitado' ? 'error' : 'default'
                                              }
                                              variant={nivel.situacao_aprov === 'Pendente' ? 'filled' : 'outlined'}
                                            />
                                          ))}
                                        </Stack>
                                      </Paper>
                                    </Grid>
                                  </Grid>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            component="div"
            count={processedDocuments.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Linhas por página"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </Paper>

        {/* Menu de Filtros */}
        <Menu
          anchorEl={filterMenuAnchor}
          open={Boolean(filterMenuAnchor)}
          onClose={() => setFilterMenuAnchor(null)}
        >
          <Box sx={{ p: 2, minWidth: 250 }}>
            <Typography variant="subtitle2" gutterBottom>
              Filtros Avançados
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Stack spacing={2}>
              <TextField
                size="small"
                label="Número"
                value={filters.numero || ''}
                onChange={(e) => setFilters({ ...filters, numero: e.target.value })}
              />
              <FormControl size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={filters.tipo || ''}
                  onChange={(e) => setFilters({ ...filters, tipo: e.target.value as string })}
                  label="Tipo"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="IP">Pedido de Compra</MenuItem>
                  <MenuItem value="SC">Solicitação</MenuItem>
                  <MenuItem value="CP">Contrato</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Fornecedor"
                value={filters.nome_fornecedor || ''}
                onChange={(e) => setFilters({ ...filters, nome_fornecedor: e.target.value })}
              />
              <Button
                variant="text"
                size="small"
                onClick={() => setFilters({})}
              >
                Limpar Filtros
              </Button>
            </Stack>
          </Box>
        </Menu>

        {/* Menu de Colunas */}
        <Menu
          anchorEl={columnMenuAnchor}
          open={Boolean(columnMenuAnchor)}
          onClose={() => setColumnMenuAnchor(null)}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Colunas Visíveis
            </Typography>
            <Divider sx={{ my: 1 }} />
            <FormGroup>
              {columns
                .filter(col => col.id !== 'select' && col.id !== 'actions')
                .map(column => (
                  <FormControlLabel
                    key={column.id}
                    control={
                      <Checkbox
                        size="small"
                        checked={visibleColumns.includes(column.id)}
                        onChange={() => handleColumnToggle(column.id)}
                      />
                    }
                    label={column.label}
                  />
                ))}
            </FormGroup>
          </Box>
        </Menu>
      </Container>

      {/* Dialogs */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmAction}
        action={confirmDialog.action}
        documentNumber={confirmDialog.document?.numero.trim()}
        documentValue={formatDocumentValue(confirmDialog.document)}
        loading={isProcessing}
      />

      <ConfirmationDialog
        open={bulkConfirmDialog.open}
        onClose={handleCloseBulkDialog}
        onConfirm={(comments) => handleBulkConfirmAction(documents, comments)}
        action={bulkConfirmDialog.action}
        documentNumber={`${bulkConfirmDialog.documentCount} documentos`}
        documentValue="Operação em massa"
        loading={isProcessing}
      />
    </Box>
  );
};

export default DocumentsTablePage;