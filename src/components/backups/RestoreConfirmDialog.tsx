/**
 * Diálogo de confirmación para restaurar un backup
 *
 * ⚠️ OPERACIÓN DESTRUCTIVA
 * Requiere confirmación doble: usuario debe escribir "RESTAURAR" exactamente
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Restore as RestoreIcon,
} from '@mui/icons-material';
import { formatDateTimeES } from '@/utils/dateHelpers';
import type { BackupMetadata } from '@/types/backup.types';

interface RestoreConfirmDialogProps {
  /** Controla si el diálogo está abierto */
  open: boolean;

  /** Callback cuando se cierra el diálogo */
  onClose: () => void;

  /** Callback cuando se confirma la restauración */
  onConfirm: () => Promise<void>;

  /** Backup seleccionado para restaurar */
  backup: BackupMetadata | null;

  /** Indica si se está ejecutando el restore */
  isLoading?: boolean;
}

/**
 * Diálogo de confirmación destructiva para restore
 */
export function RestoreConfirmDialog({
  open,
  onClose,
  onConfirm,
  backup,
  isLoading = false,
}: RestoreConfirmDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const REQUIRED_TEXT = 'RESTAURAR';
  const isConfirmValid = confirmText === REQUIRED_TEXT;

  /**
   * Resetea el texto de confirmación cuando se abre/cierra el diálogo
   */
  useEffect(() => {
    if (!open) {
      setConfirmText('');
    }
  }, [open]);

  /**
   * Maneja la confirmación de restauración
   */
  const handleConfirm = async () => {
    if (isConfirmValid) {
      await onConfirm();
    }
  };

  /**
   * Maneja el cierre del diálogo
   */
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  /**
   * Maneja el Enter en el input de confirmación
   */
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && isConfirmValid && !isLoading) {
      handleConfirm();
    }
  };

  if (!backup) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={isLoading}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon sx={{ fontSize: 32, color: 'error.main' }} />
          <Typography variant="h5" color="error.main" fontWeight="bold">
            ⚠️ ADVERTENCIA: OPERACIÓN DESTRUCTIVA
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Pregunta principal */}
        <Typography variant="h6" paragraph>
          ¿Está seguro que desea restaurar el backup?
        </Typography>

        {/* Info del backup seleccionado */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            bgcolor: 'grey.100',
            borderRadius: 1,
            mb: 3,
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Archivo:</strong>
          </Typography>
          <Typography variant="body1" fontFamily="monospace" gutterBottom>
            {backup.filename}
          </Typography>

          <Box display="flex" gap={3} mt={1}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                <strong>Creado:</strong>
              </Typography>
              <Typography variant="body2">
                {formatDateTimeES(backup.createdAt)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                <strong>Tamaño:</strong>
              </Typography>
              <Typography variant="body2">{backup.sizeFormatted}</Typography>
            </Box>
          </Box>
        </Paper>

        {/* Advertencia grande */}
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight="bold" gutterBottom>
            TODOS LOS DATOS ACTUALES SERÁN REEMPLAZADOS
          </Typography>
          <Typography variant="body2">
            Esta acción NO se puede deshacer. La base de datos volverá al
            estado del backup seleccionado, perdiendo todos los cambios
            realizados después de esa fecha.
          </Typography>
        </Alert>

        {/* Información adicional */}
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" component="div">
            <strong>Durante el proceso de restauración:</strong>
            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
              <li>Se cerrarán todas las conexiones activas a la base de datos</li>
              <li>El sistema puede no responder por 5-30 segundos</li>
              <li>NO cierre esta ventana hasta que se complete el proceso</li>
              <li>Al finalizar, se recomienda recargar la aplicación</li>
            </ul>
          </Typography>
        </Alert>

        {/* Input de confirmación */}
        {!isLoading && (
          <Box>
            <Typography variant="body2" gutterBottom>
              Para confirmar, escriba <strong>{REQUIRED_TEXT}</strong>{' '}
              exactamente:
            </Typography>
            <TextField
              fullWidth
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Escriba ${REQUIRED_TEXT}`}
              variant="outlined"
              autoFocus
              error={confirmText.length > 0 && !isConfirmValid}
              helperText={
                confirmText.length > 0 && !isConfirmValid
                  ? 'Debe escribir exactamente "RESTAURAR" en mayúsculas'
                  : ''
              }
              disabled={isLoading}
              sx={{ mt: 1 }}
            />
          </Box>
        )}

        {/* Loading state durante restore */}
        {isLoading && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={2}
            py={3}
          >
            <CircularProgress size={48} />
            <Typography variant="h6" color="primary">
              Restaurando base de datos...
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Por favor no cierre esta ventana.
              <br />
              Esto puede tardar hasta 30 segundos.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          disabled={isLoading}
          color="inherit"
          size="large"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!isConfirmValid || isLoading}
          variant="contained"
          color="error"
          size="large"
          startIcon={
            isLoading ? <CircularProgress size={16} /> : <RestoreIcon />
          }
        >
          {isLoading ? 'Restaurando...' : 'Confirmar Restauración'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default RestoreConfirmDialog;
