import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add as AddIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Today as TodayIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchReservas,
  createReserva,
  updateReserva,
  deleteReserva,
} from '@/store/slices/reservasSlice';
import { fetchAulasActivas } from '@/store/slices/aulasSlice';
import { fetchEstadosReservas } from '@/store/slices/estadosReservasSlice';
import personasApi from '@/services/personasApi';
import type { Persona } from '@/types/persona.types';
import type { Reserva, CreateReservaDto, UpdateReservaDto } from '@/types/reserva.types';
import ReservasTable from '@/components/reservas/ReservasTable';
import ReservaForm from '@/components/reservas/ReservaForm';
import { isToday, formatDateES } from '@/utils/dateHelpers';

/**
 * Página principal de Reservas de Aulas
 *
 * Features:
 * - Lista de reservas con filtros
 * - Crear/Editar/Eliminar reservas
 * - Dashboard con estadísticas
 * - Integración con Redux
 */
const ReservasPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    reservas,
    loading: loadingReservas,
    error: errorReservas,
  } = useAppSelector((state) => state.reservas);
  const { aulas } = useAppSelector((state) => state.aulas);
  const { estadosReservas } = useAppSelector((state) => state.estadosReservas);

  const [docentes, setDocentes] = useState<Persona[]>([]);
  const [loadingDocentes, setLoadingDocentes] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Cargar reservas, aulas y estados en paralelo
        await Promise.all([
          dispatch(fetchReservas()).unwrap(),
          dispatch(fetchAulasActivas()).unwrap(),
          dispatch(fetchEstadosReservas()).unwrap(),
        ]);

        // Cargar docentes
        setLoadingDocentes(true);
        const docentesData = await personasApi.getDocentes({ activo: true });
        setDocentes(docentesData.data);
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
      } finally {
        setLoadingDocentes(false);
      }
    };

    loadInitialData();
  }, [dispatch]);

  // Abrir diálogo para crear/editar
  const handleOpenDialog = (reserva?: Reserva) => {
    setSelectedReserva(reserva || null);
    setSubmitError(null);
    setDialogOpen(true);
  };

  // Cerrar diálogo
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedReserva(null);
    setSubmitError(null);
  };

  // Manejar submit del formulario
  const handleSubmit = async (data: CreateReservaDto | UpdateReservaDto) => {
    try {
      setSubmitting(true);
      setSubmitError(null);

      if (selectedReserva) {
        // Actualizar reserva existente
        await dispatch(
          updateReserva({
            id: selectedReserva.id,
            data: data as UpdateReservaDto,
          })
        ).unwrap();
      } else {
        // Crear nueva reserva
        await dispatch(createReserva(data as CreateReservaDto)).unwrap();
      }

      handleCloseDialog();

      // Recargar reservas
      await dispatch(fetchReservas()).unwrap();
    } catch (error: any) {
      console.error('Error al guardar reserva:', error);
      setSubmitError(error || 'Error al guardar la reserva');
    } finally {
      setSubmitting(false);
    }
  };

  // Manejar eliminación
  const handleDelete = async (reserva: Reserva) => {
    if (
      !window.confirm(
        `¿Está seguro de eliminar la reserva del aula "${reserva.aulas?.nombre}" para el ${formatDateES(
          reserva.fechaInicio
        )}?`
      )
    ) {
      return;
    }

    try {
      await dispatch(deleteReserva(reserva.id)).unwrap();
      // Recargar reservas
      await dispatch(fetchReservas()).unwrap();
    } catch (error: any) {
      console.error('Error al eliminar reserva:', error);
      alert(error || 'Error al eliminar la reserva');
    }
  };

  // Calcular estadísticas
  const totalReservas = reservas.length;
  const confirmadas = reservas.filter(
    (r) => r.estadoReserva?.codigo === 'CONFIRMADA' && r.activa
  ).length;
  const pendientes = reservas.filter(
    (r) => r.estadoReserva?.codigo === 'PENDIENTE' && r.activa
  ).length;
  const hoy = reservas.filter((r) => isToday(r.fechaInicio)).length;

  const loading = loadingReservas || loadingDocentes;

  if (loading && reservas.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Reservas de Aulas
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nueva Reserva
        </Button>
      </Box>

      {/* Dashboard - Cards de estadísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <CalendarIcon color="primary" />
                <Typography color="textSecondary" variant="body2">
                  Total Reservas
                </Typography>
              </Box>
              <Typography variant="h4">{totalReservas}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <CheckCircleIcon color="success" />
                <Typography color="textSecondary" variant="body2">
                  Confirmadas
                </Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {confirmadas}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <ScheduleIcon color="warning" />
                <Typography color="textSecondary" variant="body2">
                  Pendientes
                </Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {pendientes}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TodayIcon color="info" />
                <Typography color="textSecondary" variant="body2">
                  Hoy
                </Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {hoy}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Mensaje informativo */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Gestiona las reservas de aulas. El sistema detecta automáticamente conflictos de horarios.
      </Alert>

      {/* Errores */}
      {errorReservas && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorReservas}
        </Alert>
      )}

      {/* Tabla de reservas */}
      <ReservasTable
        reservas={reservas}
        aulas={aulas}
        docentes={docentes}
        estadosReservas={estadosReservas}
        onEdit={handleOpenDialog}
        onDelete={handleDelete}
        loading={loadingReservas}
      />

      {/* Dialog para crear/editar */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{selectedReserva ? 'Editar Reserva' : 'Nueva Reserva'}</DialogTitle>
        <DialogContent>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <Box mt={2}>
            <ReservaForm
              reserva={selectedReserva}
              onSubmit={handleSubmit}
              onCancel={handleCloseDialog}
              loading={submitting}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ReservasPage;
