import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
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
import { useLanguage } from '../contexts/LanguageContext';

interface FieldChangeHistoryProps {
  registrationId: string;
  fieldLabels?: Record<string, string>; // Map of fieldName to display label
}

const FieldChangeHistory: React.FC<FieldChangeHistoryProps> = ({
  registrationId,
  fieldLabels = {},
}) => {
  const { t } = useLanguage();
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
            <Timeline position="right" sx={{ m: 0, p: 0 }}>
              {changes.map((change, index) => (
                <TimelineItem key={change.id}>
                  <TimelineOppositeContent sx={{ flex: 0.3, minWidth: 120 }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(change.changedAt)}
                    </Typography>
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color="primary" variant="outlined">
                      <Edit sx={{ fontSize: 16 }} />
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
