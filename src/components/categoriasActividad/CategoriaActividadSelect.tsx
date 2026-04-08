import React, { useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Box,
} from '@mui/material';
import type { CategoriaActividadSelectProps } from '../../types/categoriaActividad.types';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchCategoriasActividad } from '../../store/slices/categoriasActividadSlice';

/**
 * Componente Select reutilizable para Categorías de Actividad
 * Se usa en formularios de creación/edición de actividades
 */
export const CategoriaActividadSelect: React.FC<CategoriaActividadSelectProps> = ({
  value,
  onChange,
  error,
  includeInactive = false,
  required = false,
  label = 'Categoría de Actividad',
  disabled = false,
}) => {
  const dispatch = useAppDispatch();
  const { categorias, loading } = useAppSelector((state) => state.categoriasActividad);

  useEffect(() => {
    // Cargar categorías si no están cargadas
    if (categorias.length === 0) {
      dispatch(fetchCategoriasActividad({ includeInactive }));
    }
  }, [dispatch, categorias.length, includeInactive]);

  const categoriasFiltradas = categorias
    .filter((categoria) => includeInactive || categoria.activo)
    .sort((a, b) => a.orden - b.orden);

  return (
    <FormControl fullWidth error={!!error} required={required} disabled={disabled || loading}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        label={label}
      >
        {loading ? (
          <MenuItem disabled>
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={20} />
              Cargando...
            </Box>
          </MenuItem>
        ) : categoriasFiltradas.length === 0 ? (
          <MenuItem disabled>No hay categorías de actividad disponibles</MenuItem>
        ) : (
          categoriasFiltradas.map((categoria) => (
            <MenuItem key={categoria.id} value={categoria.id}>
              {categoria.nombre}
              {!categoria.activo && ' (Inactivo)'}
            </MenuItem>
          ))
        )}
      </Select>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
};

export default CategoriaActividadSelect;
