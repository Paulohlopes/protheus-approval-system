import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  Divider,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import { Visibility, MoreVert } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';

export interface CardField {
  label: string;
  value: any;
  format?: 'text' | 'currency' | 'date' | 'number' | 'chip' | 'monospace';
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  bold?: boolean;
  icon?: React.ReactNode;
}

export interface CardSection {
  fields: CardField[];
  direction?: 'row' | 'column';
}

interface DocumentCardProps {
  title: string;
  subtitle?: string;
  badge?: {
    label: string;
    color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'default';
  };
  icon?: React.ReactNode;
  sections: CardSection[];
  onViewDetails?: () => void;
  actions?: React.ReactNode;
  elevation?: number;
  highlight?: boolean;
}

const formatValue = (field: CardField): string | React.ReactNode => {
  const { value, format } = field;
  
  if (value === null || value === undefined) return '-';
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(Number(value) || 0);
    
    case 'number':
      return Number(value).toLocaleString('pt-BR');
    
    case 'date':
      // Assumindo formato YYYYMMDD do Protheus
      const dateStr = String(value);
      if (dateStr.length === 8) {
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        return `${day}/${month}/${year}`;
      }
      return dateStr;
    
    case 'chip':
      return (
        <Chip 
          label={String(value)} 
          size="small" 
          color={field.color || 'default'}
          variant="outlined"
        />
      );
    
    case 'monospace':
      return (
        <Typography 
          component="span" 
          fontFamily="monospace"
          fontWeight={field.bold ? 'bold' : 'normal'}
          color={field.color ? `${field.color}.main` : undefined}
        >
          {String(value)}
        </Typography>
      );
    
    default:
      return String(value);
  }
};

export const DocumentCard: React.FC<DocumentCardProps> = ({
  title,
  subtitle,
  badge,
  icon,
  sections,
  onViewDetails,
  actions,
  elevation = 1,
  highlight = false
}) => {
  const { t } = useLanguage();
  return (
    <Card 
      elevation={elevation}
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.3s ease',
        border: highlight ? 2 : 1,
        borderColor: highlight ? 'primary.main' : 'divider',
        '&:hover': {
          elevation: elevation + 2,
          transform: 'translateY(-2px)',
          boxShadow: 3
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          pb: 1,
          background: (theme) => 
            `linear-gradient(135deg, ${theme.palette.primary.light}15 0%, ${theme.palette.primary.light}05 100%)`
        }}
      >
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ flex: 1 }}>
            {icon && (
              <Box sx={{ color: 'primary.main', mt: 0.5 }}>
                {icon}
              </Box>
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" component="div" gutterBottom>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Stack>
          {badge && (
            <Chip 
              label={badge.label}
              size="small"
              color={badge.color || 'default'}
              variant="filled"
            />
          )}
        </Stack>
      </Box>

      <Divider />

      {/* Content */}
      <CardContent sx={{ flex: 1, py: 2 }}>
        <Stack spacing={2}>
          {sections.map((section, sectionIndex) => (
            <Stack 
              key={sectionIndex}
              direction={section.direction || 'column'}
              spacing={section.direction === 'row' ? 2 : 1}
              divider={section.direction === 'row' ? 
                <Divider orientation="vertical" flexItem /> : 
                undefined
              }
            >
              {section.fields.map((field, fieldIndex) => (
                <Box key={fieldIndex} sx={{ flex: section.direction === 'row' ? 1 : undefined }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {field.icon}
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}
                    >
                      {field.label}
                    </Typography>
                  </Stack>
                  <Typography 
                    variant="body2" 
                    fontWeight={field.bold ? 'bold' : 'normal'}
                    color={field.color ? `${field.color}.main` : 'text.primary'}
                    sx={{ mt: 0.5 }}
                  >
                    {formatValue(field)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ))}
        </Stack>
      </CardContent>

      {/* Actions */}
      {(onViewDetails || actions) && (
        <>
          <Divider />
          <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
            <Box>{actions}</Box>
            {onViewDetails && (
              <Button 
                size="small" 
                startIcon={<Visibility />}
                onClick={onViewDetails}
                variant="text"
                color="primary"
              >
                {t?.common?.details || 'Ver Detalhes'}
              </Button>
            )}
          </CardActions>
        </>
      )}
    </Card>
  );
};

export default DocumentCard;