import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  InputAdornment,
  Alert,
  Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { Receipt, Person } from '@mui/icons-material';
import { useAppSelector } from '../../hooks/redux';

interface CrearReciboLibreDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ReciboLibreFormData) => void;
  loading?: boolean;
  datosIniciales?: Partial<ReciboLibreFormData>;
  modo?: 'crear' | 'duplicar';
}

export interface ReciboLibreFormData {
  tipo: 'CUOTA' | 'SUELDO' | 'PAGO_ACTIVIDAD' | 'DEUDA';
  concepto: string;
  importe: number;
  fechaEmision: Date;
  fechaVencimiento: Date | null;
  emisorId: number | null;
  receptorId: number | null;
  observaciones: string;
}

export const CrearReciboLibreDialog: React.FC<CrearReciboLibreDialogProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false,
  datosIniciales,
  modo = 'crear',
}) => {
  const { personas } = useAppSelector((state) => state.personas);

  const [formData, setFormData] = useState<ReciboLibreFormData>({
    tipo: 'DEUDA',
    concepto: '',
    importe: 0,
    fechaEmision: new Date(),
    fechaVencimiento: null,
    emisorId: null,
    receptorId: null,
    observaciones: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos iniciales cuando se abre el diálogo
  useEffect(() => {
    if (open && datosIniciales) {
      setFormData({
        tipo: datosIniciales.tipo || 'DEUDA',
        concepto: datosIniciales.concepto || '',
        importe: datosIniciales.importe || 0,
        fechaEmision: datosIniciales.fechaEmision || new Date(),
        fechaVencimiento: datosIniciales.fechaVencimiento || null,
        emisorId: datosIniciales.emisorId || null,
        receptorId: datosIniciales.receptorId || null,
        observaciones: datosIniciales.observaciones || '',
      });
    } else if (open && !datosIniciales) {
      // Reset al abrir en modo crear
      setFormData({
        tipo: 'DEUDA',
        concepto: '',
        importe: 0,
        fechaEmision: new Date(),
        fechaVencimiento: null,
        emisorId: null,
        receptorId: null,
        observaciones: '',
      });
    }
    setErrors({});
  }, [open, datosIniciales]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.concepto || formData.concepto.trim().length < 5) {
      newErrors.concepto = 'El concepto debe tener al menos 5 caracteres';
    }

    if (formData.concepto.length > 200) {
      newErrors.concepto = 'El concepto no puede exceder 200 caracteres';
    }

    if (formData.importe <= 0) {
      newErrors.importe = 'El importe debe ser mayor a 0';
    }

    if (formData.observaciones && formData.observaciones.length > 500) {
      newErrors.observaciones = 'Las observaciones no pueden exceder 500 caracteres';
    }

    // Validaciones por tipo de recibo
    if (['CUOTA', 'SUELDO', 'PAGO_ACTIVIDAD'].includes(formData.tipo)) {
      if (!formData.receptorId) {
        newErrors.receptorId = 'Este tipo de recibo requiere especificar el receptor';
      }
    }

    if (formData.fechaVencimiento && formData.fechaEmision) {
      if (formData.fechaVencimiento < formData.fechaEmision) {
        newErrors.fechaVencimiento = 'La fecha de vencimiento debe ser posterior a la fecha de emisión';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({
      tipo: 'DEUDA',
      concepto: '',
      importe: 0,
      fechaEmision: new Date(),
      fechaVencimiento: null,
      emisorId: null,
      receptorId: null,
      observaciones: '',
    });
    setErrors({});
    onClose();
  };

  const personasOptions = personas.map((p) => ({
    id: p.id,
    label: `${p.nombre} ${p.apellido} - DNI: ${p.dni}`,
    nombre: p.nombre,
    apellido: p.apellido,
  }));

  const emisorSeleccionado = personasOptions.find((p) => p.id === formData.emisorId);
  const receptorSeleccionado = personasOptions.find((p) => p.id === formData.receptorId);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Receipt color="primary" />
            {modo === 'duplicar' ? 'Duplicar Recibo' : 'Crear Recibo Libre'}
          </Box>
        </DialogTitle>

        <DialogContent>
          {modo === 'duplicar' && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Los datos del recibo original han sido pre-llenados. Puedes modificarlos antes de crear el nuevo recibo.
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Tipo de Recibo */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.tipo}>
                <InputLabel>Tipo de Recibo *</InputLabel>
                <Select
                  value={formData.tipo}
                  onChange={(e) =>
                    setFormData({ ...formData, tipo: e.target.value as any })
                  }
                  label="Tipo de Recibo *"
                >
                  <MenuItem value="CUOTA">Cuota de Socio</MenuItem>
                  <MenuItem value="SUELDO">Sueldo de Docente</MenuItem>
                  <MenuItem value="PAGO_ACTIVIDAD">Pago de Actividad</MenuItem>
                  <MenuItem value="DEUDA">Deuda General</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Importe */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Importe *"
                type="number"
                value={formData.importe}
                onChange={(e) =>
                  setFormData({ ...formData, importe: parseFloat(e.target.value) || 0 })
                }
                error={!!errors.importe}
                helperText={errors.importe}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>

            {/* Concepto */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Concepto *"
                value={formData.concepto}
                onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                error={!!errors.concepto}
                helperText={errors.concepto || `${formData.concepto.length}/200 caracteres`}
                multiline
                rows={2}
              />
            </Grid>

            {/* Fecha de Emisión */}
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Fecha de Emisión *"
                value={formData.fechaEmision}
                onChange={(date) => setFormData({ ...formData, fechaEmision: date || new Date() })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.fechaEmision,
                    helperText: errors.fechaEmision,
                  },
                }}
              />
            </Grid>

            {/* Fecha de Vencimiento */}
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Fecha de Vencimiento"
                value={formData.fechaVencimiento}
                onChange={(date) => setFormData({ ...formData, fechaVencimiento: date })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.fechaVencimiento,
                    helperText: errors.fechaVencimiento,
                  },
                }}
              />
            </Grid>

            {/* Emisor */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={personasOptions}
                value={emisorSeleccionado || null}
                onChange={(_, newValue) =>
                  setFormData({ ...formData, emisorId: newValue?.id || null })
                }
                getOptionLabel={(option) => option.label}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Emisor"
                    error={!!errors.emisorId}
                    helperText={errors.emisorId}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <Person color="action" sx={{ mr: 1 }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            {/* Receptor */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={personasOptions}
                value={receptorSeleccionado || null}
                onChange={(_, newValue) =>
                  setFormData({ ...formData, receptorId: newValue?.id || null })
                }
                getOptionLabel={(option) => option.label}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={
                      ['CUOTA', 'SUELDO', 'PAGO_ACTIVIDAD'].includes(formData.tipo)
                        ? 'Receptor *'
                        : 'Receptor'
                    }
                    error={!!errors.receptorId}
                    helperText={errors.receptorId}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <Person color="action" sx={{ mr: 1 }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            {/* Observaciones */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observaciones"
                value={formData.observaciones}
                onChange={(e) =>
                  setFormData({ ...formData, observaciones: e.target.value })
                }
                error={!!errors.observaciones}
                helperText={
                  errors.observaciones || `${formData.observaciones.length}/500 caracteres`
                }
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {modo === 'duplicar' ? 'Crear Recibo Duplicado' : 'Crear Recibo'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default CrearReciboLibreDialog;
