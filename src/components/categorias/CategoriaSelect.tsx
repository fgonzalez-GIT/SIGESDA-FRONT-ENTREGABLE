import React, { useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCategorias } from '../../store/slices/categoriasSlice';
import { CategoriaSocio } from '../../types/categoria.types';

interface CategoriaSelectProps {
  value?: string | number;
  onChange: (categoriaId: string | number) => void;
  error?: string;
  includeInactive?: boolean;
  required?: boolean;
  label?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  showEmpty?: boolean; // Mostrar opción "Sin categoría"
}

export const CategoriaSelect: React.FC<CategoriaSelectProps> = ({
  value = '',
  onChange,
  error,
  includeInactive = false,
  required = false,
  label = 'Categoría',
  disabled = false,
  fullWidth = true,
  showEmpty = false,
}) => {
  const dispatch = useAppDispatch();
  const { categorias, loading, error: fetchError } = useAppSelector(state => state.categorias);

  // Cargar categorías al montar el componente
  useEffect(() => {
    if (categorias.length === 0) {
      dispatch(fetchCategorias({ includeInactive }));
    }
  }, [dispatch, includeInactive, categorias.length]);

  // Filtrar categorías activas/inactivas
  const categoriasFiltered = includeInactive
    ? categorias
    : categorias.filter(cat => cat.activa);

  // Ordenar por campo 'orden'
  const categoriasOrdenadas = [...categoriasFiltered].sort((a, b) => a.orden - b.orden);

  // Formatear monto para mostrar
  const formatMonto = (monto: string) => {
    const numero = parseFloat(monto);
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numero);
  };

  const handleChange = (event: any) => {
    onChange(event.target.value);
  };

  // Mostrar error de fetch si existe
  if (fetchError) {
    return (
      <FormControl fullWidth={fullWidth} error>
        <InputLabel>{label} {required && '*'}</InputLabel>
        <Select disabled value="">
          <MenuItem value="">Error al cargar categorías</MenuItem>
        </Select>
        <FormHelperText>
          {fetchError}. Por favor, recargue la página.
        </FormHelperText>
      </FormControl>
    );
  }

  return (
    <FormControl
      fullWidth={fullWidth}
      error={!!error}
      disabled={disabled || loading}
    >
      <InputLabel>{label} {required && '*'}</InputLabel>
      <Select
        value={value}
        onChange={handleChange}
        label={`${label} ${required ? '*' : ''}`}
        endAdornment={
          loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <CircularProgress size={20} />
            </Box>
          ) : null
        }
      >
        {showEmpty && (
          <MenuItem value="">
            <em>Sin categoría</em>
          </MenuItem>
        )}

        {categoriasOrdenadas.length === 0 && !loading ? (
          <MenuItem value="" disabled>
            <em>No hay categorías disponibles</em>
          </MenuItem>
        ) : (
          categoriasOrdenadas.map((categoria) => (
            <MenuItem
              key={categoria.id}
              value={categoria.id}
              disabled={!categoria.activa}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">
                    {categoria.nombre}
                    {!categoria.activa && ' (Inactiva)'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                    {formatMonto(categoria.montoCuota)}
                  </Typography>
                </Box>
                {categoria.descripcion && (
                  <Typography variant="caption" color="text.secondary">
                    {categoria.descripcion}
                  </Typography>
                )}
                {parseFloat(categoria.descuento) > 0 && (
                  <Typography variant="caption" color="success.main">
                    {categoria.descuento}% de descuento
                  </Typography>
                )}
              </Box>
            </MenuItem>
          ))
        )}
      </Select>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
};

export default CategoriaSelect;
