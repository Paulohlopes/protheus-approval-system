import React, { useState, memo } from 'react';
import {
  Card,
  CardContent,
  Grid,
  Box,
  Typography,
  Chip,
  Button,
  Stack,
  Checkbox,
  Collapse,
  Divider,
  Avatar,
  LinearProgress,
  Tooltip,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Business,
  CalendarToday,
  ExpandMore,
  Person,
  AttachMoney,
  Description,
  MoreVert,
  Schedule,
  Visibility,
  Timeline,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProtheusDocument, DocumentApprovalLevel } from '../../types/auth';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getTypeColor, getTypeLabel, getStatusColor } from '../../utils/documentHelpers';

interface ModernDocumentCardProps {
  document: ProtheusDocument;
  onApprove: (document: ProtheusDocument) => void;
  onReject: (document: ProtheusDocument) => void;
  loading?: boolean;
  userEmail?: string;
  isSelected?: boolean;
  onSelectChange?: (documentNumber: string, selected: boolean) => void;
  showSelection?: boolean;
  currentStatus: DocumentApprovalLevel;
  isPending: boolean;
  index?: number;
}

const ModernDocumentCard: React.FC<ModernDocumentCardProps> = memo(({
  document,
  onApprove,
  onReject,
  loading,
  userEmail,
  isSelected,
  onSelectChange,
  showSelection,
  currentStatus,
  isPending,
  index = 0,
}) => {
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();

  // Calculate approval progress
  const totalLevels = document.alcada.length;
  const completedLevels = document.alcada.filter(level => level.situacao_aprov === 'Liberado').length;
  const progressPercent = (completedLevels / totalLevels) * 100;

  const typeColor = getTypeColor(document.tipo);
  const statusColor = getStatusColor(currentStatus.situacao_aprov);

  const getTypeGradient = (type: string) => {
    switch (type) {
      case 'IP':
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case 'SC':
        return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
      case 'CP':
        return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
      default:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  };

  const getStatusGradient = (status: string) => {
    switch (status) {
      case 'Liberado':
        return 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
      case 'Pendente':
        return 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
      case 'Rejeitado':
        return 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)';
      default:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
    >
      <Card
        sx={{
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
          background: isPending 
            ? `linear-gradient(135deg, ${alpha(theme.palette.warning.light, 0.05)} 0%, ${alpha(theme.palette.warning.main, 0.02)} 100%)`
            : theme.palette.background.paper,
          border: isPending 
            ? `2px solid ${alpha(theme.palette.warning.main, 0.3)}`
            : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 3,
          boxShadow: isPending 
            ? `0 8px 32px ${alpha(theme.palette.warning.main, 0.15)}`
            : '0 4px 20px rgba(0,0,0,0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: isPending
              ? `0 12px 40px ${alpha(theme.palette.warning.main, 0.25)}`
              : '0 8px 32px rgba(0,0,0,0.12)',
            transform: 'translateY(-6px)',
          },
        }}
      >
        {/* Priority indicator */}
        {isPending && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: getStatusGradient(currentStatus.situacao_aprov),
            }}
          />
        )}

        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
            {showSelection && isPending && (
              <Box sx={{ pt: 0.5 }}>
                <Checkbox
                  checked={isSelected || false}
                  onChange={(e) => onSelectChange?.(document.numero.trim(), e.target.checked)}
                  color="primary"
                  sx={{
                    '&.Mui-checked': {
                      color: theme.palette.primary.main,
                    },
                  }}
                />
              </Box>
            )}

            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: getTypeGradient(document.tipo),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  <Description sx={{ fontSize: 24 }} />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="h6" fontWeight={700} color="text.primary">
                      {document.numero.trim()}
                    </Typography>
                    <Chip
                      label={getTypeLabel(document.tipo)}
                      size="small"
                      sx={{
                        background: getTypeGradient(document.tipo),
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={currentStatus.situacao_aprov}
                      size="small"
                      variant={isPending ? 'filled' : 'outlined'}
                      sx={{
                        ...(isPending && {
                          background: getStatusGradient(currentStatus.situacao_aprov),
                          color: 'white',
                          fontWeight: 600,
                        }),
                      }}
                    />
                    {isPending && (
                      <Chip
                        icon={<Schedule sx={{ fontSize: 16 }} />}
                        label="Urgente"
                        size="small"
                        color="warning"
                        variant="filled"
                      />
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Progress bar */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    Progresso da Aprovação
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {completedLevels} de {totalLevels} níveis
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progressPercent}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: alpha(theme.palette.grey[300], 0.3),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      background: progressPercent === 100 
                        ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    },
                  }}
                />
              </Box>

              {/* Document info grid */}
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Business sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Fornecedor:
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={600} color="text.primary">
                    {document.nome_fornecedor ? String(document.nome_fornecedor).trim() : 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CalendarToday sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Emissão:
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={600} color="text.primary">
                    {formatDate(document.Emissao)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AttachMoney sx={{ fontSize: 18, color: theme.palette.success.main }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Valor:
                    </Typography>
                  </Box>
                  <Typography 
                    variant="h6" 
                    fontWeight={800}
                    sx={{
                      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    {formatCurrency(document.vl_tot_documento)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <IconButton size="small">
                <MoreVert />
              </IconButton>
              <Tooltip title="Ver detalhes">
                <IconButton 
                  size="small" 
                  onClick={() => setExpanded(!expanded)}
                  sx={{
                    transform: expanded ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.3s ease',
                  }}
                >
                  <ExpandMore />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Action buttons for pending documents */}
          {isPending && (
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<CheckCircle />}
                onClick={() => onApprove(document)}
                disabled={loading}
                sx={{
                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  minWidth: 140,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  boxShadow: '0 4px 16px rgba(67, 233, 123, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #38f9d7 0%, #43e97b 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(67, 233, 123, 0.4)',
                  },
                }}
              >
                Aprovar
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<Cancel />}
                onClick={() => onReject(document)}
                disabled={loading}
                sx={{
                  minWidth: 140,
                  py: 1.5,
                  borderRadius: 2,
                  borderWidth: 2,
                  fontWeight: 600,
                  color: theme.palette.error.main,
                  borderColor: theme.palette.error.main,
                  '&:hover': {
                    background: alpha(theme.palette.error.main, 0.08),
                    borderWidth: 2,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 20px ${alpha(theme.palette.error.main, 0.3)}`,
                  },
                }}
              >
                Rejeitar
              </Button>
            </Box>
          )}

          {/* Approval timeline preview */}
          {document.alcada.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Linha do tempo de aprovação:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
                {document.alcada.slice(0, 4).map((nivel, index) => (
                  <Tooltip 
                    key={index} 
                    title={`${nivel.CNOME || nivel.aprovador_aprov} - ${nivel.situacao_aprov}`}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: '0.75rem',
                        backgroundColor: 
                          nivel.situacao_aprov === 'Liberado' ? theme.palette.success.main :
                          nivel.situacao_aprov === 'Pendente' ? theme.palette.warning.main :
                          theme.palette.grey[400],
                        color: 'white',
                        border: nivel.situacao_aprov === 'Pendente' ? `2px solid ${theme.palette.warning.dark}` : 'none',
                      }}
                    >
                      {(nivel.CNOME || nivel.aprovador_aprov || 'U').charAt(0)}
                    </Avatar>
                  </Tooltip>
                ))}
                {document.alcada.length > 4 && (
                  <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: 'grey.400' }}>
                    +{document.alcada.length - 4}
                  </Avatar>
                )}
              </Stack>
            </Box>
          )}
        </CardContent>

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Divider />
              <CardContent sx={{ pt: 2 }}>
                <DocumentDetails document={document} />
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
});

// Simple DocumentDetails component (you can expand this)
const DocumentDetails: React.FC<{ document: ProtheusDocument }> = ({ document }) => {
  const theme = useTheme();
  
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Description fontSize="small" />
          Informações Gerais
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Filial</Typography>
              <Typography variant="body2" fontWeight={500}>{document.filial}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Comprador</Typography>
              <Typography variant="body2" fontWeight={500}>{document.comprador}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">Condição de Pagamento</Typography>
              <Typography variant="body2" fontWeight={500}>{document.cond_pagamento}</Typography>
            </Grid>
          </Grid>
        </Box>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person fontSize="small" />
          Alçada de Aprovação
        </Typography>
        <Box sx={{ pl: 2, maxHeight: 200, overflowY: 'auto' }}>
          {document.alcada.map((nivel, index) => (
            <Box 
              key={index} 
              sx={{ 
                mb: 1, 
                p: 2, 
                bgcolor: nivel.situacao_aprov === 'Pendente' ? alpha(theme.palette.warning.light, 0.1) : 'transparent',
                borderRadius: 2,
                border: nivel.situacao_aprov === 'Pendente' ? `1px solid ${alpha(theme.palette.warning.main, 0.3)}` : '1px solid transparent',
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                Nível {nivel.nivel_aprov} - {nivel.avaliado_aprov}
              </Typography>
              <Typography variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
                {nivel.CNOME || nivel.aprovador_aprov}
              </Typography>
              <Chip 
                label={nivel.situacao_aprov}
                size="small"
                color={
                  nivel.situacao_aprov === 'Liberado' ? 'success' :
                  nivel.situacao_aprov === 'Pendente' ? 'warning' : 'default'
                }
                sx={{ mt: 0.5 }}
              />
            </Box>
          ))}
        </Box>
      </Grid>
    </Grid>
  );
};

export default ModernDocumentCard;