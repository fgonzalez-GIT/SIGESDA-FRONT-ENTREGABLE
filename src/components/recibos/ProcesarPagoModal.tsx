import React, { useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useAppDispatch } from '../../hooks/redux';
import { pagarRecibo } from '../../store/slices/recibosSlice';
import { Recibo, MedioPago } from '../../store/slices/recibosSlice';
import {
  procesarPagoSchema,
  ProcesarPagoFormData,
  tipoMedioPagoEnum,
  validarSumaMediosPago,
} from '../../schemas/recibo.schema';
import { TextField } from '@mui/material';

interface ProcesarPagoModalProps {
  open: boolean;
  onClose: () => void;
  recibo: Recibo;
  onSuccess: () => void;
}

const TIPOS_MEDIO_PAGO_OPTIONS = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'TARJETA_DEBITO', label: 'Tarjeta de Débito' },
  { value: 'TARJETA_CREDITO', label: 'Tarjeta de Crédito' },
  { value: 'CHEQUE', label: 'Cheque' },
];

// Tipos que requieren banco Y número (ambos obligatorios)
const TIPOS_CON_BANCO_Y_NUMERO = ['TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA'];

// Tipos que tienen banco opcional pero número obligatorio
const TIPOS_BANCO_OPCIONAL_NUMERO_REQUERIDO = ['CHEQUE'];

export const ProcesarPagoModal: React.FC<ProcesarPagoModalProps> = ({
  open,
  onClose,
  recibo,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Calcular saldo pendiente
  const saldoPendiente = useMemo(() => {
    return recibo.total - recibo.montoPagado;
  }, [recibo]);

  // Configurar formulario con React Hook Form
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProcesarPagoFormData>({
    resolver: zodResolver(procesarPagoSchema),
    defaultValues: {
      mediosPago: [
        {
          tipo: 'EFECTIVO',
          importe: saldoPendiente,
          fecha: new Date().toISOString().split('T')[0],
          banco: '',
          numero: '',
        },
      ],
    },
  });

  // useFieldArray para gestionar array dinámico de medios de pago
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'mediosPago',
  });

  // Observar valores del formulario para cálculos en tiempo real
  const mediosPagoValues = useWatch({
    control,
    name: 'mediosPago',
    defaultValue: [],
  });

  // Calcular total pagado y restante
  const { totalPagado, restante, validacion } = useMemo(() => {
    const total = mediosPagoValues.reduce((sum, medio) => {
      const importe = typeof medio.importe === 'number' ? medio.importe : parseFloat(medio.importe || '0');
      return sum + (isNaN(importe) ? 0 : importe);
    }, 0);

    const rest = saldoPendiente - total;
    const val = validarSumaMediosPago(
      mediosPagoValues.map(m => ({ importe: typeof m.importe === 'number' ? m.importe : parseFloat(m.importe || '0') })),
      saldoPendiente
    );

    return {
      totalPagado: total,
      restante: rest,
      validacion: val,
    };
  }, [mediosPagoValues, saldoPendiente]);

  // Reset form cuando cambia el recibo
  useEffect(() => {
    if (open) {
      reset({
        mediosPago: [
          {
            tipo: 'EFECTIVO',
            importe: saldoPendiente,
            fecha: new Date().toISOString().split('T')[0],
            banco: '',
            numero: '',
          },
        ],
      });
      setError(null);
    }
  }, [open, recibo, saldoPendiente, reset]);

  // Handler para agregar nuevo medio de pago
  const handleAgregarMedio = () => {
    if (fields.length < 5) {
      append({
        tipo: 'EFECTIVO',
        importe: Math.max(0, restante),
        fecha: new Date().toISOString().split('T')[0],
        banco: '',
        numero: '',
      });
    }
  };

  // Handler para eliminar medio de pago
  const handleEliminarMedio = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Handler para enviar formulario
  const onSubmit = async (data: ProcesarPagoFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Validación adicional de suma
      if (!validacion.valido) {
        setError(validacion.mensaje || 'Error en la validación de importes');
        setLoading(false);
        return;
      }

      // Limpiar campos opcionales vacíos
      const mediosPagoLimpios: MedioPago[] = data.mediosPago.map((medio) => {
        const medioPago: MedioPago = {
          tipo: medio.tipo,
          importe: typeof medio.importe === 'number' ? medio.importe : parseFloat(medio.importe),
          fecha: medio.fecha,
        };

        // Solo incluir banco y número si tienen valor
        if (medio.banco && medio.banco.trim().length > 0) {
          medioPago.banco = medio.banco.trim();
        }
        if (medio.numero && medio.numero.trim().length > 0) {
          medioPago.numero = medio.numero.trim();
        }

        return medioPago;
      });

      await dispatch(
        pagarRecibo({
          reciboId: recibo.id,
          request: { mediosPago: mediosPagoLimpios },
        })
      ).unwrap();

      setLoading(false);
      onSuccess();
    } catch (err: any) {
      console.error('Error al procesar pago:', err);
      console.error('Error response:', err.response?.data);

      // Detectar errores específicos de duplicados (409 Conflict)
      let errorMessage = 'Error al procesar el pago';

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Agregar información adicional para errores 500
      if (err.response?.status === 500) {
        errorMessage = `Error interno del servidor: ${errorMessage}. Por favor, revise los logs del backend.`;
      }

      // Mensaje más amigable para errores de números duplicados
      if (errorMessage.includes('ya fue utilizado') || errorMessage.includes('ya existe')) {
        setError(errorMessage);
      } else {
        setError(errorMessage);
      }

      setLoading(false);
    }
  };

  // Determinar color del resumen según el restante
  const getColorRestante = () => {
    if (restante === 0) return 'success';
    if (restante > 0) return 'info';
    return 'error';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Procesar Pago - Recibo #{recibo.numero}
      </DialogTitle>

      <DialogContent>
        {/* Card de resumen */}
        <Card sx={{ mb: 3, bgcolor: 'background.default' }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Receptor
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {recibo.personaNombre} {recibo.personaApellido}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Concepto
                </Typography>
                <Typography variant="body1">
                  {recibo.conceptos[0]?.concepto || 'Sin concepto'}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Total del recibo
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  ${recibo.total.toFixed(2)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Saldo pendiente
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="warning.main">
                  ${saldoPendiente.toFixed(2)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Total a pagar
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  ${totalPagado.toFixed(2)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Restante
                </Typography>
                <Typography variant="h6" fontWeight="bold" color={`${getColorRestante()}.main`}>
                  ${Math.abs(restante).toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Alertas de validación */}
        {!validacion.valido && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {validacion.mensaje}
          </Alert>
        )}

        {restante > 0 && validacion.valido && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Se realizará un pago parcial. El recibo quedará en estado PENDIENTE con saldo de ${restante.toFixed(2)}
          </Alert>
        )}

        {error && (
          <Alert
            severity={error.includes('ya fue utilizado') || error.includes('ya existe') ? 'warning' : 'error'}
            sx={{ mb: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Tabla de medios de pago */}
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Medios de Pago
        </Typography>

        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell>Importe</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Banco</TableCell>
                <TableCell>Número</TableCell>
                <TableCell width={50}>Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fields.map((field, index) => {
                const tipoSeleccionado = watch(`mediosPago.${index}.tipo`);
                const requiereBancoYNumero = TIPOS_CON_BANCO_Y_NUMERO.includes(tipoSeleccionado);
                const tieneBancoOpcional = TIPOS_BANCO_OPCIONAL_NUMERO_REQUERIDO.includes(tipoSeleccionado);
                const muestraBanco = requiereBancoYNumero || tieneBancoOpcional;
                const muestraNumero = requiereBancoYNumero || tieneBancoOpcional;

                return (
                  <TableRow key={field.id}>
                    {/* Tipo */}
                    <TableCell>
                      <Controller
                        name={`mediosPago.${index}.tipo`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            select
                            size="small"
                            fullWidth
                            error={!!errors.mediosPago?.[index]?.tipo}
                            helperText={errors.mediosPago?.[index]?.tipo?.message}
                          >
                            {TIPOS_MEDIO_PAGO_OPTIONS.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                    </TableCell>

                    {/* Importe */}
                    <TableCell>
                      <Controller
                        name={`mediosPago.${index}.importe`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            size="small"
                            fullWidth
                            inputProps={{ step: 0.01, min: 0.01 }}
                            error={!!errors.mediosPago?.[index]?.importe}
                            helperText={errors.mediosPago?.[index]?.importe?.message}
                          />
                        )}
                      />
                    </TableCell>

                    {/* Fecha */}
                    <TableCell>
                      <Controller
                        name={`mediosPago.${index}.fecha`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="date"
                            size="small"
                            fullWidth
                            error={!!errors.mediosPago?.[index]?.fecha}
                            helperText={errors.mediosPago?.[index]?.fecha?.message}
                          />
                        )}
                      />
                    </TableCell>

                    {/* Banco (condicional) */}
                    <TableCell>
                      {muestraBanco ? (
                        <Controller
                          name={`mediosPago.${index}.banco`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              size="small"
                              fullWidth
                              placeholder={
                                tipoSeleccionado === 'TRANSFERENCIA'
                                  ? "Banco o billetera..."
                                  : tipoSeleccionado === 'CHEQUE'
                                  ? "Banco (opcional)..."
                                  : "Banco..."
                              }
                              error={!!errors.mediosPago?.[index]?.banco}
                              helperText={errors.mediosPago?.[index]?.banco?.message}
                            />
                          )}
                        />
                      ) : (
                        <Typography variant="body2" color="text.disabled">
                          -
                        </Typography>
                      )}
                    </TableCell>

                    {/* Número (condicional) */}
                    <TableCell>
                      {muestraNumero ? (
                        <Controller
                          name={`mediosPago.${index}.numero`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              size="small"
                              fullWidth
                              placeholder={
                                tipoSeleccionado === 'CHEQUE'
                                  ? "Núm. cheque..."
                                  : tipoSeleccionado === 'TRANSFERENCIA'
                                  ? "Núm. operación..."
                                  : "Últimos 4 dígitos..."
                              }
                              error={!!errors.mediosPago?.[index]?.numero}
                              helperText={errors.mediosPago?.[index]?.numero?.message}
                            />
                          )}
                        />
                      ) : (
                        <Typography variant="body2" color="text.disabled">
                          -
                        </Typography>
                      )}
                    </TableCell>

                    {/* Botón eliminar */}
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleEliminarMedio(index)}
                        disabled={fields.length === 1}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Botón agregar medio de pago */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAgregarMedio}
            disabled={fields.length >= 5}
          >
            Agregar medio de pago {fields.length >= 5 && '(máximo 5)'}
          </Button>
        </Box>

        {/* Errores generales del formulario */}
        {errors.mediosPago && typeof errors.mediosPago.message === 'string' && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.mediosPago.message}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={loading || !validacion.valido}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Procesando...' : 'Procesar Pago'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProcesarPagoModal;
