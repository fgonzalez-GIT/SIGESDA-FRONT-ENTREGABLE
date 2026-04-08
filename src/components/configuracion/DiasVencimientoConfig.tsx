/**
 * Componente para configurar días de vencimiento
 *
 * Permite a los administradores configurar:
 * - Día de vencimiento de cuotas mensuales (SOCIOS)
 * - Día de vencimiento de pagos de actividades (NO_SOCIO)
 *
 * Características:
 * - Formulario reactivo con React Hook Form + Zod
 * - Validación client-side (rango 1-28)
 * - Estados de loading y error
 * - Notificaciones Redux
 * - Información sobre impacto de cambios
 */

import React, { useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  AlertTitle,
  Box,
  CircularProgress,
  Typography,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDiasVencimiento } from '@/hooks/useDiasVencimiento';
import {
  diaVencimientoSchema,
  type DiaVencimientoFormData,
} from '@/schemas/configuracion.schema';
import { useAppDispatch } from '@/hooks/redux';
import { showNotification } from '@/store/slices/uiSlice';

/**
 * Componente principal para gestión de días de vencimiento
 */
export const DiasVencimientoConfig: React.FC = () => {
  const dispatch = useAppDispatch();
  const { config, loading, error, saving, guardarCambios, refetch } = useDiasVencimiento();

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<DiaVencimientoFormData>({
    resolver: zodResolver(diaVencimientoSchema),
    defaultValues: {
      diaVencimientoCuota: 0,
      diaVencimientoPagoActividad: 0,
    },
  });

  /**
   * Sincronizar formulario cuando se carguen los datos del backend
   */
  useEffect(() => {
    if (config) {
      reset({
        diaVencimientoCuota: config.diaVencimientoCuota,
        diaVencimientoPagoActividad: config.diaVencimientoPagoActividad,
      });
    }
  }, [config, reset]);

  /**
   * Handler del submit del formulario
   */
  const onSubmit = async (data: DiaVencimientoFormData) => {
    try {
      await guardarCambios(data);

      dispatch(
        showNotification({
          message: 'Configuración guardada exitosamente',
          severity: 'success',
        })
      );

      reset(data); // Resetear dirty state
    } catch (err) {
      // El error ya fue manejado en el hook, solo mostramos notificación
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar cambios';
      dispatch(
        showNotification({
          message: errorMsg,
          severity: 'error',
        })
      );
    }
  };

  /**
   * Handler para cancelar cambios
   */
  const handleCancel = () => {
    if (config) {
      reset({
        diaVencimientoCuota: config.diaVencimientoCuota,
        diaVencimientoPagoActividad: config.diaVencimientoPagoActividad,
      });
    }
  };

  /**
   * Estado de carga inicial
   */
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" p={4}>
            <CircularProgress size={40} sx={{ mr: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Cargando configuración...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  /**
   * Estado de error (sin datos cargados)
   */
  if (error && !config) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            <AlertTitle>Error al cargar configuración</AlertTitle>
            {error}
            <Box mt={2}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<RefreshIcon />}
                onClick={refetch}
              >
                Reintentar
              </Button>
            </Box>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  /**
   * Formulario principal
   */
  return (
    <Card>
      <CardHeader
        avatar={<CalendarIcon color="primary" />}
        title="Configuración de Días de Vencimiento"
        subheader="Configure los días del mes en que vencen los recibos"
      />
      <Divider />
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Información importante - Superior */}
            <Grid size={{ xs: 12 }}>
              <Alert severity="info" icon={<InfoIcon />}>
                <AlertTitle>Información Importante</AlertTitle>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li>Los cambios solo afectan a recibos generados después de guardar</li>
                  <li>Los recibos existentes mantienen su fecha de vencimiento original</li>
                  <li>Se recomienda usar días entre 1 y 28 para evitar problemas con febrero</li>
                </ul>
              </Alert>
            </Grid>

            {/* Input: Día de Vencimiento - Cuotas (SOCIOS) */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="diaVencimientoCuota"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                    label="Día de Vencimiento - Cuotas (SOCIOS)"
                    type="number"
                    fullWidth
                    required
                    disabled={saving}
                    error={!!errors.diaVencimientoCuota}
                    helperText={
                      errors.diaVencimientoCuota?.message ||
                      'Día del mes en que vencen las cuotas mensuales de socios'
                    }
                    InputProps={{
                      inputProps: {
                        min: 1,
                        max: 28,
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Input: Día de Vencimiento - Pagos de Actividades (NO_SOCIO) */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="diaVencimientoPagoActividad"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                    label="Día de Vencimiento - Pagos de Actividades (NO_SOCIO)"
                    type="number"
                    fullWidth
                    required
                    disabled={saving}
                    error={!!errors.diaVencimientoPagoActividad}
                    helperText={
                      errors.diaVencimientoPagoActividad?.message ||
                      'Día del mes en que vencen los pagos de actividades para personas no socias'
                    }
                    InputProps={{
                      inputProps: {
                        min: 1,
                        max: 28,
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Warning sobre caché del backend */}
            <Grid size={{ xs: 12 }}>
              <Alert severity="warning" icon={<WarningIcon />}>
                <AlertTitle>Propagación de Cambios</AlertTitle>
                El sistema tiene un caché de 5 minutos. Los cambios pueden tardar hasta ese
                tiempo en aplicarse completamente a todos los nuevos recibos generados.
              </Alert>
            </Grid>

            {/* Error del formulario */}
            {error && (
              <Grid size={{ xs: 12 }}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}

            {/* Botones de acción */}
            <Grid size={{ xs: 12 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  {isDirty && (
                    <Typography variant="body2" color="warning.main">
                      ⚠️ Hay cambios sin guardar
                    </Typography>
                  )}
                </Box>
                <Box display="flex" gap={2}>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={!isDirty || saving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={!isDirty || saving}
                  >
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};
