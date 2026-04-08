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
  CircularProgress,
  Snackbar
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { DocenteItem } from './DocenteItem';
import { AsignarDocenteModalV2 } from './AsignarDocenteModalV2';
import { LoadingSkeleton } from '../LoadingSkeleton';
import { actividadesApi } from '../../../../services/actividadesApi';
import type { DocenteActividad } from '../../../../types/actividad.types';

interface DocentesTabProps {
  actividadId: number;
  actividadNombre?: string;
  docentes: (DocenteActividad & {
    personas?: {
      id: number;
      nombre: string;
      apellido: string;
      especialidad?: string;
    };
    rolesDocentes?: {
      id: number;
      nombre: string;
      codigo: string;
    };
  })[];
  loading: boolean;
  onRefresh: () => void;
}

/**
 * Pestaña de Docentes para ActividadDetallePageV2
 * Muestra lista de docentes asignados con opción de agregar/eliminar
 */
export const DocentesTab: React.FC<DocentesTabProps> = ({
  actividadId,
  actividadNombre = 'Actividad',
  docentes,
  loading,
  onRefresh
}) => {
  const [asignarModalOpen, setAsignarModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    docente: any | null;
  }>({ open: false, docente: null });
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const docentesActivos = docentes?.filter(d => d.activo) || [];

  const handleOpenDeleteDialog = (docente: any) => {
    setDeleteDialog({ open: true, docente });
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog({ open: false, docente: null });
    setError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.docente) return;

    setDeleting(true);
    setError(null);

    try {
      // El API solo necesita el ID de la asignación (docente_actividad.id)
      await actividadesApi.desasignarDocente(deleteDialog.docente.id);

      handleCloseDeleteDialog();
      setSnackbar({
        open: true,
        message: 'Docente desasignado correctamente',
        severity: 'success'
      });
      onRefresh();
    } catch (error: any) {
      setError(error.message || 'Error al desasignar docente');
    } finally {
      setDeleting(false);
    }
  };

  const handleAsignarDocente = () => {
    setAsignarModalOpen(true);
  };

  const handleAsignarSuccess = () => {
    setAsignarModalOpen(false);
    setSnackbar({
      open: true,
      message: 'Docente asignado correctamente',
      severity: 'success'
    });
    onRefresh();
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
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
            Docentes Asignados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestiona los docentes responsables de impartir la actividad
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={handleAsignarDocente}
          sx={{ minWidth: 180 }}
        >
          Asignar Docente
        </Button>
      </Box>

      {/* Lista de docentes */}
      {loading ? (
        <LoadingSkeleton type="docentes" />
      ) : docentesActivos.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No hay docentes asignados a esta actividad.
          Haz clic en "Asignar Docente" para añadir un docente.
        </Alert>
      ) : (
        <List sx={{ mt: 2 }}>
          {docentesActivos.map((docente) => (
            <DocenteItem
              key={docente.id}
              docente={docente}
              onDelete={handleOpenDeleteDialog}
            />
          ))}
        </List>
      )}

      {/* Modal de asignación de docente */}
      <AsignarDocenteModalV2
        open={asignarModalOpen}
        onClose={() => setAsignarModalOpen(false)}
        actividadId={actividadId}
        actividadNombre={actividadNombre}
        onSuccess={handleAsignarSuccess}
        docentesAsignadosIds={docentesActivos.map(d => d.docenteId)}
      />

      {/* Dialog de confirmación de eliminación */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirmar Desasignación</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <DialogContentText>
            ¿Estás seguro de que deseas desasignar a{' '}
            <strong>
              {deleteDialog.docente?.personas
                ? `${deleteDialog.docente.personas.apellido}, ${deleteDialog.docente.personas.nombre}`
                : 'este docente'}
            </strong>{' '}
            de esta actividad?
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
            Esta acción puede revertirse asignando nuevamente al docente.
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
            {deleting ? 'Desasignando...' : 'Desasignar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DocentesTab;
