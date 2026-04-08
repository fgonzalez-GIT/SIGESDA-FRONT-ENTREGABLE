import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Stack,
  SelectChangeEvent,
  OutlinedInput,
  FormControlLabel,
  Switch,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  DeleteOutline as DeleteOutlineIcon,
} from '@mui/icons-material';
import { FiltrosAccordion } from '../../common/FiltrosAccordion';
import type { PersonasQueryParams, CatalogosPersonas } from '../../../types/persona.types';

interface PersonasFiltersProps {
  filters: PersonasQueryParams;
  catalogos: CatalogosPersonas | null;
  onFilterChange: (filters: PersonasQueryParams) => void;
  onClearFilters: () => void;
  resultCount?: number;
  totalCount?: number;
}

/**
 * Componente de filtros para el listado de personas
 * Incluye búsqueda, filtros por tipo, estado, categoría y especialidad
 *
 * @example
 * ```tsx
 * <PersonasFilters
 *   filters={filters}
 *   catalogos={catalogos}
 *   onFilterChange={handleFilterChange}
 *   onClearFilters={handleClearFilters}
 *   resultCount={10}
 *   totalCount={100}
 * />
 * ```
 */
export const PersonasFilters: React.FC<PersonasFiltersProps> = ({
  filters,
  catalogos,
  onFilterChange,
  onClearFilters,
  resultCount,
  totalCount,
}) => {
  const [filtrosExpanded, setFiltrosExpanded] = useState(false);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: event.target.value, page: 1 });
  };

  const handleTiposChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    onFilterChange({
      ...filters,
      tiposCodigos: typeof value === 'string' ? value.split(',') : value,
      page: 1,
    });
  };

  const handleEstadoChange = (event: SelectChangeEvent<string>) => {
    onFilterChange({
      ...filters,
      estado: event.target.value as 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | undefined,
      page: 1,
    });
  };

  const handleCategoriaChange = (event: SelectChangeEvent<string>) => {
    onFilterChange({
      ...filters,
      categoriaId: event.target.value ? Number(event.target.value) : undefined,
      page: 1,
    });
  };

  const handleEspecialidadChange = (event: SelectChangeEvent<string>) => {
    onFilterChange({
      ...filters,
      especialidadId: event.target.value ? Number(event.target.value) : undefined,
      page: 1,
    });
  };

  const handleIncludeDeletedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      // Si el switch está ON (checked=true), mostrar solo inactivas (activo=false)
      // Si el switch está OFF (checked=false), mostrar solo activas (activo=true)
      activo: !event.target.checked,
      page: 1,
    });
  };

  const hasActiveFilters =
    filters.search ||
    (filters.tiposCodigos && filters.tiposCodigos.length > 0) ||
    filters.estado ||
    filters.categoriaId ||
    filters.especialidadId ||
    filters.activo === false; // El switch está activo cuando activo es false (mostrando inactivas)

  // Contar filtros activos
  const filtrosActivos = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.tiposCodigos && filters.tiposCodigos.length > 0) count += filters.tiposCodigos.length;
    if (filters.estado) count++;
    if (filters.categoriaId) count++;
    if (filters.especialidadId) count++;
    if (filters.activo === false) count++;
    return count;
  }, [filters]);

  return (
    <FiltrosAccordion
      expanded={filtrosExpanded}
      onToggle={() => setFiltrosExpanded(!filtrosExpanded)}
      activeCount={filtrosActivos}
      onClearFilters={onClearFilters}
      title="Filtros de Búsqueda"
    >
      <Stack spacing={2}>
        {/* Primera fila: Búsqueda principal y controles */}
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por nombre, apellido, DNI o email..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={filters.activo === false}
                  onChange={handleIncludeDeletedChange}
                  size="small"
                  color="warning"
                />
              }
              label="Solo eliminadas"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {resultCount !== undefined && totalCount !== undefined && (
              <Chip
                label={`${resultCount} de ${totalCount} personas`}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
          </Grid>
        </Grid>

        {/* Segunda fila: Filtros avanzados */}
        <Grid container spacing={2}>
          {/* Filtro de Tipos (múltiple) */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipos de Persona</InputLabel>
              <Select
                multiple
                value={filters.tiposCodigos || []}
                onChange={handleTiposChange}
                input={<OutlinedInput label="Tipos de Persona" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const tipo = catalogos?.tiposPersona.find((t) => t.codigo === value);
                      return <Chip key={value} label={tipo?.nombre || value} size="small" />;
                    })}
                  </Box>
                )}
              >
                {catalogos?.tiposPersona
                  .filter((t) => t.activo)
                  .map((tipo) => (
                    <MenuItem key={tipo.id} value={tipo.codigo}>
                      {tipo.nombre}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Filtro de Estado */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.estado || ''}
                onChange={handleEstadoChange}
                label="Estado"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="ACTIVO">Activo</MenuItem>
                <MenuItem value="INACTIVO">Inactivo</MenuItem>
                <MenuItem value="SUSPENDIDO">Suspendido</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Filtro de Categoría (solo si hay tipo SOCIO seleccionado) */}
          {filters.tiposCodigos?.includes('SOCIO') && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoría de Socio</InputLabel>
                <Select
                  value={filters.categoriaId || ''}
                  onChange={handleCategoriaChange}
                  label="Categoría de Socio"
                >
                  <MenuItem value="">Todas</MenuItem>
                  {catalogos?.categoriasSocio
                    .filter((c) => c.activa)
                    .map((categoria) => (
                      <MenuItem key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Filtro de Especialidad (solo si hay tipo DOCENTE seleccionado) */}
          {filters.tiposCodigos?.includes('DOCENTE') && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Especialidad Docente</InputLabel>
                <Select
                  value={filters.especialidadId?.toString() || ''}
                  onChange={handleEspecialidadChange}
                  label="Especialidad Docente"
                >
                  <MenuItem value="">Todas</MenuItem>
                  {catalogos?.especialidadesDocentes
                    .filter((e) => e.activo)
                    .map((especialidad) => (
                      <MenuItem key={especialidad.id} value={especialidad.id.toString()}>
                        {especialidad.nombre}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>

        {/* Chips de filtros activos */}
        {hasActiveFilters && (
          <Box display="flex" gap={1} flexWrap="wrap" pt={1}>
            {filters.search && (
              <Chip
                label={`Búsqueda: "${filters.search}"`}
                size="small"
                onDelete={() => onFilterChange({ ...filters, search: undefined })}
              />
            )}
            {filters.tiposCodigos?.map((codigo) => {
              const tipo = catalogos?.tiposPersona.find((t) => t.codigo === codigo);
              return (
                <Chip
                  key={codigo}
                  label={`Tipo: ${tipo?.nombre || codigo}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  onDelete={() =>
                    onFilterChange({
                      ...filters,
                      tiposCodigos: filters.tiposCodigos?.filter((c) => c !== codigo),
                    })
                  }
                />
              );
            })}
            {filters.estado && (
              <Chip
                label={`Estado: ${filters.estado}`}
                size="small"
                color="secondary"
                variant="outlined"
                onDelete={() => onFilterChange({ ...filters, estado: undefined })}
              />
            )}
            {filters.categoriaId && (
              <Chip
                label={`Categoría: ${
                  catalogos?.categoriasSocio.find((c) => c.id === filters.categoriaId)?.nombre ||
                  'N/A'
                }`}
                size="small"
                variant="outlined"
                onDelete={() => onFilterChange({ ...filters, categoriaId: undefined })}
              />
            )}
            {filters.especialidadId && (
              <Chip
                label={`Especialidad: ${
                  catalogos?.especialidadesDocentes.find(
                    (e) => e.id === filters.especialidadId
                  )?.nombre || 'N/A'
                }`}
                size="small"
                variant="outlined"
                onDelete={() => onFilterChange({ ...filters, especialidadId: undefined })}
              />
            )}
            {filters.activo === false && (
              <Chip
                label="Solo eliminadas"
                size="small"
                color="warning"
                variant="outlined"
                icon={<DeleteOutlineIcon />}
                onDelete={() => onFilterChange({ ...filters, activo: true })}
              />
            )}
          </Box>
        )}
      </Stack>
    </FiltrosAccordion>
  );
};

export default PersonasFilters;
