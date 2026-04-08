import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Badge,
  Collapse,
  Button,
  Chip,
  Alert,
} from '@mui/material';
import {
  Warning,
  Info,
  Error,
  CheckCircle,
  ExpandMore,
  ExpandLess,
  Close,
  NotificationsActive,
} from '@mui/icons-material';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionLabel?: string;
  onAction?: () => void;
}

export const NotificationWidget: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'warning',
      title: 'Cuotas vencidas',
      message: '15 socios tienen cuotas vencidas del mes anterior',
      timestamp: '2025-09-27T08:30:00',
      read: false,
      priority: 'high',
      actionLabel: 'Ver detalles',
      onAction: () => console.log('Ver cuotas vencidas'),
    },
    {
      id: '2',
      type: 'info',
      title: 'Nuevas inscripciones',
      message: '3 nuevas inscripciones para el Coro Juvenil',
      timestamp: '2025-09-27T10:15:00',
      read: false,
      priority: 'medium',
      actionLabel: 'Revisar',
      onAction: () => console.log('Ver inscripciones'),
    },
    {
      id: '3',
      type: 'success',
      title: 'Backup completado',
      message: 'Respaldo de seguridad realizado exitosamente',
      timestamp: '2025-09-27T06:00:00',
      read: true,
      priority: 'low',
    },
    {
      id: '4',
      type: 'error',
      title: 'Error de sincronización',
      message: 'Problema al sincronizar datos con el servidor',
      timestamp: '2025-09-26T22:45:00',
      read: false,
      priority: 'high',
      actionLabel: 'Reintentar',
      onAction: () => console.log('Reintentar sincronización'),
    },
    {
      id: '5',
      type: 'info',
      title: 'Mantenimiento programado',
      message: 'Mantenimiento del sistema programado para el próximo domingo',
      timestamp: '2025-09-26T14:20:00',
      read: true,
      priority: 'medium',
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    const iconMap = {
      info: <Info color="info" />,
      warning: <Warning color="warning" />,
      error: <Error color="error" />,
      success: <CheckCircle color="success" />,
    };
    return iconMap[type as keyof typeof iconMap] || <Info />;
  };

  const getPriorityColor = (priority: string) => {
    const colorMap = {
      low: 'default',
      medium: 'primary',
      high: 'error',
    };
    return colorMap[priority as keyof typeof colorMap] || 'default';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return `Hace ${diffMinutes} min`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours}h`;
    } else {
      return date.toLocaleDateString('es-AR');
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        p={2}
        pb={0}
      >
        <Box display="flex" alignItems="center">
          <Badge badgeContent={unreadCount} color="error" sx={{ mr: 1 }}>
            <NotificationsActive color={unreadCount > 0 ? 'primary' : 'disabled'} />
          </Badge>
          <Typography variant="h6">
            Notificaciones
          </Typography>
        </Box>
        <Box>
          {unreadCount > 0 && (
            <Button size="small" onClick={markAllAsRead}>
              Marcar todo como leído
            </Button>
          )}
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      </Box>

      {/* Mostrar siempre las notificaciones de alta prioridad */}
      <Box sx={{ p: 2, pt: 1 }}>
        {notifications
          .filter(n => n.priority === 'high' && !n.read)
          .map(notification => (
            <Alert
              key={notification.id}
              severity={notification.type}
              action={
                <IconButton
                  size="small"
                  onClick={() => dismissNotification(notification.id)}
                >
                  <Close fontSize="inherit" />
                </IconButton>
              }
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle2">
                {notification.title}
              </Typography>
              <Typography variant="body2">
                {notification.message}
              </Typography>
            </Alert>
          ))
        }
      </Box>

      <Collapse in={expanded}>
        <Box flex={1} sx={{ maxHeight: 400, overflow: 'auto' }}>
          <List dense>
            {notifications.map((notification) => (
              <ListItem
                key={notification.id}
                sx={{
                  bgcolor: notification.read ? 'transparent' : 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' },
                }}
              >
                <ListItemIcon>
                  {getIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1} component="div">
                      <Typography
                        variant="subtitle2"
                        component="span"
                        sx={{
                          fontWeight: notification.read ? 400 : 600,
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <Chip
                        label={notification.priority}
                        size="small"
                        color={getPriorityColor(notification.priority) as any}
                        variant="outlined"
                        sx={{ height: 16, fontSize: '0.6875rem' }}
                      />
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
                        {notification.message}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center" component="span" sx={{ display: 'flex' }}>
                        <Typography variant="caption" component="span" color="text.secondary">
                          {formatTime(notification.timestamp)}
                        </Typography>
                        <Box component="span" sx={{ display: 'flex', gap: 1 }}>
                          {!notification.read && (
                            <Button
                              size="small"
                              onClick={() => markAsRead(notification.id)}
                            >
                              Marcar como leído
                            </Button>
                          )}
                          {notification.actionLabel && notification.onAction && (
                            <Button
                              size="small"
                              color="primary"
                              onClick={notification.onAction}
                            >
                              {notification.actionLabel}
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Collapse>

      {!expanded && notifications.length > 0 && (
        <Box p={2} pt={0}>
          <Typography variant="caption" color="text.secondary">
            {unreadCount > 0
              ? `${unreadCount} notificaciones sin leer`
              : 'Todas las notificaciones leídas'
            }
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default NotificationWidget;