/**
 * Diálogo para crear un nuevo backup de la base de datos
 *
 * Modal simple de confirmación para crear backup
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Backup as BackupIcon } from '@mui/icons-material';

interface CreateBackupDialogProps {
  /** Controla si el diálogo está abierto */
  open: boolean;

  /** Callback cuando se cierra el diálogo */
  onClose: () => void;

  /** Callback cuando se confirma la creación */
  onConfirm: () => Promise<void>;

  /** Indica si se está creando el backup */
  isLoading?: boolean;
}

/**
 * Diálogo de confirmación para crear backup
 */
export function CreateBackupDialog({
  open,
  onClose,
  onConfirm,
  isLoading = false,
}: CreateBackupDialogProps) {
  /**
   * Maneja la confirmación de creación
   */
  const handleConfirm = async () => {
    await onConfirm();
  };

  /**
   * Maneja el cierre del diálogo
   */
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isLoading}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <BackupIcon color="primary" />
          <Typography variant="h6">Crear Nuevo Backup</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" paragraph>
          ¿Está seguro que desea crear un backup de la base de datos?
        </Typography>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Información:</strong>
          </Typography>
          <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
            <li>Se creará un snapshot completo de la base de datos</li>
            <li>El proceso toma aproximadamente 1-5 segundos</li>
            <li>Los usuarios pueden continuar trabajando durante el backup</li>
            <li>El archivo se guardará en el servidor con formato .dump</li>
          </Typography>
        </Alert>

        {isLoading && (
          <Box display="flex" alignItems="center" gap={2} mt={3}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">
              Creando backup... Por favor espere
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isLoading} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isLoading}
          variant="contained"
          color="primary"
          startIcon={isLoading ? <CircularProgress size={16} /> : <BackupIcon />}
        >
          {isLoading ? 'Creando...' : 'Crear Backup'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateBackupDialog;
