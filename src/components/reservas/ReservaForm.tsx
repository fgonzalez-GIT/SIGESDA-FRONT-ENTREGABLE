import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  TextField,
  Autocomplete,
  Button,
  CircularProgress,
  Alert,
  AlertTitle,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchAulasActivas } from '@/store/slices/aulasSlice';
import personasApi from '@/services/personasApi';
import actividadesApi from '@/services/actividadesApi';
import reservasApi from '@/services/reservasApi';
import { usePreferences } from '@/hooks/usePreferences';
import type {
  CreateReservaDto,
  UpdateReservaDto,
  Reserva,
  ConflictosAllResponse,
} from '@/types/reserva.types';
import type { Aula } from '@/types/aula.types';
import type { Persona } from '@/types/persona.types';
import type { Actividad } from '@/types/actividad.types';
import { reservaFormSchema } from '@/schemas/reserva.schema';
import { combineDateAndTime, toDateInputFormat, toTimeInputFormat } from '@/utils/dateHelpers';
import ConflictosAlert from './ConflictosAlert';

interface ReservaFormProps {
  reserva?: Reserva | null;
  onSubmit: (data: CreateReservaDto | UpdateReservaDto) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Formulario para crear/editar reservas de aulas
 *
 * Features:
 * - Validación con Zod
 * - Detección automática de conflictos
 * - Autocomplete para aulas, docentes y actividades
 * - Validación de fechas/horarios
 */
const ReservaForm: React.FC<ReservaFormProps> = ({
  reserva,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const dispatch = useAppDispatch();
  const { aulas } = useAppSelector((state) => state.aulas);
  const { is12Hour } = usePreferences();

  const [docentes, setDocentes] = useState<Persona[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [conflictos, setConflictos] = useState<ConflictosAllResponse | null>(null);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [conflictCheckError, setConflictCheckError] = useState<string | null>(null);

  const isEditMode = Boolean(reserva);

  // Valores iniciales del formulario
  const getDefaultValues = () => {
    if (reserva) {
      const fechaInicio = new Date(reserva.fechaInicio);
      const fechaFin = new Date(reserva.fechaFin);

      return {
        aulaId: reserva.aulaId,
        docenteId: reserva.docenteId,
        actividadId: reserva.actividadId || 0,
        fechaDate: toDateInputFormat(fechaInicio),
        horaInicio: toTimeInputFormat(fechaInicio),
        horaFin: toTimeInputFormat(fechaFin),
        observaciones: reserva.observaciones || '',
      };
    }

    // Valores por defecto para nueva reserva
    const now = new Date();
    now.setMinutes(0, 0, 0); // Redondear a la hora exacta
    const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2 horas

    return {
      aulaId: 0,
      docenteId: 0,
      actividadId: 0,
      fechaDate: toDateInputFormat(now),
      horaInicio: toTimeInputFormat(now),
      horaFin: toTimeInputFormat(endTime),
      observaciones: '',
    };
  };

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(reservaFormSchema),
    defaultValues: getDefaultValues(),
  });

  // Watch para detectar conflictos automáticamente
  const aulaId = watch('aulaId');
  const fechaDate = watch('fechaDate');
  const horaInicio = watch('horaInicio');
  const horaFin = watch('horaFin');

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);

        // Cargar aulas activas
        await dispatch(fetchAulasActivas()).unwrap();

        // Cargar docentes activos
        const docentesData = await personasApi.getDocentes({ activo: true });
        setDocentes(docentesData.data);

        // Cargar actividades activas
        const actividadesData = await actividadesApi.listarActividades({ activa: true });
        setActividades(actividadesData.data);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [dispatch]);

  // Detectar conflictos cuando cambian aula, fecha u horario
  useEffect(() => {
    const checkConflicts = async () => {
      // Validar que tenemos todos los datos necesarios
      if (!aulaId || aulaId === 0 || !fechaDate || !horaInicio || !horaFin) {
        setConflictos(null);
        return;
      }

      try {
        setCheckingConflicts(true);
        setConflictCheckError(null); // Limpiar error anterior

        // Detectar si la reserva cruza medianoche (horaFin <= horaInicio)
        const [horaInicioHH, horaInicioMM] = horaInicio.split(':').map(Number);
        const [horaFinHH, horaFinMM] = horaFin.split(':').map(Number);
        const minutosInicio = horaInicioHH * 60 + horaInicioMM;
        const minutosFin = horaFinHH * 60 + horaFinMM;
        const cruzaMedianoche = minutosFin <= minutosInicio;

        const fechaInicio = combineDateAndTime(fechaDate, horaInicio);
        const fechaFin = combineDateAndTime(fechaDate, horaFin, cruzaMedianoche);

        // Construir payload - solo incluir excludeReservaId si existe
        const payload: any = {
          aulaId,
          fechaInicio,
          fechaFin,
        };

        if (reserva?.id) {
          payload.excludeReservaId = reserva.id;
        }

        console.log('[ReservaForm] Detectando conflictos con payload:', payload);

        const result = await reservasApi.detectarConflictosAll(payload);

        console.log('[ReservaForm] Resultado de conflictos:', result);
        setConflictos(result);
      } catch (error: any) {
        console.error('Error al verificar conflictos:', error);
        console.error('Error details:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
        });

        // Mostrar error amigable al usuario pero no bloquear el formulario
        const errorMsg = error?.response?.status === 500
          ? 'El sistema de detección de conflictos no está disponible temporalmente. Puede continuar creando la reserva bajo su propia responsabilidad.'
          : 'Error al verificar conflictos. Verifique manualmente antes de guardar.';

        setConflictCheckError(errorMsg);
        setConflictos(null);
      } finally {
        setCheckingConflicts(false);
      }
    };

    // Debounce de 500ms para evitar múltiples llamadas
    const timeoutId = setTimeout(checkConflicts, 500);
    return () => clearTimeout(timeoutId);
  }, [aulaId, fechaDate, horaInicio, horaFin, reserva?.id]);

  // Manejar submit
  const handleFormSubmit = async (data: any) => {
    // Detectar si la reserva cruza medianoche (horaFin <= horaInicio)
    const [horaInicioHH, horaInicioMM] = data.horaInicio.split(':').map(Number);
    const [horaFinHH, horaFinMM] = data.horaFin.split(':').map(Number);
    const minutosInicio = horaInicioHH * 60 + horaInicioMM;
    const minutosFin = horaFinHH * 60 + horaFinMM;
    const cruzaMedianoche = minutosFin <= minutosInicio;

    // Convertir a formato esperado por el backend
    const fechaInicio = combineDateAndTime(data.fechaDate, data.horaInicio);
    const fechaFin = combineDateAndTime(data.fechaDate, data.horaFin, cruzaMedianoche);

    // Construir payload base
    const payload: CreateReservaDto = {
      aulaId: data.aulaId,
      docenteId: data.docenteId,
      fechaInicio,
      fechaFin,
      observaciones: data.observaciones || undefined,
    };

    // Solo agregar actividadId si hay una actividad seleccionada
    if (data.actividadId && data.actividadId !== 0) {
      payload.actividadId = data.actividadId;
    }

    await onSubmit(payload);
  };

  if (loadingData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
      {/* Alert de conflictos */}
      {conflictos?.hasConflicts && (
        <ConflictosAlert conflictos={conflictos} onClose={() => setConflictos(null)} />
      )}

      {/* Alert de error en detección de conflictos */}
      {conflictCheckError && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          onClose={() => setConflictCheckError(null)}
        >
          <AlertTitle>Advertencia</AlertTitle>
          {conflictCheckError}
        </Alert>
      )}

      {checkingConflicts && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Verificando conflictos de horario...
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* Aula */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="aulaId"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={aulas}
                getOptionLabel={(option) => option.nombre}
                value={aulas.find((a) => a.id === field.value) || null}
                onChange={(_, newValue) => field.onChange(newValue?.id || 0)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Aula *"
                    error={Boolean(errors.aulaId)}
                    helperText={errors.aulaId?.message as string}
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            )}
          />
        </Grid>

        {/* Docente */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="docenteId"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={docentes}
                getOptionLabel={(option) =>
                  `${option.nombre} ${option.apellido}${
                    option.personaTipos?.find((pt) => pt.tipoPersona?.codigo === 'DOCENTE')
                      ?.especialidadDocente?.nombre
                      ? ` - ${
                          option.personaTipos.find((pt) => pt.tipoPersona?.codigo === 'DOCENTE')
                            ?.especialidadDocente?.nombre
                        }`
                      : ''
                  }`
                }
                value={docentes.find((d) => d.id === field.value) || null}
                onChange={(_, newValue) => field.onChange(newValue?.id || 0)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Docente *"
                    error={Boolean(errors.docenteId)}
                    helperText={errors.docenteId?.message as string}
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            )}
          />
        </Grid>

        {/* Actividad (opcional) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="actividadId"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={actividades}
                getOptionLabel={(option) => option.nombre}
                value={actividades.find((a) => a.id === field.value) || null}
                onChange={(_, newValue) => field.onChange(newValue?.id || 0)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Actividad (opcional)"
                    error={Boolean(errors.actividadId)}
                    helperText={errors.actividadId?.message as string}
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            )}
          />
        </Grid>

        {/* Fecha */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="fechaDate"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="date"
                label="Fecha"
                fullWidth
                error={Boolean(errors.fechaDate)}
                helperText={errors.fechaDate?.message as string}
                InputLabelProps={{ shrink: true }}
              />
            )}
          />
        </Grid>

        {/* Hora inicio - TimePicker */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="horaInicio"
            control={control}
            render={({ field: { value, onChange, ...rest } }) => (
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <TimePicker
                  label="Hora Inicio"
                  value={value ? new Date(`2000-01-01T${value}:00`) : null}
                  onChange={(newValue) => {
                    if (newValue) {
                      const timeStr = newValue.toTimeString().substring(0, 5);
                      onChange(timeStr);
                    } else {
                      onChange('');
                    }
                  }}
                  ampm={is12Hour}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: Boolean(errors.horaInicio),
                      helperText: errors.horaInicio?.message as string,
                      ...rest,
                    },
                  }}
                />
              </LocalizationProvider>
            )}
          />
        </Grid>

        {/* Hora fin - TimePicker */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="horaFin"
            control={control}
            render={({ field: { value, onChange, ...rest } }) => (
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <TimePicker
                  label="Hora Fin"
                  value={value ? new Date(`2000-01-01T${value}:00`) : null}
                  onChange={(newValue) => {
                    if (newValue) {
                      const timeStr = newValue.toTimeString().substring(0, 5);
                      onChange(timeStr);
                    } else {
                      onChange('');
                    }
                  }}
                  ampm={is12Hour}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: Boolean(errors.horaFin),
                      helperText: errors.horaFin?.message as string,
                      ...rest,
                    },
                  }}
                />
              </LocalizationProvider>
            )}
          />
        </Grid>

        {/* Observaciones */}
        <Grid size={{ xs: 12 }}>
          <Controller
            name="observaciones"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Observaciones"
                multiline
                rows={3}
                fullWidth
                error={Boolean(errors.observaciones)}
                helperText={errors.observaciones?.message as string || 'Máximo 500 caracteres'}
                inputProps={{ maxLength: 500 }}
              />
            )}
          />
        </Grid>

        {/* Botones */}
        <Grid size={{ xs: 12 }}>
          <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={loading || conflictos?.hasConflicts || checkingConflicts}
              title={conflictos?.hasConflicts ? 'Resuelva los conflictos antes de guardar' : undefined}
            >
              {loading ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear Reserva'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReservaForm;
