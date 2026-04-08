// @ts-nocheck
// TODO: Migrar a Cuota V2 - Usa propiedades obsoletas (personaId, estado, montoFinal, concepto, fechaVencimiento)
// Prioridad: ALTA - Componente en producción
// Ver GUIA_DESARROLLO_FRONTEND.md sección "Categoría B: GenerarReciboDialog"
import React, { useState, useEffect, useMemo } from 'react';
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
  Chip,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TableContainer,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { Delete, Add, Person, Receipt } from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { GenerarReciboRequest } from '../../store/slices/recibosSlice';
import { fetchCuotas } from '../../store/slices/cuotasSlice';

interface GenerarReciboDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (request: GenerarReciboRequest) => void;
  loading?: boolean;
  personaPreseleccionada?: number;
  cuotasPreseleccionadas?: number[];
}

interface FormData {
  personaId: number | null;
  cuotaIds: number[];
  fechaVencimiento: Date | null;
  observaciones: string;
  aplicarDescuentos: boolean;
  descuentoPorcentaje: number;
  descuentoMonto: number;
  tipoDescuento: 'porcentaje' | 'monto';
}

export const GenerarReciboDialog: React.FC<GenerarReciboDialogProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false,
  personaPreseleccionada,
  cuotasPreseleccionadas = [],
}) => {
  const dispatch = useAppDispatch();
  const { personas } = useAppSelector((state) => state.personas);
  const { cuotas } = useAppSelector((state) => state.cuotas);

  const [formData, setFormData] = useState<FormData>({
    personaId: null,
    cuotaIds: [],
    fechaVencimiento: null,
    observaciones: '',
    aplicarDescuentos: false,
    descuentoPorcentaje: 0,
    descuentoMonto: 0,
    tipoDescuento: 'porcentaje',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Memoizar filtrado de cuotas para evitar recálculos innecesarios
  // V2: Usar recibo.receptorId y recibo.estado en lugar de cuota.personaId y cuota.estado
  const cuotasDisponibles = useMemo(() => {
    return cuotas.filter(cuota =>
      formData.personaId &&
      cuota.recibo?.receptorId === formData.personaId &&
      (cuota.recibo?.estado === 'PENDIENTE' || cuota.recibo?.estado === 'VENCIDO')
    );
  }, [cuotas, formData.personaId]);

  const cuotasSeleccionadas = useMemo(() =>
    cuotas.filter(cuota =>
      formData.cuotaIds.includes(cuota.id)
    ),
    [cuotas, formData.cuotaIds]
  );

  // Memoizar cuotasPreseleccionadas para evitar infinite loop
  const cuotasPreseleccionadasMemo = useMemo(() => cuotasPreseleccionadas, [cuotasPreseleccionadas.length]);

  useEffect(() => {
    if (open) {
      const currentDate = new Date();
      const defaultVencimiento = new Date(currentDate);
      defaultVencimiento.setDate(currentDate.getDate() + 10);

      setFormData({
        personaId: personaPreseleccionada || null,
        cuotaIds: cuotasPreseleccionadasMemo,
        fechaVencimiento: defaultVencimiento,
        observaciones: '',
        aplicarDescuentos: false,
        descuentoPorcentaje: 0,
        descuentoMonto: 0,
        tipoDescuento: 'porcentaje',
      });
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, personaPreseleccionada]);

  // Cargar cuotas impagas cuando se selecciona una persona
  useEffect(() => {
    if (formData.personaId) {
      dispatch(fetchCuotas({
        soloImpagas: true,
        personaId: formData.personaId
      }));
    }
  }, [formData.personaId, dispatch]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.personaId) {
      newErrors.personaId = 'Debe seleccionar una persona';
    }
    if (formData.cuotaIds.length === 0) {
      newErrors.cuotaIds = 'Debe seleccionar al menos una cuota';
    }
    if (!formData.fechaVencimiento) {
      newErrors.fechaVencimiento = 'La fecha de vencimiento es obligatoria';
    }
    if (formData.aplicarDescuentos) {
      if (formData.tipoDescuento === 'porcentaje' && (formData.descuentoPorcentaje <= 0 || formData.descuentoPorcentaje > 100)) {
        newErrors.descuentoPorcentaje = 'El porcentaje debe ser entre 1 y 100';
      }
      if (formData.tipoDescuento === 'monto' && formData.descuentoMonto <= 0) {
        newErrors.descuentoMonto = 'El monto del descuento debe ser mayor a 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const request: GenerarReciboRequest = {
      personaId: formData.personaId!,
      cuotaIds: formData.cuotaIds,
      fechaVencimiento: formData.fechaVencimiento!.toISOString().split('T')[0],
      observaciones: formData.observaciones || undefined,
      aplicarDescuentos: formData.aplicarDescuentos,
      descuentoPorcentaje: formData.aplicarDescuentos && formData.tipoDescuento === 'porcentaje'
        ? formData.descuentoPorcentaje
        : undefined,
      descuentoMonto: formData.aplicarDescuentos && formData.tipoDescuento === 'monto'
        ? formData.descuentoMonto
        : undefined,
    };

    onSubmit(request);
  };

  const handleClose = () => {
    setFormData({
      personaId: null,
      cuotaIds: [],
      fechaVencimiento: null,
      observaciones: '',
      aplicarDescuentos: false,
      descuentoPorcentaje: 0,
      descuentoMonto: 0,
      tipoDescuento: 'porcentaje',
    });
    setErrors({});
    onClose();
  };

  const handleToggleCuota = (cuotaId: number) => {
    setFormData(prev => ({
      ...prev,
      cuotaIds: prev.cuotaIds.includes(cuotaId)
        ? prev.cuotaIds.filter(id => id !== cuotaId)
        : [...prev.cuotaIds, cuotaId],
    }));
    setErrors(prev => ({ ...prev, cuotaIds: '' }));
  };

  const handleSelectAllCuotas = () => {
    setFormData(prev => ({
      ...prev,
      cuotaIds: cuotasDisponibles.map(c => c.id),
    }));
    setErrors(prev => ({ ...prev, cuotaIds: '' }));
  };

  const handleDeselectAllCuotas = () => {
    setFormData(prev => ({
      ...prev,
      cuotaIds: [],
    }));
  };

  // Memoizar opciones de personas para evitar recreación en cada render (FIX: loop infinito)
  const personasOptions = useMemo(() =>
    personas.map(persona => ({
      id: persona.id,
      label: `${persona.nombre} ${persona.apellido} (${persona.tipos?.map(t => t.tipoPersona?.codigo || 'Sin código').join(', ') || 'Sin tipo'})`,
      persona
    })),
    [personas]
  );

  // Memoizar valor seleccionado para evitar búsquedas en cada render
  const selectedPersonaOption = useMemo(() =>
    personasOptions.find(p => p.id === formData.personaId) || null,
    [personasOptions, formData.personaId]
  );

  // Memoizar cálculos de montos para evitar recálculos innecesarios
  // V2: Usar montoTotal en lugar de montoFinal (deprecated)
  const subtotal = useMemo(() =>
    cuotasSeleccionadas.reduce((sum, cuota) => sum + parseFloat(cuota.montoTotal || '0'), 0),
    [cuotasSeleccionadas]
  );

  const descuentoCalculado = useMemo(() =>
    formData.aplicarDescuentos
      ? (formData.tipoDescuento === 'porcentaje'
          ? subtotal * (formData.descuentoPorcentaje / 100)
          : formData.descuentoMonto)
      : 0,
    [formData.aplicarDescuentos, formData.tipoDescuento, formData.descuentoPorcentaje, formData.descuentoMonto, subtotal]
  );

  const total = useMemo(() =>
    subtotal - descuentoCalculado,
    [subtotal, descuentoCalculado]
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { height: '90vh' } }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Receipt color="primary" />
            <Typography variant="h6">
              Generar Recibo
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column' }}>
          {loading && <LinearProgress sx={{ mb: 2 }} />}

          <Box sx={{ display: 'flex', gap: 3, height: '100%' }}>
            {/* Panel izquierdo - Configuración */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h6" gutterBottom>
                Datos del Recibo
              </Typography>

              {/* Selección de persona */}
              <Autocomplete
                options={personasOptions}
                value={selectedPersonaOption}
                onChange={(_, newValue) => {
                  setFormData(prev => ({
                    ...prev,
                    personaId: newValue?.id || null,
                    cuotaIds: [], // Limpiar cuotas al cambiar persona
                  }));
                  setErrors(prev => ({ ...prev, personaId: '' }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Persona"
                    error={!!errors.personaId}
                    helperText={errors.personaId}
                    required
                    placeholder="Buscar por nombre, apellido o DNI..."
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body1">
                        {option.persona.nombre} {option.persona.apellido}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.persona.tipos?.map(t => t.tipoPersona?.codigo || 'Sin código').join(', ') || 'Sin tipo'} - {option.persona.email}
                      </Typography>
                    </Box>
                  </li>
                )}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                filterSelectedOptions
                noOptionsText="No se encontraron personas"
                loadingText="Cargando personas..."
                disabled={loading}
              />

              {/* Fecha de vencimiento */}
              <DatePicker
                label="Fecha de Vencimiento"
                value={formData.fechaVencimiento}
                onChange={(newValue) => {
                  setFormData(prev => ({ ...prev, fechaVencimiento: newValue }));
                  setErrors(prev => ({ ...prev, fechaVencimiento: '' }));
                }}
                disabled={loading}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!errors.fechaVencimiento,
                    helperText: errors.fechaVencimiento,
                  }
                }}
              />

              {/* Descuentos */}
              <Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.aplicarDescuentos}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        aplicarDescuentos: e.target.checked
                      }))}
                      disabled={loading}
                    />
                  }
                  label="Aplicar descuento"
                />

                {formData.aplicarDescuentos && (
                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>Tipo de descuento</InputLabel>
                      <Select
                        value={formData.tipoDescuento}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          tipoDescuento: e.target.value as 'porcentaje' | 'monto'
                        }))}
                        disabled={loading}
                      >
                        <MenuItem value="porcentaje">Porcentaje</MenuItem>
                        <MenuItem value="monto">Monto fijo</MenuItem>
                      </Select>
                    </FormControl>

                    {formData.tipoDescuento === 'porcentaje' ? (
                      <TextField
                        label="Descuento (%)"
                        type="number"
                        value={formData.descuentoPorcentaje}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          descuentoPorcentaje: Number(e.target.value)
                        }))}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        }}
                        error={!!errors.descuentoPorcentaje}
                        helperText={errors.descuentoPorcentaje}
                        disabled={loading}
                        fullWidth
                      />
                    ) : (
                      <TextField
                        label="Descuento"
                        type="number"
                        value={formData.descuentoMonto}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          descuentoMonto: Number(e.target.value)
                        }))}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        error={!!errors.descuentoMonto}
                        helperText={errors.descuentoMonto}
                        disabled={loading}
                        fullWidth
                      />
                    )}
                  </Box>
                )}
              </Box>

              {/* Observaciones */}
              <TextField
                label="Observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                disabled={loading}
                fullWidth
                multiline
                rows={3}
                placeholder="Observaciones adicionales para el recibo..."
              />

              {/* Resumen */}
              <Box sx={{ mt: 'auto' }}>
                <Alert severity="info">
                  <Typography variant="subtitle2" gutterBottom>
                    Resumen del Recibo
                  </Typography>
                  <Typography variant="body2">
                    • <strong>{cuotasSeleccionadas.length}</strong> cuotas seleccionadas
                  </Typography>
                  <Typography variant="body2">
                    • Subtotal: <strong>${subtotal.toLocaleString()}</strong>
                  </Typography>
                  {descuentoCalculado > 0 && (
                    <Typography variant="body2">
                      • Descuento: <strong>-${descuentoCalculado.toLocaleString()}</strong>
                    </Typography>
                  )}
                  <Typography variant="body2">
                    • <strong>Total: ${total.toLocaleString()}</strong>
                  </Typography>
                  <Typography variant="body2">
                    • Vence: <strong>{formData.fechaVencimiento?.toLocaleDateString('es-AR')}</strong>
                  </Typography>
                </Alert>
              </Box>
            </Box>

            {/* Panel derecho - Selección de cuotas */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Cuotas a Incluir
                </Typography>
                {cuotasDisponibles.length > 0 && (
                  <Box display="flex" gap={1}>
                    <Button
                      size="small"
                      onClick={handleSelectAllCuotas}
                      disabled={loading}
                    >
                      Todas
                    </Button>
                    <Button
                      size="small"
                      onClick={handleDeselectAllCuotas}
                      disabled={loading}
                    >
                      Ninguna
                    </Button>
                  </Box>
                )}
              </Box>

              {errors.cuotaIds && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.cuotaIds}
                </Alert>
              )}

              <Box sx={{ flex: 1, overflow: 'auto' }}>
                {!formData.personaId ? (
                  <Box p={3} textAlign="center">
                    <Person color="disabled" sx={{ fontSize: 48, mb: 1 }} />
                    <Typography color="text.secondary">
                      Seleccione una persona para ver sus cuotas pendientes
                    </Typography>
                  </Box>
                ) : cuotasDisponibles.length === 0 ? (
                  <Box p={3} textAlign="center">
                    <Receipt color="disabled" sx={{ fontSize: 48, mb: 1 }} />
                    <Typography color="text.secondary">
                      Esta persona no tiene cuotas pendientes
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox">Sel.</TableCell>
                          <TableCell>Concepto</TableCell>
                          <TableCell>Vencimiento</TableCell>
                          <TableCell align="right">Monto</TableCell>
                          <TableCell>Estado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cuotasDisponibles.map((cuota) => (
                          <TableRow
                            key={cuota.id}
                            hover
                            onClick={() => handleToggleCuota(cuota.id)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={formData.cuotaIds.includes(cuota.id)}
                                onChange={() => handleToggleCuota(cuota.id)}
                                disabled={loading}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {cuota.recibo?.concepto || `Cuota ${cuota.mes}/${cuota.anio}`}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {cuota.recibo?.fechaVencimiento
                                  ? new Date(cuota.recibo.fechaVencimiento).toLocaleDateString('es-AR')
                                  : '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                ${parseFloat(cuota.montoTotal || '0').toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={cuota.recibo?.estado || 'pendiente'}
                                size="small"
                                color={cuota.recibo?.estado === 'VENCIDO' ? 'error' : 'warning'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {formData.cuotaIds.length} de {cuotasDisponibles.length} cuotas seleccionadas
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || cuotasSeleccionadas.length === 0}
            startIcon={<Receipt />}
          >
            {loading ? 'Generando...' : `Generar Recibo ($${total.toLocaleString()})`}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default GenerarReciboDialog;