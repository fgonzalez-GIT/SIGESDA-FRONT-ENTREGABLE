import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { Delete, SelectAll, ClearAll, Person } from '@mui/icons-material';
import { useAppSelector } from '../../hooks/redux';
import { GenerarCuotasRequest } from '../../types/cuota.types';

interface GenerarCuotasMasivasDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (request: GenerarCuotasRequest) => void;
  loading?: boolean;
}

interface FormData {
  concepto: string;
  monto: number;
  mesVencimiento: string;
  fechaVencimiento: Date | null;
  aplicarDescuentos: boolean;
  filtroTipo: 'todos' | 'socio' | 'docente' | 'estudiante';
  personasSeleccionadas: number[];
}

export const GenerarCuotasMasivasDialog: React.FC<GenerarCuotasMasivasDialogProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const { personas } = useAppSelector((state) => state.personas);
  const [formData, setFormData] = useState<FormData>({
    concepto: '',
    monto: 0,
    mesVencimiento: '',
    fechaVencimiento: null,
    aplicarDescuentos: false,
    filtroTipo: 'todos',
    personasSeleccionadas: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filtrar personas según el tipo seleccionado
  const personasFiltradas = personas.filter(persona => {
    if (formData.filtroTipo === 'todos') return true;
    return persona.tipos?.some(t => t.tipoPersonaCodigo.toLowerCase() === formData.filtroTipo);
  }).filter(persona => persona.estado === 'ACTIVO'); // Solo personas activas

  useEffect(() => {
    if (open) {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');

      setFormData({
        concepto: `Cuota mensual - ${getMonthName(currentDate.getMonth())} ${year}`,
        monto: 5000,
        mesVencimiento: `${year}-${month}`,
        fechaVencimiento: new Date(year, currentDate.getMonth(), 10),
        aplicarDescuentos: false,
        filtroTipo: 'socio',
        personasSeleccionadas: [],
      });
      setErrors({});
    }
  }, [open]);

  const getMonthName = (monthIndex: number) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthIndex];
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.concepto.trim()) {
      newErrors.concepto = 'El concepto es obligatorio';
    }
    if (formData.monto <= 0) {
      newErrors.monto = 'El monto debe ser mayor a 0';
    }
    if (!formData.mesVencimiento) {
      newErrors.mesVencimiento = 'El mes de vencimiento es obligatorio';
    }
    if (!formData.fechaVencimiento) {
      newErrors.fechaVencimiento = 'La fecha de vencimiento es obligatoria';
    }
    if (formData.personasSeleccionadas.length === 0) {
      newErrors.personasSeleccionadas = 'Debe seleccionar al menos una persona';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const request: GenerarCuotasRequest = {
      personaIds: formData.personasSeleccionadas,
      concepto: formData.concepto,
      monto: formData.monto,
      mesVencimiento: formData.mesVencimiento,
      fechaVencimiento: formData.fechaVencimiento!.toISOString().split('T')[0],
      aplicarDescuentos: formData.aplicarDescuentos,
    };

    onSubmit(request);
  };

  const handleClose = () => {
    setFormData({
      concepto: '',
      monto: 0,
      mesVencimiento: '',
      fechaVencimiento: null,
      aplicarDescuentos: false,
      filtroTipo: 'todos',
      personasSeleccionadas: [],
    });
    setErrors({});
    onClose();
  };

  const handleSelectAll = () => {
    setFormData(prev => ({
      ...prev,
      personasSeleccionadas: personasFiltradas.map(p => p.id),
    }));
    setErrors(prev => ({ ...prev, personasSeleccionadas: '' }));
  };

  const handleDeselectAll = () => {
    setFormData(prev => ({
      ...prev,
      personasSeleccionadas: [],
    }));
  };

  const handleTogglePersona = (personaId: number) => {
    setFormData(prev => ({
      ...prev,
      personasSeleccionadas: prev.personasSeleccionadas.includes(personaId)
        ? prev.personasSeleccionadas.filter(id => id !== personaId)
        : [...prev.personasSeleccionadas, personaId],
    }));
    setErrors(prev => ({ ...prev, personasSeleccionadas: '' }));
  };

  const generateMesVencimiento = (fecha: Date | null) => {
    if (!fecha) return '';
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const totalCuotas = formData.personasSeleccionadas.length;
  const totalMonto = totalCuotas * formData.monto;

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
          Generar Cuotas Masivas
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column' }}>
          {loading && <LinearProgress sx={{ mb: 2 }} />}

          <Box sx={{ display: 'flex', gap: 3, height: '100%' }}>
            {/* Panel izquierdo - Configuración */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h6" gutterBottom>
                Configuración de Cuotas
              </Typography>

              <TextField
                label="Concepto"
                value={formData.concepto}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, concepto: e.target.value }));
                  setErrors(prev => ({ ...prev, concepto: '' }));
                }}
                error={!!errors.concepto}
                helperText={errors.concepto}
                required
                disabled={loading}
                fullWidth
                multiline
                rows={2}
              />

              <TextField
                label="Monto"
                type="number"
                value={formData.monto}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, monto: Number(e.target.value) }));
                  setErrors(prev => ({ ...prev, monto: '' }));
                }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                error={!!errors.monto}
                helperText={errors.monto}
                required
                disabled={loading}
                fullWidth
              />

              <Box display="flex" gap={2}>
                <TextField
                  label="Mes de Vencimiento"
                  type="month"
                  value={formData.mesVencimiento}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, mesVencimiento: e.target.value }));
                    setErrors(prev => ({ ...prev, mesVencimiento: '' }));
                  }}
                  error={!!errors.mesVencimiento}
                  helperText={errors.mesVencimiento}
                  required
                  disabled={loading}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />

                <DatePicker
                  label="Fecha de Vencimiento"
                  value={formData.fechaVencimiento}
                  onChange={(newValue) => {
                    setFormData(prev => ({
                      ...prev,
                      fechaVencimiento: newValue,
                      mesVencimiento: generateMesVencimiento(newValue),
                    }));
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
              </Box>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.aplicarDescuentos}
                    onChange={(e) => setFormData(prev => ({ ...prev, aplicarDescuentos: e.target.checked }))}
                    disabled={loading}
                  />
                }
                label="Aplicar descuentos automáticos"
              />

              {/* Resumen */}
              <Box sx={{ mt: 'auto' }}>
                <Alert severity="info">
                  <Typography variant="subtitle2" gutterBottom>
                    Resumen de Generación
                  </Typography>
                  <Typography variant="body2">
                    • <strong>{totalCuotas}</strong> cuotas a generar
                  </Typography>
                  <Typography variant="body2">
                    • <strong>${totalMonto.toLocaleString()}</strong> monto total
                  </Typography>
                  <Typography variant="body2">
                    • Vencimiento: <strong>{formData.fechaVencimiento?.toLocaleDateString('es-AR')}</strong>
                  </Typography>
                </Alert>
              </Box>
            </Box>

            {/* Panel derecho - Selección de personas */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Seleccionar Personas
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    size="small"
                    startIcon={<SelectAll />}
                    onClick={handleSelectAll}
                    disabled={loading}
                  >
                    Todos
                  </Button>
                  <Button
                    size="small"
                    startIcon={<ClearAll />}
                    onClick={handleDeselectAll}
                    disabled={loading}
                  >
                    Ninguno
                  </Button>
                </Box>
              </Box>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Filtrar por tipo</InputLabel>
                <Select
                  value={formData.filtroTipo}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      filtroTipo: e.target.value as any,
                      personasSeleccionadas: [], // Limpiar selección al cambiar filtro
                    }));
                  }}
                  disabled={loading}
                >
                  <MenuItem value="todos">Todos los tipos</MenuItem>
                  <MenuItem value="socio">Solo Socios</MenuItem>
                  <MenuItem value="docente">Solo Docentes</MenuItem>
                  <MenuItem value="estudiante">Solo Estudiantes</MenuItem>
                </Select>
              </FormControl>

              {errors.personasSeleccionadas && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.personasSeleccionadas}
                </Alert>
              )}

              <Box sx={{
                flex: 1,
                overflow: 'auto',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}>
                <List dense>
                  {personasFiltradas.map((persona, index) => (
                    <React.Fragment key={persona.id}>
                      <ListItem
                        component="div"
                        onClick={loading ? undefined : () => handleTogglePersona(persona.id)}
                        sx={{
                          bgcolor: formData.personasSeleccionadas.includes(persona.id)
                            ? 'action.selected'
                            : 'transparent',
                          cursor: loading ? 'default' : 'pointer',
                          opacity: loading ? 0.5 : 1,
                          pointerEvents: loading ? 'none' : 'auto',
                          '&:hover': {
                            bgcolor: loading ? undefined : 'action.hover',
                          },
                        }}
                      >
                        <ListItemText
                          primary={`${persona.nombre} ${persona.apellido}`}
                          secondary={
                            <Box>
                              {persona.tipos?.map(t => (
                                <Chip
                                  key={t.id}
                                  label={t.tipoPersonaCodigo}
                                  size="small"
                                  color={
                                    t.tipoPersonaCodigo === 'SOCIO' ? 'primary' :
                                    t.tipoPersonaCodigo === 'DOCENTE' ? 'secondary' : 'default'
                                  }
                                  sx={{ mr: 1 }}
                                />
                              ))}
                              {persona.email}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Checkbox
                            checked={formData.personasSeleccionadas.includes(persona.id)}
                            onChange={() => handleTogglePersona(persona.id)}
                            disabled={loading}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < personasFiltradas.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>

                {personasFiltradas.length === 0 && (
                  <Box p={3} textAlign="center">
                    <Person color="disabled" sx={{ fontSize: 48, mb: 1 }} />
                    <Typography color="text.secondary">
                      No hay personas del tipo seleccionado
                    </Typography>
                  </Box>
                )}
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {formData.personasSeleccionadas.length} de {personasFiltradas.length} personas seleccionadas
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
            disabled={loading || totalCuotas === 0}
          >
            {loading ? 'Generando...' : `Generar ${totalCuotas} Cuotas`}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default GenerarCuotasMasivasDialog;