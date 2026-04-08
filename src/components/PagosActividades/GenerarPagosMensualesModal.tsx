import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Typography,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  generarPagosActividadesSchema,
  GenerarPagosActividadesFormData,
} from '@/schemas/pagosActividades.schema';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { generarPagosMensuales, clearLastGeneration } from '@/store/slices/pagosActividadesSlice';
import { CheckCircle, Warning } from '@mui/icons-material';

interface GenerarPagosMensualesModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const GenerarPagosMensualesModal: React.FC<GenerarPagosMensualesModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const { operationLoading, error, lastGeneration } = useAppSelector(
    (state) => state.pagosActividades
  );

  const [showResult, setShowResult] = useState(false);
  const [lastRequest, setLastRequest] = useState<{ mes: number; anio: number } | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GenerarPagosActividadesFormData>({
    resolver: zodResolver(generarPagosActividadesSchema),
    defaultValues: {
      mes: new Date().getMonth() + 1,
      anio: new Date().getFullYear(),
      observaciones: '',
    },
  });

  const handleClose = () => {
    reset();
    setShowResult(false);
    setLastRequest(null);
    dispatch(clearLastGeneration());
    onClose();
  };

  const onSubmit = async (data: GenerarPagosActividadesFormData) => {
    try {
      // Guardar el request para mostrar en el resumen
      setLastRequest({ mes: data.mes, anio: data.anio });
      await dispatch(generarPagosMensuales(data)).unwrap();
      setShowResult(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      // Error manejado por el slice
    }
  };

  const getMesNombre = (mes: number) => {
    const meses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    return meses[mes - 1];
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Generar Pagos de Actividades Mensuales</DialogTitle>
      <DialogContent>
        {!showResult ? (
          <Box component="form" sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Esta acción generará recibos para todas las personas NO_SOCIO que tengan
              participación activa en actividades durante el período seleccionado.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Controller
                name="mes"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.mes}>
                    <InputLabel>Mes</InputLabel>
                    <Select {...field} label="Mes">
                      <MenuItem value={1}>Enero</MenuItem>
                      <MenuItem value={2}>Febrero</MenuItem>
                      <MenuItem value={3}>Marzo</MenuItem>
                      <MenuItem value={4}>Abril</MenuItem>
                      <MenuItem value={5}>Mayo</MenuItem>
                      <MenuItem value={6}>Junio</MenuItem>
                      <MenuItem value={7}>Julio</MenuItem>
                      <MenuItem value={8}>Agosto</MenuItem>
                      <MenuItem value={9}>Septiembre</MenuItem>
                      <MenuItem value={10}>Octubre</MenuItem>
                      <MenuItem value={11}>Noviembre</MenuItem>
                      <MenuItem value={12}>Diciembre</MenuItem>
                    </Select>
                    {errors.mes && (
                      <Typography variant="caption" color="error">
                        {errors.mes.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />

              <Controller
                name="anio"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.anio}>
                    <InputLabel>Año</InputLabel>
                    <Select {...field} label="Año">
                      {[2024, 2025, 2026].map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.anio && (
                      <Typography variant="caption" color="error">
                        {errors.anio.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Box>

            <Controller
              name="observaciones"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Observaciones (opcional)"
                  multiline
                  rows={3}
                  error={!!errors.observaciones}
                  helperText={errors.observaciones?.message}
                  placeholder="Ingrese observaciones adicionales si es necesario"
                />
              )}
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            {lastGeneration && lastGeneration.generados > 0 ? (
              <>
                <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3 }}>
                  <Typography variant="body1" fontWeight="medium">
                    {lastGeneration.mensaje}
                  </Typography>
                </Alert>

                <Box
                  sx={{
                    p: 3,
                    bgcolor: 'background.default',
                    borderRadius: 1,
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Resumen de Generación
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Período"
                        secondary={
                          lastRequest
                            ? `${getMesNombre(lastRequest.mes)} ${lastRequest.anio}`
                            : lastGeneration.pagos.length > 0
                            ? `${getMesNombre(lastGeneration.pagos[0].mes)} ${lastGeneration.pagos[0].anio}`
                            : 'No disponible'
                        }
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Pagos Generados"
                        secondary={`${lastGeneration.generados} recibos creados`}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Total Facturado"
                        secondary={
                          lastGeneration.pagos.length > 0
                            ? new Intl.NumberFormat('es-AR', {
                                style: 'currency',
                                currency: 'ARS',
                              }).format(
                                lastGeneration.pagos.reduce((sum, p) => sum + p.total, 0)
                              )
                            : new Intl.NumberFormat('es-AR', {
                                style: 'currency',
                                currency: 'ARS',
                              }).format(0)
                        }
                      />
                    </ListItem>
                  </List>
                </Box>

                <Typography variant="body2" color="text.secondary">
                  Los recibos han sido generados y están disponibles en la tabla principal.
                  Puede descargarlos, enviarlos por email o registrar los pagos.
                </Typography>
              </>
            ) : (
              <Alert severity="warning" icon={<Warning />}>
                <Typography variant="body1" fontWeight="medium">
                  No se generaron pagos
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  No se encontraron personas NO_SOCIO con actividades activas para el
                  período seleccionado, o los pagos ya fueron generados anteriormente.
                </Typography>
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          {showResult ? 'Cerrar' : 'Cancelar'}
        </Button>
        {!showResult && (
          <Button
            variant="contained"
            onClick={handleSubmit(onSubmit)}
            disabled={operationLoading}
            startIcon={operationLoading ? <CircularProgress size={20} /> : null}
          >
            {operationLoading ? 'Generando...' : 'Generar Pagos'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default GenerarPagosMensualesModal;
