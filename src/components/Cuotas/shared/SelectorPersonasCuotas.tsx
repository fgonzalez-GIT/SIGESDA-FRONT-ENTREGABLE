import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  TextField,
  Paper,
  List,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Avatar,
  Chip,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Autocomplete,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { personasApi } from '@/services/personasApi';
import { Persona, TipoPersona } from '@/types/persona.types';
import { useCatalogosPersonas } from '@/hooks/usePersonas';

/**
 * Props del componente SelectorPersonasCuotas
 */
interface SelectorPersonasCuotasProps {
  /** Callback cuando cambian las personas seleccionadas */
  onPersonasChange: (personaIds: number[]) => void;
  /** IDs de personas actualmente seleccionadas */
  personasSeleccionadas: number[];
  /** Filtrar solo socios (por defecto: true) */
  soloSocios?: boolean;
  /** Deshabilitar componente */
  disabled?: boolean;
}

/**
 * Componente de búsqueda y selección múltiple de personas para generación de cuotas
 *
 * Características:
 * - Búsqueda con autocomplete (debounce 300ms, mínimo 2 caracteres)
 * - Filtro de tipos de persona (Socio, No Socio, etc.) con lógica "Todos"
 * - Dropdown con resultados (avatares + badges de rol)
 * - Navegación con teclado (↑↓ Enter Escape)
 * - Tabla de personas seleccionadas con botón eliminar
 * - Contador de seleccionados
 * - Estado vacío con iconografía
 *
 * @example
 * ```tsx
 * <SelectorPersonasCuotas
 *   onPersonasChange={(ids) => setPersonasIds(ids)}
 *   personasSeleccionadas={personasIds}
 *   soloSocios={true}
 * />
 * ```
 */
export const SelectorPersonasCuotas: React.FC<SelectorPersonasCuotasProps> = ({
  onPersonasChange,
  personasSeleccionadas,
  soloSocios = true,
  disabled = false,
}) => {
  // ============================================================================
  // STATE
  // ============================================================================
  const [searchTerm, setSearchTerm] = useState('');
  const [resultados, setResultados] = useState<Persona[]>([]);
  const [personasDetalle, setPersonasDetalle] = useState<Map<number, Persona>>(new Map());
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [tiposFiltro, setTiposFiltro] = useState<TipoPersona[]>([]);

  // ============================================================================
  // REFS
  // ============================================================================
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // HOOKS
  // ============================================================================
  const { catalogos } = useCatalogosPersonas();
  const tiposPersona = catalogos?.tiposPersona || [];

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Búsqueda de personas
   */
  const handleSearch = useCallback(async (query: string) => {
    setLoading(true);

    try {
      const params: any = {
        limit: 10,
      };

      // Filtrar por tipos si están seleccionados
      if (tiposFiltro.length > 0) {
        params.tipos = tiposFiltro.map((t) => t.codigo).join(',');
      } else if (soloSocios) {
        params.tipos = 'SOCIO';
      }

      const response = await personasApi.search(query, params);

      // La respuesta tiene estructura { success, data, meta }
      const personas = response.data || [];

      // Filtrar los ya seleccionados
      const filtrados = personas.filter(
        (p) => !personasSeleccionadas.includes(p.id)
      );

      console.log('Personas encontradas:', personas.length, 'Filtradas:', filtrados.length);

      setResultados(filtrados);
      setShowDropdown(filtrados.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error buscando personas:', error);
      setResultados([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  }, [tiposFiltro, soloSocios, personasSeleccionadas]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Efecto de debounce para búsqueda
   */
  useEffect(() => {
    // Limpiar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // No buscar si el término es muy corto
    if (searchTerm.length < 2) {
      setResultados([]);
      setShowDropdown(false);
      return;
    }

    // Configurar nuevo timer
    debounceTimerRef.current = setTimeout(() => {
      handleSearch(searchTerm);
    }, 300);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm, handleSearch]);

  /**
   * Cargar detalles de personas ya seleccionadas
   */
  useEffect(() => {
    const cargarDetallesPersonas = async () => {
      const idsNuevos = personasSeleccionadas.filter((id) => !personasDetalle.has(id));

      if (idsNuevos.length === 0) return;

      try {
        const promesas = idsNuevos.map((id) => personasApi.getById(id, false));
        const respuestas = await Promise.allSettled(promesas);

        const nuevoMapa = new Map(personasDetalle);
        respuestas.forEach((resp, idx) => {
          if (resp.status === 'fulfilled' && resp.value.success) {
            nuevoMapa.set(idsNuevos[idx], resp.value.data);
          }
        });

        setPersonasDetalle(nuevoMapa);
      } catch (error) {
        console.error('Error cargando detalles de personas:', error);
      }
    };

    cargarDetallesPersonas();
  }, [personasSeleccionadas]);

  // ============================================================================
  // OTHER HANDLERS
  // ============================================================================

  /**
   * Seleccionar una persona
   */
  const handleSelectPersona = (persona: Persona) => {
    if (personasSeleccionadas.includes(persona.id)) return;

    // Agregar a detalle
    const nuevoMapa = new Map(personasDetalle);
    nuevoMapa.set(persona.id, persona);
    setPersonasDetalle(nuevoMapa);

    // Notificar cambio
    onPersonasChange([...personasSeleccionadas, persona.id]);

    // Limpiar búsqueda
    setSearchTerm('');
    setResultados([]);
    setShowDropdown(false);
    setSelectedIndex(-1);

    // Enfocar búsqueda nuevamente
    searchInputRef.current?.focus();
  };

  /**
   * Eliminar una persona seleccionada
   */
  const handleRemovePersona = (personaId: number) => {
    const nuevasSeleccionadas = personasSeleccionadas.filter((id) => id !== personaId);
    onPersonasChange(nuevasSeleccionadas);
  };

  /**
   * Navegación con teclado
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || resultados.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < resultados.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < resultados.length) {
          handleSelectPersona(resultados[selectedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  /**
   * Obtener iniciales para avatar
   */
  const getInitials = (persona: Persona): string => {
    const nombre = persona.nombre?.charAt(0) || '';
    const apellido = persona.apellido?.charAt(0) || '';
    return `${nombre}${apellido}`.toUpperCase();
  };

  /**
   * Obtener color de badge según tipo
   */
  const getTipoColor = (tipo: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' => {
    const colores: Record<string, any> = {
      SOCIO: 'primary',
      NO_SOCIO: 'default',
      DOCENTE: 'success',
      PROVEEDOR: 'warning',
    };
    return colores[tipo] || 'default';
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Box>
      {/* Filtro de Tipos */}
      {!soloSocios && (
        <Box sx={{ mb: 2 }}>
          <Autocomplete
            multiple
            options={tiposPersona}
            getOptionLabel={(option) => option.nombre}
            value={tiposFiltro}
            onChange={(_, newValue) => setTiposFiltro(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Filtrar por Tipo"
                placeholder={tiposFiltro.length === 0 ? "Todos los tipos" : ""}
                variant="outlined"
                size="small"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    key={key}
                    label={option.nombre}
                    size="small"
                    color={getTipoColor(option.codigo)}
                    {...tagProps}
                  />
                );
              })
            }
            disabled={disabled}
          />
        </Box>
      )}

      {/* Buscador */}
      <Box sx={{ position: 'relative', mb: 3 }}>
        <TextField
          inputRef={searchInputRef}
          fullWidth
          placeholder={soloSocios ? "Buscar socio (nombre, apellido, DNI)..." : "Buscar persona..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          slotProps={{
            input: {
              startAdornment: loading ? (
                <CircularProgress size={20} sx={{ mr: 1 }} />
              ) : (
                <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              ),
            }
          }}
          helperText="Mínimo 2 caracteres para buscar"
        />

        {/* Dropdown de Resultados */}
        {showDropdown && (
          <Paper
            elevation={8}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1300, // Mayor que el z-index del modal (1200)
              mt: 0.5,
              maxHeight: 300,
              overflow: 'auto',
              bgcolor: 'background.paper',
            }}
          >
            <List>
              {resultados.map((persona, index) => (
                <ListItemButton
                  key={persona.id}
                  selected={index === selectedIndex}
                  onClick={() => handleSelectPersona(persona)}
                  sx={{
                    borderLeft: index === selectedIndex ? 4 : 0,
                    borderColor: 'primary.main',
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {getInitials(persona)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">
                          {persona.apellido}, {persona.nombre}
                        </Typography>
                        {persona.tipos?.map((tipo) => (
                          <Chip
                            key={tipo.id}
                            label={tipo.tipoPersona?.nombre || 'N/A'}
                            size="small"
                            color={getTipoColor(tipo.tipoPersona?.codigo || '')}
                          />
                        ))}
                      </Box>
                    }
                    secondary={`DNI: ${persona.dni || 'N/A'}`}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        )}
      </Box>

      {/* Contador */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Personas seleccionadas: <strong>{personasSeleccionadas.length}</strong>
        </Typography>
      </Box>

      {/* Tabla de Seleccionados */}
      {personasSeleccionadas.length > 0 ? (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={60}></TableCell>
                <TableCell>Apellido y Nombre</TableCell>
                <TableCell>DNI</TableCell>
                <TableCell>Tipos</TableCell>
                <TableCell width={80} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {personasSeleccionadas.map((id) => {
                const persona = personasDetalle.get(id);
                if (!persona) {
                  return (
                    <TableRow key={id}>
                      <TableCell colSpan={5}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={16} />
                          <Typography variant="body2" color="text.secondary">
                            Cargando...
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow key={id} hover>
                    <TableCell>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                        {getInitials(persona)}
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {persona.apellido}, {persona.nombre}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {persona.dni || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {persona.tipos?.map((tipo) => (
                          <Chip
                            key={tipo.id}
                            label={tipo.tipoPersona?.nombre || 'N/A'}
                            size="small"
                            color={getTipoColor(tipo.tipoPersona?.codigo || '')}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemovePersona(id)}
                        disabled={disabled}
                        aria-label={`Eliminar ${persona.apellido}, ${persona.nombre}`}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        // Estado vacío
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: 'background.default',
          }}
        >
          <PersonAddIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No hay personas seleccionadas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {soloSocios
              ? 'Busca y selecciona socios para generar sus cuotas'
              : 'Busca y selecciona personas para generar sus cuotas'
            }
          </Typography>
        </Paper>
      )}

      {/* Advertencia de validación */}
      {personasSeleccionadas.length > 100 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Has seleccionado {personasSeleccionadas.length} personas.
          La generación masiva puede tomar varios minutos.
        </Alert>
      )}
    </Box>
  );
};
