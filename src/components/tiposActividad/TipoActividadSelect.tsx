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
import type { TipoActividadSelectProps } from '../../types/tipoActividad.types';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchTiposActividad } from '../../store/slices/tiposActividadSlice';

/**
 * Componente Select reutilizable para Tipos de Actividad
 * Se usa en formularios de creación/edición de actividades
 */
export const TipoActividadSelect: React.FC<TipoActividadSelectProps> = ({
  value,
  onChange,
  error,
  includeInactive = false,
  required = false,
  label = 'Tipo de Actividad',
  disabled = false,
}) => {
  const dispatch = useAppDispatch();
  const { tipos, loading } = useAppSelector((state) => state.tiposActividad);

  useEffect(() => {
    // Cargar tipos si no están cargados
    if (tipos.length === 0) {
      dispatch(fetchTiposActividad({ includeInactive }));
    }
  }, [dispatch, tipos.length, includeInactive]);

  const tiposFiltrados = tipos
    .filter((tipo) => includeInactive || tipo.activo)
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
        ) : tiposFiltrados.length === 0 ? (
          <MenuItem disabled>No hay tipos de actividad disponibles</MenuItem>
        ) : (
          tiposFiltrados.map((tipo) => (
            <MenuItem key={tipo.id} value={tipo.id}>
              {tipo.nombre}
              {!tipo.activo && ' (Inactivo)'}
            </MenuItem>
          ))
        )}
      </Select>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
};

export default TipoActividadSelect;
