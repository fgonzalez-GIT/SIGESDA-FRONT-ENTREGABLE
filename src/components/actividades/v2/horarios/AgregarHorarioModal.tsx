import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Typography,
  Divider
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { actividadesApi } from '../../../../services/actividadesApi';
import { useCatalogos } from '../../../../hooks/useActividades';
import { usePreferences } from '../../../../hooks/usePreferences';
import type { CreateHorarioDTO, HorarioActividad } from '../../../../types/actividad.types';

interface AgregarHorarioModalProps {
  open: boolean;
  onClose: () => void;
  actividadId: number;
  actividadNombre: string;
  horarioEditar?: HorarioActividad | null;
  onSuccess: () => void;
}

/**
 * Modal para agregar o editar horarios de actividad
 * Permite seleccionar día de la semana, hora inicio y hora fin
 * Valida que la hora fin sea posterior a la hora inicio
 */
export const AgregarHorarioModal: React.FC<AgregarHorarioModalProps> = ({
  open,
  onClose,
  actividadId,
  actividadNombre,
  horarioEditar,
  onSuccess
}) => {
  const { catalogos } = useCatalogos();
  const { is12Hour } = usePreferences();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const diasSemana = catalogos?.diasSemana || [];

  // Estados del formulario
  const [diaSemanaId, setDiaSemanaId] = useState<number>(0);
  const [horaInicio, setHoraInicio] = useState<Date | null>(null);
  const [horaFin, setHoraFin] = useState<Date | null>(null);

  // Función helper para convertir string de hora a Date
  const parseHoraToDate = (horaStr: string): Date | null => {
    if (!horaStr) return null;

    try {
      let timePart: string;

      // Detectar formato ISO timestamp completo (contiene 'T')
      if (horaStr.includes('T')) {
        // Formato: "1970-01-01T10:00:00.000Z" → extraer "10:00"
        timePart = horaStr.substring(11, 16);
      } else {
        // Formato simple: "10:00:00" o "10:00" → extraer "10:00"
        timePart = horaStr.substring(0, 5);
      }

      // Validar formato HH:mm
      if (!/^\d{2}:\d{2}$/.test(timePart)) {
        console.error('[AgregarHorarioModal] Formato de hora inválido:', horaStr, 'timePart:', timePart);
        return null;
      }

      const dateObj = new Date(`2000-01-01T${timePart}:00`);

      // Verificar que la fecha es válida
      if (isNaN(dateObj.getTime())) {
        console.error('[AgregarHorarioModal] Fecha inválida generada de:', horaStr);
        return null;
      }

      return dateObj;
    } catch (error) {
      console.error('[AgregarHorarioModal] Error al parsear hora:', horaStr, error);
      return null;
    }
  };

  // Resetear o cargar datos al abrir
  useEffect(() => {
    if (open) {
      if (horarioEditar) {
        // Modo edición - Convertir strings HH:MM a Date
        setDiaSemanaId(horarioEditar.diaSemanaId);

        const horaInicioDate = parseHoraToDate(horarioEditar.horaInicio);
        const horaFinDate = parseHoraToDate(horarioEditar.horaFin);

        setHoraInicio(horaInicioDate);
        setHoraFin(horaFinDate);

        if (!horaInicioDate || !horaFinDate) {
          console.warn('[AgregarHorarioModal] No se pudieron cargar los horarios:', {
            horaInicio: horarioEditar.horaInicio,
            horaFin: horarioEditar.horaFin
          });
        }
      } else {
        // Modo creación
        setDiaSemanaId(0);
        setHoraInicio(null);
        setHoraFin(null);
      }
      setError(null);
    }
  }, [open, horarioEditar]);

  const handleClose = () => {
    setDiaSemanaId(0);
    setHoraInicio(null);
    setHoraFin(null);
    setError(null);
    onClose();
  };

  const validarFormulario = (): boolean => {
    if (diaSemanaId === 0) {
      setError('Debes seleccionar un día de la semana');
      return false;
    }

    if (!horaInicio || !horaFin) {
      setError('Debes ingresar hora de inicio y hora de fin');
      return false;
    }

    // Validar que hora fin sea posterior a hora inicio
    if (horaFin.getTime() <= horaInicio.getTime()) {
      setError('La hora de fin debe ser posterior a la hora de inicio');
      return false;
    }

    return true;
  };

  const handleGuardar = async () => {
    if (!validarFormulario()) return;

    setLoading(true);
    setError(null);

    try {
      // Convertir Date a string HH:mm:ss
      const horaInicioStr = horaInicio!.toTimeString().substring(0, 5); // HH:MM
      const horaFinStr = horaFin!.toTimeString().substring(0, 5); // HH:MM

      const data: CreateHorarioDTO = {
        diaSemanaId: diaSemanaId,
        horaInicio: `${horaInicioStr}:00`,
        horaFin: `${horaFinStr}:00`,
        activo: true
      };

      if (horarioEditar) {
        // Actualizar horario existente
        await actividadesApi.actualizarHorario(horarioEditar.id, data);
      } else {
        // Crear nuevo horario
        await actividadesApi.agregarHorario(actividadId, data);
      }

      onSuccess();
      handleClose();
    } catch (error: any) {
      setError(error.message || 'Error al guardar horario');
    } finally {
      setLoading(false);
    }
  };

  // Obtener el día seleccionado para mostrarlo
  const diaSeleccionado = diasSemana.find(d => d.id === diaSemanaId);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScheduleIcon />
          {horarioEditar ? 'Editar Horario' : 'Agregar Horario'}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {actividadNombre}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          {/* Selector de día de la semana */}
          <TextField
            select
            fullWidth
            label="Día de la Semana"
            value={diaSemanaId}
            onChange={(e) => setDiaSemanaId(Number(e.target.value))}
            required
            helperText="Selecciona el día en que se desarrolla la actividad"
          >
            <MenuItem value={0} disabled>
              Seleccionar día...
            </MenuItem>
            {diasSemana.map((dia) => (
              <MenuItem key={dia.id} value={dia.id}>
                {dia.nombre}
              </MenuItem>
            ))}
          </TextField>

          <Divider />

          {/* Horarios con TimePicker */}
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TimePicker
                label="Hora de Inicio"
                value={horaInicio}
                onChange={(newValue) => setHoraInicio(newValue)}
                ampm={is12Hour}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    helperText: 'Hora de inicio',
                  },
                }}
              />
              <TimePicker
                label="Hora de Fin"
                value={horaFin}
                onChange={(newValue) => setHoraFin(newValue)}
                ampm={is12Hour}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    helperText: 'Hora de finalización',
                  },
                }}
              />
            </Box>
          </LocalizationProvider>

          {/* Preview del horario */}
          {diaSeleccionado && horaInicio && horaFin && !isNaN(horaInicio.getTime()) && !isNaN(horaFin.getTime()) && (
            <Alert severity="info" icon={<ScheduleIcon />}>
              <Typography variant="body2" fontWeight={500}>
                Vista previa: {diaSeleccionado.nombre}s de {horaInicio.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: is12Hour })} a {horaFin.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: is12Hour })} hs
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleGuardar}
          disabled={loading || diaSemanaId === 0 || !horaInicio || !horaFin}
          startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
        >
          {loading ? 'Guardando...' : horarioEditar ? 'Actualizar' : 'Agregar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AgregarHorarioModal;
