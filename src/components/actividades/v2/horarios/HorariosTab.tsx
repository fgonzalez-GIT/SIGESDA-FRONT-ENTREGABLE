import React, { useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  Button,
  List,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon
} from '@mui/icons-material';
import { HorarioItem } from './HorarioItem';
import { AgregarHorarioModal } from './AgregarHorarioModal';
import { LoadingSkeleton } from '../LoadingSkeleton';
import { actividadesApi } from '../../../../services/actividadesApi';
import type { HorarioActividad } from '../../../../types/actividad.types';

interface HorariosTabProps {
  actividadId: number;
  actividadNombre?: string;
  horarios: HorarioActividad[];
  loading: boolean;
  onRefresh: () => void;
}

/**
 * Pestaña de Horarios para ActividadDetallePageV2
 * Permite agregar, editar y eliminar horarios de la actividad
 */
export const HorariosTab: React.FC<HorariosTabProps> = ({
  actividadId,
  actividadNombre = 'Actividad',
  horarios,
  loading,
  onRefresh
}) => {
  const [agregarModalOpen, setAgregarModalOpen] = useState(false);
  const [horarioEditar, setHorarioEditar] = useState<HorarioActividad | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    horario: HorarioActividad | null;
  }>({ open: false, horario: null });
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const horariosActivos = horarios?.filter(h => h.activo) || [];

  // Ordenar horarios por día de la semana y hora de inicio
  const horariosOrdenados = [...horariosActivos].sort((a, b) => {
    const ordenA = a.diaSemana?.orden || 0;
    const ordenB = b.diaSemana?.orden || 0;
    if (ordenA !== ordenB) return ordenA - ordenB;
    return a.horaInicio.localeCompare(b.horaInicio);
  });

  const handleAgregarHorario = () => {
    setHorarioEditar(null);
    setAgregarModalOpen(true);
  };

  const handleEditarHorario = (horario: HorarioActividad) => {
    setHorarioEditar(horario);
    setAgregarModalOpen(true);
  };

  const handleOpenDeleteDialog = (horario: HorarioActividad) => {
    setDeleteDialog({ open: true, horario });
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog({ open: false, horario: null });
    setError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.horario) return;

    setDeleting(true);
    setError(null);

    try {
      await actividadesApi.eliminarHorario(deleteDialog.horario.id);

      handleCloseDeleteDialog();
      onRefresh();
    } catch (error: any) {
      setError(error.message || 'Error al eliminar horario');
    } finally {
      setDeleting(false);
    }
  };

  const handleModalSuccess = () => {
    setAgregarModalOpen(false);
    setHorarioEditar(null);
    onRefresh();
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        mb: 3
      }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Horarios de la Actividad
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestiona los días y horarios en los que se desarrolla la actividad
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAgregarHorario}
          sx={{ minWidth: 160 }}
        >
          Agregar Horario
        </Button>
      </Box>

      {/* Lista de horarios */}
      {loading ? (
        <LoadingSkeleton type="horarios" />
      ) : horariosOrdenados.length === 0 ? (
        <Alert severity="info">
          No hay horarios asignados a esta actividad.
          Haz clic en "Agregar Horario" para definir los días y horarios.
        </Alert>
      ) : (
        <List sx={{ mt: 2 }}>
          {horariosOrdenados.map((horario) => (
            <HorarioItem
              key={horario.id}
              horario={horario}
              onEdit={handleEditarHorario}
              onDelete={handleOpenDeleteDialog}
            />
          ))}
        </List>
      )}

      {/* Modal de agregar/editar horario */}
      <AgregarHorarioModal
        open={agregarModalOpen}
        onClose={() => {
          setAgregarModalOpen(false);
          setHorarioEditar(null);
        }}
        actividadId={actividadId}
        actividadNombre={actividadNombre}
        horarioEditar={horarioEditar}
        onSuccess={handleModalSuccess}
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
            ¿Estás seguro de que deseas eliminar el horario de{' '}
            <strong>
              {deleteDialog.horario?.diaSemana?.nombre || 'este día'}
            </strong>{' '}
            de {deleteDialog.horario?.horaInicio.substring(0, 5)} a{' '}
            {deleteDialog.horario?.horaFin.substring(0, 5)} hs?
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
            Esta acción eliminará el horario de la actividad.
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

export default HorariosTab;
