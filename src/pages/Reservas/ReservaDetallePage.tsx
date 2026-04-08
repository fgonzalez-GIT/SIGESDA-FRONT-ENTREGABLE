import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  ArrowBack as ArrowBackIcon,
  Room as RoomIcon,
  Person as PersonIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  Description as DescriptionIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchReservaById, updateReserva } from '@/store/slices/reservasSlice';
import type { Reserva, UpdateReservaDto } from '@/types/reserva.types';
import {
  formatDateTimeES,
  formatTimeES,
  calculateDuration,
  formatDuration,
  isCurrentlyActive,
} from '@/utils/dateHelpers';
import {
  getEstadoReservaColor,
  canEditReserva,
} from '@/utils/reservaValidations';
import ReservaWorkflowButtons from '@/components/reservas/ReservaWorkflowButtons';
import ReservaForm from '@/components/reservas/ReservaForm';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reserva-tabpanel-${index}`}
      aria-labelledby={`reserva-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * Página de detalle de una reserva específica
 *
 * Features:
 * - Tabs: Datos Generales, Historial
 * - Botones de workflow para cambiar estado
 * - Edición condicional
 * - Información completa de la reserva
 */
const ReservaDetallePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { currentReserva, loading, error } = useAppSelector((state) => state.reservas);

  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Cargar reserva
  useEffect(() => {
    if (id) {
      dispatch(fetchReservaById(Number(id)));
    }
  }, [id, dispatch]);

  // Recargar después de una acción de workflow
  const handleActionComplete = () => {
    if (id) {
      dispatch(fetchReservaById(Number(id)));
    }
  };

  // Abrir diálogo de edición
  const handleOpenEdit = () => {
    setEditDialogOpen(true);
    setSubmitError(null);
  };

  // Cerrar diálogo de edición
  const handleCloseEdit = () => {
    setEditDialogOpen(false);
    setSubmitError(null);
  };

  // Manejar submit de edición
  const handleSubmitEdit = async (data: UpdateReservaDto) => {
    if (!currentReserva) return;

    try {
      setSubmitting(true);
      setSubmitError(null);

      await dispatch(
        updateReserva({
          id: currentReserva.id,
          data,
        })
      ).unwrap();

      handleCloseEdit();

      // Recargar reserva
      await dispatch(fetchReservaById(currentReserva.id));
    } catch (error: any) {
      console.error('Error al actualizar reserva:', error);
      setSubmitError(error || 'Error al actualizar la reserva');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate('/reservas')} sx={{ mt: 2 }}>
          Volver a Reservas
        </Button>
      </Box>
    );
  }

  if (!currentReserva) {
    return (
      <Box p={3}>
        <Alert severity="warning">Reserva no encontrada</Alert>
        <Button onClick={() => navigate('/reservas')} sx={{ mt: 2 }}>
          Volver a Reservas
        </Button>
      </Box>
    );
  }

  const isActive = isCurrentlyActive(currentReserva.fechaInicio, currentReserva.fechaFin);
  const duracion = calculateDuration(currentReserva.fechaInicio, currentReserva.fechaFin);
  const canEdit = canEditReserva(currentReserva).valid;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/reservas')}
          sx={{ mb: 2 }}
        >
          Volver a Reservas
        </Button>

        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Reserva #{currentReserva.id}
            </Typography>
            <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
              <Chip
                label={currentReserva.estadoReserva?.nombre || 'Desconocido'}
                color={getEstadoReservaColor(currentReserva.estadoReserva?.codigo || '')}
                size="small"
              />
              {isActive && (
                <Chip label="EN CURSO" color="success" size="small" variant="outlined" />
              )}
              {!currentReserva.activa && (
                <Chip label="INACTIVA" color="default" size="small" variant="outlined" />
              )}
            </Box>
          </Box>

          <ReservaWorkflowButtons
            reserva={currentReserva}
            onActionComplete={handleActionComplete}
            onEdit={handleOpenEdit}
          />
        </Box>
      </Box>

      {/* Tabs */}
      <Paper>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Datos Generales" />
          <Tab label="Historial" />
        </Tabs>

        {/* Tab 1: Datos Generales */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Aula */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <RoomIcon color="primary" />
                  <Typography variant="subtitle2" color="textSecondary">
                    Aula
                  </Typography>
                </Box>
                <Typography variant="h6">
                  {currentReserva.aulas?.nombre || `Aula #${currentReserva.aulaId}`}
                </Typography>
                {currentReserva.aulas && (
                  <Box mt={1}>
                    <Typography variant="body2" color="textSecondary">
                      Tipo: {currentReserva.aulas.tipo}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Capacidad: {currentReserva.aulas.capacidad} personas
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Docente */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <PersonIcon color="secondary" />
                  <Typography variant="subtitle2" color="textSecondary">
                    Docente
                  </Typography>
                </Box>
                <Typography variant="h6">
                  {currentReserva.personas
                    ? `${currentReserva.personas.nombre} ${currentReserva.personas.apellido}`
                    : `Docente #${currentReserva.docenteId}`}
                </Typography>
              </Paper>
            </Grid>

            {/* Actividad */}
            {currentReserva.actividadId && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <CategoryIcon color="info" />
                    <Typography variant="subtitle2" color="textSecondary">
                      Actividad
                    </Typography>
                  </Box>
                  <Typography variant="h6">
                    {currentReserva.actividades?.nombre || `Actividad #${currentReserva.actividadId}`}
                  </Typography>
                </Paper>
              </Grid>
            )}

            {/* Fecha y Hora */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <EventIcon color="primary" />
                  <Typography variant="subtitle2" color="textSecondary">
                    Fecha y Horario
                  </Typography>
                </Box>
                <Typography variant="body1">
                  <strong>Inicio:</strong> {formatDateTimeES(currentReserva.fechaInicio)}
                </Typography>
                <Typography variant="body1">
                  <strong>Fin:</strong> {formatDateTimeES(currentReserva.fechaFin)}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Duración: {formatDuration(duracion)}
                </Typography>
              </Paper>
            </Grid>

            {/* Observaciones */}
            {currentReserva.observaciones && (
              <Grid size={{ xs: 12 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <DescriptionIcon color="action" />
                    <Typography variant="subtitle2" color="textSecondary">
                      Observaciones
                    </Typography>
                  </Box>
                  <Typography variant="body1">{currentReserva.observaciones}</Typography>
                </Paper>
              </Grid>
            )}

            {/* Motivo de Cancelación */}
            {currentReserva.motivoCancelacion && (
              <Grid size={{ xs: 12 }}>
                <Alert severity="warning">
                  <Typography variant="subtitle2" gutterBottom>
                    <strong>Motivo de Cancelación/Rechazo:</strong>
                  </Typography>
                  <Typography variant="body2">{currentReserva.motivoCancelacion}</Typography>
                </Alert>
              </Grid>
            )}

            {/* Metadatos */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Información del Sistema
              </Typography>
              <Grid container spacing={1}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2">
                    <strong>Creada:</strong>{' '}
                    {currentReserva.createdAt
                      ? formatDateTimeES(currentReserva.createdAt)
                      : 'N/A'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2">
                    <strong>Última actualización:</strong>{' '}
                    {currentReserva.updatedAt
                      ? formatDateTimeES(currentReserva.updatedAt)
                      : 'N/A'}
                  </Typography>
                </Grid>
                {currentReserva.aprobadoPorId && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2">
                      <strong>Aprobada por:</strong> Usuario #{currentReserva.aprobadoPorId}
                    </Typography>
                  </Grid>
                )}
                {currentReserva.canceladoPorId && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2">
                      <strong>Cancelada por:</strong> Usuario #{currentReserva.canceladoPorId}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 2: Historial */}
        <TabPanel value={tabValue} index={1}>
          <Alert severity="info">
            El historial de cambios de estado estará disponible próximamente.
          </Alert>
          {/* TODO: Implementar historial de cambios de estado cuando el backend lo provea */}
        </TabPanel>
      </Paper>

      {/* Dialog de edición */}
      <Dialog open={editDialogOpen} onClose={handleCloseEdit} maxWidth="md" fullWidth>
        <DialogTitle>Editar Reserva</DialogTitle>
        <DialogContent>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <Box mt={2}>
            <ReservaForm
              reserva={currentReserva}
              onSubmit={handleSubmitEdit}
              onCancel={handleCloseEdit}
              loading={submitting}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ReservaDetallePage;
