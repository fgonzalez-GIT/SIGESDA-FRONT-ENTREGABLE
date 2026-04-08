import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert, Typography, Chip, Box } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

interface BulkDeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCount: number;
  entityName: string; // "recibos" | "pagos de actividades"
  loading?: boolean;
  warningMessage?: string;
}

/**
 * Dialog de confirmación para eliminación masiva
 * Usado por RecibosPage y PagosActividadesPage
 * @see /SIGESDA-BACKEND/docs/API_BULK_DELETE.md
 */
export const BulkDeleteConfirmDialog: React.FC<BulkDeleteConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  selectedCount,
  entityName,
  loading = false,
  warningMessage
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="warning" />
          Confirmar Eliminación Masiva
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Esta acción no se puede deshacer
        </Alert>

        <Typography variant="body1" gutterBottom>
          ¿Estás seguro de eliminar{' '}
          <Chip
            label={`${selectedCount} ${entityName}`}
            color="error"
            size="small"
          />{' '}
          seleccionados?
        </Typography>

        {warningMessage && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {warningMessage}
          </Alert>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Solo se eliminarán registros en estado PENDIENTE, VENCIDO o CANCELADO
          sin pagos asociados.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Eliminando...' : `Eliminar ${selectedCount}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
