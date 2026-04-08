import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Block as BlockIcon,
  Edit as EditIcon,
  TaskAlt as TaskAltIcon,
} from '@mui/icons-material';
import { useAppDispatch } from '@/store';
import {
  aprobarReserva,
  rechazarReserva,
  cancelarReserva,
  completarReserva,
} from '@/store/slices/reservasSlice';
import type { Reserva, EstadoReservaCodigo } from '@/types/reserva.types';
import { getAvailableActions, validateMotivo } from '@/utils/reservaValidations';

interface ReservaWorkflowButtonsProps {
  reserva: Reserva;
  onActionComplete?: () => void;
  onEdit?: () => void;
  disabled?: boolean;
}

const ICON_MAP: Record<string, React.ReactElement> = {
  CheckCircle: <CheckCircleIcon />,
  Cancel: <CancelIcon />,
  Block: <BlockIcon />,
  Edit: <EditIcon />,
  TaskAlt: <TaskAltIcon />,
};

/**
 * Componente para renderizar botones de acciones de workflow de reservas
 *
 * Muestra botones según el estado actual y maneja los diálogos de confirmación
 */
const ReservaWorkflowButtons: React.FC<ReservaWorkflowButtonsProps> = ({
  reserva,
  onActionComplete,
  onEdit,
  disabled = false,
}) => {
  const dispatch = useAppDispatch();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estadoCodigo = reserva.estadoReserva?.codigo as EstadoReservaCodigo;
  const availableActions = getAvailableActions(estadoCodigo, reserva);

  // Abrir diálogo según la acción
  const handleActionClick = (action: string) => {
    if (action === 'editar') {
      onEdit?.();
      return;
    }

    setCurrentAction(action);
    setMotivo('');
    setObservaciones('');
    setError(null);
    setDialogOpen(true);
  };

  // Cerrar diálogo
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentAction(null);
    setMotivo('');
    setObservaciones('');
    setError(null);
  };

  // Ejecutar acción
  const handleConfirmAction = async () => {
    if (!currentAction) return;

    setError(null);

    // Validar motivo para acciones que lo requieren
    if (currentAction === 'rechazar' || currentAction === 'cancelar') {
      const validation = validateMotivo(motivo);
      if (!validation.valid) {
        setError(validation.errors.join(', '));
        return;
      }
    }

    try {
      setLoading(true);

      switch (currentAction) {
        case 'aprobar':
          await dispatch(
            aprobarReserva({
              id: reserva.id,
              data: { observaciones: observaciones || undefined },
            })
          ).unwrap();
          break;

        case 'rechazar':
          await dispatch(
            rechazarReserva({
              id: reserva.id,
              data: { motivo },
            })
          ).unwrap();
          break;

        case 'cancelar':
          await dispatch(
            cancelarReserva({
              id: reserva.id,
              data: { motivo },
            })
          ).unwrap();
          break;

        case 'completar':
          await dispatch(
            completarReserva({
              id: reserva.id,
              data: { observaciones: observaciones || undefined },
            })
          ).unwrap();
          break;

        default:
          throw new Error(`Acción desconocida: ${currentAction}`);
      }

      handleCloseDialog();
      onActionComplete?.();
    } catch (err: any) {
      console.error(`Error al ${currentAction} reserva:`, err);
      setError(err || `Error al ${currentAction} la reserva`);
    } finally {
      setLoading(false);
    }
  };

  // Obtener título del diálogo
  const getDialogTitle = () => {
    const titles: Record<string, string> = {
      aprobar: '✅ Aprobar Reserva',
      rechazar: '❌ Rechazar Reserva',
      cancelar: '🚫 Cancelar Reserva',
      completar: '✔️ Completar Reserva',
    };
    return titles[currentAction || ''] || 'Confirmar Acción';
  };

  // Verificar si la acción requiere motivo
  const requiresMotivo = currentAction === 'rechazar' || currentAction === 'cancelar';

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <>
      <Box display="flex" gap={1} flexWrap="wrap">
        {availableActions.map((action) => (
          <Button
            key={action.action}
            variant={action.action === 'editar' ? 'outlined' : 'contained'}
            color={action.color as any}
            startIcon={ICON_MAP[action.icon]}
            onClick={() => handleActionClick(action.action)}
            disabled={disabled || loading}
            size="small"
          >
            {action.label}
          </Button>
        ))}
      </Box>

      {/* Diálogo de Confirmación */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{getDialogTitle()}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {requiresMotivo && (
            <TextField
              label="Motivo *"
              placeholder="Ingrese el motivo (mínimo 10 caracteres)"
              multiline
              rows={4}
              fullWidth
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              error={Boolean(error)}
              helperText="Requerido: 10-500 caracteres"
              sx={{ mb: 2 }}
            />
          )}

          {(currentAction === 'aprobar' || currentAction === 'completar') && (
            <TextField
              label="Observaciones (opcional)"
              placeholder="Ingrese observaciones adicionales"
              multiline
              rows={3}
              fullWidth
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              helperText="Máximo 500 caracteres"
              inputProps={{ maxLength: 500 }}
            />
          )}

          {!requiresMotivo && currentAction !== 'aprobar' && currentAction !== 'completar' && (
            <Alert severity="info">
              ¿Está seguro que desea realizar esta acción?
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            color={
              currentAction === 'aprobar' || currentAction === 'completar'
                ? 'success'
                : currentAction === 'rechazar'
                ? 'error'
                : 'warning'
            }
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : undefined}
          >
            {loading ? 'Procesando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ReservaWorkflowButtons;
