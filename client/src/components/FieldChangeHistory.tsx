import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Edit,
  ExpandMore,
  History,
} from '@mui/icons-material';
import { registrationService, type FieldChangeHistory as FieldChangeHistoryType } from '../services/registrationService';

// Custom Timeline components since @mui/lab Timeline requires MUI v7
const Timeline: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', pl: 2 }}>
    {children}
  </Box>
);

interface TimelineItemProps {
  children: React.ReactNode;
  isLast?: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ children, isLast }) => (
  <Box sx={{ display: 'flex', position: 'relative', pb: isLast ? 0 : 3 }}>
    {children}
  </Box>
);

const TimelineSeparator: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 2 }}>
    {children}
  </Box>
);

const TimelineDot: React.FC<{ children?: React.ReactNode; color?: 'primary' | 'secondary' }> = ({ children, color = 'primary' }) => (
  <Box
    sx={{
      width: 32,
      height: 32,
      borderRadius: '50%',
      border: 2,
      borderColor: `${color}.main`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'background.paper',
      zIndex: 1,
    }}
  >
    {children}
  </Box>
);

const TimelineConnector: React.FC = () => (
  <Box
    sx={{
      width: 2,
      flexGrow: 1,
      bgcolor: 'grey.300',
      mt: 0.5,
    }}
  />
);

const TimelineContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ flexGrow: 1, pt: 0.5 }}>
    {children}
  </Box>
);

const TimelineOppositeContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ minWidth: 120, mr: 2, pt: 0.5, textAlign: 'right' }}>
    {children}
  </Box>
);

interface FieldChangeHistoryProps {
  registrationId: string;
  fieldLabels?: Record<string, string>; // Map of fieldName to display label
}

const FieldChangeHistory: React.FC<FieldChangeHistoryProps> = ({
  registrationId,
  fieldLabels = {},
}) => {
  const [history, setHistory] = useState<FieldChangeHistoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [registrationId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await registrationService.getFieldChangeHistory(registrationId);
      setHistory(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar historico');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const parseValue = (value: string | null | undefined): string => {
    if (!value) return '-';
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object') {
        return JSON.stringify(parsed, null, 2);
      }
      return String(parsed);
    } catch {
      return value;
    }
  };

  const getFieldLabel = (fieldName: string): string => {
    return fieldLabels[fieldName] || fieldName;
  };

  // Group changes by approval level
  const changesByLevel = history.reduce((acc, change) => {
    const level = change.approvalLevel;
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(change);
    return acc;
  }, {} as Record<number, FieldChangeHistoryType[]>);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (history.length === 0) {
    return (
      <Box sx={{ py: 2, textAlign: 'center' }}>
        <History sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary">
          Nenhuma alteracao registrada
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <History color="primary" />
        <Typography variant="h6">
          Historico de Alteracoes
        </Typography>
        <Chip
          label={`${history.length} alteracoes`}
          size="small"
          color="primary"
          variant="outlined"
        />
      </Box>

      {Object.entries(changesByLevel).map(([level, changes]) => (
        <Accordion key={level} defaultExpanded={Number(level) === Math.max(...Object.keys(changesByLevel).map(Number))}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={`Nivel ${level}`}
                size="small"
                color="secondary"
              />
              <Typography variant="body2" color="text.secondary">
                {changes.length} alteracao(es)
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Timeline>
              {changes.map((change, index) => (
                <TimelineItem key={change.id} isLast={index === changes.length - 1}>
                  <TimelineOppositeContent>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(change.changedAt)}
                    </Typography>
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color="primary">
                      <Edit sx={{ fontSize: 16, color: 'primary.main' }} />
                    </TimelineDot>
                    {index < changes.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {getFieldLabel(change.fieldName)}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          De:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            bgcolor: 'error.light',
                            color: 'error.contrastText',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            display: 'inline-block',
                            textDecoration: 'line-through',
                            opacity: 0.8,
                          }}
                        >
                          {parseValue(change.previousValue)}
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Para:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            bgcolor: 'success.light',
                            color: 'success.contrastText',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            display: 'inline-block',
                          }}
                        >
                          {parseValue(change.newValue)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Por: {change.changedBy?.name || 'Usuario desconhecido'}
                      </Typography>
                    </Paper>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default FieldChangeHistory;
