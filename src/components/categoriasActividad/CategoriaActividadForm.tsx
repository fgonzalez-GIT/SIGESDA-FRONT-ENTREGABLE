import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
} from '@mui/material';
import type {
  CategoriaActividad,
  CategoriaActividadFormData,
  CreateCategoriaActividadDto,
  UpdateCategoriaActividadDto,
} from '../../types/categoriaActividad.types';
import { generateCodigoFromNombre } from '@/utils/string.helpers';

interface CategoriaActividadFormProps {
  initialData?: CategoriaActividad | null;
  onSubmit: (data: CreateCategoriaActividadDto | UpdateCategoriaActividadDto) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

/**
 * Componente de formulario para crear/editar Categorías de Actividad
 */
export const CategoriaActividadForm: React.FC<CategoriaActividadFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
}) => {
  const [formData, setFormData] = useState<CategoriaActividadFormData & { activo?: boolean }>({
    codigo: '',
    nombre: '',
    descripcion: '',
    orden: undefined,
    activo: true,
  });

  const [validationErrors, setValidationErrors] = useState<{
    codigo?: string;
    nombre?: string;
    descripcion?: string;
    orden?: string;
  }>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        codigo: initialData.codigo,
        nombre: initialData.nombre,
        descripcion: initialData.descripcion || '',
        orden: initialData.orden,
        activo: initialData.activo,
      });
    }
  }, [initialData]);

  // Auto-generar código desde el nombre (solo en modo creación)
  useEffect(() => {
    if (!initialData && formData.nombre) {
      const codigoGenerado = generateCodigoFromNombre(formData.nombre);
      setFormData((prev) => ({
        ...prev,
        codigo: codigoGenerado,
      }));
    }
  }, [initialData, formData.nombre]);

  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case 'codigo':
        if (!value || value.trim() === '') {
          return 'El código es requerido';
        }
        if (value.length < 2) {
          return 'El código debe tener al menos 2 caracteres';
        }
        if (value.length > 20) {
          return 'El código no puede exceder 20 caracteres';
        }
        if (!/^[A-Z0-9_-]+$/.test(value)) {
          return 'El código solo puede contener letras mayúsculas, números, guiones (-) y guiones bajos (_)';
        }
        break;

      case 'nombre':
        if (!value || value.trim() === '') {
          return 'El nombre es requerido';
        }
        if (value.trim().length < 3) {
          return 'El nombre debe tener al menos 3 caracteres';
        }
        if (value.length > 100) {
          return 'El nombre no puede exceder 100 caracteres';
        }
        break;

      case 'descripcion':
        if (value && value.length > 500) {
          return 'La descripción no puede exceder 500 caracteres';
        }
        break;

      case 'orden':
        if (value !== undefined && value !== '') {
          const num = Number(value);
          if (isNaN(num)) {
            return 'El orden debe ser un número';
          }
          if (!Number.isInteger(num)) {
            return 'El orden debe ser un número entero';
          }
          if (num < 0) {
            return 'El orden no puede ser negativo';
          }
        }
        break;
    }
    return undefined;
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value;

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Validar campo
    const errorMsg = validateField(field, value);
    setValidationErrors((prev) => ({
      ...prev,
      [field]: errorMsg,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar todos los campos
    const errors: typeof validationErrors = {
      codigo: validateField('codigo', formData.codigo),
      nombre: validateField('nombre', formData.nombre),
      descripcion: validateField('descripcion', formData.descripcion),
      orden: validateField('orden', formData.orden),
    };

    setValidationErrors(errors);

    // Verificar si hay errores
    if (Object.values(errors).some((error) => error !== undefined)) {
      return;
    }

    // Preparar datos para enviar
    const dataToSubmit: CreateCategoriaActividadDto | UpdateCategoriaActividadDto = {
      codigo: formData.codigo.trim(),
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion?.trim() || undefined,
      orden: formData.orden !== undefined && formData.orden !== null
        ? Number(formData.orden)
        : undefined,
    };

    // Si estamos editando, incluir el campo activo
    if (initialData) {
      (dataToSubmit as UpdateCategoriaActividadDto).activo = formData.activo;
    }

    onSubmit(dataToSubmit);
  };

  const isEditing = !!initialData;

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Grid container spacing={2}>
        {error && (
          <Grid size={{ xs: 12 }}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Nombre"
            value={formData.nombre}
            onChange={handleChange('nombre')}
            error={!!validationErrors.nombre}
            helperText={validationErrors.nombre || 'Nombre descriptivo de la categoría'}
            required
            disabled={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Orden"
            type="number"
            value={formData.orden ?? ''}
            onChange={handleChange('orden')}
            error={!!validationErrors.orden}
            helperText={validationErrors.orden || 'Orden de visualización (opcional)'}
            disabled={loading}
            inputProps={{ min: 0, step: 1 }}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Descripción"
            value={formData.descripcion}
            onChange={handleChange('descripcion')}
            error={!!validationErrors.descripcion}
            helperText={validationErrors.descripcion || 'Descripción opcional de la categoría (máx. 500 caracteres)'}
            multiline
            rows={3}
            disabled={loading}
          />
        </Grid>

        {isEditing && (
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.activo ?? true}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, activo: e.target.checked }))
                  }
                  disabled={loading}
                />
              }
              label="Categoría de actividad activa"
            />
          </Grid>
        )}

        <Grid size={{ xs: 12 }}>
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CategoriaActividadForm;
