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
  FormControlLabel,
  Checkbox,
  Alert,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import {
  FamilyRestroom,
  Person,
  Percent,
  Save,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { CrearRelacionRequest, crearRelacion, actualizarRelacion, RelacionFamiliar } from '../../store/slices/familiaresSlice';

interface RelacionFamiliarDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  personaSeleccionada?: number;
  relacionToEdit?: RelacionFamiliar | null;
}

interface FormData {
  personaId: number | null;
  familiarId: number | null;
  tipoRelacion: string;
  descripcion: string;
  responsableFinanciero: boolean;
  autorizadoRetiro: boolean;
  contactoEmergencia: boolean;
  porcentajeDescuento: number;
}

const tiposRelacion = [
  { value: 'padre', label: 'Padre' },
  { value: 'madre', label: 'Madre' },
  { value: 'hijo', label: 'Hijo' },
  { value: 'hija', label: 'Hija' },
  { value: 'conyuge', label: 'Cónyuge' },
  { value: 'esposo', label: 'Esposo' },
  { value: 'esposa', label: 'Esposa' },
  { value: 'hermano', label: 'Hermano' },
  { value: 'hermana', label: 'Hermana' },
  { value: 'abuelo', label: 'Abuelo' },
  { value: 'abuela', label: 'Abuela' },
  { value: 'nieto', label: 'Nieto' },
  { value: 'nieta', label: 'Nieta' },
  { value: 'tio', label: 'Tío' },
  { value: 'tia', label: 'Tía' },
  { value: 'primo', label: 'Primo' },
  { value: 'prima', label: 'Prima' },
  { value: 'otro', label: 'Otra relación' },
];

const RelacionFamiliarDialog: React.FC<RelacionFamiliarDialogProps> = ({
  open,
  onClose,
  onSuccess,
  personaSeleccionada,
  relacionToEdit,
}) => {
  const dispatch = useAppDispatch();
  const { personas } = useAppSelector((state) => state.personas);
  const { loading } = useAppSelector((state) => state.familiares);

  const isEditing = !!relacionToEdit;

  const [formData, setFormData] = useState<FormData>({
    personaId: null,
    familiarId: null,
    tipoRelacion: '',
    descripcion: '',
    responsableFinanciero: false,
    autorizadoRetiro: false,
    contactoEmergencia: false,
    porcentajeDescuento: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (relacionToEdit) {
        // Modo edición: cargar datos existentes
        setFormData({
          personaId: relacionToEdit.personaId,
          familiarId: relacionToEdit.familiarId,
          tipoRelacion: relacionToEdit.tipoRelacion,
          descripcion: relacionToEdit.descripcion || '',
          responsableFinanciero: relacionToEdit.responsableFinanciero,
          autorizadoRetiro: relacionToEdit.autorizadoRetiro,
          contactoEmergencia: relacionToEdit.contactoEmergencia,
          porcentajeDescuento: relacionToEdit.porcentajeDescuento || 0,
        });
      } else {
        // Modo creación: formulario vacío
        setFormData({
          personaId: personaSeleccionada || null,
          familiarId: null,
          tipoRelacion: '',
          descripcion: '',
          responsableFinanciero: false,
          autorizadoRetiro: false,
          contactoEmergencia: false,
          porcentajeDescuento: 0,
        });
      }
      setError(null);
    }
  }, [open, personaSeleccionada, relacionToEdit]);

  const handleChange = (field: keyof FormData) => (value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.personaId || !formData.familiarId || !formData.tipoRelacion) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }

    if (formData.personaId === formData.familiarId) {
      setError('Una persona no puede ser familiar de sí misma');
      return;
    }

    try {
      if (isEditing && relacionToEdit) {
        // Modo edición: actualizar relación existente
        const updateData: Partial<RelacionFamiliar> = {
          tipoRelacion: formData.tipoRelacion as any,
          descripcion: formData.descripcion,
          responsableFinanciero: formData.responsableFinanciero,
          autorizadoRetiro: formData.autorizadoRetiro,
          contactoEmergencia: formData.contactoEmergencia,
          porcentajeDescuento: formData.porcentajeDescuento,
        };

        await dispatch(actualizarRelacion({ id: relacionToEdit.id, relacion: updateData })).unwrap();
      } else {
        // Modo creación: crear nueva relación
        const request: CrearRelacionRequest = {
          personaId: formData.personaId,
          familiarId: formData.familiarId,
          tipoRelacion: formData.tipoRelacion as any,
          descripcion: formData.descripcion,
          responsableFinanciero: formData.responsableFinanciero,
          autorizadoRetiro: formData.autorizadoRetiro,
          contactoEmergencia: formData.contactoEmergencia,
          porcentajeDescuento: formData.porcentajeDescuento,
        };

        await dispatch(crearRelacion(request)).unwrap();
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      setError(isEditing ? 'Error al actualizar la relación familiar' : 'Error al crear la relación familiar');
    }
  };

  const personasDisponibles = personas.filter(p => p.id !== formData.personaId);
  const familiaresDisponibles = personas.filter(p => p.id !== formData.familiarId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <FamilyRestroom color="primary" />
          <Typography variant="h6">
            {isEditing ? 'Editar Relación Familiar' : 'Nueva Relación Familiar'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box display="flex" gap={3} flexWrap="wrap">
          <Box minWidth={250} flex={1}>
            <Autocomplete
              options={personas}
              getOptionLabel={(option) => `${option.nombre} ${option.apellido}`}
              value={personas.find(p => p.id === formData.personaId) || null}
              onChange={(_, value) => handleChange('personaId')(value?.id || null)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Persona principal *"
                  fullWidth
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />
                    }
                  }}
                />
              )}
              disabled={!!personaSeleccionada || isEditing}
            />
          </Box>
          <Box minWidth={250} flex={1}>
            <Autocomplete
              options={personasDisponibles}
              getOptionLabel={(option) => `${option.nombre} ${option.apellido}`}
              value={personas.find(p => p.id === formData.familiarId) || null}
              onChange={(_, value) => handleChange('familiarId')(value?.id || null)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Familiar *"
                  fullWidth
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />
                    }
                  }}
                />
              )}
              disabled={isEditing}
            />
          </Box>
        </Box>

        <Box display="flex" gap={3} flexWrap="wrap" mt={3}>
          <Box minWidth={200} flex={1}>
            <FormControl fullWidth>
              <InputLabel>Tipo de relación *</InputLabel>
              <Select
                value={formData.tipoRelacion}
                onChange={(e) => handleChange('tipoRelacion')(e.target.value)}
                label="Tipo de relación *"
              >
                {tiposRelacion.map((tipo) => (
                  <MenuItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box minWidth={150} flex={1}>
            <TextField
              label="% Descuento"
              type="number"
              value={formData.porcentajeDescuento}
              onChange={(e) => handleChange('porcentajeDescuento')(Number(e.target.value))}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Percent />
                    </InputAdornment>
                  ),
                  inputProps: { min: 0, max: 100 }
                }
              }}
            />
          </Box>
        </Box>

        <Box mt={3}>
          <TextField
            label="Descripción"
            value={formData.descripcion}
            onChange={(e) => handleChange('descripcion')(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
        </Box>

        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom>
            Permisos y Responsabilidades
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.responsableFinanciero}
                  onChange={(e) => handleChange('responsableFinanciero')(e.target.checked)}
                />
              }
              label="Responsable financiero"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.autorizadoRetiro}
                  onChange={(e) => handleChange('autorizadoRetiro')(e.target.checked)}
                />
              }
              label="Autorizado para retiro"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.contactoEmergencia}
                  onChange={(e) => handleChange('contactoEmergencia')(e.target.checked)}
                />
              }
              label="Contacto de emergencia"
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={<Save />}
        >
          {loading ? 'Guardando...' : (isEditing ? 'Actualizar Relación' : 'Guardar Relación')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RelacionFamiliarDialog;