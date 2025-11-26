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
} from '@mui/material';
import {
  AddBox,
  Description,
  ArrowForward,
} from '@mui/icons-material';
import { registrationService } from '../../services/registrationService';
import { toast } from '../../utils/toast';
import type { FormTemplate } from '../../types/registration';
import { EmptyState } from '../../components/EmptyState';

export const SelectRegistrationTypePage = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);

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
      toast.error('Erro ao carregar tipos de cadastro. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    navigate(`/registration/new/${templateId}`);
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
          <AddBox fontSize="large" color="primary" />
          <Typography variant="h4" component="h1" fontWeight={600}>
            Novo Cadastro
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Selecione o tipo de cadastro que deseja realizar
        </Typography>
      </Box>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <EmptyState
          type="empty-folder"
          title="Nenhum tipo de cadastro disponível"
          description="Não há tipos de cadastro configurados no momento. Entre em contato com o administrador."
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
                    borderColor: 'primary.main',
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
                          bgcolor: 'primary.main',
                          fontSize: '1.25rem',
                          fontWeight: 700,
                        }}
                      >
                        {template.tableName.substring(0, 2).toUpperCase()}
                      </Avatar>
                      <Box sx={{ ml: 'auto' }}>
                        <ArrowForward color="action" />
                      </Box>
                    </Box>

                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {template.label}
                    </Typography>

                    <Chip
                      icon={<Description sx={{ fontSize: 16 }} />}
                      label={template.tableName}
                      size="small"
                      variant="outlined"
                      sx={{ mb: 1.5, borderRadius: 1 }}
                    />

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
