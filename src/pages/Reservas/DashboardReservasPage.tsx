import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Room as RoomIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchReservas } from '@/store/slices/reservasSlice';
import { fetchAulasActivas } from '@/store/slices/aulasSlice';
import { fetchEstadosReservas } from '@/store/slices/estadosReservasSlice';
import {
  formatDateTimeES,
  isInFuture,
  isToday,
} from '@/utils/dateHelpers';
import { getEstadoReservaColor } from '@/utils/reservaValidations';

/**
 * Dashboard ejecutivo de Reservas
 *
 * Features:
 * - Métricas clave (KPIs)
 * - Reservas por estado
 * - Aulas más reservadas
 * - Próximas reservas
 */
const DashboardReservasPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    reservas,
    loading: loadingReservas,
    error: errorReservas,
  } = useAppSelector((state) => state.reservas);
  const { aulas } = useAppSelector((state) => state.aulas);
  const { estadosReservas } = useAppSelector((state) => state.estadosReservas);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          dispatch(fetchReservas()).unwrap(),
          dispatch(fetchAulasActivas()).unwrap(),
          dispatch(fetchEstadosReservas()).unwrap(),
        ]);
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
      }
    };

    loadData();
  }, [dispatch]);

  // Calcular estadísticas
  const totalReservas = reservas.length;
  const reservasActivas = reservas.filter((r) => r.activa);
  const reservasHoy = reservas.filter((r) => isToday(r.fechaInicio));
  const reservasFuturas = reservas.filter((r) => isInFuture(r.fechaInicio) && r.activa);

  // Reservas por estado
  const reservasPorEstado = estadosReservas.map((estado) => ({
    estado,
    count: reservas.filter((r) => r.estadoReservaId === estado.id).length,
  }));

  // Aulas más reservadas
  const aulasCounts = reservas.reduce((acc, reserva) => {
    const aulaId = reserva.aulaId;
    acc[aulaId] = (acc[aulaId] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const aulasTopReservas = Object.entries(aulasCounts)
    .map(([aulaId, count]) => {
      const aula = aulas.find((a) => a.id === Number(aulaId));
      return {
        aula: aula?.nombre || `Aula #${aulaId}`,
        count,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Próximas reservas (siguiente semana)
  const proximasReservas = reservasFuturas
    .filter((r) => {
      const fechaReserva = new Date(r.fechaInicio);
      const unaSemana = new Date();
      unaSemana.setDate(unaSemana.getDate() + 7);
      return fechaReserva <= unaSemana;
    })
    .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime())
    .slice(0, 10);

  if (loadingReservas && reservas.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard de Reservas
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Vista ejecutiva del sistema de reservas de aulas
      </Typography>

      {errorReservas && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorReservas}
        </Alert>
      )}

      {/* KPIs Cards */}
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
              <Typography variant="h3">{totalReservas}</Typography>
              <Typography variant="caption" color="textSecondary">
                Activas: {reservasActivas.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <CheckCircleIcon color="success" />
                <Typography color="textSecondary" variant="body2">
                  Reservas Hoy
                </Typography>
              </Box>
              <Typography variant="h3" color="success.main">
                {reservasHoy.length}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Programadas para hoy
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <ScheduleIcon color="info" />
                <Typography color="textSecondary" variant="body2">
                  Próximas 7 días
                </Typography>
              </Box>
              <Typography variant="h3" color="info.main">
                {proximasReservas.length}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                En la próxima semana
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingUpIcon color="warning" />
                <Typography color="textSecondary" variant="body2">
                  Aulas Activas
                </Typography>
              </Box>
              <Typography variant="h3" color="warning.main">
                {aulas.length}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Disponibles para reservar
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Reservas por Estado */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Reservas por Estado
            </Typography>
            <Box mt={2}>
              {reservasPorEstado.map(({ estado, count }) => (
                <Box
                  key={estado.id}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  py={1}
                  borderBottom="1px solid"
                  borderColor="divider"
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      label={estado.nombre}
                      color={getEstadoReservaColor(estado.codigo)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="h6">{count}</Typography>
                </Box>
              ))}
              {reservasPorEstado.length === 0 && (
                <Typography variant="body2" color="textSecondary">
                  No hay datos disponibles
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Aulas Más Reservadas */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Aulas Más Reservadas
            </Typography>
            <Box mt={2}>
              {aulasTopReservas.map((item, index) => (
                <Box
                  key={index}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  py={1}
                  borderBottom="1px solid"
                  borderColor="divider"
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <RoomIcon color="primary" fontSize="small" />
                    <Typography variant="body1">{item.aula}</Typography>
                  </Box>
                  <Chip label={`${item.count} reservas`} size="small" variant="outlined" />
                </Box>
              ))}
              {aulasTopReservas.length === 0 && (
                <Typography variant="body2" color="textSecondary">
                  No hay datos disponibles
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Próximas Reservas */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Próximas Reservas (7 días)
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha/Hora</TableCell>
                    <TableCell>Aula</TableCell>
                    <TableCell>Docente</TableCell>
                    <TableCell>Actividad</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="center">Acción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {proximasReservas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No hay reservas próximas
                      </TableCell>
                    </TableRow>
                  ) : (
                    proximasReservas.map((reserva) => (
                      <TableRow key={reserva.id} hover>
                        <TableCell>{formatDateTimeES(reserva.fechaInicio)}</TableCell>
                        <TableCell>{reserva.aulas?.nombre || `Aula #${reserva.aulaId}`}</TableCell>
                        <TableCell>
                          {reserva.personas
                            ? `${reserva.personas.nombre} ${reserva.personas.apellido}`
                            : `Docente #${reserva.docenteId}`}
                        </TableCell>
                        <TableCell>
                          {reserva.actividades?.nombre || (reserva.actividadId ? `#${reserva.actividadId}` : '-')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={reserva.estadoReserva?.nombre || 'N/A'}
                            color={getEstadoReservaColor(reserva.estadoReserva?.codigo || '')}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/reservas/${reserva.id}`)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardReservasPage;
