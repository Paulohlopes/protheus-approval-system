import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';

interface DocumentStatsProps {
  pendingCount?: number;
  totalCount?: number;
}

const DocumentStats: React.FC<DocumentStatsProps> = ({ 
  pendingCount = 0, 
  totalCount = 0 
}) => {
  const today = new Date().toLocaleDateString('pt-BR');

  const statsCards = [
    {
      title: 'Pendentes',
      value: pendingCount.toString(),
      subtitle: 'Aguardando sua ação',
      bgcolor: 'grey.100',
    },
    {
      title: 'Total',
      value: totalCount.toString(),
      subtitle: 'Documentos listados',
      bgcolor: 'grey.50',
    },
    {
      title: 'Hoje',
      value: today,
      subtitle: 'Data atual',
      bgcolor: 'grey.100',
    },
  ];

  return (
    <Grid container spacing={2} sx={{ mt: 2 }}>
      {statsCards.map((card, index) => (
        <Grid item xs={12} sm={4} key={index}>
          <Paper 
            sx={{ 
              p: 2, 
              textAlign: 'center',
              bgcolor: card.bgcolor,
              border: '1px solid',
              borderColor: 'grey.300'
            }}
          >
            <Typography variant="h5" fontWeight={600} color="text.primary">
              {card.value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {card.subtitle}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default DocumentStats;