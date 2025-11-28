import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Avatar,
  CircularProgress,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import {
  AddBox,
  Description,
  ArrowForward,
  Edit,
  Search,
} from '@mui/icons-material';
import { registrationService } from '../../services/registrationService';
import { toast } from '../../utils/toast';
import { useLanguage } from '../../contexts/LanguageContext';
import type { FormTemplate } from '../../types/registration';
import { EmptyState } from '../../components/EmptyState';

type OperationType = 'NEW' | 'ALTERATION';

export const SelectRegistrationTypePage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [operationType, setOperationType] = useState<OperationType>('NEW');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await registrationService.getTemplates(false);
      setTemplates(data.filter((t) => t.isActive));
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error(t.registration.errorLoadTemplates);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    if (operationType === 'NEW') {
      navigate(`/registration/new/${templateId}`);
    } else {
      // Navigate to search page for alteration
      navigate(`/registration/search/${templateId}`);
    }
  };

  const handleOperationTypeChange = (
    _: React.MouseEvent<HTMLElement>,
    newValue: OperationType | null,
  ) => {
    if (newValue !== null) {
      setOperationType(newValue);
    }
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
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          {operationType === 'NEW' ? (
            <AddBox fontSize="large" color="primary" />
          ) : (
            <Edit fontSize="large" color="secondary" />
          )}
          <Typography variant="h4" component="h1" fontWeight={600}>
            {operationType === 'NEW'
              ? t.registration.selectTypeTitle
              : t.registration.alteration.selectTypeTitle}
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          {operationType === 'NEW'
            ? t.registration.selectTypeSubtitle
            : t.registration.alteration.selectTypeSubtitle}
        </Typography>
      </Box>

      {/* Operation Type Toggle */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <ToggleButtonGroup
          value={operationType}
          exclusive
          onChange={handleOperationTypeChange}
          aria-label="operation type"
          sx={{
            '& .MuiToggleButton-root': {
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            },
          }}
        >
          <ToggleButton value="NEW" aria-label="new registration">
            <Tooltip title={t.registration.alteration.newTooltip}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AddBox />
                {t.registration.alteration.newRegistration}
              </Box>
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="ALTERATION" aria-label="alteration">
            <Tooltip title={t.registration.alteration.alterationTooltip}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Edit />
                {t.registration.alteration.alteration}
              </Box>
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <EmptyState
          type="empty-folder"
          title={t.registration.noTemplatesTitle}
          description={t.registration.noTemplatesDesc}
        />
      ) : (
        <Grid container spacing={3}>
          {templates.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  height: '100%',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    borderColor: operationType === 'NEW' ? 'primary.main' : 'secondary.main',
                    boxShadow: 3,
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardActionArea
                  onClick={() => handleSelectTemplate(template.id)}
                  sx={{ height: '100%', p: 1 }}
                >
                  <CardContent sx={{ height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: operationType === 'NEW' ? 'primary.main' : 'secondary.main',
                          fontSize: '1.25rem',
                          fontWeight: 700,
                        }}
                      >
                        {template.tableName.substring(0, 2).toUpperCase()}
                      </Avatar>
                      <Box sx={{ ml: 'auto' }}>
                        {operationType === 'NEW' ? (
                          <ArrowForward color="action" />
                        ) : (
                          <Search color="action" />
                        )}
                      </Box>
                    </Box>

                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {template.label}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                      <Chip
                        icon={<Description sx={{ fontSize: 16 }} />}
                        label={template.tableName}
                        size="small"
                        variant="outlined"
                        sx={{ borderRadius: 1 }}
                      />
                      {operationType === 'ALTERATION' && (
                        <Chip
                          icon={<Search sx={{ fontSize: 16 }} />}
                          label={t.registration.alteration.searchLabel}
                          size="small"
                          color="secondary"
                          sx={{ borderRadius: 1 }}
                        />
                      )}
                    </Box>

                    {template.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {template.description}
                      </Typography>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};
