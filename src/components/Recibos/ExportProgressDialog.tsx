import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material';

export interface ExportProgressState {
  open: boolean;
  format: string;
  progress: number;
  total: number;
  message: string;
  status: 'processing' | 'success' | 'error';
  error?: string;
}

interface ExportProgressDialogProps {
  progress: ExportProgressState;
  onClose: () => void;
}

export const ExportProgressDialog: React.FC<ExportProgressDialogProps> = ({
  progress,
  onClose,
}) => {
  const { open, format, progress: current, total, message, status, error } = progress;

  const getFormatLabel = (format: string): string => {
    const labels: Record<string, string> = {
      csv: 'CSV',
      excel: 'Excel',
      'pdf-listado': 'PDF Listado',
      'pdf-zip': 'PDFs Individuales (ZIP)',
    };
    return labels[format] || format;
  };

  const progressPercentage = total > 0 ? Math.round((current / total) * 100) : 0;

  const canClose = status === 'success' || status === 'error';

  return (
    <Dialog
      open={open}
      onClose={canClose ? onClose : undefined}
      disableEscapeKeyDown={!canClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Exportando a {getFormatLabel(format)}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          {status === 'processing' && (
            <>
              <LinearProgress
                variant={total > 0 ? 'determinate' : 'indeterminate'}
                value={progressPercentage}
                sx={{ mb: 2 }}
              />
              {total > 0 && (
                <Typography variant="body2" color="text.secondary" align="center">
                  {current} de {total} ({progressPercentage}%)
                </Typography>
              )}
            </>
          )}

          {status === 'success' && (
            <Alert severity="success" icon={<CheckCircle />}>
              Exportación completada exitosamente
            </Alert>
          )}

          {status === 'error' && (
            <Alert severity="error" icon={<ErrorIcon />}>
              {error || 'Error al exportar'}
            </Alert>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>
      <DialogActions>
        {canClose && (
          <Button onClick={onClose} variant="contained">
            Cerrar
          </Button>
        )}
        {status === 'processing' && (
          <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
            Por favor, espere...
          </Typography>
        )}
      </DialogActions>
    </Dialog>
  );
};
