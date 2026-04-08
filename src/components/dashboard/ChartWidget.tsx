import React from 'react';
import {
  Paper,
  Typography,
  Box,
  useTheme,
  Skeleton,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { MoreVert } from '@mui/icons-material';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface ChartWidgetProps {
  title: string;
  subtitle?: string;
  data: ChartData[];
  type: 'bar' | 'pie' | 'line' | 'donut';
  loading?: boolean;
  height?: number;
  showLegend?: boolean;
  onExport?: () => void;
}

export const ChartWidget: React.FC<ChartWidgetProps> = React.memo(({
  title,
  subtitle,
  data,
  type,
  loading = false,
  height = 300,
  showLegend = true,
  onExport,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuClick = React.useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = React.useCallback(() => {
    setAnchorEl(null);
  }, []);

  const colors = React.useMemo(() => [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
  ], [theme]);

  const getBarChart = React.useCallback(() => {
    const maxValue = Math.max(...data.map(d => d.value));

    return (
      <Box sx={{ p: 2 }}>
        {data.map((item, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2">{item.label}</Typography>
              <Typography variant="body2" fontWeight="bold">
                {item.value}
              </Typography>
            </Box>
            <Box
              sx={{
                width: '100%',
                height: 8,
                bgcolor: 'grey.200',
                borderRadius: 1,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: `${(item.value / maxValue) * 100}%`,
                  height: '100%',
                  bgcolor: item.color || colors[index % colors.length],
                  transition: 'width 0.5s ease-in-out',
                }}
              />
            </Box>
          </Box>
        ))}
      </Box>
    );
  }, [data, colors]);

  const getPieChart = React.useCallback(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    // Si no hay datos, mostrar mensaje
    if (total === 0) {
      return (
        <Box display="flex" alignItems="center" justifyContent="center" sx={{ p: 2, height: '100%' }}>
          <Typography variant="body2" color="text.secondary">
            No hay datos para mostrar
          </Typography>
        </Box>
      );
    }

    let cumulativePercentage = 0;

    return (
      <Box display="flex" alignItems="center" sx={{ p: 2 }}>
        <Box sx={{ position: 'relative', mr: 3 }}>
          <svg width="120" height="120" viewBox="0 0 42 42">
            <circle
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke={theme.palette.grey[200]}
              strokeWidth="3"
            />
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = -cumulativePercentage;
              cumulativePercentage += percentage;

              return (
                <circle
                  key={index}
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke={item.color || colors[index % colors.length]}
                  strokeWidth="3"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={String(strokeDashoffset)}
                  transform="rotate(-90 21 21)"
                />
              );
            })}
          </svg>
        </Box>
        {showLegend && (
          <Box flex={1}>
            {data.map((item, index) => (
              <Box key={index} display="flex" alignItems="center" mb={1}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    bgcolor: item.color || colors[index % colors.length],
                    borderRadius: '50%',
                    mr: 1,
                  }}
                />
                <Typography variant="body2" sx={{ mr: 1 }}>
                  {item.label}
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {item.value} ({((item.value / total) * 100).toFixed(1)}%)
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  }, [data, colors, theme, showLegend]);

  const getLineChart = React.useCallback(() => {
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;

    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 280 + 20;
      const y = 180 - ((item.value - minValue) / range) * 140 + 20;
      return `${x},${y}`;
    }).join(' ');

    return (
      <Box sx={{ p: 2 }}>
        <svg width="100%" height="200" viewBox="0 0 320 200">
          <polyline
            fill="none"
            stroke={theme.palette.primary.main}
            strokeWidth="2"
            points={points}
          />
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 280 + 20;
            const y = 180 - ((item.value - minValue) / range) * 140 + 20;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill={theme.palette.primary.main}
              />
            );
          })}
        </svg>
        <Box display="flex" justifyContent="space-between" mt={1}>
          {data.map((item, index) => (
            <Typography key={index} variant="caption" color="text.secondary">
              {item.label}
            </Typography>
          ))}
        </Box>
      </Box>
    );
  }, [data, theme]);

  const renderChart = React.useCallback(() => {
    switch (type) {
      case 'bar':
        return getBarChart();
      case 'pie':
      case 'donut':
        return getPieChart();
      case 'line':
        return getLineChart();
      default:
        return getBarChart();
    }
  }, [type, getBarChart, getPieChart, getLineChart]);

  if (loading) {
    return (
      <Paper sx={{ p: 3, height }}>
        <Skeleton variant="text" width="60%" height={32} />
        {subtitle && <Skeleton variant="text" width="40%" height={20} />}
        <Skeleton variant="rectangular" width="100%" height={height - 120} sx={{ mt: 2 }} />
      </Paper>
    );
  }

  return (
    <Paper sx={{ height, display: 'flex', flexDirection: 'column' }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        p={2}
        pb={0}
      >
        <Box>
          <Typography variant="h6">{title}</Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {onExport && (
          <IconButton size="small" onClick={handleMenuClick}>
            <MoreVert />
          </IconButton>
        )}
      </Box>

      <Box flex={1} display="flex" flexDirection="column">
        {data.length > 0 ? (
          renderChart()
        ) : (
          <Box
            flex={1}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Typography variant="body2" color="text.secondary">
              No hay datos disponibles
            </Typography>
          </Box>
        )}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { onExport?.(); handleMenuClose(); }}>
          Exportar datos
        </MenuItem>
      </Menu>
    </Paper>
  );
});

export default ChartWidget;