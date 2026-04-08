import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchPersonas } from '@/store/slices/personasSlice';
import { personasApi } from '@/services/personasApi';
import type { Persona } from '@/types/persona.types';

// Umbral para cambiar de búsqueda simple a asíncrona
const ASYNC_SEARCH_THRESHOLD = 1000;

// Tipo para las opciones del Autocomplete
interface PersonaOption {
  id: number;
  label: string;
  persona: Persona;
}

interface PersonaAutocompleteFilterProps {
  value: number | null | undefined;
  onChange: (personaId: number | null) => void;
  label?: string;
  placeholder?: string;
  soloSocios?: boolean;
  size?: 'small' | 'medium';
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  sx?: any;
}

export const PersonaAutocompleteFilter = ({
  value,
  onChange,
  label = 'Persona',
  placeholder = 'Buscar por apellido, nombre o DNI...',
  soloSocios = true,
  size = 'small',
  disabled = false,
  error = false,
  helperText,
  required = false,
  sx,
}: PersonaAutocompleteFilterProps) => {
  const dispatch = useAppDispatch();
  const { personas, loading } = useAppSelector((state) => state.personas);

  // Estado para búsqueda asíncrona
  const [searchQuery, setSearchQuery] = useState('');
  const [asyncOptions, setAsyncOptions] = useState<PersonaOption[]>([]);
  const [asyncLoading, setAsyncLoading] = useState(false);
  const [useAsyncSearch, setUseAsyncSearch] = useState(false);

  // Estado para persona seleccionada cargada individualmente
  const [loadedSelectedPersona, setLoadedSelectedPersona] = useState<PersonaOption | null>(null);

  // Cargar personas al montar si no están cargadas
  useEffect(() => {
    if (personas.length === 0 && !loading) {
      const params = soloSocios ? { tiposCodigos: ['SOCIO'] } : {};
      dispatch(fetchPersonas(params));
    }
  }, [dispatch, personas.length, loading, soloSocios]);

  // Determinar si usar búsqueda asíncrona basado en cantidad de registros
  useEffect(() => {
    if (personas.length >= ASYNC_SEARCH_THRESHOLD) {
      setUseAsyncSearch(true);
    }
  }, [personas.length]);

  // Filtrar personas localmente (para búsqueda simple)
  const filteredPersonas = useMemo(() => {
    if (useAsyncSearch) return [];

    return personas.filter((p) => {
      // Filtrar por tipo si soloSocios está activo
      if (soloSocios) {
        const esSocio = p.tipos?.some((t) => t.tipoPersona?.codigo === 'SOCIO');
        if (!esSocio) return false;
      }
      return true;
    });
  }, [personas, soloSocios, useAsyncSearch]);

  // Convertir a opciones para el Autocomplete
  const personasOptions = useMemo<PersonaOption[]>(() => {
    if (useAsyncSearch) return asyncOptions;

    return filteredPersonas.map((persona) => ({
      id: persona.id,
      label: `${persona.apellido}, ${persona.nombre}${persona.dni ? ` (DNI: ${persona.dni})` : ''}`,
      persona,
    }));
  }, [filteredPersonas, useAsyncSearch, asyncOptions]);

  // Encontrar la opción seleccionada
  const selectedOption = useMemo(() => {
    if (!value) return null;
    const found = personasOptions.find((p) => p.id === value);
    return found || loadedSelectedPersona;
  }, [personasOptions, value, loadedSelectedPersona]);

  // Búsqueda asíncrona con debounce
  const performAsyncSearch = useCallback(
    async (query: string) => {
      if (!query || query.length < 2) {
        setAsyncOptions([]);
        return;
      }

      setAsyncLoading(true);
      try {
        const response = soloSocios
          ? await personasApi.getSocios({ search: query, limit: 50 })
          : await personasApi.search(query, { limit: 50 });

        const options = response.data.map((persona) => ({
          id: persona.id,
          label: `${persona.apellido}, ${persona.nombre}${persona.dni ? ` (DNI: ${persona.dni})` : ''}`,
          persona,
        }));

        setAsyncOptions(options);
      } catch (error) {
        console.error('Error en búsqueda asíncrona:', error);
        setAsyncOptions([]);
      } finally {
        setAsyncLoading(false);
      }
    },
    [soloSocios]
  );

  // Debounce para búsqueda asíncrona
  useEffect(() => {
    if (!useAsyncSearch) return;

    const timer = setTimeout(() => {
      performAsyncSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, useAsyncSearch, performAsyncSearch]);

  // Cargar persona seleccionada si no está en las opciones
  useEffect(() => {
    const loadSelectedPersona = async () => {
      if (!value) {
        setLoadedSelectedPersona(null);
        return;
      }

      // Buscar en opciones actuales
      const found = personasOptions.find((p) => p.id === value);
      if (found) {
        setLoadedSelectedPersona(null); // Ya está en opciones
        return;
      }

      // No está en opciones, cargar individualmente
      try {
        const response = await personasApi.getById(value);
        const persona = response.data;
        setLoadedSelectedPersona({
          id: persona.id,
          label: `${persona.apellido}, ${persona.nombre}${persona.dni ? ` (DNI: ${persona.dni})` : ''}`,
          persona,
        });
      } catch (error) {
        console.error('Error cargando persona seleccionada:', error);
        setLoadedSelectedPersona(null);
      }
    };

    loadSelectedPersona();
  }, [value, personasOptions]);

  // Handler de cambio de input (para búsqueda asíncrona)
  const handleInputChange = (_: any, newInputValue: string) => {
    if (useAsyncSearch) {
      setSearchQuery(newInputValue);
    }
  };

  // Handler de cambio de valor
  const handleChange = (_: any, newValue: PersonaOption | null) => {
    onChange(newValue?.id || null);
  };

  return (
    <Autocomplete<PersonaOption>
      size={size}
      options={personasOptions}
      value={selectedOption}
      onChange={handleChange}
      onInputChange={handleInputChange}
      disabled={disabled}
      loading={useAsyncSearch ? asyncLoading : loading}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          required={required}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {(useAsyncSearch ? asyncLoading : loading) ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <Box>
            <Typography variant="body2">
              {option.persona.apellido}, {option.persona.nombre}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {option.persona.dni ? `DNI: ${option.persona.dni}` : 'Sin DNI'}
              {option.persona.tipos && option.persona.tipos.length > 0
                ? ` - ${option.persona.tipos.map((t) => t.tipoPersona?.codigo || 'Sin tipo').join(', ')}`
                : ''}
            </Typography>
          </Box>
        </li>
      )}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      noOptionsText={
        useAsyncSearch && searchQuery.length < 2
          ? 'Escribe al menos 2 caracteres para buscar'
          : 'No se encontraron personas'
      }
      loadingText="Buscando personas..."
      sx={sx}
    />
  );
};
