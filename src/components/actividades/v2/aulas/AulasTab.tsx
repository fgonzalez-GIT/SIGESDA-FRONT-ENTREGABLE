/**
 * Tab de Aulas para ActividadDetallePageV2
 * Muestra lista de aulas asignadas y permite asignar/desasignar
 * Siguiendo el patrón de DocentesTab y ParticipantesTab
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  Alert,
  AlertTitle,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Room as RoomIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import AulaAsignadaItem from './AulaAsignadaItem';
import AsignarAulaModal from './AsignarAulaModal';
import { useAulasMutations } from '@/hooks/useActividadesAulas';
import { useAppDispatch } from '@/hooks/redux';
import { showNotification } from '@/store/slices/uiSlice';
import type { ActividadAula } from '@/types/actividad-aula.types';

interface AulasTabProps {
  actividadId: number;
  actividadNombre: string;
  tieneHorarios: boolean; // VALIDACIÓN CRÍTICA
  aulas: ActividadAula[];
  loading: boolean;
  onRefresh: () => void;
}

const AulasTab: React.FC<AulasTabProps> = ({
  actividadId,
  actividadNombre,
  tieneHorarios,
  aulas,
  loading,
  onRefresh,
}) => {
  const dispatch = useAppDispatch();

  // Estado UI
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [aulaToDesasignar, setAulaToDesasignar] = useState<ActividadAula | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Hook de mutaciones
  const { desasignar, loading: desasignando } = useAulasMutations(
    actividadId,
    handleMutationSuccess
  );

  function handleMutationSuccess() {
    onRefresh();
  }

  // Filtrar aulas activas
  const aulasActivas = aulas.filter((a) => a.activa);

  // Handlers
  const handleOpenModal = () => {
    if (!tieneHorarios) {
      dispatch(showNotification({
        message: 'La actividad no tiene horarios definidos. Debe asignar horarios antes de asignar aulas.',
        severity: 'warning'
      }));
      return;
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleCambiarClick = (aula: ActividadAula) => {
    // TODO: Implementar cambio de aula (Iteración 3)
    dispatch(showNotification({
      message: 'Funcionalidad de cambio de aula en desarrollo',
      severity: 'info'
    }));
  };

  const handleDesasignarClick = (aula: ActividadAula) => {
    setAulaToDesasignar(aula);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDesasignar = async () => {
    if (!aulaToDesasignar) return;

    try {
      await desasignar(aulaToDesasignar.id);
      setSnackbarMessage(`Aula "${aulaToDesasignar.aulas.nombre}" desasignada exitosamente`);
      setSnackbarOpen(true);
      setConfirmDialogOpen(false);
      setAulaToDesasignar(null);
    } catch (error: any) {
      dispatch(showNotification({
        message: error.message || 'Error al desasignar aula',
        severity: 'error'
      }));
    }
  };

  const handleCancelDesasignar = () => {
    setConfirmDialogOpen(false);
    setAulaToDesasignar(null);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box>
      {/* Header con botón */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h6" display="flex" alignItems="center" gap={1}>
          <RoomIcon />
          Aulas Asignadas ({aulasActivas.length})
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenModal}
          disabled={!tieneHorarios || loading}
        >
          Asignar Aula
        </Button>
      </Box>

      {/* Alerta si no tiene horarios */}
      {!tieneHorarios && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<InfoIcon />}>
          <AlertTitle>No se pueden asignar aulas</AlertTitle>
          Esta actividad no tiene horarios definidos. Debe asignar horarios antes de poder
          asignar aulas.
        </Alert>
      )}

      {/* Loading state */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Lista vacía */}
      {!loading && aulasActivas.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle>No hay aulas asignadas</AlertTitle>
          {tieneHorarios
            ? 'Haga clic en "Asignar Aula" para comenzar.'
            : 'Debe definir horarios antes de asignar aulas.'}
        </Alert>
      )}

      {/* Lista de aulas asignadas */}
      {!loading && aulasActivas.length > 0 && (
        <List sx={{ width: '100%' }}>
          {aulasActivas
            .sort((a, b) => a.prioridad - b.prioridad) // Ordenar por prioridad
            .map((aula) => (
              <AulaAsignadaItem
                key={aula.id}
                aula={aula}
                onCambiar={handleCambiarClick}
                onDesasignar={handleDesasignarClick}
              />
            ))}
        </List>
      )}

      {/* Información adicional */}
      {aulasActivas.length > 1 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Esta actividad tiene múltiples aulas asignadas. El aula con prioridad 1 es la
          principal.
        </Alert>
      )}

      {/* Modal de asignación */}
      <AsignarAulaModal
        open={modalOpen}
        actividadId={actividadId}
        actividadNombre={actividadNombre}
        aulasExistentes={aulas}
        onClose={handleCloseModal}
        onSuccess={handleMutationSuccess}
      />

      {/* Dialog de confirmación para desasignar */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelDesasignar}
        disableEscapeKeyDown={desasignando}
      >
        <DialogTitle>Confirmar Desasignación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea desasignar el aula{' '}
            <strong>{aulaToDesasignar?.aulas.nombre}</strong> de la actividad{' '}
            <strong>{actividadNombre}</strong>?
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            Esta acción marcará la asignación como inactiva. Podrá reactivarla más tarde
            si es necesario.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDesasignar} disabled={desasignando}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDesasignar}
            color="error"
            variant="contained"
            disabled={desasignando}
          >
            {desasignando ? 'Desasignando...' : 'Desasignar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de notificaciones */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default AulasTab;
