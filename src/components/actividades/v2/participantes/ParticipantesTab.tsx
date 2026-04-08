import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  List,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { ParticipanteItem } from './ParticipanteItem';
import { InscripcionUnificadaModal } from './InscripcionUnificadaModal';
import { LoadingSkeleton } from '../LoadingSkeleton';
import { participacionApi } from '../../../../services/participacionApi';
import type { ParticipacionActividad } from '../../../../types/actividad.types';

interface ParticipantesTabProps {
  actividadId: number;
  actividadNombre?: string;
  costoActividad?: number;
  fechaInicioActividad?: string;
  participantes: (ParticipacionActividad & {
    personas?: {
      id: number;
      nombre: string;
      apellido: string;
      email?: string;
      tipo?: string;
    };
  })[];
  loading: boolean;
  cupoMaximo: number | null;
  cupoActual: number;
  onRefresh: () => void;
}

/**
 * Pestaña de Participantes para ActividadDetallePageV2
 * Muestra lista de participantes con opciones de inscripción masiva e individual
 */
export const ParticipantesTab: React.FC<ParticipantesTabProps> = ({
  actividadId,
  actividadNombre = 'Actividad',
  costoActividad = 0,
  fechaInicioActividad,
  participantes,
  loading,
  cupoMaximo,
  cupoActual,
  onRefresh
}) => {
  const [inscripcionOpen, setInscripcionOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    participante: any | null;
  }>({ open: false, participante: null });
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const participantesActivos = participantes?.filter(p => p.activa) || [];

  const handleOpenDeleteDialog = (participante: any) => {
    setDeleteDialog({ open: true, participante });
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog({ open: false, participante: null });
    setError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.participante) return;

    setDeleting(true);
    setError(null);

    try {
      await participacionApi.eliminar(deleteDialog.participante.id, actividadId);

      handleCloseDeleteDialog();
      onRefresh();
    } catch (error: any) {
      setError(error.message || 'Error al eliminar participante');
    } finally {
      setDeleting(false);
    }
  };

  const handleInscripcionSuccess = () => {
    // El modal maneja su propio cierre, solo refrescamos los datos aquí
    onRefresh();
  };

  // Obtener IDs de participantes ya inscritos
  const participantesExistentesIds = participantesActivos.map((p) => p.personaId);

  // Cálculo de cupo
  const cuposDisponibles = cupoMaximo ? cupoMaximo - cupoActual : null;
  const porcentajeOcupacion = cupoMaximo ? (cupoActual / cupoMaximo) * 100 : 0;

  return (
    <Box>
      {/* Header con información de cupo */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        mb: 3
      }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            Participantes Inscritos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestiona las inscripciones de participantes en la actividad
          </Typography>
          {cupoMaximo && (
            <Box sx={{ mt: 1.5 }}>
              <Typography
                variant="body2"
                sx={{
                  color: porcentajeOcupacion >= 90 ? 'error.main' :
                         porcentajeOcupacion >= 70 ? 'warning.main' : 'success.main',
                  fontWeight: 500
                }}
              >
                Cupo: {cupoActual} / {cupoMaximo} ({porcentajeOcupacion.toFixed(0)}%)
                {cuposDisponibles !== null && (
                  <> • Disponibles: {cuposDisponibles}</>
                )}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Botón único de inscripción */}
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setInscripcionOpen(true)}
          sx={{ minWidth: 240 }}
        >
          Inscribir Participante(s)
        </Button>
      </Box>

      {/* Alerta si el cupo está lleno */}
      {cupoMaximo && cupoActual >= cupoMaximo && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          La actividad ha alcanzado su cupo máximo de {cupoMaximo} participantes.
        </Alert>
      )}

      {/* Lista de participantes */}
      {loading ? (
        <LoadingSkeleton type="participantes" />
      ) : participantesActivos.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No hay participantes inscritos en esta actividad.
          Utiliza los botones de arriba para inscribir participantes.
        </Alert>
      ) : (
        <List sx={{ mt: 2 }}>
          {participantesActivos.map((participante) => (
            <ParticipanteItem
              key={participante.id}
              participante={participante}
              onDelete={handleOpenDeleteDialog}
            />
          ))}
        </List>
      )}

      {/* Modal unificado de inscripción */}
      <InscripcionUnificadaModal
        open={inscripcionOpen}
        onClose={() => setInscripcionOpen(false)}
        actividadId={actividadId}
        actividadNombre={actividadNombre}
        costoActividad={costoActividad}
        cupoMaximo={cupoMaximo}
        cupoActual={cupoActual}
        fechaInicioActividad={fechaInicioActividad}
        participantesExistentes={participantesExistentesIds}
        onSuccess={handleInscripcionSuccess}
      />

      {/* Dialog de confirmación de eliminación */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar a{' '}
            <strong>
              {deleteDialog.participante?.personas
                ? `${deleteDialog.participante.personas.apellido}, ${deleteDialog.participante.personas.nombre}`
                : 'este participante'}
            </strong>{' '}
            de esta actividad?
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
            Esta acción eliminará su inscripción y liberará un cupo.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit" disabled={deleting}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : undefined}
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ParticipantesTab;
