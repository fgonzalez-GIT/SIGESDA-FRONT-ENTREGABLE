import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Stack,
  InputAdornment,
  Alert,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { CategoriaSocio } from '../../types/categoria.types';
import { generateCodigoFromNombre } from '@/utils/string.helpers';

interface CategoriaFormData {
  codigo: string;
  nombre: string;
  descripcion: string;
  montoCuota: string;
  descuento: string;
  orden: string;
}

interface CategoriaFormErrors {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  montoCuota?: string;
  descuento?: string;
  orden?: string;
}

interface CategoriaFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  categoria?: CategoriaSocio | null;
  loading?: boolean;
}

const initialFormData: CategoriaFormData = {
  codigo: '',
  nombre: '',
  descripcion: '',
  montoCuota: '',
  descuento: '0',
  orden: '',
};

export const CategoriaForm: React.FC<CategoriaFormProps> = ({
  open,
  onClose,
  onSubmit,
  categoria,
  loading = false,
}) => {
  const [formData, setFormData] = useState<CategoriaFormData>(initialFormData);
  const [errors, setErrors] = useState<CategoriaFormErrors>({});
  const [submitError, setSubmitError] = useState<string>('');

  const isEditing = Boolean(categoria);
  const dialogTitle = isEditing ? 'Editar Categoría' : 'Nueva Categoría';

  useEffect(() => {
    if (categoria) {
      setFormData({
        codigo: categoria.codigo,
        nombre: categoria.nombre,
        descripcion: categoria.descripcion || '',
        montoCuota: categoria.montoCuota,
        descuento: categoria.descuento,
        orden: categoria.orden.toString(),
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
    setSubmitError('');
  }, [categoria, open]);

  // Auto-generar código desde el nombre (solo en modo creación)
  useEffect(() => {
    if (!isEditing && formData.nombre) {
      const codigoGenerado = generateCodigoFromNombre(formData.nombre);
      setFormData(prev => ({
        ...prev,
        codigo: codigoGenerado,
      }));
    }
  }, [isEditing, formData.nombre]);

  const handleChange = useCallback((field: keyof CategoriaFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value;

    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Limpiar error del campo
    setErrors(prev => ({
      ...prev,
      [field]: undefined,
    }));
    setSubmitError('');
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: CategoriaFormErrors = {};

    // Código
    if (!formData.codigo.trim()) {
      newErrors.codigo = 'El código es requerido';
    } else if (formData.codigo.trim().length < 2) {
      newErrors.codigo = 'El código debe tener al menos 2 caracteres';
    } else if (!/^[A-Z_]+$/.test(formData.codigo)) {
      newErrors.codigo = 'El código solo puede contener mayúsculas y guiones bajos';
    }

    // Nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
    }

    // Descripción (opcional)
    if (formData.descripcion && formData.descripcion.length > 200) {
      newErrors.descripcion = 'La descripción no puede exceder 200 caracteres';
    }

    // Monto de cuota
    if (!formData.montoCuota) {
      newErrors.montoCuota = 'El monto de cuota es requerido';
    } else {
      const monto = parseFloat(formData.montoCuota);
      if (isNaN(monto) || monto < 0) {
        newErrors.montoCuota = 'El monto debe ser un número positivo';
      } else if (monto > 1000000) {
        newErrors.montoCuota = 'El monto no puede exceder 1,000,000';
      }
    }

    // Descuento
    if (formData.descuento) {
      const descuento = parseFloat(formData.descuento);
      if (isNaN(descuento) || descuento < 0) {
        newErrors.descuento = 'El descuento debe ser un número positivo';
      } else if (descuento > 100) {
        newErrors.descuento = 'El descuento no puede exceder 100%';
      }
    }

    // Orden (opcional)
    if (formData.orden) {
      const orden = parseInt(formData.orden);
      if (isNaN(orden) || orden < 1) {
        newErrors.orden = 'El orden debe ser un número positivo';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    const submitData: any = {
      codigo: formData.codigo.trim(),
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim() || undefined,
      montoCuota: parseFloat(formData.montoCuota),
      descuento: parseFloat(formData.descuento) || 0,
    };

    // Solo incluir orden si se proporcionó
    if (formData.orden) {
      submitData.orden = parseInt(formData.orden);
    }

    try {
      await onSubmit(submitData);
      // Si tiene éxito, el componente padre cerrará el diálogo
    } catch (error: any) {
      setSubmitError(error.message || 'Error al guardar la categoría');
    }
  }, [validateForm, formData, onSubmit]);

  const handleClose = useCallback(() => {
    if (!loading) {
      onClose();
    }
  }, [loading, onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{dialogTitle}</Typography>
          <IconButton
            onClick={handleClose}
            disabled={loading}
            edge="end"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {submitError && (
            <Alert severity="error" onClose={() => setSubmitError('')}>
              {submitError}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Nombre *"
            value={formData.nombre}
            onChange={handleChange('nombre')}
            error={!!errors.nombre}
            helperText={errors.nombre || 'Nombre descriptivo de la categoría'}
            disabled={loading}
            inputProps={{ maxLength: 50 }}
          />

          <TextField
            fullWidth
            label="Descripción"
            value={formData.descripcion}
            onChange={handleChange('descripcion')}
            error={!!errors.descripcion}
            helperText={errors.descripcion}
            disabled={loading}
            multiline
            rows={2}
            inputProps={{ maxLength: 200 }}
          />

          <TextField
            fullWidth
            label="Monto de Cuota *"
            type="number"
            value={formData.montoCuota}
            onChange={handleChange('montoCuota')}
            error={!!errors.montoCuota}
            helperText={errors.montoCuota || 'Monto mensual base de la cuota'}
            disabled={loading}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{
              min: 0,
              max: 1000000,
              step: 100,
            }}
          />

          <TextField
            fullWidth
            label="Descuento (%)"
            type="number"
            value={formData.descuento}
            onChange={handleChange('descuento')}
            error={!!errors.descuento}
            helperText={errors.descuento || 'Porcentaje de descuento (0-100)'}
            disabled={loading}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
            inputProps={{
              min: 0,
              max: 100,
              step: 0.5,
            }}
          />

          <TextField
            fullWidth
            label="Orden"
            type="number"
            value={formData.orden}
            onChange={handleChange('orden')}
            error={!!errors.orden}
            helperText={errors.orden || 'Orden de visualización (opcional)'}
            disabled={loading}
            inputProps={{
              min: 1,
              step: 1,
            }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoriaForm;
