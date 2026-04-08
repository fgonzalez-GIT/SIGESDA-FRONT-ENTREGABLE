import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { hideNotification } from '../../store/slices/uiSlice';

/**
 * Componente global de notificaciones conectado a Redux
 * Muestra mensajes de éxito, error, warning e info
 * Se auto-cierra después de 5 segundos
 */
export const GlobalNotification: React.FC = () => {
  const dispatch = useAppDispatch();
  const { notification } = useAppSelector((state) => state.ui);

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    // No cerrar si el usuario hizo clic fuera del snackbar
    if (reason === 'clickaway') {
      return;
    }
    dispatch(hideNotification());
  };

  return (
    <Snackbar
      open={notification.open}
      autoHideDuration={5000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    >
      <Alert
        onClose={handleClose}
        severity={notification.severity}
        variant="filled"
        sx={{ width: '100%' }}
        elevation={6}
      >
        {notification.message}
      </Alert>
    </Snackbar>
  );
};

export default GlobalNotification;
