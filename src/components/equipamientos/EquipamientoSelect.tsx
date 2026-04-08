import React, { useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Chip,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  MusicNote as MusicNoteIcon,
  Videocam as VideocamIcon,
  Chair as ChairIcon,
  Thermostat as ThermostatIcon,
  Computer as ComputerIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchEquipamientos } from '@/store/slices/equipamientosSlice';
import type { Equipamiento, CategoriaEquipamientoCodigo } from '@/types/equipamiento.types';
import {
  getCategoriaLabel,
  getCategoriaColor,
  getEstadoLabel,
  getEstadoColor,
  puedeAsignarse,
  isEstadoBloqueado,
} from '@/types/equipamiento.types';

interface EquipamientoSelectProps {
  value: number[]; // Array de IDs de equipamientos seleccionados
  onChange: (newValue: number[]) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  label?: string;
  multiple?: boolean; // true = multi-select, false = single select
  groupByCategory?: boolean; // Agrupar por categoría
  showOnlyActive?: boolean; // Mostrar solo activos
  soloAsignables?: boolean; // NUEVO: Filtrar equipamientos no asignables (estados bloqueados)
  mostrarCantidad?: boolean; // NUEVO: Mostrar cantidad en opciones
  mostrarEstado?: boolean; // NUEVO: Mostrar estado en opciones
}

// Mapeo de iconos por código de categoría
const categoriaIcons: Record<string, React.ReactElement> = {
  TEC_AUDIO: <ComputerIcon fontSize="small" />,
  DIDACT: <CategoryIcon fontSize="small" />,
  INST_MUS: <MusicNoteIcon fontSize="small" />,
  MOB: <ChairIcon fontSize="small" />,
  INFRAEST: <CategoryIcon fontSize="small" />,
  // Fallbacks para códigos legacy
  MUSICAL: <MusicNoteIcon fontSize="small" />,
  AUDIOVISUAL: <VideocamIcon fontSize="small" />,
  MOBILIARIO: <ChairIcon fontSize="small" />,
  CLIMATIZACION: <ThermostatIcon fontSize="small" />,
  TECNOLOGIA: <ComputerIcon fontSize="small" />,
  OTRO: <CategoryIcon fontSize="small" />,
};

export const EquipamientoSelect: React.FC<EquipamientoSelectProps> = ({
  value,
  onChange,
  disabled = false,
  error = false,
  helperText,
  label = 'Equipamientos',
  multiple = true,
  groupByCategory = false,
  showOnlyActive = true,
  soloAsignables = false,
  mostrarCantidad = false,
  mostrarEstado = false,
}) => {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.equipamientos);

  // Cargar equipamientos al montar
  useEffect(() => {
    if (items.length === 0) {
      dispatch(fetchEquipamientos({ includeInactive: !showOnlyActive, limit: 100 }));
    }
  }, [dispatch, items.length, showOnlyActive]);

  // Filtrar equipamientos
  let equipamientosFiltrados = showOnlyActive
    ? items.filter((eq) => eq.activo)
    : items;

  // NUEVO: Filtrar solo asignables (excluir estados bloqueados)
  if (soloAsignables) {
    equipamientosFiltrados = equipamientosFiltrados.filter((eq) => puedeAsignarse(eq));
  }

  // Ordenar por orden y nombre
  const equipamientosOrdenados = [...equipamientosFiltrados].sort((a, b) => {
    if (a.orden !== b.orden) return a.orden - b.orden;
    return a.nombre.localeCompare(b.nombre);
  });

  // Obtener objetos completos de los equipamientos seleccionados
  const equipamientosSeleccionados = equipamientosOrdenados.filter((eq) =>
    value.includes(eq.id)
  );

  const handleChange = (_event: any, newValue: Equipamiento | Equipamiento[] | null) => {
    if (multiple) {
      const newIds = (newValue as Equipamiento[]).map((eq) => eq.id);
      onChange(newIds);
    } else {
      const newId = newValue ? (newValue as Equipamiento).id : null;
      onChange(newId ? [newId] : []);
    }
  };

  // Agrupar por categoría si está habilitado
  const getGroupBy = groupByCategory
    ? (option: Equipamiento) => getCategoriaLabel(option.categoriaEquipamiento)
    : undefined;

  if (loading && items.length === 0) {
    return (
      <TextField
        fullWidth
        label={label}
        disabled
        InputProps={{
          endAdornment: <CircularProgress size={20} />,
        }}
        helperText="Cargando equipamientos..."
      />
    );
  }

  return (
    <Autocomplete
      multiple={multiple}
      id="equipamiento-select"
      options={equipamientosOrdenados}
      value={multiple ? equipamientosSeleccionados : (equipamientosSeleccionados[0] || null)}
      onChange={handleChange}
      disabled={disabled}
      loading={loading}
      getOptionLabel={(option) => (option as Equipamiento).nombre}
      isOptionEqualToValue={(option, value) => (option as Equipamiento).id === (value as Equipamiento).id}
      getOptionDisabled={(option) => !puedeAsignarse(option as Equipamiento)} // NUEVO: Deshabilitar estados bloqueados
      groupBy={getGroupBy}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={multiple ? 'Seleccione equipamientos' : 'Seleccione un equipamiento'}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => {
        const { key, ...restProps } = props as any;
        const eq = option as Equipamiento;
        const esBloqueado = isEstadoBloqueado(eq.estadoEquipamiento);

        return (
          <Box
            component="li"
            key={key}
            {...restProps}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              opacity: esBloqueado ? 0.6 : 1,
            }}
          >
            {categoriaIcons[eq.categoriaEquipamiento?.codigo] || categoriaIcons['OTRO']}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body1">
                  {eq.nombre}
                  {!eq.activo && ' (Inactivo)'}
                  {esBloqueado && ' (No disponible)'}
                </Typography>
                {/* NUEVO: Mostrar cantidad */}
                {mostrarCantidad && eq.cantidad !== undefined && (
                  <Chip
                    label={`Stock: ${eq.cantidad}`}
                    size="small"
                    variant="outlined"
                    color={eq.cantidad > 0 ? 'default' : 'error'}
                  />
                )}
              </Box>
              {eq.descripcion && (
                <Typography variant="caption" color="text.secondary">
                  {eq.descripcion}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
              {/* NUEVO: Mostrar estado */}
              {mostrarEstado && eq.estadoEquipamiento && (
                <Chip
                  label={getEstadoLabel(eq.estadoEquipamiento)}
                  size="small"
                  color={getEstadoColor(eq.estadoEquipamiento)}
                  variant="outlined"
                />
              )}
              <Chip
                label={getCategoriaLabel(eq.categoriaEquipamiento)}
                size="small"
                color={getCategoriaColor(eq.categoriaEquipamiento)}
                variant="outlined"
              />
            </Box>
          </Box>
        );
      }}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => {
          const { key, ...restProps } = getTagProps({ index }) as any;
          const eq = option as Equipamiento;
          return (
            <Chip
              key={key}
              label={eq.nombre}
              icon={categoriaIcons[eq.categoriaEquipamiento?.codigo] || categoriaIcons['OTRO']}
              {...restProps}
              color={getCategoriaColor(eq.categoriaEquipamiento)}
              variant="filled"
              size="small"
            />
          );
        })
      }
      sx={{
        minWidth: 300,
      }}
      disableCloseOnSelect={multiple}
      limitTags={3}
      noOptionsText="No hay equipamientos disponibles"
    />
  );
};

export default EquipamientoSelect;
