/**
 * @deprecated
 * Este componente está deprecado desde v1.18.0 (Marzo 2026)
 *
 * Usar en su lugar:
 * - `GeneracionCuotasModal` con tab "Por Personas"
 *
 * Este archivo se mantendrá por compatibilidad pero será removido
 * en una versión futura (estimado: v2.0.0)
 *
 * @see /src/components/Cuotas/GeneracionCuotasModal.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Chip,
  InputAdornment,
  AlertTitle,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Discount as DiscountIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchPersonas } from '../../store/slices/personasSlice';
import cuotasService from '../../services/cuotasService';

// Schema de validación
const generarCuotaIndividualSchema = z.object({
  personaId: z.number().positive('Debe seleccionar una persona'),
  mes: z.number().min(1, 'Mes inválido').max(12, 'Mes inválido'),
  anio: z.number().min(2020, 'Año inválido').max(2030, 'Año inválido'),
  aplicarDescuento: z.boolean(),
  tipoDescuento: z.enum(['DESCUENTO_FIJO', 'DESCUENTO_PORCENTAJE']).optional(),
  valorDescuento: z.number().min(0, 'Valor debe ser positivo').optional(),
  conceptoDescuento: z.string().optional(),
  observaciones: z.string().optional(),
}).refine((data) => {
  // Si aplica descuento, los campos son requeridos
  if (data.aplicarDescuento) {
    return data.tipoDescuento && data.valorDescuento && data.valorDescuento > 0 && data.conceptoDescuento;
  }
  return true;
}, {
  message: 'Complete todos los campos del descuento',
  path: ['valorDescuento'],
});

type FormData = z.infer<typeof generarCuotaIndividualSchema>;

interface GenerarCuotaIndividualModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  personaPreseleccionada?: number;
}

const steps = ['Selección', 'Generación', 'Resultado'];

const GenerarCuotaIndividualModal: React.FC<GenerarCuotaIndividualModalProps> = ({
  open,
  onClose,
  onSuccess,
  personaPreseleccionada,
}) => {
  const dispatch = useAppDispatch();
  const { personas } = useAppSelector((state) => state.personas);

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<{
    cuotaId?: number;
    numero?: string;
    montoTotal?: string;
    montoFinal?: string;
    descuentoAplicado?: boolean;
  } | null>(null);

  const { control, handleSubmit, watch, reset, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(generarCuotaIndividualSchema),
    mode: 'onChange',
    defaultValues: {
      personaId: personaPreseleccionada || 0,
      mes: new Date().getMonth() + 1,
      anio: new Date().getFullYear(),
      aplicarDescuento: false,
      tipoDescuento: 'DESCUENTO_PORCENTAJE',
      valorDescuento: 0,
      conceptoDescuento: '',
      observaciones: '',
    },
  });

  const formValues = watch();
  const personaSeleccionada = personas.find((p) => p.id === formValues.personaId);

  // Filtrar solo personas tipo SOCIO
  const personasSocios = personas.filter((p) =>
    p.tipos?.some((t) => t.tipoPersona?.codigo === 'SOCIO' && t.activo)
  );

  useEffect(() => {
    if (open) {
      // Warning de deprecación
      console.warn(
        '[DEPRECATION] GenerarCuotaIndividualModal está deprecado desde v1.18.0. ' +
        'Usar GeneracionCuotasModal con tab "Por Personas".'
      );

      dispatch(fetchPersonas({}));
      setActiveStep(0);
      setError(null);
      setResultData(null);
      reset({
        personaId: personaPreseleccionada || 0,
        mes: new Date().getMonth() + 1,
        anio: new Date().getFullYear(),
        aplicarDescuento: false,
        tipoDescuento: 'DESCUENTO_PORCENTAJE',
        valorDescuento: 0,
        conceptoDescuento: '',
        observaciones: '',
      });
    }
  }, [open, dispatch, reset, personaPreseleccionada]);

  const handleGenerar = async () => {
    try {
      setLoading(true);
      setError(null);

      // PASO 1: Generar cuota (sin descuentos automáticos)
      const resultGenerar = await cuotasService.generarCuotasBatch({
        mes: formValues.mes,
        anio: formValues.anio,
        personaIds: [formValues.personaId],
        observaciones: formValues.observaciones,
      });

      if (resultGenerar.errores?.length > 0) {
        throw new Error(resultGenerar.errores.join(', '));
      }

      if (resultGenerar.cuotasGeneradas === 0 || !resultGenerar.cuotas[0]) {
        throw new Error('No se pudo generar la cuota. Verifique que la persona no tenga ya una cuota para este período.');
      }

      const cuotaGenerada = resultGenerar.cuotas[0];
      const cuotaId = cuotaGenerada.id;
      const montoOriginal = cuotaGenerada.montoTotal;

      let descuentoAplicado = false;
      let montoFinal = montoOriginal;

      // PASO 2: (OPCIONAL) Aplicar descuento si está habilitado
      if (formValues.aplicarDescuento && formValues.tipoDescuento && formValues.valorDescuento) {
        const primerDiaMes = new Date(formValues.anio, formValues.mes - 1, 1);
        const ultimoDiaMes = new Date(formValues.anio, formValues.mes, 0);

        await cuotasService.aplicarAjusteCuota({
          personaId: formValues.personaId,
          tipoAjuste: formValues.tipoDescuento,
          valor: formValues.valorDescuento,
          concepto: formValues.conceptoDescuento || `Descuento ${formValues.mes}/${formValues.anio}`,
          fechaInicio: primerDiaMes.toISOString().split('T')[0],
          fechaFin: ultimoDiaMes.toISOString().split('T')[0],
          aplicaA: 'TOTAL_CUOTA',
        });

        // PASO 3: Recalcular cuota con ajustes
        const recalculoResponse = await cuotasService.recalcularCuota(cuotaId, {
          aplicarAjustes: true,
          aplicarExenciones: true,
          aplicarDescuentos: false,
        });

        montoFinal = recalculoResponse.cuotaRecalculada.montoTotal;
        descuentoAplicado = true;
      }

      setResultData({
        cuotaId,
        numero: cuotaGenerada.recibo?.numero,
        montoTotal: montoOriginal,
        montoFinal,
        descuentoAplicado,
      });

      setActiveStep(2);
      onSuccess();
    } catch (err: any) {
      console.error('Error al generar cuota:', err);
      setError(err.message || 'Error al generar la cuota');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      setActiveStep(1);
    } else if (activeStep === 1) {
      handleGenerar();
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleClose = () => {
    setActiveStep(0);
    setError(null);
    setResultData(null);
    reset();
    onClose();
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {/* Selección de Persona */}
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="personaId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.personaId}>
                      <InputLabel>Persona (Socio) *</InputLabel>
                      <Select
                        {...field}
                        label="Persona (Socio) *"
                        disabled={!!personaPreseleccionada}
                      >
                        <MenuItem value={0}>
                          <em>Seleccione una persona</em>
                        </MenuItem>
                        {personasSocios.map((persona) => (
                          <MenuItem key={persona.id} value={persona.id}>
                            {persona.nombre} {persona.apellido} - {persona.dni}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.personaId && (
                        <Typography variant="caption" color="error">
                          {errors.personaId.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Período */}
              <Grid size={{ xs: 6 }}>
                <Controller
                  name="mes"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.mes}>
                      <InputLabel>Mes *</InputLabel>
                      <Select {...field} label="Mes *">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((mes) => (
                          <MenuItem key={mes} value={mes}>
                            {new Date(2000, mes - 1).toLocaleString('es-AR', { month: 'long' })}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Controller
                  name="anio"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Año *"
                      type="number"
                      fullWidth
                      error={!!errors.anio}
                      helperText={errors.anio?.message}
                    />
                  )}
                />
              </Grid>

              {/* Descuento Opcional */}
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
                <Controller
                  name="aplicarDescuento"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Aplicar descuento/bonificación"
                    />
                  )}
                />
              </Grid>

              {formValues.aplicarDescuento && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      name="tipoDescuento"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Tipo de Descuento</InputLabel>
                          <Select {...field} label="Tipo de Descuento">
                            <MenuItem value="DESCUENTO_PORCENTAJE">Porcentaje (%)</MenuItem>
                            <MenuItem value="DESCUENTO_FIJO">Monto Fijo ($)</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      name="valorDescuento"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Valor"
                          type="number"
                          fullWidth
                          error={!!errors.valorDescuento}
                          helperText={errors.valorDescuento?.message}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                {formValues.tipoDescuento === 'DESCUENTO_PORCENTAJE' ? '%' : '$'}
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Controller
                      name="conceptoDescuento"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Concepto del Descuento"
                          fullWidth
                          placeholder="Ej: Descuento familiar, Bonificación especial..."
                        />
                      )}
                    />
                  </Grid>
                </>
              )}

              {/* Observaciones */}
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="observaciones"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Observaciones"
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Observaciones adicionales sobre la cuota..."
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" icon={<PersonIcon />} sx={{ mb: 2 }}>
              <AlertTitle>Persona Seleccionada</AlertTitle>
              <strong>
                {personaSeleccionada?.nombre} {personaSeleccionada?.apellido}
              </strong>
              <br />
              DNI: {personaSeleccionada?.dni}
            </Alert>

            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Período
              </Typography>
              <Typography variant="h6" color="primary">
                {new Date(formValues.anio, formValues.mes - 1).toLocaleString('es-AR', { month: 'long', year: 'numeric' })}
              </Typography>
            </Paper>

            {formValues.aplicarDescuento && (
              <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'success.50' }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <DiscountIcon color="success" />
                  <Typography variant="subtitle2" color="success.main">
                    Descuento a Aplicar
                  </Typography>
                </Box>
                <Typography variant="body2">
                  <strong>Tipo:</strong>{' '}
                  {formValues.tipoDescuento === 'DESCUENTO_PORCENTAJE'
                    ? `${formValues.valorDescuento}%`
                    : `$${formValues.valorDescuento}`}
                </Typography>
                <Typography variant="body2">
                  <strong>Concepto:</strong> {formValues.conceptoDescuento}
                </Typography>
              </Paper>
            )}

            {formValues.observaciones && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Observaciones
                </Typography>
                <Typography variant="body2">{formValues.observaciones}</Typography>
              </Paper>
            )}

            <Alert severity="warning" sx={{ mt: 2 }}>
              Al confirmar, se generará la cuota para esta persona
              {formValues.aplicarDescuento && ' y se aplicará el descuento automáticamente'}.
            </Alert>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            {loading ? (
              <CircularProgress />
            ) : error ? (
              <Alert severity="error" icon={<WarningIcon />}>
                <AlertTitle>Error</AlertTitle>
                {error}
              </Alert>
            ) : (
              <>
                <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  ¡Cuota Generada Exitosamente!
                </Typography>

                <Paper variant="outlined" sx={{ p: 3, mt: 3, textAlign: 'left' }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary">
                        Recibo N°
                      </Typography>
                      <Typography variant="h6">{resultData?.numero}</Typography>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Divider />
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Monto Original
                      </Typography>
                      <Typography variant="body1">
                        ${parseFloat(resultData?.montoTotal || '0').toLocaleString()}
                      </Typography>
                    </Grid>

                    {resultData?.descuentoAplicado && (
                      <>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="success.main">
                            Monto con Descuento
                          </Typography>
                          <Typography variant="h6" color="success.main">
                            ${parseFloat(resultData?.montoFinal || '0').toLocaleString()}
                          </Typography>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                          <Chip
                            icon={<DiscountIcon />}
                            label="Descuento aplicado correctamente"
                            color="success"
                            size="small"
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </Paper>
              </>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <ReceiptIcon color="primary" />
          <Typography variant="h6">Generar Cuota Individual</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mt: 2, mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        {activeStep > 0 && activeStep < 2 && (
          <Button onClick={handleBack} disabled={loading}>
            Atrás
          </Button>
        )}
        <Button
          onClick={handleNext}
          variant="contained"
          disabled={(!isValid && activeStep === 0) || loading}
        >
          {loading ? <CircularProgress size={24} /> : activeStep === 2 ? 'Cerrar' : activeStep === 1 ? 'Generar' : 'Siguiente'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GenerarCuotaIndividualModal;
