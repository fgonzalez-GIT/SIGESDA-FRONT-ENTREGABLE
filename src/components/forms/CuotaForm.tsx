// @ts-nocheck
// LEGACY: Este componente no se usa. Utiliza interfaz Cuota V1 obsoleta.
import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Alert,
  Autocomplete,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppSelector } from '../../hooks/redux';
import { Cuota } from '../../types/cuota.types';

// Schema de validación para el formulario de cuota
const cuotaFormSchema = z.object({
  personaId: z.number().int().positive('Receptor requerido'),
  monto: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  concepto: z.string().min(3, 'El concepto debe tener al menos 3 caracteres').max(200, 'El concepto no puede exceder 200 caracteres'),
  mesVencimiento: z.string().min(1, 'El mes de vencimiento es obligatorio'),
  fechaVencimiento: z.date(),
  estado: z.enum(['pendiente', 'pagada', 'vencida', 'cancelada']),
  metodoPago: z.enum(['efectivo', 'transferencia', 'tarjeta_debito', 'tarjeta_credito']).optional(),
  fechaPago: z.date().optional().nullable(),
  observaciones: z.string().max(500, 'Observaciones no puede exceder 500 caracteres').optional(),
  descuento: z.number().min(0, 'El descuento debe ser mayor o igual a 0'),
  recargo: z.number().min(0, 'El recargo debe ser mayor o igual a 0'),
}).refine(
  (data) => {
    // Si el estado es "pagada", metodoPago es obligatorio
    if (data.estado === 'pagada') {
      return data.metodoPago !== undefined;
    }
    return true;
  },
  {
    message: 'El método de pago es obligatorio para cuotas pagadas',
    path: ['metodoPago'],
  }
).refine(
  (data) => {
    // Si el estado es "pagada", fechaPago es obligatoria
    if (data.estado === 'pagada') {
      return data.fechaPago !== null && data.fechaPago !== undefined;
    }
    return true;
  },
  {
    message: 'La fecha de pago es obligatoria para cuotas pagadas',
    path: ['fechaPago'],
  }
);

type CuotaFormData = z.infer<typeof cuotaFormSchema>;

interface CuotaFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (cuota: Omit<Cuota, 'id'>) => void;
  cuota?: Cuota | null;
  loading?: boolean;
}

export const CuotaForm: React.FC<CuotaFormProps> = ({
  open,
  onClose,
  onSubmit,
  cuota,
  loading = false,
}) => {
  const { personas } = useAppSelector((state) => state.personas);

  // React Hook Form con Zod Resolver
  const { control, handleSubmit, formState: { errors }, reset, watch } = useForm<CuotaFormData>({
    resolver: zodResolver(cuotaFormSchema),
    defaultValues: {
      personaId: null as any,
      monto: 0,
      concepto: '',
      mesVencimiento: '',
      fechaVencimiento: null as any,
      estado: 'pendiente',
      metodoPago: undefined,
      fechaPago: null,
      observaciones: '',
      descuento: 0,
      recargo: 0,
    }
  });

  // Watch para valores calculados
  const watchMonto = watch('monto', 0);
  const watchDescuento = watch('descuento', 0);
  const watchRecargo = watch('recargo', 0);
  const watchEstado = watch('estado', 'pendiente');

  useEffect(() => {
    if (cuota && open) {
      reset({
        personaId: cuota.personaId,
        monto: cuota.monto,
        concepto: cuota.concepto,
        mesVencimiento: cuota.mesVencimiento,
        fechaVencimiento: new Date(cuota.fechaVencimiento),
        estado: cuota.estado,
        metodoPago: cuota.metodoPago,
        fechaPago: cuota.fechaPago ? new Date(cuota.fechaPago) : null,
        observaciones: cuota.observaciones || '',
        descuento: cuota.descuento || 0,
        recargo: cuota.recargo || 0,
      });
    } else if (open) {
      reset({
        personaId: null as any,
        monto: 0,
        concepto: '',
        mesVencimiento: '',
        fechaVencimiento: null as any,
        estado: 'pendiente',
        metodoPago: undefined,
        fechaPago: null,
        observaciones: '',
        descuento: 0,
        recargo: 0,
      });
    }
  }, [cuota, open, reset]);

  // Handler del formulario con validación automática de Zod
  const onFormSubmit = (data: CuotaFormData) => {
    const persona = personas.find(p => p.id === data.personaId);
    if (!persona) return;

    const montoFinal = data.monto - data.descuento + data.recargo;

    const socioTipo = persona.tipos?.find(t => t.tipoPersonaCodigo === 'SOCIO');
    const personaTipoValue = persona.tipos?.[0]?.tipoPersonaCodigo.toLowerCase() as 'socio' | 'docente' | 'estudiante';

    const cuotaData: Omit<Cuota, 'id'> = {
      personaId: data.personaId!,
      personaNombre: persona.nombre,
      personaApellido: persona.apellido,
      personaTipo: personaTipoValue,
      categoriaId: socioTipo?.categoriaId || '',
      monto: data.monto,
      concepto: data.concepto,
      mesVencimiento: data.mesVencimiento,
      fechaVencimiento: data.fechaVencimiento!.toISOString().split('T')[0],
      fechaCreacion: new Date().toISOString().split('T')[0],
      estado: data.estado,
      metodoPago: data.metodoPago,
      fechaPago: data.fechaPago?.toISOString().split('T')[0],
      observaciones: data.observaciones || undefined,
      descuento: data.descuento > 0 ? data.descuento : undefined,
      recargo: data.recargo > 0 ? data.recargo : undefined,
      montoFinal,
    };

    onSubmit(cuotaData);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const generateMesVencimiento = (fecha: Date | null) => {
    if (!fecha) return '';
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const personasOptions = personas.map(persona => ({
    id: persona.id,
    label: `${persona.nombre} ${persona.apellido} (${persona.tipos?.map(t => t.tipoPersonaCodigo).join(', ') || 'Sin tipo'})`,
    persona
  }));

  const montoFinal = watchMonto - watchDescuento + watchRecargo;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {cuota ? 'Editar Cuota' : 'Nueva Cuota'}
        </DialogTitle>

        <form onSubmit={handleSubmit(onFormSubmit)}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              {/* Selección de persona */}
              <Controller
                name="personaId"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <Autocomplete
                    options={personasOptions}
                    value={personasOptions.find(p => p.id === field.value) || null}
                    onChange={(_, newValue) => field.onChange(newValue?.id || null)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Persona"
                        error={!!error}
                        helperText={error?.message}
                        required
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box>
                          <Typography variant="body1">
                            {option.persona.nombre} {option.persona.apellido}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.persona.tipos?.map(t => t.tipoPersonaCodigo).join(', ') || 'Sin tipo'} - {option.persona.email}
                          </Typography>
                        </Box>
                      </li>
                    )}
                    getOptionLabel={(option) => option.label}
                    disabled={loading}
                  />
                )}
              />

              {/* Datos financieros */}
              <Box display="flex" gap={2}>
                <Controller
                  name="monto"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label="Monto"
                      type="number"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      error={!!error}
                      helperText={error?.message}
                      required
                      disabled={loading}
                      fullWidth
                    />
                  )}
                />

                <Controller
                  name="descuento"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label="Descuento"
                      type="number"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      error={!!error}
                      helperText={error?.message}
                      disabled={loading}
                      fullWidth
                    />
                  )}
                />

                <Controller
                  name="recargo"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label="Recargo"
                      type="number"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      error={!!error}
                      helperText={error?.message}
                      disabled={loading}
                      fullWidth
                    />
                  )}
                />
              </Box>

              {/* Mostrar monto final */}
              {montoFinal !== watchMonto && (
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Monto final: ${montoFinal.toLocaleString()}</strong>
                    {watchDescuento > 0 && ` (Descuento: -$${watchDescuento})`}
                    {watchRecargo > 0 && ` (Recargo: +$${watchRecargo})`}
                  </Typography>
                </Alert>
              )}

              {/* Concepto */}
              <Controller
                name="concepto"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Concepto"
                    placeholder="Ej: Cuota mensual - Octubre 2025"
                    error={!!error}
                    helperText={error?.message}
                    required
                    disabled={loading}
                    fullWidth
                    multiline
                    rows={2}
                  />
                )}
              />

              {/* Fechas */}
              <Box display="flex" gap={2}>
                <Controller
                  name="mesVencimiento"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label="Mes de Vencimiento"
                      type="month"
                      error={!!error}
                      helperText={error?.message}
                      required
                      disabled={loading}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />

                <Controller
                  name="fechaVencimiento"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <DatePicker
                      label="Fecha de Vencimiento"
                      value={field.value}
                      onChange={(newValue) => {
                        field.onChange(newValue);
                        // Auto-set mesVencimiento
                        if (newValue) {
                          const mesValue = generateMesVencimiento(newValue);
                          // Use setValue from useForm if needed, or handle differently
                        }
                      }}
                      disabled={loading}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          error: !!error,
                          helperText: error?.message,
                        }
                      }}
                    />
                  )}
                />
              </Box>

              {/* Estado y método de pago */}
              <Box display="flex" gap={2}>
                <Controller
                  name="estado"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <FormControl fullWidth required error={!!error}>
                      <InputLabel>Estado</InputLabel>
                      <Select {...field} disabled={loading}>
                        <MenuItem value="pendiente">Pendiente</MenuItem>
                        <MenuItem value="pagada">Pagada</MenuItem>
                        <MenuItem value="vencida">Vencida</MenuItem>
                        <MenuItem value="cancelada">Cancelada</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />

                {watchEstado === 'pagada' && (
                  <Controller
                    name="metodoPago"
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <FormControl fullWidth required error={!!error}>
                        <InputLabel>Método de Pago</InputLabel>
                        <Select {...field} disabled={loading} value={field.value || ''}>
                          <MenuItem value="efectivo">Efectivo</MenuItem>
                          <MenuItem value="transferencia">Transferencia</MenuItem>
                          <MenuItem value="tarjeta_debito">Tarjeta de Débito</MenuItem>
                          <MenuItem value="tarjeta_credito">Tarjeta de Crédito</MenuItem>
                        </Select>
                        {error && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                            {error.message}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
                )}
              </Box>

              {/* Fecha de pago */}
              {watchEstado === 'pagada' && (
                <Controller
                  name="fechaPago"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <DatePicker
                      label="Fecha de Pago"
                      value={field.value}
                      onChange={field.onChange}
                      disabled={loading}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          error: !!error,
                          helperText: error?.message,
                        }
                      }}
                    />
                  )}
                />
              )}

              {/* Observaciones */}
              <Controller
                name="observaciones"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Observaciones"
                    disabled={loading}
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Observaciones adicionales..."
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Guardando...' : (cuota ? 'Actualizar' : 'Crear')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default CuotaForm;
