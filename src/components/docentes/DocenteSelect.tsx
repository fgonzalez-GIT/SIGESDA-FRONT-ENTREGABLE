import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Box,
  Typography,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon, Person as PersonIcon } from '@mui/icons-material';
import { personasApi } from '../../services/personasApi';
import { Persona } from '../../types/persona.types';

interface DocenteSelectProps {
  value?: number | string;
  onChange: (docenteId: number | string) => void;
  error?: string;
  required?: boolean;
  label?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  helperText?: string;
  showSearch?: boolean;
  excludeDocenteIds?: number[]; // Lista de IDs de docentes ya asignados
}

export const DocenteSelect: React.FC<DocenteSelectProps> = ({
  value = '',
  onChange,
  error,
  required = false,
  label = 'Docente',
  disabled = false,
  fullWidth = true,
  helperText,
  showSearch = true,
  excludeDocenteIds = [],
}) => {
  const [docentes, setDocentes] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar docentes al montar el componente
  useEffect(() => {
    const fetchDocentes = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        // En V2, filtrar por tipo de persona usando tiposCodigos
        const response = await personasApi.getAll({
          tiposCodigos: ['DOCENTE'],
          estado: 'ACTIVO',
          limit: 100, // Límite máximo
          includeRelaciones: true, // ✅ Incluir relaciones para obtener tipoPersona.codigo y especialidad
          includeTipos: true,
        });

        // En V2, la respuesta tiene estructura { success, data, pagination }
        setDocentes(response.data || []);
      } catch (err) {
        console.error('Error al cargar docentes:', err);
        setFetchError('Error al cargar la lista de docentes');
      } finally {
        setLoading(false);
      }
    };

    fetchDocentes();
  }, []);

  // Filtrar docentes por búsqueda
  const docentesFiltrados = docentes.filter((docente) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const nombreCompleto = `${docente.nombre} ${docente.apellido}`.toLowerCase();
    const dni = docente.dni?.toLowerCase() || '';

    return nombreCompleto.includes(searchLower) || dni.includes(searchLower);
  });

  // Ordenar docentes por apellido, nombre
  const docentesOrdenados = [...docentesFiltrados].sort((a, b) => {
    const apellidoCompare = a.apellido.localeCompare(b.apellido);
    if (apellidoCompare !== 0) return apellidoCompare;
    return a.nombre.localeCompare(b.nombre);
  });

  const handleChange = (event: any) => {
    onChange(event.target.value);
  };

  // Mostrar error de fetch si existe
  if (fetchError) {
    return (
      <FormControl fullWidth={fullWidth} error>
        <InputLabel>{label} {required && '*'}</InputLabel>
        <Select disabled value="">
          <MenuItem value="">Error al cargar docentes</MenuItem>
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
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 400,
            },
          },
        }}
      >
        {/* Campo de búsqueda dentro del menú */}
        {showSearch && docentes.length > 5 && (
          <Box sx={{ px: 2, py: 1, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
            <TextField
              size="small"
              placeholder="Buscar por nombre o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}

        {/* Opción vacía si no es requerido */}
        {!required && (
          <MenuItem value="">
            <em>Sin docente</em>
          </MenuItem>
        )}

        {/* Lista de docentes */}
        {docentesOrdenados.length === 0 && !loading ? (
          <MenuItem value="" disabled>
            <em>
              {searchTerm
                ? 'No se encontraron docentes con ese criterio'
                : 'No hay docentes disponibles'}
            </em>
          </MenuItem>
        ) : (
          docentesOrdenados.map((docente) => {
            const yaAsignado = excludeDocenteIds.includes(docente.id);

            // En V2, la especialidad está en el tipo DOCENTE
            const tipoDocente = docente.tipos?.find(t => t.tipoPersona?.codigo === 'DOCENTE');
            const especialidad = tipoDocente?.especialidad?.nombre;

            return (
              <MenuItem
                key={docente.id}
                value={docente.id}
                disabled={yaAsignado}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <PersonIcon fontSize="small" color={yaAsignado ? "disabled" : "action"} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <Typography
                      variant="body2"
                      color={yaAsignado ? "text.disabled" : "text.primary"}
                    >
                      {docente.apellido}, {docente.nombre}
                      {yaAsignado && ' (Ya asignado)'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {docente.dni && `DNI: ${docente.dni}`}
                      {especialidad && ` • ${especialidad}`}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            );
          })
        )}
      </Select>
      {(error || helperText) && (
        <FormHelperText>{error || helperText}</FormHelperText>
      )}
    </FormControl>
  );
};

export default DocenteSelect;
