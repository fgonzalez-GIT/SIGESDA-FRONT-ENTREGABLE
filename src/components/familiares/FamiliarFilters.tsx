/**
 * FamiliarFilters - Componente de filtros para relaciones familiares (FASE 2)
 *
 * Permite filtrar relaciones por:
 * - Tipo de relación (parentesco)
 * - Persona específica
 * - Permisos (RF, CE, AR)
 * - Estado (activo/inactivo)
 * - Con descuento
 */

import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextField,
  Autocomplete,
  FormControlLabel,
  Checkbox,
  Button,
  Paper,
  Typography,
  Divider,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import type { PersonaTipo } from '@/types/persona.types';

interface PersonaBasica {
  id: number;
  nombre: string;
  apellido: string;
  tipos?: PersonaTipo[];
}

export interface FiltrosRelaciones {
  tipoRelacion?: string;
  personaId?: number;
  responsableFinanciero?: boolean;
  contactoEmergencia?: boolean;
  autorizadoRetiro?: boolean;
  conDescuento?: boolean;
  soloActivos?: boolean;
}

interface FamiliarFiltersProps {
  filtros: FiltrosRelaciones;
  personas: PersonaBasica[];
  onFiltrosChange: (filtros: FiltrosRelaciones) => void;
  onClearFiltros: () => void;
  showAdvanced?: boolean;
}

const tiposRelacion = [
  { value: 'padre', label: 'Padre' },
  { value: 'madre', label: 'Madre' },
  { value: 'hijo', label: 'Hijo' },
  { value: 'hija', label: 'Hija' },
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
  { value: 'otro', label: 'Otro' },
];

export const FamiliarFilters: React.FC<FamiliarFiltersProps> = ({
  filtros,
  personas,
  onFiltrosChange,
  onClearFiltros,
  showAdvanced = false,
}) => {
  const [expanded, setExpanded] = React.useState(showAdvanced);

  const handleChange = (field: keyof FiltrosRelaciones, value: any) => {
    onFiltrosChange({
      ...filtros,
      [field]: value === '' ? undefined : value,
    });
  };

  const handleCheckboxChange = (field: keyof FiltrosRelaciones, checked: boolean) => {
    onFiltrosChange({
      ...filtros,
      [field]: checked ? true : undefined,
    });
  };

  // Contar filtros activos
  const activeFiltrosCount = Object.values(filtros).filter(v => v !== undefined && v !== '').length;

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <FilterIcon color="primary" />
          <Typography variant="h6">Filtros</Typography>
          {activeFiltrosCount > 0 && (
            <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>
              ({activeFiltrosCount} activos)
            </Typography>
          )}
        </Box>
        <Box display="flex" gap={1}>
          <Button
            size="small"
            startIcon={<ClearIcon />}
            onClick={onClearFiltros}
            disabled={activeFiltrosCount === 0}
          >
            Limpiar Filtros
          </Button>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Filtros básicos (siempre visibles) */}
      <Box display="flex" gap={2} flexWrap="wrap" mb={expanded ? 2 : 0}>
        {/* Tipo de Relación */}
        <FormControl sx={{ minWidth: 200, flex: 1 }} size="small">
          <InputLabel>Tipo de Relación</InputLabel>
          <Select
            value={filtros.tipoRelacion || ''}
            onChange={(e: SelectChangeEvent) => handleChange('tipoRelacion', e.target.value)}
            label="Tipo de Relación"
          >
            <MenuItem value="">Todos</MenuItem>
            {tiposRelacion.map(tipo => (
              <MenuItem key={tipo.value} value={tipo.value}>
                {tipo.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Persona */}
        <Autocomplete
          sx={{ minWidth: 250, flex: 1 }}
          size="small"
          options={personas}
          getOptionLabel={(option) => `${option.nombre} ${option.apellido}`}
          value={personas.find(p => p.id === filtros.personaId) || null}
          onChange={(_, value) => handleChange('personaId', value?.id)}
          renderInput={(params) => (
            <TextField {...params} label="Buscar por persona" />
          )}
        />

        {/* Solo activos */}
        <FormControlLabel
          control={
            <Checkbox
              checked={filtros.soloActivos || false}
              onChange={(e) => handleCheckboxChange('soloActivos', e.target.checked)}
            />
          }
          label="Solo activos"
        />
      </Box>

      {/* Filtros avanzados (colapsables) */}
      <Collapse in={expanded}>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="subtitle2" color="text.secondary" mb={1}>
          Filtros Avanzados
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          {/* Permisos */}
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              Permisos
            </Typography>
            <Box display="flex" gap={1}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filtros.responsableFinanciero || false}
                    onChange={(e) => handleCheckboxChange('responsableFinanciero', e.target.checked)}
                    size="small"
                  />
                }
                label="Responsable Financiero"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filtros.contactoEmergencia || false}
                    onChange={(e) => handleCheckboxChange('contactoEmergencia', e.target.checked)}
                    size="small"
                  />
                }
                label="Contacto Emergencia"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filtros.autorizadoRetiro || false}
                    onChange={(e) => handleCheckboxChange('autorizadoRetiro', e.target.checked)}
                    size="small"
                  />
                }
                label="Autorizado Retiro"
              />
            </Box>
          </Box>

          {/* Con descuento */}
          <FormControlLabel
            control={
              <Checkbox
                checked={filtros.conDescuento || false}
                onChange={(e) => handleCheckboxChange('conDescuento', e.target.checked)}
              />
            }
            label="Con descuento aplicado"
          />
        </Box>
      </Collapse>
    </Paper>
  );
};

export default FamiliarFilters;
