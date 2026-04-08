import React from 'react';
import {
  Paper,
  Typography,
  Button,
  Box,
  Avatar,
  Stack,
} from '@mui/material';
import {
  PersonAdd,
  MusicNote,
  Room,
  Receipt,
  TrendingUp,
  Settings,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  badge?: string | number;
}

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      title: 'Nueva Persona',
      description: 'Registrar socio, docente o estudiante',
      icon: <PersonAdd />,
      path: '/personas',
      color: '#1976d2',
    },
    {
      title: 'Nueva Actividad',
      description: 'Crear coro, clase o taller',
      icon: <MusicNote />,
      path: '/actividades',
      color: '#9c27b0',
    },
    {
      title: 'Gestionar Aulas',
      description: 'Ver disponibilidad y reservas',
      icon: <Room />,
      path: '/aulas',
      color: '#2e7d32',
    },
    {
      title: 'Generar Cuotas',
      description: 'Crear cuotas mensuales',
      icon: <Receipt />,
      path: '/cuotas',
      color: '#ed6c02',
    },
    {
      title: 'Ver Reportes',
      description: 'Estadísticas y análisis',
      icon: <TrendingUp />,
      path: '/reportes',
      color: '#0288d1',
    },
    {
      title: 'Configuración',
      description: 'Ajustes del sistema',
      icon: <Settings />,
      path: '/configuracion',
      color: '#5d4037',
    },
  ];

  const handleActionClick = (path: string) => {
    navigate(path);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Accesos Rápidos
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Accede rápidamente a las funcionalidades más utilizadas
      </Typography>

      <Stack direction="row" flexWrap="wrap" gap={2}>
        {actions.map((action, index) => (
          <Box key={index} minWidth={200} flex={1}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleActionClick(action.path)}
              sx={{
                p: 2,
                height: 'auto',
                justifyContent: 'flex-start',
                textAlign: 'left',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: action.color,
                  backgroundColor: `${action.color}08`,
                },
              }}
            >
              <Box display="flex" alignItems="center" width="100%">
                <Avatar
                  sx={{
                    bgcolor: action.color,
                    width: 40,
                    height: 40,
                    mr: 2,
                  }}
                >
                  {action.icon}
                </Avatar>
                <Box flex={1}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: 0.5,
                    }}
                  >
                    {action.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      display: 'block',
                    }}
                  >
                    {action.description}
                  </Typography>
                </Box>
                {action.badge && (
                  <Avatar
                    sx={{
                      bgcolor: 'error.main',
                      width: 20,
                      height: 20,
                      fontSize: '0.75rem',
                    }}
                  >
                    {action.badge}
                  </Avatar>
                )}
              </Box>
            </Button>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
};

export default QuickActions;