import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Stack,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  TextField,
  Zoom,
  ToggleButtonGroup,
  ToggleButton,
  Tabs,
  Tab,
  Paper,
  Grid,
  Snackbar,
  TablePagination,
} from '@mui/material';
import {
  Add,
  FamilyRestroom,
  People,
  AccountTree,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Search,
  Timeline,
  Groups,
  LocalOffer,
  TableChart,
  ViewModule,
  ViewList,
  BarChart,
  CheckCircle,
  AccountBalance,
  Phone,
  ExitToApp,
  Percent,
  TrendingUp,
} from '@mui/icons-material';
import { SeccionPaginaTitulo } from '@/components/common/SeccionPaginaTitulo';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { TiposBadges } from '@/components/personas/v2/tipos';

// Límite máximo para "Ver Todos" en familiares (backend max=100)
const MAX_FAMILIARES_LIMIT = 100;
import {
  fetchRelaciones,
  fetchPersonasConFamiliares,
  fetchGrupos,
  fetchAllRelaciones,
  fetchEstadisticasParentesco,
  eliminarRelacion,
  crearRelacion,
  actualizarRelacion,
  eliminarGrupo,
  setFilters,
  clearFilters,
  clearError,
  clearGrupoWarnings, // NUEVO (v2026-02-26)
  type FamiliaresFilters,
  type PersonaConFamiliares,
  type RelacionFamiliar,
  type GrupoFamiliar,
  type CrearRelacionRequest,
} from '../../store/slices/familiaresSlice';
import { showNotification, hideNotification } from '@/store/slices/uiSlice';
import { fetchPersonas } from '../../store/slices/personasSlice';
import { RelacionFamiliarDialog } from '../../components/forms/RelacionFamiliarDialog';
import GrupoFamiliarDialog from '../../components/forms/GrupoFamiliarDialog';
import GestionMiembrosDialog from '../../components/forms/GestionMiembrosDialog';
import FamiliaresTable from '../../components/familiares/FamiliaresTable';
import FamiliarFilters, { type FiltrosRelaciones } from '../../components/familiares/FamiliarFilters';
import FamiliaresStats from '../../components/familiares/FamiliaresStats';
import { ConfirmDeleteDialog } from '../../components/common/ConfirmDeleteDialog';

interface PersonaNode {
  id: number;
  nombre: string;
  apellido: string;
  tipo: string;
  level: number;
  x: number;
  y: number;
  relations: Array<{
    targetId: number;
    tipo: string;
    color: string;
  }>;
}

const FamiliaresPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    relaciones,
    personasConFamiliares,
    grupos,
    loading,
    error,
    estadisticas,
    grupoWarnings, // NUEVO (v2026-02-26)
  } = useAppSelector((state) => state.familiares);
  const { personas } = useAppSelector((state) => state.personas);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<PersonaConFamiliares | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'tree' | 'groups'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuPersona, setMenuPersona] = useState<PersonaConFamiliares | null>(null);

  // Tab principal (Vista General | Estadísticas)
  const [mainTab, setMainTab] = useState(0);

  // FASE 2: Nuevos estados para tabla
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [verTodos, setVerTodos] = useState(false);
  // Iniciar sin filtros para mostrar todos los grupos y relaciones
  const [filtrosGlobales, setFiltrosGlobales] = useState<FiltrosRelaciones>({});
  const [relacionToEdit, setRelacionToEdit] = useState<RelacionFamiliar | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [relacionToDelete, setRelacionToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Estados para gestión de grupos familiares
  const [grupoDialogOpen, setGrupoDialogOpen] = useState(false);
  const [grupoToEdit, setGrupoToEdit] = useState<GrupoFamiliar | null>(null);
  const [miembrosDialogOpen, setMiembrosDialogOpen] = useState(false);
  const [grupoForMiembros, setGrupoForMiembros] = useState<GrupoFamiliar | null>(null);
  const [grupoToDelete, setGrupoToDelete] = useState<GrupoFamiliar | null>(null);
  const [deleteGrupoDialogOpen, setDeleteGrupoDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchPersonas({}));

    if (viewMode === 'table') {
      // FASE 2: Cargar relaciones completas con paginación
      dispatch(fetchAllRelaciones({
        ...(verTodos ? { limit: MAX_FAMILIARES_LIMIT } : { page: page + 1, limit: rowsPerPage }),
        soloActivos: filtrosGlobales.soloActivos,
        socioId: filtrosGlobales.personaId,
        parentesco: filtrosGlobales.tipoRelacion,
      }));
      dispatch(fetchEstadisticasParentesco());
    } else {
      // Modo cards/tree/groups: usar funciones originales con los filtros aplicados
      const filtersForPersonas = {
        soloActivos: filtrosGlobales.soloActivos,
        socioId: filtrosGlobales.personaId,
        parentesco: filtrosGlobales.tipoRelacion,
      };

      // Mapear FiltrosRelaciones a FamiliaresFilters
      const familiaresFilters: FamiliaresFilters = {
        personaId: filtrosGlobales.personaId,
        tipoRelacion: filtrosGlobales.tipoRelacion as any, // Cast necesario por incompatibilidad de tipos
        responsableFinanciero: filtrosGlobales.responsableFinanciero,
        contactoEmergencia: filtrosGlobales.contactoEmergencia,
        activo: filtrosGlobales.soloActivos,
      };

      dispatch(fetchRelaciones(familiaresFilters));
      dispatch(fetchPersonasConFamiliares(filtersForPersonas));
      dispatch(fetchGrupos());
    }
  }, [dispatch, viewMode, page, rowsPerPage, filtrosGlobales, verTodos]);

  const handlePersonaSelect = (persona: PersonaConFamiliares) => {
    setSelectedPersona(persona);
    setViewMode('tree');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, persona: PersonaConFamiliares) => {
    setAnchorEl(event.currentTarget);
    setMenuPersona(persona);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuPersona(null);
  };

  // FASE 2: Handlers para tabla
  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVerTodos(false);
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleToggleVerTodos = () => {
    setVerTodos(prev => !prev);
    setPage(0);
  };

  const handleFiltrosChange = (nuevosFiltros: FiltrosRelaciones) => {
    setFiltrosGlobales(nuevosFiltros);
    setPage(0); // Reset a primera página cuando cambian filtros
  };

  const handleClearFiltros = () => {
    setFiltrosGlobales({});
    setVerTodos(false);
    setRowsPerPage(10);
    setPage(0);
  };

  const handleEditRelacion = (relacion: any) => {
    dispatch(clearError()); // Limpiar error previo al abrir
    dispatch(hideNotification()); // Cerrar Snackbar previo
    setRelacionToEdit(relacion);
    setDialogOpen(true);
  };

  const handleDeleteRelacion = (id: number) => {
    setRelacionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!relacionToDelete) return;

    setDeleting(true);
    try {
      await dispatch(eliminarRelacion(relacionToDelete)).unwrap();

      // Recargar datos
      if (viewMode === 'table') {
        await dispatch(fetchAllRelaciones({
          ...(verTodos ? { limit: MAX_FAMILIARES_LIMIT } : { page: page + 1, limit: rowsPerPage }),
          soloActivos: filtrosGlobales.soloActivos,
          socioId: filtrosGlobales.personaId,
          parentesco: filtrosGlobales.tipoRelacion,
        }));
      }
    } catch (error) {
      console.error('Error al eliminar relación:', error);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setRelacionToDelete(null);
    }
  };

  const handleSubmitRelacion = async (request: CrearRelacionRequest) => {
    try {
      if (relacionToEdit) {
        // Modo edición
        await dispatch(actualizarRelacion({
          id: relacionToEdit.id,
          relacion: request
        })).unwrap();
      } else {
        // Modo creación
        await dispatch(crearRelacion(request)).unwrap();
      }

      // Cerrar diálogo y recargar datos
      handleDialogSuccess();
    } catch (error: any) {
      console.error('Error al guardar relación:', error);

      // Mostrar notificación global (Snackbar)
      dispatch(showNotification({
        message: error.message || 'Error al guardar la relación familiar',
        severity: 'error'
      }));

      // Re-lanzar error para que el modal lo capture y muestre el Alert interno
      throw error;
    }
  };

  const handleDialogSuccess = () => {
    setDialogOpen(false);
    setRelacionToEdit(null);
    dispatch(clearError()); // Limpiar error previo
    dispatch(hideNotification()); // Cerrar Snackbar previo

    // Recargar datos según modo
    if (viewMode === 'table') {
      dispatch(fetchAllRelaciones({
        ...(verTodos ? { limit: MAX_FAMILIARES_LIMIT } : { page: page + 1, limit: rowsPerPage }),
        soloActivos: filtrosGlobales.soloActivos,
        socioId: filtrosGlobales.personaId,
        parentesco: filtrosGlobales.tipoRelacion,
      }));
    } else {
      const filtersForPersonas = {
        soloActivos: filtrosGlobales.soloActivos,
        socioId: filtrosGlobales.personaId,
        parentesco: filtrosGlobales.tipoRelacion,
      };

      // Mapear FiltrosRelaciones a FamiliaresFilters
      const familiaresFilters: FamiliaresFilters = {
        personaId: filtrosGlobales.personaId,
        tipoRelacion: filtrosGlobales.tipoRelacion as any,
        responsableFinanciero: filtrosGlobales.responsableFinanciero,
        contactoEmergencia: filtrosGlobales.contactoEmergencia,
        activo: filtrosGlobales.soloActivos,
      };

      dispatch(fetchRelaciones(familiaresFilters));
      dispatch(fetchPersonasConFamiliares(filtersForPersonas));
    }
  };

  // ============================================================================
  // HANDLERS PARA GESTIÓN DE GRUPOS FAMILIARES
  // ============================================================================

  const handleCreateGrupo = () => {
    setGrupoToEdit(null);
    setGrupoDialogOpen(true);
  };

  const handleEditGrupo = (grupo: GrupoFamiliar) => {
    setGrupoToEdit(grupo);
    setGrupoDialogOpen(true);
  };

  const handleDeleteGrupo = (grupo: GrupoFamiliar) => {
    setGrupoToDelete(grupo);
    setDeleteGrupoDialogOpen(true);
  };

  const confirmDeleteGrupo = async () => {
    if (!grupoToDelete) return;

    try {
      await dispatch(eliminarGrupo(grupoToDelete.id)).unwrap();

      dispatch(showNotification({
        message: `Grupo "${grupoToDelete.nombre}" eliminado exitosamente`,
        severity: 'success'
      }));

      // Recargar grupos
      dispatch(fetchGrupos());
    } catch (error: any) {
      dispatch(showNotification({
        message: error.message || 'Error al eliminar el grupo',
        severity: 'error'
      }));
    } finally {
      setDeleteGrupoDialogOpen(false);
      setGrupoToDelete(null);
    }
  };

  const handleManageMembers = (grupo: GrupoFamiliar) => {
    setGrupoForMiembros(grupo);
    setMiembrosDialogOpen(true);
  };

  const handleGrupoDialogSuccess = () => {
    setGrupoDialogOpen(false);
    setGrupoToEdit(null);

    dispatch(showNotification({
      message: grupoToEdit ? 'Grupo actualizado exitosamente' : 'Grupo creado exitosamente',
      severity: 'success'
    }));

    // Recargar grupos
    dispatch(fetchGrupos());
  };

  const handleMiembrosDialogSuccess = () => {
    setMiembrosDialogOpen(false);
    setGrupoForMiembros(null);

    dispatch(showNotification({
      message: 'Miembros actualizados exitosamente',
      severity: 'success'
    }));

    // Recargar grupos
    dispatch(fetchGrupos());
  };

  // Calcular estadísticas para el panel de estadísticas
  // Para conteos globales usa estadisticas de Redux (totalRelaciones, totalGrupos, personasConFamiliares)
  // Para distribución por permisos/descuentos usa los datos de la página actual como fallback
  // Calcular número de filtros activos
  const filtrosActivos = Object.entries(filtrosGlobales).filter(([key, value]) => {
    // soloActivos es true por defecto, no cuenta como filtro activo
    if (key === 'soloActivos') return false;
    return value !== undefined && value !== '' && value !== false;
  }).length;

  // Helper: Verificar si una relación cumple con los filtros globales
  const cumpleFiltros = (relacion: any, familiarId: number) => {
    return (
      (!filtrosGlobales.tipoRelacion || relacion.tipoRelacion === filtrosGlobales.tipoRelacion) &&
      (!filtrosGlobales.personaId || relacion.personaId === filtrosGlobales.personaId || familiarId === filtrosGlobales.personaId) &&
      (!filtrosGlobales.responsableFinanciero || relacion.responsableFinanciero) &&
      (!filtrosGlobales.contactoEmergencia || relacion.contactoEmergencia) &&
      (!filtrosGlobales.autorizadoRetiro || relacion.autorizadoRetiro) &&
      (!filtrosGlobales.conDescuento || (relacion.porcentajeDescuento && relacion.porcentajeDescuento > 0)) &&
      (!filtrosGlobales.soloActivos || relacion.activo)
    );
  };

  const calcularEstadisticas = () => {
    // Conteos sobre página actual (para permisos y descuentos - no hay endpoint global para estos)
    const totalActivas = relaciones.filter(r => r.activo).length;
    const responsablesFinancieros = relaciones.filter(r => r.responsableFinanciero).length;
    const contactosEmergencia = relaciones.filter(r => r.contactoEmergencia).length;
    const autorizadosRetiro = relaciones.filter(r => r.autorizadoRetiro).length;
    const relacionesConDescuento = relaciones.filter(r => r.porcentajeDescuento && r.porcentajeDescuento > 0).length;

    const descuentos = relaciones
      .filter(r => r.porcentajeDescuento && r.porcentajeDescuento > 0)
      .map(r => r.porcentajeDescuento || 0);

    const promedioDescuento = descuentos.length > 0
      ? descuentos.reduce((sum, d) => sum + d, 0) / descuentos.length
      : 0;

    return {
      // Totales globales desde Redux (correctos, no dependen de paginación)
      totalRelaciones: estadisticas.totalRelaciones,
      gruposFamiliares: estadisticas.totalGrupos,
      personasConFamiliares: estadisticas.personasConFamiliares,
      // Conteos de permisos desde datos disponibles
      relacionesActivas: totalActivas,
      responsablesFinancieros,
      contactosEmergencia,
      autorizadosRetiro,
      relacionesConDescuento,
      promedioDescuento,
    };
  };

  const buildFamilyTree = (persona: PersonaConFamiliares): PersonaNode[] => {
    const nodes: PersonaNode[] = [];
    const visited = new Set<number>();
    const levels = new Map<number, number>();

    const addNode = (p: PersonaConFamiliares, level: number, x: number) => {
      if (visited.has(p.id)) return;

      visited.add(p.id);
      levels.set(p.id, level);

      // Filtrar relaciones según filtros globales para el nodo actual
      const familiaresFiltradosNodo = p.familiares.filter(f => cumpleFiltros(f.relacion, f.familiar.id));

      const relations = familiaresFiltradosNodo.map(f => ({
        targetId: f.familiar.id,
        tipo: f.relacion.tipoRelacion,
        color: getRelationColor(f.relacion.tipoRelacion),
      }));

      // Obtener primer tipo activo para mostrar en el árbol
      const tipoActivo = personas.find(pers => pers.id === p.id)?.tipos?.find(t => t.activo);
      const tipoLabel = tipoActivo?.tipoPersona?.nombre || 'Sin tipo';

      nodes.push({
        id: p.id,
        nombre: p.nombre,
        apellido: p.apellido,
        tipo: tipoLabel,
        level,
        x,
        y: level * 120 + 50,
        relations,
      });

      // Filtrar familiares según filtros globales antes de agregar
      const familiaresFiltrados = p.familiares.filter(f => cumpleFiltros(f.relacion, f.familiar.id));

      // Agregar familiares filtrados en niveles apropiados
      familiaresFiltrados.forEach((familiar, index) => {
        const familiarPersona = personasConFamiliares.find(pc => pc.id === familiar.familiar.id);
        if (familiarPersona && !visited.has(familiarPersona.id)) {
          const relationLevel = getRelationLevel(familiar.relacion.tipoRelacion, level);
          addNode(familiarPersona, relationLevel, x + (index - familiaresFiltrados.length / 2) * 200);
        }
      });
    };

    addNode(persona, 2, 400);
    return nodes;
  };

  const getRelationLevel = (tipoRelacion: string, currentLevel: number): number => {
    const upRelations = ['padre', 'madre', 'abuelo', 'abuela'];
    const downRelations = ['hijo', 'hija', 'nieto', 'nieta'];
    const sameRelations = ['esposo', 'esposa', 'hermano', 'hermana'];

    if (upRelations.includes(tipoRelacion)) return currentLevel - 1;
    if (downRelations.includes(tipoRelacion)) return currentLevel + 1;
    if (sameRelations.includes(tipoRelacion)) return currentLevel;
    return currentLevel;
  };

  const getRelationColor = (tipoRelacion: string): string => {
    const colors: { [key: string]: string } = {
      'padre': '#1976d2',
      'madre': '#d32f2f',
      'hijo': '#2e7d32',
      'hija': '#7b1fa2',
      'esposo': '#ed6c02',
      'esposa': '#ed6c02',
      'hermano': '#0288d1',
      'hermana': '#0288d1',
      'abuelo': '#5d4037',
      'abuela': '#5d4037',
      'tio': '#455a64',
      'tia': '#455a64',
      'primo': '#795548',
      'prima': '#795548',
    };
    return colors[tipoRelacion] || '#616161';
  };

  // Función removida: getPersonTypeColor ya no es necesaria
  // El componente TiposBadges maneja los colores automáticamente

  const filteredPersonas = personasConFamiliares.filter(persona => {
    // Búsqueda por texto
    const searchMatch = searchTerm === '' ||
      persona.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      persona.apellido.toLowerCase().includes(searchTerm.toLowerCase());

    // Verificar si la persona tiene al menos un familiar que cumpla los filtros
    const tieneFamiliaresFiltrados = persona.familiares.some(f => cumpleFiltros(f.relacion, f.familiar.id));

    return searchMatch && tieneFamiliaresFiltrados;
  });

  const renderPersonCard = (persona: PersonaConFamiliares) => {
    // Buscar la persona completa en Redux para obtener tipos
    const personaCompleta = personas.find(p => p.id === persona.id);

    return (
    <Zoom in={true} key={persona.id}>
      <Card
        sx={{
          minHeight: 300,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4,
          }
        }}
        onClick={() => handlePersonaSelect(persona)}
      >
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: getRelationColor('padre') }}>
                {persona.nombre[0]}{persona.apellido[0]}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {persona.nombre} {persona.apellido}
                </Typography>
                {personaCompleta?.tipos && personaCompleta.tipos.length > 0 && (
                  <TiposBadges tipos={personaCompleta.tipos} max={2} size="small" />
                )}
              </Box>
            </Box>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleMenuOpen(e, persona);
              }}
            >
              <MoreVert />
            </IconButton>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Relaciones Familiares ({persona.familiares.length})
          </Typography>

          <Stack spacing={1} sx={{ maxHeight: 120, overflow: 'auto' }}>
            {persona.familiares.slice(0, 3).map((familiar) => (
              <Box
                key={familiar.familiar.id}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  p: 1,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  border: `2px solid ${getRelationColor(familiar.relacion.tipoRelacion)}20`
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {familiar.familiar.nombre} {familiar.familiar.apellido}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {familiar.relacion.tipoRelacion}
                  </Typography>
                </Box>
                <Box display="flex" gap={0.5}>
                  {familiar.relacion.responsableFinanciero && (
                    <Chip label="RF" size="small" color="warning" />
                  )}
                  {familiar.relacion.contactoEmergencia && (
                    <Chip label="CE" size="small" color="error" />
                  )}
                  {familiar.relacion.autorizadoRetiro && (
                    <Chip label="AR" size="small" color="info" />
                  )}
                </Box>
              </Box>
            ))}
            {persona.familiares.length > 3 && (
              <Typography variant="caption" color="text.secondary" textAlign="center">
                +{persona.familiares.length - 3} relaciones más
              </Typography>
            )}
          </Stack>

          {persona.grupoFamiliar && (
            <Box mt={2}>
              <Divider sx={{ mb: 1 }} />
              <Box display="flex" alignItems="center" gap={1}>
                <Groups fontSize="small" color="primary" />
                <Typography variant="body2" color="primary">
                  {persona.grupoFamiliar.nombre}
                </Typography>
                <Chip
                  label={`${persona.grupoFamiliar.descuentoGrupal}% desc.`}
                  size="small"
                  color="success"
                  icon={<LocalOffer />}
                />
              </Box>
            </Box>
          )}
        </CardContent>

        <CardActions>
          <Button
            size="small"
            startIcon={<AccountTree />}
            onClick={(e) => {
              e.stopPropagation();
              handlePersonaSelect(persona);
            }}
          >
            Ver Árbol
          </Button>
          <Button
            size="small"
            startIcon={<Add />}
            onClick={(e) => {
              e.stopPropagation();
              dispatch(clearError()); // Limpiar error previo al abrir
              dispatch(hideNotification()); // Cerrar Snackbar previo
              setDialogOpen(true);
            }}
          >
            Agregar Relación
          </Button>
        </CardActions>
      </Card>
    </Zoom>
    );
  };

  const renderFamilyTree = () => {
    if (!selectedPersona) return null;

    const nodes = buildFamilyTree(selectedPersona);
    const svgWidth = 800;
    const svgHeight = 600;

    return (
      <Card sx={{ p: 2 }}>
        <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Árbol Genealógico: {selectedPersona.nombre} {selectedPersona.apellido}
          </Typography>
          <Button
            onClick={() => setSelectedPersona(null)}
            variant="outlined"
            size="small"
          >
            Volver a Lista
          </Button>
        </Box>

        <Box
          sx={{
            width: '100%',
            height: svgHeight,
            overflow: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            position: 'relative'
          }}
        >
          <svg width={svgWidth} height={svgHeight} style={{ minWidth: svgWidth }}>
            {/* Líneas de conexión */}
            {nodes.map(node =>
              node.relations.map(relation => {
                const targetNode = nodes.find(n => n.id === relation.targetId);
                if (!targetNode) return null;

                return (
                  <line
                    key={`${node.id}-${relation.targetId}`}
                    x1={node.x}
                    y1={node.y + 30}
                    x2={targetNode.x}
                    y2={targetNode.y + 30}
                    stroke={relation.color}
                    strokeWidth="2"
                    opacity="0.7"
                  />
                );
              })
            )}

            {/* Nodos de personas */}
            {nodes.map(node => (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y + 30}
                  r="25"
                  fill={getRelationColor('padre')}
                  opacity="0.8"
                />
                <text
                  x={node.x}
                  y={node.y + 35}
                  textAnchor="middle"
                  fontSize="10"
                  fill="white"
                  fontWeight="bold"
                >
                  {node.nombre[0]}{node.apellido[0]}
                </text>
                <text
                  x={node.x}
                  y={node.y + 75}
                  textAnchor="middle"
                  fontSize="12"
                  fill="black"
                >
                  {node.nombre}
                </text>
                <text
                  x={node.x}
                  y={node.y + 90}
                  textAnchor="middle"
                  fontSize="10"
                  fill="gray"
                >
                  {node.tipo}
                </text>
              </g>
            ))}
          </svg>
        </Box>
      </Card>
    );
  };

  const renderGroupsView = () => {
    // Mostrar todos los grupos sin filtrar por relaciones familiares
    // Los grupos son entidades independientes y no deben depender de las relaciones de sus miembros
    const gruposFiltrados = grupos;

    return (
      <Stack spacing={3}>
        {gruposFiltrados.length === 0 && (
          <Alert severity="info">
            No se encontraron grupos familiares que cumplan con los filtros aplicados.
          </Alert>
        )}
        {gruposFiltrados.map(grupo => {
          // Mostrar todos los miembros del grupo
          const miembrosFiltrados = grupo.miembros;

          return (
            <Card key={grupo.id}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {grupo.nombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {grupo.descripcion}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${grupo.descuentoGrupal}% descuento`}
                    color="success"
                    icon={<LocalOffer />}
                  />
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Miembros ({miembrosFiltrados.length}{miembrosFiltrados.length !== grupo.miembros.length ? ` de ${grupo.miembros.length}` : ''})
                  <Typography variant="caption" color="text.secondary" component="span" sx={{ ml: 1 }}>
                    (incluye referente)
                  </Typography>
                </Typography>

                <Box display="flex" gap={2} flexWrap="wrap">
                  {miembrosFiltrados.map(miembroId => {
                    // Buscar el miembro en el array de personas (no en personasConFamiliares)
                    const miembro = personas.find(p => p.id === miembroId);
                    if (!miembro) return null;

                    const esReferente = miembro.id === grupo.personaReferente;

                    return (
                      <Box
                        key={miembro.id}
                        minWidth={250}
                        flex={1}
                        display="flex"
                        alignItems="center"
                        gap={2}
                        sx={{
                          p: 1.5,
                          bgcolor: esReferente ? 'primary.50' : 'grey.50',
                          borderRadius: 1,
                          border: esReferente ? '2px solid' : '1px solid',
                          borderColor: esReferente ? 'primary.main' : 'divider'
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: esReferente ? 'primary.main' : 'grey.400',
                            width: 32,
                            height: 32
                          }}
                        >
                          {miembro.nombre[0]}
                        </Avatar>
                        <Box flex={1}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" fontWeight={esReferente ? 'bold' : 'normal'}>
                              {miembro.nombre} {miembro.apellido}
                            </Typography>
                            {esReferente && (
                              <Chip label="Referente" size="small" color="primary" />
                            )}
                          </Box>
                          {miembro.tipos && miembro.tipos.length > 0 && (
                            <TiposBadges tipos={miembro.tipos} max={2} size="small" />
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>

                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Configuración
                  </Typography>
                  <Box display="flex" gap={2} flexWrap="wrap">
                    <Chip
                      label={grupo.configuracion.facturacionConjunta ? "Facturación conjunta" : "Facturación individual"}
                      size="small"
                      color={grupo.configuracion.facturacionConjunta ? "primary" : "default"}
                    />
                    <Chip
                      label={grupo.configuracion.descuentoProgresivo ? "Descuento progresivo" : "Descuento fijo"}
                      size="small"
                      color={grupo.configuracion.descuentoProgresivo ? "secondary" : "default"}
                    />
                    {grupo.configuracion.limiteCuotas > 0 && (
                      <Chip
                        label={`Límite: ${grupo.configuracion.limiteCuotas} cuotas`}
                        size="small"
                        color="warning"
                      />
                    )}
                  </Box>
                </Box>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                <Button
                  size="small"
                  startIcon={<Edit />}
                  onClick={() => handleEditGrupo(grupo)}
                >
                  Editar
                </Button>
                <Button
                  size="small"
                  startIcon={<People />}
                  onClick={() => handleManageMembers(grupo)}
                  color="primary"
                >
                  Gestionar Miembros
                </Button>
                <Button
                  size="small"
                  startIcon={<Delete />}
                  onClick={() => handleDeleteGrupo(grupo)}
                  color="error"
                >
                  Eliminar
                </Button>
              </CardActions>
            </Card>
          );
        })}
      </Stack>
    );
  };

  return (
    <Box>
      {/* Header */}
      <SeccionPaginaTitulo
        titulo="Gestión de Familiares"
        subtitulo="Administra las relaciones familiares y grupos familiares del sistema"
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Familiares' },
        ]}
        actions={
          viewMode === 'groups' ? (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                dispatch(clearError());
                dispatch(hideNotification());
                handleCreateGrupo();
              }}
            >
              Crear Grupo
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                dispatch(clearError());
                dispatch(hideNotification());
                setDialogOpen(true);
              }}
            >
              Nueva Relación
            </Button>
          )
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabs Principal + Modo de Vista */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tabs value={mainTab} onChange={(_, newValue) => setMainTab(newValue)}>
          <Tab icon={<ViewList />} label="Vista General" iconPosition="start" />
          <Tab icon={<BarChart />} label="Estadísticas" iconPosition="start" />
        </Tabs>
        <Box display="flex" gap={2} alignItems="center" sx={{ pr: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" color="text.secondary">
              Modo de vista:
            </Typography>
            {filtrosActivos > 0 && (
              <Chip
                size="small"
                label={`${filtrosActivos} filtro${filtrosActivos > 1 ? 's' : ''} activo${filtrosActivos > 1 ? 's' : ''}`}
                color="primary"
                sx={{ height: 20 }}
              />
            )}
          </Box>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="table">
              <TableChart sx={{ mr: 0.5 }} fontSize="small" />
              Tabla
            </ToggleButton>
            <ToggleButton value="cards">
              <ViewModule sx={{ mr: 0.5 }} fontSize="small" />
              Tarjetas
            </ToggleButton>
            <ToggleButton value="tree">
              <AccountTree sx={{ mr: 0.5 }} fontSize="small" />
              Árbol
            </ToggleButton>
            <ToggleButton value="groups">
              <Groups sx={{ mr: 0.5 }} fontSize="small" />
              Grupos
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* TAB 0: Vista General - Filtros + Contenido */}
      {mainTab === 0 && (
        <>
          {/* Filtros globales (visibles en todos los modos de vista) */}
          <FamiliarFilters
            filtros={filtrosGlobales}
            personas={personas}
            onFiltrosChange={handleFiltrosChange}
            onClearFiltros={handleClearFiltros}
          />

          {/* Contenido principal */}
          {viewMode === 'table' ? (
            // FASE 2: Nueva vista de tabla bidireccional
            <>
              <FamiliaresTable
                relaciones={relaciones}
                personas={personas}
                loading={loading}
                onEdit={handleEditRelacion}
                onDelete={handleDeleteRelacion}
              />

              {/* Paginación externa (igual que en PersonasPage) */}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                flexWrap="wrap"
                gap={1}
                mt={2}
              >
                {/* Botón "Ver Todos / Ver Paginado" */}
                <Button
                  variant={verTodos ? 'contained' : 'outlined'}
                  size="small"
                  color="secondary"
                  onClick={handleToggleVerTodos}
                  startIcon={<ViewList />}
                >
                  {verTodos
                    ? `Mostrando todos (${estadisticas.totalRelaciones} relaciones)`
                    : 'Ver todos'}
                </Button>

                {/* TablePagination — oculto en modo verTodos */}
                {!verTodos && (
                  <TablePagination
                    component="div"
                    count={estadisticas.totalRelaciones}
                    page={page}
                    onPageChange={handlePageChange}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    rowsPerPageOptions={[10, 20, 50, 100]}
                    labelRowsPerPage="Filas por página:"
                    labelDisplayedRows={({ from, to, count }) =>
                      `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                    }
                  />
                )}
              </Box>
            </>
          ) : viewMode === 'groups' ? (
            renderGroupsView()
          ) : selectedPersona && viewMode === 'tree' ? (
            renderFamilyTree()
          ) : (
            <>
              {filteredPersonas.length === 0 && filtrosActivos > 0 && (
                <Alert
                  severity="info"
                  action={
                    <Button size="small" onClick={handleClearFiltros} color="inherit">
                      Limpiar Filtros
                    </Button>
                  }
                  sx={{ mb: 2 }}
                >
                  No se encontraron personas con relaciones familiares que cumplan los filtros aplicados.
                </Alert>
              )}
              <Box display="flex" gap={3} flexWrap="wrap">
                {filteredPersonas.map(persona => (
                  <Box key={persona.id} minWidth={350} flex={1} maxWidth={450}>
                    {renderPersonCard(persona)}
                  </Box>
                ))}
              </Box>
            </>
          )}
        </>
      )}

      {/* TAB 1: Panel de Estadísticas (Pantalla Completa) */}
      {mainTab === 1 && (
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
          <Stack spacing={4}>
            {/* BLOQUE 1: Estadísticas Generales */}
            <Box>
              <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <People /> Estadísticas de Relaciones Familiares
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <People color="primary" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      {calcularEstadisticas().totalRelaciones}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Total Relaciones
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <CheckCircle color="success" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {calcularEstadisticas().relacionesActivas}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Activas
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <Groups color="info" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="info.main">
                      {calcularEstadisticas().gruposFamiliares}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Grupos Familiares
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <People color="secondary" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="secondary.main">
                      {calcularEstadisticas().personasConFamiliares}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Personas con Familiares
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            {/* BLOQUE 2: Permisos y Responsabilidades */}
            <Box>
              <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalance /> Permisos y Responsabilidades
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <AccountBalance color="primary" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      {calcularEstadisticas().responsablesFinancieros}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Responsables Financieros
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <Phone color="error" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="error.main">
                      {calcularEstadisticas().contactosEmergencia}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Contactos de Emergencia
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <ExitToApp color="warning" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                      {calcularEstadisticas().autorizadosRetiro}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Autorizados para Retiro
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            {/* BLOQUE 3: Descuentos */}
            <Box>
              <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Percent /> Descuentos Familiares
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <Percent color="success" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {calcularEstadisticas().relacionesConDescuento}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Con Descuento
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <TrendingUp color="info" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="info.main">
                      {calcularEstadisticas().promedioDescuento.toFixed(1)}%
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Descuento Promedio
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* Menú contextual */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (menuPersona) handlePersonaSelect(menuPersona);
          handleMenuClose();
        }}>
          <AccountTree sx={{ mr: 1 }} />
          Ver Árbol Genealógico
        </MenuItem>
        <MenuItem onClick={() => {
          dispatch(clearError()); // Limpiar error previo al abrir
          dispatch(hideNotification()); // Cerrar Snackbar previo
          setDialogOpen(true);
          handleMenuClose();
        }}>
          <Add sx={{ mr: 1 }} />
          Agregar Relación
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Edit sx={{ mr: 1 }} />
          Editar Relaciones
        </MenuItem>
      </Menu>

      {/* Dialog de relación familiar */}
      <RelacionFamiliarDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setRelacionToEdit(null);
          dispatch(clearError()); // Limpiar error de Redux al cerrar
          dispatch(hideNotification()); // Cerrar Snackbar al cerrar
        }}
        onSubmit={handleSubmitRelacion}
        relacion={relacionToEdit}
        loading={loading}
      />

      {/* FASE 2: Diálogo de confirmación de eliminación */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setRelacionToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Eliminar Relación Familiar"
        message="¿Está seguro que desea eliminar esta relación familiar?"
        itemName="la relación"
        loading={deleting}
      />

      {/* Diálogos de Gestión de Grupos Familiares */}
      <GrupoFamiliarDialog
        open={grupoDialogOpen}
        onClose={() => {
          setGrupoDialogOpen(false);
          setGrupoToEdit(null);
        }}
        onSuccess={handleGrupoDialogSuccess}
        grupoToEdit={grupoToEdit}
      />

      {miembrosDialogOpen && grupoForMiembros && (
        <GestionMiembrosDialog
          open={miembrosDialogOpen}
          onClose={() => {
            setMiembrosDialogOpen(false);
            setGrupoForMiembros(null);
          }}
          onSuccess={handleMiembrosDialogSuccess}
          grupo={grupoForMiembros}
        />
      )}

      <ConfirmDeleteDialog
        open={deleteGrupoDialogOpen}
        onClose={() => {
          setDeleteGrupoDialogOpen(false);
          setGrupoToDelete(null);
        }}
        onConfirm={confirmDeleteGrupo}
        title="Eliminar Grupo Familiar"
        message={`¿Está seguro que desea eliminar el grupo "${grupoToDelete?.nombre}"?`}
        itemName="el grupo"
        loading={loading}
      />

      {/* NUEVO (v2026-02-26): Snackbar para mostrar warnings de grupos */}
      <Snackbar
        open={grupoWarnings.length > 0}
        autoHideDuration={8000}
        onClose={() => dispatch(clearGrupoWarnings())}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => dispatch(clearGrupoWarnings())}
          severity="warning"
          variant="filled"
          sx={{ width: '100%', maxWidth: 600 }}
        >
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Advertencias de validación familiar:
          </Typography>
          {grupoWarnings.map((warning, index) => (
            <Typography key={index} variant="body2" sx={{ mt: 0.5 }}>
              • {warning}
            </Typography>
          ))}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FamiliaresPage;