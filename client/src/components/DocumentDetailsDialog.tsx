import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider
} from '@mui/material';
import { formatProtheusDate } from '../utils/dateFormatter';

interface DocumentField {
  label: string;
  value: string | number | undefined | null;
  type?: 'text' | 'currency' | 'number' | 'date' | 'monospace' | 'chip';
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  bold?: boolean;
}

interface DocumentSection {
  title: string;
  fields: DocumentField[];
  gridSize?: number;
}

interface DocumentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  sections: DocumentSection[];
  actions?: React.ReactNode;
}

const formatValue = (field: DocumentField): string | React.ReactNode => {
  const { value, type } = field;
  
  if (value === null || value === undefined) return 'N/A';
  
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(Number(value) || 0);
    
    case 'number':
      return Number(value).toLocaleString('pt-BR');
    
    case 'date':
      return formatProtheusDate(String(value));
    
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
        >
          {String(value)}
        </Typography>
      );
    
    default:
      return String(value);
  }
};

const FieldDisplay: React.FC<{ field: DocumentField }> = ({ field }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="body2" color="text.secondary" gutterBottom>
      {field.label}
    </Typography>
    <Typography 
      variant="body1" 
      fontWeight={field.bold ? 'bold' : 'normal'}
      color={field.color ? `${field.color}.main` : 'text.primary'}
    >
      {formatValue(field)}
    </Typography>
  </Box>
);

export const DocumentDetailsDialog: React.FC<DocumentDetailsDialogProps> = ({
  open,
  onClose,
  title,
  subtitle,
  icon,
  sections,
  actions
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        elevation: 3,
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {icon}
          <Box>
            <Typography variant="h5" component="div">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {sections.map((section, sectionIndex) => (
            <Grid 
              item 
              xs={12} 
              md={section.gridSize || 6} 
              key={sectionIndex}
            >
              <Card 
                variant="outlined" 
                sx={{ 
                  height: '100%',
                  borderRadius: 2,
                  '&:hover': {
                    boxShadow: 2,
                    transition: 'box-shadow 0.3s ease-in-out'
                  }
                }}
              >
                <CardContent>
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    color="primary"
                    sx={{ 
                      mb: 2,
                      pb: 1,
                      borderBottom: '2px solid',
                      borderColor: 'divider'
                    }}
                  >
                    {section.title}
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    {section.fields.map((field, fieldIndex) => (
                      <FieldDisplay key={fieldIndex} field={field} />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ p: 2, px: 3 }}>
        {actions}
        <Button 
          onClick={onClose}
          variant="outlined"
          color="primary"
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};