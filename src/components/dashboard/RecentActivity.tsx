import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Box,
  Chip,
  Divider,
  Button,
} from '@mui/material';
import {
  PersonAdd,
  MusicNote,
  Receipt,
  Edit,
  Delete,
  Group,
  Event,
} from '@mui/icons-material';

interface ActivityItem {
  id: string;
  type: 'persona' | 'actividad' | 'cuota' | 'reserva' | 'edit' | 'delete';
  title: string;
  description: string;
  time: string;
  user?: string;
  status?: 'success' | 'warning' | 'error' | 'info';
}

export const RecentActivity: React.FC = () => {
  // Mock data - en producción vendría de la API
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'persona',
      title: 'Nuevo socio registrado',
      description: 'María González se registró como socia',
      time: 'Hace 15 min',
      user: 'Admin',
      status: 'success',
    },
    {
      id: '2',
      type: 'actividad',
      title: 'Actividad actualizada',
      description: 'Coro Juvenil - Horario modificado',
      time: 'Hace 1 hora',
      user: 'Juan Pérez',
      status: 'info',
    },
    {
      id: '3',
      type: 'cuota',
      title: 'Cuotas generadas',
      description: 'Cuotas de Octubre 2025 creadas',
      time: 'Hace 2 horas',
      user: 'Sistema',
      status: 'success',
    },
    {
      id: '4',
      type: 'reserva',
      title: 'Reserva de aula',
      description: 'Aula 1 reservada para ensayo',
      time: 'Hace 3 horas',
      user: 'Ana López',
      status: 'info',
    },
    {
      id: '5',
      type: 'edit',
      title: 'Datos actualizados',
      description: 'Información de contacto modificada',
      time: 'Hace 4 horas',
      user: 'Carlos Ruiz',
      status: 'warning',
    },
  ];

  const getIcon = (type: string) => {
    const iconMap = {
      persona: <PersonAdd />,
      actividad: <MusicNote />,
      cuota: <Receipt />,
      reserva: <Event />,
      edit: <Edit />,
      delete: <Delete />,
    };
    return iconMap[type as keyof typeof iconMap] || <Group />;
  };

  const getAvatarColor = (status?: string) => {
    const colorMap = {
      success: '#2e7d32',
      warning: '#ed6c02',
      error: '#d32f2f',
      info: '#0288d1',
    };
    return colorMap[status as keyof typeof colorMap] || '#1976d2';
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">
          Actividad Reciente
        </Typography>
        <Button size="small" color="primary">
          Ver todo
        </Button>
      </Box>

      <List sx={{ p: 0 }}>
        {activities.map((activity, index) => (
          <React.Fragment key={activity.id}>
            <ListItem
              sx={{
                px: 0,
                py: 1.5,
                alignItems: 'flex-start',
              }}
            >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor: getAvatarColor(activity.status),
                    width: 36,
                    height: 36,
                  }}
                >
                  {getIcon(activity.type)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1} component="div">
                    <Typography variant="subtitle2" component="span">
                      {activity.title}
                    </Typography>
                    {activity.status && (
                      <Chip
                        label={activity.status}
                        size="small"
                        color={activity.status as any}
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.6875rem' }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box component="span">
                    <Typography
                      variant="body2"
                      component="span"
                      color="text.secondary"
                      sx={{ mb: 0.5, display: 'block' }}
                    >
                      {activity.description}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center" component="span" sx={{ display: 'flex' }}>
                      <Typography variant="caption" component="span" color="text.secondary">
                        {formatTime(activity.time)}
                      </Typography>
                      {activity.user && (
                        <Typography variant="caption" component="span" color="primary">
                          {activity.user}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                }
              />
            </ListItem>
            {index < activities.length - 1 && (
              <Divider variant="inset" component="li" sx={{ ml: 6 }} />
            )}
          </React.Fragment>
        ))}
      </List>

      {activities.length === 0 && (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={4}
        >
          <Typography variant="body2" color="text.secondary" align="center">
            No hay actividad reciente
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default RecentActivity;