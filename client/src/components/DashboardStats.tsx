import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  Cancel,
  PriorityHigh,
  Schedule,
} from '@mui/icons-material';
import { useDashboardStats } from '../hooks/useDocuments';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, loading }) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={60} height={32} />
            ) : (
              <Typography variant="h4" component="div">
                {value.toLocaleString()}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
            }}
          >
            {React.cloneElement(icon as React.ReactElement, { 
              sx: { color: 'white', fontSize: 24 }
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const DashboardStats: React.FC = () => {
  const { data: stats, isLoading, error } = useDashboardStats();

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error" align="center">
            Erro ao carregar estatísticas: {error.message}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const statsData = [
    {
      title: 'Pendentes',
      value: stats?.totalPending || 0,
      icon: <Assignment />,
      color: '#FF9800', // orange
    },
    {
      title: 'Aprovados',
      value: stats?.totalApproved || 0,
      icon: <CheckCircle />,
      color: '#4CAF50', // green
    },
    {
      title: 'Rejeitados',
      value: stats?.totalRejected || 0,
      icon: <Cancel />,
      color: '#F44336', // red
    },
    {
      title: 'Alta Prioridade',
      value: stats?.highPriority || 0,
      icon: <PriorityHigh />,
      color: '#9C27B0', // purple
    },
    {
      title: 'Vencendo Hoje',
      value: stats?.expiringSoon || 0,
      icon: <Schedule />,
      color: '#FF5722', // deep orange
    },
  ];

  return (
    <Grid container spacing={3}>
      {statsData.map((stat, index) => (
        <Grid item xs={12} sm={6} md={2.4} key={index}>
          <StatCard
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            loading={isLoading}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default DashboardStats;