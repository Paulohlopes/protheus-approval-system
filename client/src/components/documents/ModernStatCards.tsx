import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  useTheme,
  alpha,
  Skeleton,
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  Schedule,
  TrendingUp,
  MoreVert,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient: string;
  delay?: number;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  gradient,
  delay = 0,
  loading = false,
}) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="rectangular" width={48} height={48} sx={{ borderRadius: 2, mb: 2 }} />
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="80%" height={40} />
          <Skeleton variant="text" width="40%" height={20} />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -8 }}
    >
      <Card
        sx={{
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          background: theme.palette.background.paper,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          '&:hover': {
            boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
            '& .stat-icon': {
              transform: 'rotate(15deg) scale(1.1)',
            },
            '& .gradient-bg': {
              opacity: 0.15,
            },
          },
        }}
      >
        {/* Background Gradient */}
        <Box
          className="gradient-bg"
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200%',
            height: '200%',
            background: gradient,
            opacity: 0.08,
            transition: 'opacity 0.3s ease',
            transform: 'translate(30%, -30%) rotate(25deg)',
            borderRadius: '30%',
          }}
        />

        <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box
              className="stat-icon"
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                background: gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <Box sx={{ color: 'white', display: 'flex' }}>
                {icon}
              </Box>
            </Box>
            <IconButton size="small" sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}>
              <MoreVert fontSize="small" />
            </IconButton>
          </Box>

          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 500,
              mb: 1,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '0.75rem',
            }}
          >
            {title}
          </Typography>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: theme.palette.text.primary,
              mb: 1,
              background: gradient,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {value}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {trend && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  background: trend.isPositive
                    ? alpha(theme.palette.success.main, 0.1)
                    : alpha(theme.palette.error.main, 0.1),
                }}
              >
                {trend.isPositive ? (
                  <ArrowUpward sx={{ fontSize: 16, color: theme.palette.success.main }} />
                ) : (
                  <ArrowDownward sx={{ fontSize: 16, color: theme.palette.error.main }} />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: trend.isPositive ? theme.palette.success.main : theme.palette.error.main,
                  }}
                >
                  {Math.abs(trend.value)}%
                </Typography>
              </Box>
            )}
            {subtitle && (
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface ModernStatCardsProps {
  pendingCount?: number;
  totalCount?: number;
  approvedToday?: number;
  rejectedToday?: number;
  loading?: boolean;
}

const ModernStatCards: React.FC<ModernStatCardsProps> = ({
  pendingCount = 0,
  totalCount = 0,
  approvedToday = 0,
  rejectedToday = 0,
  loading = false,
}) => {
  const theme = useTheme();

  const stats = [
    {
      title: 'Documentos Pendentes',
      value: pendingCount.toString(),
      subtitle: 'Aguardando aprovação',
      icon: <Schedule sx={{ fontSize: 28 }} />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      trend: { value: 12, isPositive: false },
    },
    {
      title: 'Total de Documentos',
      value: totalCount.toString(),
      subtitle: 'Este mês',
      icon: <Assignment sx={{ fontSize: 28 }} />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      trend: { value: 8, isPositive: true },
    },
    {
      title: 'Aprovados Hoje',
      value: approvedToday.toString(),
      subtitle: 'Documentos aprovados',
      icon: <CheckCircle sx={{ fontSize: 28 }} />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      trend: { value: 15, isPositive: true },
    },
    {
      title: 'Taxa de Aprovação',
      value: totalCount > 0 ? `${Math.round((approvedToday / totalCount) * 100)}%` : '0%',
      subtitle: 'Média do mês',
      icon: <TrendingUp sx={{ fontSize: 28 }} />,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      trend: { value: 5, isPositive: true },
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} lg={3} key={index}>
          <StatCard {...stat} delay={index * 0.1} loading={loading} />
        </Grid>
      ))}
    </Grid>
  );
};

export default ModernStatCards;