import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
} from '@mui/material';
import {
  Save as SaveIcon,
  Business as OrganizationIcon,
  Payment as PaymentIcon,
  Notifications as NotificationIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore,
  Settings,
} from '@mui/icons-material';
import { SeccionPaginaTitulo } from '@/components/common/SeccionPaginaTitulo';
import { usePreferences } from '@/hooks/usePreferences';
import type { TimeFormat } from '@/store/slices/preferencesSlice';

interface ConfiguracionGeneral {
  nombreOrganizacion: string;
  direccion: string;
  telefono: string;
  email: string;
  sitioWeb: string;
  logoUrl: string;
}

interface ConfiguracionPagos {
  montoDefaultCuota: number;
  diasVencimiento: number;
  recargoPorcentaje: number;
  permitePagosParciales: boolean;
  requiereComprobanteTransferencia: boolean;
}

interface ConfiguracionNotificaciones {
  emailNotificaciones: boolean;
  notificarVencimientos: boolean;
  diasAvisoVencimiento: number;
  notificarNuevosRecibos: boolean;
  emailRemitente: string;
}

interface HorarioActividad {
  id: number;
  actividad: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
}

const ConfiguracionPage: React.FC = () => {
  const { timeFormat, updateTimeFormat } = usePreferences();

  const [configGeneral, setConfigGeneral] = useState<ConfiguracionGeneral>({
    nombreOrganizacion: 'Conservatorio de Música SIGESDA',
    direccion: 'Av. Principal 123, Ciudad',
    telefono: '+1 234 567 8900',
    email: 'info@conservatorio.edu',
    sitioWeb: 'https://conservatorio.edu',
    logoUrl: ''
  });

  const [configPagos, setConfigPagos] = useState<ConfiguracionPagos>({
    montoDefaultCuota: 5000,
    diasVencimiento: 10,
    recargoPorcentaje: 5,
    permitePagosParciales: false,
    requiereComprobanteTransferencia: true
  });

  const [configNotificaciones, setConfigNotificaciones] = useState<ConfiguracionNotificaciones>({
    emailNotificaciones: true,
    notificarVencimientos: true,
    diasAvisoVencimiento: 5,
    notificarNuevosRecibos: true,
    emailRemitente: 'notificaciones@conservatorio.edu'
  });

  const [horariosActividades, setHorariosActividades] = useState<HorarioActividad[]>([
    { id: 1, actividad: 'Coro Principal', dia: 'Martes', horaInicio: '19:00', horaFin: '21:00' },
    { id: 2, actividad: 'Coro Infantil', dia: 'Sábado', horaInicio: '09:00', horaFin: '11:00' },
    { id: 3, actividad: 'Clases de Piano', dia: 'Lunes', horaInicio: '15:00', horaFin: '18:00' }
  ]);

  const [openHorarioDialog, setOpenHorarioDialog] = useState(false);
  const [selectedHorario, setSelectedHorario] = useState<HorarioActividad | null>(null);
  const [formHorario, setFormHorario] = useState({
    actividad: '',
    dia: '',
    horaInicio: '',
    horaFin: ''
  });

  const [guardado, setGuardado] = useState(false);

  // Estados para Accordions
  const [expandedPreferencias, setExpandedPreferencias] = useState(true);
  const [expandedGeneral, setExpandedGeneral] = useState(false);
  const [expandedFinanciero, setExpandedFinanciero] = useState(false);
  const [expandedNotificaciones, setExpandedNotificaciones] = useState(false);
  const [expandedHorarios, setExpandedHorarios] = useState(false);

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const handleSaveGeneral = () => {
    // Aquí se enviaría la configuración al backend
    console.log('Guardando configuración general:', configGeneral);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  };

  const handleSavePagos = () => {
    console.log('Guardando configuración de pagos:', configPagos);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  };

  const handleSaveNotificaciones = () => {
    console.log('Guardando configuración de notificaciones:', configNotificaciones);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  };

  const handleOpenHorarioDialog = (horario?: HorarioActividad) => {
    if (horario) {
      setSelectedHorario(horario);
      setFormHorario({
        actividad: horario.actividad,
        dia: horario.dia,
        horaInicio: horario.horaInicio,
        horaFin: horario.horaFin
      });
    } else {
      setSelectedHorario(null);
      setFormHorario({
        actividad: '',
        dia: '',
        horaInicio: '',
        horaFin: ''
      });
    }
    setOpenHorarioDialog(true);
  };

  const handleSaveHorario = () => {
    if (selectedHorario) {
      setHorariosActividades(prev => prev.map(h =>
        h.id === selectedHorario.id ? { ...selectedHorario, ...formHorario } : h
      ));
    } else {
      const newHorario: HorarioActividad = {
        id: Date.now(),
        ...formHorario
      };
      setHorariosActividades(prev => [...prev, newHorario]);
    }
    setOpenHorarioDialog(false);
  };

  const handleDeleteHorario = (id: number) => {
    setHorariosActividades(prev => prev.filter(h => h.id !== id));
  };

  return (
    <Box>
      {/* Header */}
      <SeccionPaginaTitulo
        titulo="Configuración del Sistema"
        subtitulo="Gestiona los parámetros generales del sistema SIGESDA"
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Configuración' },
        ]}
      />

      {guardado && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Configuración guardada exitosamente
        </Alert>
      )}

      {/* NOTA: Secciones MOCK (pendientes de integración con backend) */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Las secciones de Información General, Pagos, Notificaciones y Horarios contienen datos de ejemplo. La integración con el backend está pendiente.
      </Alert>

      <Stack spacing={2}>
        {/* ACCORDION 1: Preferencias de Usuario */}
        <Accordion expanded={expandedPreferencias} onChange={() => setExpandedPreferencias(!expandedPreferencias)}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={2}>
              <Settings color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Preferencias de Usuario
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Card>
              <CardHeader
                avatar={<ScheduleIcon color="primary" />}
                title="Formato de Hora"
                subheader="Configura cómo se muestran las horas en todo el sistema"
              />
              <CardContent>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Selecciona el formato de hora que prefieres:
                  </Typography>
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Formato de Hora</InputLabel>
                    <Select
                      value={timeFormat}
                      onChange={(e) => updateTimeFormat(e.target.value as TimeFormat)}
                      label="Formato de Hora"
                    >
                      <MenuItem value="24h">
                        <Box>
                          <Typography variant="body1">Formato 24 horas</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Ejemplo: 14:30, 22:00 (estándar argentino)
                          </Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="12h">
                        <Box>
                          <Typography variant="body1">Formato 12 horas (AM/PM)</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Ejemplo: 2:30 p. m., 10:00 p. m.
                          </Typography>
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Este formato se aplicará a todos los selectores de hora (reservas, horarios de actividades, etc.). Los cambios son inmediatos y se guardan automáticamente.
                  </Alert>
                </Box>
              </CardContent>
            </Card>
          </AccordionDetails>
        </Accordion>

        {/* ACCORDION 2: Configuración General */}
        <Accordion expanded={expandedGeneral} onChange={() => setExpandedGeneral(!expandedGeneral)}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={2}>
              <Settings color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Configuración General
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={3}>
              {/* Información General */}
              <Card>
                <CardHeader
                  avatar={<OrganizationIcon color="primary" />}
                  title="Información General"
                  subheader="Datos básicos de la organización"
                />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Nombre de la Organización"
                        value={configGeneral.nombreOrganizacion}
                        onChange={(e) => setConfigGeneral({
                          ...configGeneral,
                          nombreOrganizacion: e.target.value
                        })}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Dirección"
                        value={configGeneral.direccion}
                        onChange={(e) => setConfigGeneral({
                          ...configGeneral,
                          direccion: e.target.value
                        })}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Teléfono"
                        value={configGeneral.telefono}
                        onChange={(e) => setConfigGeneral({
                          ...configGeneral,
                          telefono: e.target.value
                        })}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={configGeneral.email}
                        onChange={(e) => setConfigGeneral({
                          ...configGeneral,
                          email: e.target.value
                        })}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Sitio Web"
                        value={configGeneral.sitioWeb}
                        onChange={(e) => setConfigGeneral({
                          ...configGeneral,
                          sitioWeb: e.target.value
                        })}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveGeneral}
                        fullWidth
                      >
                        Guardar Información General
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* ACCORDION 2: Configuración Financiera */}
        <Accordion expanded={expandedFinanciero} onChange={() => setExpandedFinanciero(!expandedFinanciero)}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={2}>
              <PaymentIcon color="secondary" />
              <Typography variant="h6" fontWeight="bold">
                Configuración Financiera
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Card>
              <CardHeader
                avatar={<PaymentIcon color="primary" />}
                title="Configuración de Pagos"
                subheader="Parámetros para cuotas y recibos"
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Monto por Defecto de Cuota"
                      type="number"
                      value={configPagos.montoDefaultCuota}
                      onChange={(e) => setConfigPagos({
                        ...configPagos,
                        montoDefaultCuota: parseFloat(e.target.value) || 0
                      })}
                      InputProps={{ startAdornment: '$' }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Días de Vencimiento"
                      type="number"
                      value={configPagos.diasVencimiento}
                      onChange={(e) => setConfigPagos({
                        ...configPagos,
                        diasVencimiento: parseInt(e.target.value) || 0
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Recargo por Vencimiento (%)"
                      type="number"
                      value={configPagos.recargoPorcentaje}
                      onChange={(e) => setConfigPagos({
                        ...configPagos,
                        recargoPorcentaje: parseFloat(e.target.value) || 0
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={configPagos.permitePagosParciales}
                          onChange={(e) => setConfigPagos({
                            ...configPagos,
                            permitePagosParciales: e.target.checked
                          })}
                        />
                      }
                      label="Permitir pagos parciales"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={configPagos.requiereComprobanteTransferencia}
                          onChange={(e) => setConfigPagos({
                            ...configPagos,
                            requiereComprobanteTransferencia: e.target.checked
                          })}
                        />
                      }
                      label="Requiere comprobante para transferencias"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSavePagos}
                      fullWidth
                    >
                      Guardar Configuración de Pagos
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </AccordionDetails>
        </Accordion>

        {/* ACCORDION 3: Notificaciones y Comunicación */}
        <Accordion expanded={expandedNotificaciones} onChange={() => setExpandedNotificaciones(!expandedNotificaciones)}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={2}>
              <NotificationIcon color="info" />
              <Typography variant="h6" fontWeight="bold">
                Notificaciones y Comunicación
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Card>
              <CardHeader
                avatar={<EmailIcon color="primary" />}
                title="Configuración de Notificaciones"
                subheader="Configuración de emails y alertas"
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Email Remitente"
                      type="email"
                      value={configNotificaciones.emailRemitente}
                      onChange={(e) => setConfigNotificaciones({
                        ...configNotificaciones,
                        emailRemitente: e.target.value
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Días de Aviso Previo a Vencimiento"
                      type="number"
                      value={configNotificaciones.diasAvisoVencimiento}
                      onChange={(e) => setConfigNotificaciones({
                        ...configNotificaciones,
                        diasAvisoVencimiento: parseInt(e.target.value) || 0
                      })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={configNotificaciones.emailNotificaciones}
                          onChange={(e) => setConfigNotificaciones({
                            ...configNotificaciones,
                            emailNotificaciones: e.target.checked
                          })}
                        />
                      }
                      label="Habilitar notificaciones por email"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={configNotificaciones.notificarVencimientos}
                          onChange={(e) => setConfigNotificaciones({
                            ...configNotificaciones,
                            notificarVencimientos: e.target.checked
                          })}
                        />
                      }
                      label="Notificar vencimientos de cuotas"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={configNotificaciones.notificarNuevosRecibos}
                          onChange={(e) => setConfigNotificaciones({
                            ...configNotificaciones,
                            notificarNuevosRecibos: e.target.checked
                          })}
                        />
                      }
                      label="Notificar nuevos recibos"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveNotificaciones}
                      fullWidth
                    >
                      Guardar Configuración de Notificaciones
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </AccordionDetails>
        </Accordion>

        {/* ACCORDION 4: Horarios y Calendario */}
        <Accordion expanded={expandedHorarios} onChange={() => setExpandedHorarios(!expandedHorarios)}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={2}>
              <ScheduleIcon color="warning" />
              <Typography variant="h6" fontWeight="bold">
                Horarios y Calendario
              </Typography>
              <Chip label={`${horariosActividades.length} horarios`} size="small" color="warning" variant="outlined" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Card>
              <CardHeader
                avatar={<ScheduleIcon color="primary" />}
                title="Horarios de Actividades"
                subheader="Gestión de horarios predeterminados"
                action={
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenHorarioDialog()}
                    size="small"
                  >
                    Agregar
                  </Button>
                }
              />
              <CardContent>
                <List>
                  {horariosActividades.map((horario) => (
                    <ListItem key={horario.id} divider>
                      <ListItemText
                        primary={horario.actividad}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                            <Chip label={horario.dia} size="small" variant="outlined" />
                            <Typography variant="body2">
                              {horario.horaInicio} - {horario.horaFin}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleOpenHorarioDialog(horario)}
                          size="small"
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteHorario(horario.id)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </AccordionDetails>
        </Accordion>
      </Stack>

      {/* Dialog para horarios */}
      <Dialog open={openHorarioDialog} onClose={() => setOpenHorarioDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedHorario ? 'Editar Horario' : 'Nuevo Horario'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Actividad"
                value={formHorario.actividad}
                onChange={(e) => setFormHorario({ ...formHorario, actividad: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Día</InputLabel>
                <Select
                  value={formHorario.dia}
                  label="Día"
                  onChange={(e) => setFormHorario({ ...formHorario, dia: e.target.value })}
                >
                  {diasSemana.map((dia) => (
                    <MenuItem key={dia} value={dia}>
                      {dia}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="Hora Inicio"
                type="time"
                value={formHorario.horaInicio}
                onChange={(e) => setFormHorario({ ...formHorario, horaInicio: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="Hora Fin"
                type="time"
                value={formHorario.horaFin}
                onChange={(e) => setFormHorario({ ...formHorario, horaFin: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHorarioDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveHorario} variant="contained">
            {selectedHorario ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConfiguracionPage;