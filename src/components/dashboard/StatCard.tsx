import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
} from '@mui/material';
import { TrendingUp, TrendingDown, Remove } from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  loading?: boolean;
  onClick?: () => void;
  gradient?: string;
}

export const StatCard: React.FC<StatCardProps> = React.memo(({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'primary',
  loading = false,
  onClick,
  gradient,
}) => {
  const getColorValues = (color: string) => {
    const colorMap = {
      primary: { main: '#1976d2', light: '#42a5f5', dark: '#1565c0' },
      secondary: { main: '#9c27b0', light: '#ba68c8', dark: '#7b1fa2' },
      success: { main: '#2e7d32', light: '#66bb6a', dark: '#1b5e20' },
      warning: { main: '#ed6c02', light: '#ffb74d', dark: '#e65100' },
      error: { main: '#d32f2f', light: '#f44336', dark: '#c62828' },
      info: { main: '#0288d1', light: '#29b6f6', dark: '#0277bd' },
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.primary;
  };

  const colors = getColorValues(color);
  const defaultGradient = `linear-gradient(135deg, ${colors.light} 0%, ${colors.main} 100%)`;

  if (loading) {
    return (
      <Card sx={{ height: '100%', minHeight: 140 }}>
        <CardContent>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={48} sx={{ my: 1 }} />
          <Skeleton variant="text" width="50%" height={20} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        minHeight: 140,
        background: gradient || defaultGradient,
        color: 'white',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        } : {},
      }}
      onClick={onClick}
    >
      <CardContent sx={{ position: 'relative', height: '100%' }}>
        {icon && (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              opacity: 0.7,
              fontSize: '2rem',
            }}
          >
            {icon}
          </Box>
        )}

        <Typography
          variant="subtitle2"
          sx={{
            opacity: 0.9,
            fontWeight: 500,
            mb: 1,
            pr: icon ? 5 : 0,
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="h3"
          sx={{
            fontWeight: 'bold',
            mb: 1,
            fontSize: { xs: '1.75rem', sm: '2.125rem' },
          }}
        >
          {value}
        </Typography>

        {subtitle && (
          <Typography
            variant="body2"
            sx={{
              opacity: 0.8,
              mb: trend ? 1 : 0,
            }}
          >
            {subtitle}
          </Typography>
        )}

        {trend && (
          <Box
            display="flex"
            alignItems="center"
            sx={{ opacity: 0.9 }}
          >
            {trend.value > 0 ? (
              <TrendingUp sx={{ fontSize: '1rem', mr: 0.5 }} />
            ) : trend.value < 0 ? (
              <TrendingDown sx={{ fontSize: '1rem', mr: 0.5 }} />
            ) : (
              <Remove sx={{ fontSize: '1rem', mr: 0.5 }} />
            )}
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              {Math.abs(trend.value)}%
              {trend.label && ` ${trend.label}`}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

export default StatCard;