/**
 * Página de Detalle de Actividad V2
 * Muestra información completa de una actividad con sus relaciones
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Divider,
  Chip,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  ContentCopy as CopyIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

import {
  useActividad,
  useHorariosActividad,
  useDocentesActividad,
  useParticipantesActividad,
  useEstadisticasActividad,
} from '../../hooks/useActividades';
import { formatTime, formatDate } from '../../types/actividad.types';
import { EstadoBadge } from '../../components/actividades/EstadoBadge';
import { HorariosListaV2 } from '../../components/actividades/HorariosListaV2';
import { AsignarDocenteDialog } from '../../components/docentes/AsignarDocenteDialog';
import { InscribirParticipanteDialog } from '../../components/participantes/InscribirParticipanteDialog';
import { desasignarDocente } from '../../services/actividadesApi';
import { desinscribirParticipacion } from '../../services/participacionApi';
import { formatDateES } from '@/utils/dateHelpers';

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const ActividadDetalleV2Page: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [addHorarioDialog, setAddHorarioDialog] = useState(false);
  const [asignarDocenteDialog, setAsignarDocenteDialog] = useState(false);
  const [inscribirParticipanteDialog, setInscribirParticipanteDialog] = useState(false);
  const [confirmarDesasignarDialog, setConfirmarDesasignarDialog] = useState(false);
  const [confirmarDesinscribirDialog, setConfirmarDesinscribirDialog] = useState(false);
  const [docenteADesasignar, setDocenteADesasignar] = useState<{
    docenteId: number;
    rolId: number;
    nombre: string;
    rol: string;
  } | null>(null);
  const [participanteADesinscribir, setParticipanteADesinscribir] = useState<{
    id: number;
    personaId: number;
    nombre: string;
  } | null>(null);
  const [desasignandoDocente, setDesasignandoDocente] = useState(false);
  const [desinscribiendoParticipante, setDesinscribiendoParticipante] = useState(false);

  // Hooks
  const { actividad, loading, error, refetch } = useActividad(Number(id));
  const { horarios, loading: horariosLoading } = useHorariosActividad(Number(id));
  const { docentes, loading: docentesLoading, refetch: refetchDocentes } = useDocentesActividad(Number(id));
  const { participantes, loading: participantesLoading, refetch: refetchParticipantes } = useParticipantesActividad(Number(id));
  const { estadisticas, loading: estadisticasLoading } = useEstadisticasActividad(Number(id));

  // Handlers
  const handleBack = () => {
    navigate('/actividades');
  };

  const handleEdit = () => {
    navigate(`/actividades/${id}/editar`);
  };

  const handleDuplicate = () => {
    navigate(`/actividades/${id}/duplicar`);
  };

  const handleDesasignarClick = (docente: any) => {
    setDocenteADesasignar({
      docenteId: docente.id, // ID de la asignación (DocenteActividad.id)
      rolId: docente.rolDocenteId,
      nombre: `${docente.personas?.nombre} ${docente.personas?.apellido}`,
      rol: docente.rolesDocentes?.nombre || '',
    });
    setConfirmarDesasignarDialog(true);
  };

  const handleDesasignarConfirmar = async () => {
    if (!docenteADesasignar) return;

    setDesasignandoDocente(true);
    try {
      // desasignarDocente solo necesita el ID de la asignación
      await desasignarDocente(docenteADesasignar.docenteId);

      // Refetch docentes
      refetchDocentes();

      // Cerrar dialog
      setConfirmarDesasignarDialog(false);
      setDocenteADesasignar(null);
    } catch (err: any) {
      console.error('Error al desasignar docente:', err);
      alert(err.message || 'Error al desasignar el docente');
    } finally {
      setDesasignandoDocente(false);
    }
  };

  const handleDesasignarCancelar = () => {
    setConfirmarDesasignarDialog(false);
    setDocenteADesasignar(null);
  };

  const handleDesinscribirClick = (participante: any) => {
    setParticipanteADesinscribir({
      id: participante.id,
      personaId: participante.persona_id,
      nombre: `${participante.personas?.nombre} ${participante.personas?.apellido}`,
    });
    setConfirmarDesinscribirDialog(true);
  };

  const handleDesinscribirConfirmar = async () => {
    if (!participanteADesinscribir) return;

    setDesinscribiendoParticipante(true);
    try {
      await desinscribirParticipacion(participanteADesinscribir.id, {
        fecha_fin: new Date().toISOString().split('T')[0],
      });

      // Refetch participantes
      refetchParticipantes();

      // Cerrar dialog
      setConfirmarDesinscribirDialog(false);
      setParticipanteADesinscribir(null);
    } catch (err: any) {
      console.error('Error al desinscribir participante:', err);

      // Extraer mensaje de error
      let errorMessage = 'Error al desinscribir el participante';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      alert(errorMessage);

      // Si el participante ya estaba inactivo, refrescar lista y cerrar diálogo
      if (errorMessage.includes('ya está inactiv')) {
        refetchParticipantes();
        setConfirmarDesinscribirDialog(false);
        setParticipanteADesinscribir(null);
      }
    } finally {
      setDesinscribiendoParticipante(false);
    }
  };

  const handleDesinscribirCancelar = () => {
    setConfirmarDesinscribirDialog(false);
    setParticipanteADesinscribir(null);
  };

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={() => refetch()}>
            Reintentar
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  // Not found
  if (!actividad) {
    return (
      <Box>
        <Alert severity="warning">
          Actividad no encontrada
        </Alert>
        <Button startIcon={<BackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
          Volver
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Button startIcon={<BackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
            Volver
          </Button>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h4" component="h1">
              {actividad.nombre}
            </Typography>
            {actividad.estadosActividades && (
              <EstadoBadge estado={actividad.estadosActividades} size="medium" />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Código: {actividad.codigoActividad}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            onClick={() => navigate(`/actividades/${id}/v2`)}
            sx={{ mr: 1 }}
          >
            Ver Interfaz Mejorada (V2)
          </Button>
          <IconButton color="primary" onClick={handleEdit}>
            <EditIcon />
          </IconButton>
          <IconButton onClick={handleDuplicate}>
            <CopyIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Información General */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Tipo y Categoría */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Clasificación
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Tipo
                  </Typography>
                  <Typography variant="body1">
                    {actividad.tiposActividades?.nombre || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Categoría
                  </Typography>
                  <Typography variant="body1">
                    {actividad.categoriasActividades?.nombre || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Fechas */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <CalendarIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Fechas
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Desde
                  </Typography>
                  <Typography variant="body1">
                    {formatDateES(actividad.fechaDesde)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Hasta
                  </Typography>
                  <Typography variant="body1">
                    {actividad.fechaHasta ? formatDateES(actividad.fechaHasta) : 'Sin fecha de fin'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Cupo y Costo */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PeopleIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Cupo
              </Typography>
              {actividad.capacidadMaxima ? (
                <Box>
                  <Typography variant="h4" color="primary">
                    {estadisticas?.cupoDisponible || 0} / {actividad.capacidadMaxima}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cupo disponible
                  </Typography>
                  {estadisticas && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {estadisticas.porcentajeOcupacion.toFixed(0)}% ocupado
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  Sin límite de cupo
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Costo */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <MoneyIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Costo
              </Typography>
              <Typography variant="h4" color="primary">
                ${actividad.costo.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {actividad.costo === 0 ? 'Actividad gratuita' : 'Por participante'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Descripción */}
        {actividad.descripcion && (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Descripción
                </Typography>
                <Typography variant="body1">
                  {actividad.descripcion}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Tabs de Detalles */}
      <Paper>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <ScheduleIcon />
                Horarios
                {horarios.length > 0 && <Chip label={horarios.length} size="small" />}
              </Box>
            }
          />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <SchoolIcon />
                Docentes
                {docentes.length > 0 && <Chip label={docentes.length} size="small" />}
              </Box>
            }
          />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <PersonIcon />
                Participantes
                {participantes.length > 0 && <Chip label={participantes.length} size="small" />}
              </Box>
            }
          />
        </Tabs>

        {/* Tab Panel: Horarios */}
        <TabPanel value={tabValue} index={0}>
          {horariosLoading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Horarios de la Actividad</Typography>
                <Button startIcon={<AddIcon />} variant="outlined" size="small">
                  Agregar Horario
                </Button>
              </Box>
              <HorariosListaV2 horarios={horarios} showActions />
            </Box>
          )}
        </TabPanel>

        {/* Tab Panel: Docentes */}
        <TabPanel value={tabValue} index={1}>
          {docentesLoading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Docentes Asignados</Typography>
                <Button
                  startIcon={<AddIcon />}
                  variant="outlined"
                  size="small"
                  onClick={() => setAsignarDocenteDialog(true)}
                >
                  Asignar Docente
                </Button>
              </Box>
              {docentes.length === 0 ? (
                <Typography color="text.secondary">
                  No hay docentes asignados
                </Typography>
              ) : (
                <List>
                  {docentes.filter(d => d.activo).map((docente) => (
                    <ListItem key={docente.id} divider>
                      <ListItemAvatar>
                        <Avatar>
                          <SchoolIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${docente.personas?.nombre} ${docente.personas?.apellido}`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              {docente.rolesDocentes?.nombre}
                            </Typography>
                            {docente.observaciones && ` — ${docente.observaciones}`}
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="desasignar"
                          onClick={() => handleDesasignarClick(docente)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
        </TabPanel>

        {/* Tab Panel: Participantes */}
        <TabPanel value={tabValue} index={2}>
          {participantesLoading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Participantes Inscritos</Typography>
                <Button
                  startIcon={<AddIcon />}
                  variant="outlined"
                  size="small"
                  onClick={() => setInscribirParticipanteDialog(true)}
                >
                  Inscribir Participante
                </Button>
              </Box>
              {participantes.length === 0 ? (
                <Typography color="text.secondary">
                  No hay participantes inscritos
                </Typography>
              ) : (
                <List>
                  {participantes.filter(p => p.activa).map((participante) => (
                    <ListItem key={participante.id} divider>
                      <ListItemAvatar>
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${participante.personas?.nombre} ${participante.personas?.apellido}`}
                        secondary={
                          <>
                            Inscrito: {formatDateES(participante.fechaInicio)}
                            {participante.precioEspecial && ` — Precio especial: $${participante.precioEspecial}`}
                            {participante.observaciones && ` — ${participante.observaciones}`}
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="desinscribir"
                          onClick={() => handleDesinscribirClick(participante)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Observaciones */}
      {actividad.observaciones && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Observaciones
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {actividad.observaciones}
          </Typography>
        </Paper>
      )}

      {/* Dialog: Asignar Docente */}
      <AsignarDocenteDialog
        open={asignarDocenteDialog}
        onClose={() => setAsignarDocenteDialog(false)}
        actividadId={Number(id)}
        onSuccess={() => {
          refetchDocentes();
          setAsignarDocenteDialog(false);
        }}
        docentesExistentes={docentes.map((d) => ({
          docente_id: d.docenteId,
          rol_docente_id: d.rolDocenteId,
        }))}
      />

      {/* Dialog: Confirmar Desasignación de Docente */}
      <Dialog
        open={confirmarDesasignarDialog}
        onClose={handleDesasignarCancelar}
        maxWidth="sm"
      >
        <DialogTitle>Confirmar Desasignación</DialogTitle>
        <DialogContent>
          {docenteADesasignar && (
            <>
              <Typography variant="body1" gutterBottom>
                ¿Está seguro que desea desasignar al siguiente docente de esta actividad?
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Docente:</strong> {docenteADesasignar.nombre}
                </Typography>
                <Typography variant="body2">
                  <strong>Rol:</strong> {docenteADesasignar.rol}
                </Typography>
              </Box>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Esta acción marcará al docente como desasignado. Esta operación se puede revertir
                volviendo a asignar al docente.
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDesasignarCancelar} disabled={desasignandoDocente}>
            Cancelar
          </Button>
          <Button
            onClick={handleDesasignarConfirmar}
            color="error"
            variant="contained"
            disabled={desasignandoDocente}
            startIcon={desasignandoDocente ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {desasignandoDocente ? 'Desasignando...' : 'Desasignar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Inscribir Participante */}
      <InscribirParticipanteDialog
        open={inscribirParticipanteDialog}
        onClose={() => setInscribirParticipanteDialog(false)}
        actividadId={Number(id)}
        actividadNombre={actividad?.nombre}
        costoActividad={actividad?.costo || 0}
        cupoMaximo={actividad?.capacidadMaxima || null}
        cupoActual={participantes.filter(p => p.activa).length}
        fechaInicioActividad={actividad?.fechaDesde}
        onSuccess={() => {
          refetchParticipantes();
          setInscribirParticipanteDialog(false);
        }}
        participantesExistentes={participantes.map((p) => ({
          persona_id: p.personaId,
        }))}
      />

      {/* Dialog: Confirmar Desinscripción de Participante */}
      <Dialog
        open={confirmarDesinscribirDialog}
        onClose={handleDesinscribirCancelar}
        maxWidth="sm"
      >
        <DialogTitle>Confirmar Desinscripción</DialogTitle>
        <DialogContent>
          {participanteADesinscribir && (
            <>
              <Typography variant="body1" gutterBottom>
                ¿Está seguro que desea desinscribir al siguiente participante de esta actividad?
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Participante:</strong> {participanteADesinscribir.nombre}
                </Typography>
              </Box>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Esta acción marcará al participante como desinscrito estableciendo una fecha de fin.
                Esta operación se puede revertir volviendo a inscribir al participante.
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDesinscribirCancelar} disabled={desinscribiendoParticipante}>
            Cancelar
          </Button>
          <Button
            onClick={handleDesinscribirConfirmar}
            color="error"
            variant="contained"
            disabled={desinscribiendoParticipante}
            startIcon={desinscribiendoParticipante ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {desinscribiendoParticipante ? 'Desinscribiendo...' : 'Desinscribir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActividadDetalleV2Page;
