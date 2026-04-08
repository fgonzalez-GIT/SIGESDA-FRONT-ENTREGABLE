/**
 * Diálogo para importar y restaurar un backup desde un archivo local
 *
 * ⚠️ OPERACIÓN DESTRUCTIVA
 * Permite subir un archivo .dump desde el equipo del usuario y restaurar la BD
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
  CloudUpload as CloudUploadIcon,
  Restore as RestoreIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';

interface ImportBackupDialogProps {
  /** Controla si el diálogo está abierto */
  open: boolean;

  /** Callback cuando se cierra el diálogo */
  onClose: () => void;

  /** Callback cuando se confirma la importación */
  onConfirm: (file: File) => Promise<void>;

  /** Indica si se está ejecutando la importación */
  isLoading?: boolean;
}

/**
 * Diálogo de confirmación destructiva para importar y restaurar backup
 */
export function ImportBackupDialog({
  open,
  onClose,
  onConfirm,
  isLoading = false,
}: ImportBackupDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const REQUIRED_TEXT = 'RESTAURAR';
  const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
  const isConfirmValid = confirmText === REQUIRED_TEXT;
  const canConfirm = selectedFile !== null && isConfirmValid && !isLoading;

  /**
   * Resetea el estado cuando se abre/cierra el diálogo
   */
  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setConfirmText('');
      setError(null);
    }
  }, [open]);

  /**
   * Maneja la selección de archivo
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      setError(null);
      return;
    }

    // Validar extensión
    if (!file.name.endsWith('.dump')) {
      setError('El archivo debe tener extensión .dump');
      setSelectedFile(null);
      return;
    }

    // Validar tamaño
    if (file.size > MAX_SIZE) {
      setError(
        `El archivo excede el tamaño máximo (100 MB). Tamaño actual: ${(file.size / 1024 / 1024).toFixed(2)} MB`
      );
      setSelectedFile(null);
      return;
    }

    // Archivo válido
    setError(null);
    setSelectedFile(file);
  };

  /**
   * Maneja la confirmación de importación
   */
  const handleConfirm = async () => {
    if (!selectedFile || !isConfirmValid) return;

    await onConfirm(selectedFile);
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
    if (event.key === 'Enter' && canConfirm) {
      handleConfirm();
    }
  };

  /**
   * Formatea el tamaño del archivo en formato legible
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

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
          <CloudUploadIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight="bold">
            Importar Backup desde Archivo
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Advertencia inicial */}
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight="bold" gutterBottom>
            ⚠️ ADVERTENCIA: Operación Destructiva
          </Typography>
          <Typography variant="body2">
            Esta operación reemplazará TODOS los datos actuales con los del
            archivo seleccionado. Esta acción NO se puede deshacer.
          </Typography>
        </Alert>

        {/* Información de uso */}
        {!isLoading && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Use esta opción para restaurar un backup que no esté listado en el
              servidor. Por ejemplo:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 3 }}>
              <Typography component="li" variant="body2" color="text.secondary">
                Backups copiados desde otro servidor
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Backups almacenados en medios externos (USB, email, etc.)
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Recuperación de emergencia cuando falla el listado de backups
              </Typography>
            </Box>

            {/* Selección de archivo */}
            <Box sx={{ mb: 3 }}>
              <input
                accept=".dump"
                style={{ display: 'none' }}
                id="backup-file-input"
                type="file"
                onChange={handleFileChange}
                disabled={isLoading}
              />
              <label htmlFor="backup-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                  size="large"
                  disabled={isLoading}
                >
                  Seleccionar archivo .dump
                </Button>
              </label>
            </Box>

            {/* Archivo seleccionado */}
            {selectedFile && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: 'success.light',
                  borderRadius: 1,
                  mb: 3,
                  border: '1px solid',
                  borderColor: 'success.main',
                }}
              >
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <FileIcon color="success" />
                  <Typography variant="body2" color="success.dark" fontWeight="bold">
                    Archivo seleccionado:
                  </Typography>
                </Box>
                <Typography variant="body1" fontFamily="monospace" gutterBottom>
                  {selectedFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Tamaño: {formatFileSize(selectedFile.size)}
                </Typography>
              </Paper>
            )}

            {/* Error de validación */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Advertencia de proceso */}
            {selectedFile && (
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
            )}

            {/* Input de confirmación */}
            {selectedFile && (
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
                  autoFocus={!!selectedFile}
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
          </>
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
              Importando y restaurando backup...
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
          disabled={!canConfirm}
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

export default ImportBackupDialog;
