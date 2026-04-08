/**
 * Página de Gestión de Actividades
 * Integración completa con API de Actividades
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress,
  Alert,
  TablePagination,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  ViewModule as CardViewIcon,
  ViewList as ListViewIcon,
  FilterList as FilterIcon,
  Event,
  CheckCircle,
  Cancel,
  People,
  Category,
  LocalOffer,
  EmojiEvents,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { SeccionPaginaTitulo } from '@/components/common/SeccionPaginaTitulo';
import { EstadisticasCards, EstadisticaItem } from '@/components/common/EstadisticasCards';
import { FiltrosAccordion } from '@/components/common/FiltrosAccordion';

// Hooks y servicios
import { useActividades, useActividadMutations } from '../../hooks/useActividades';
import { listarActividades } from '../../services/actividadesApi';
import { useCatalogosContext } from '../../providers/CatalogosProvider';
import type { ActividadesQueryParams, Actividad } from '../../types/actividad.types';
import { MAX_API_LIMIT } from '../../constants/api';

// Componentes
import { ActividadCard } from '../../components/actividades/ActividadCard';
import { ActividadesTable } from '../../components/actividades/ActividadesTable';

export const ActividadesPage: React.FC = () => {
  // ============================================
  // ESTADO
  // ============================================

  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actividadToDelete, setActividadToDelete] = useState<Actividad | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Tab principal (Vista General | Estadísticas)
  const [mainTab, setMainTab] = useState(0);

  // Acordeón de filtros (solo en Vista General)
  const [filtrosExpanded, setFiltrosExpanded] = useState(false);

  // Modo "Ver Todos" — muestra todos los registros sin paginación
  const [verTodos, setVerTodos] = useState(false);

  // Filtros
  const [filters, setFilters] = useState<ActividadesQueryParams>({
    page: 1,
    limit: 20,
  });

  // ============================================
  // HOOKS
  // ============================================

  const { catalogos, loading: catalogosLoading } = useCatalogosContext();
  const { actividades, pagination, loading, error, fetchActividades, refetch } = useActividades(filters);
  const { eliminar, loading: mutationLoading } = useActividadMutations();

  // Dataset completo para estadísticas (independiente de la paginación)
  const [todasActividadesStats, setTodasActividadesStats] = useState<Actividad[]>([]);

  // ============================================
  // EFECTOS
  // ============================================

  // Cargar dataset para estadísticas (límite máximo permitido por backend: 100)
  useEffect(() => {
    listarActividades({ limit: 100 })
      .then(response => {
        if (response.data) {
          setTodasActividadesStats(response.data);
        }
      })
      .catch(() => {
        // Si falla, las estadísticas usarán los datos de la página actual como fallback
      });
  }, []);

  // Actualizar filtros al cambiar de tab
  useEffect(() => {
    let estadoId: number | undefined;
    switch (tabValue) {
      case 1: estadoId = 1; break; // Activas
      case 2: estadoId = 2; break; // Inactivas
      case 3: estadoId = 4; break; // Finalizadas
      default: estadoId = undefined;
    }

    setFilters(prev => ({ ...prev, estadoId, page: 1 }));
  }, [tabValue]);

  // Recargar actividades cuando cambia cualquier valor de los filtros
  // (paginación, "Ver Todas", búsqueda, cambio de tab)
  // Necesario porque useActividades solo carga al montar; useEffect reactivo lo complementa
  const filtersKey = JSON.stringify(filters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchActividades(filters); }, [filtersKey]);

  // ============================================
  // HANDLERS
  // ============================================

  // TablePagination usa páginas 0-indexadas; el backend espera 1-indexadas
  const handlePageChange = (_: unknown, newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage + 1 }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVerTodos(false);
    setFilters(prev => ({ ...prev, limit: parseInt(event.target.value, 10), page: 1 }));
  };

  const handleToggleVerTodos = () => {
    if (!verTodos) {
      setVerTodos(true);
      setFilters(prev => ({ ...prev, limit: MAX_API_LIMIT, page: 1 }));
    } else {
      setVerTodos(false);
      setFilters(prev => ({ ...prev, limit: 20, page: 1 }));
    }
  };

  const handleFilterChange = (key: keyof ActividadesQueryParams, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleClearFilters = () => {
    setVerTodos(false);
    setFilters({
      page: 1,
      limit: 20,
    });
    setTabValue(0);
  };

  const handleDeleteClick = (actividad: Actividad) => {
    setActividadToDelete(actividad);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!actividadToDelete) return;

    try {
      await eliminar(actividadToDelete.id);
      alert('Actividad eliminada exitosamente');
      setDeleteDialogOpen(false);
      setActividadToDelete(null);
      refetch();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const handleView = (actividad: Actividad) => {
    navigate(`/actividades/${actividad.id}`);
  };

  const handleEdit = (actividad: Actividad) => {
    navigate(`/actividades/${actividad.id}/editar`);
  };

  const handleDuplicate = (actividad: Actividad) => {
    navigate(`/actividades/${actividad.id}/duplicar`);
  };

  const handleCreateNew = () => {
    navigate('/actividades/nueva');
  };

  // Contar filtros activos
  const activeFiltersCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof ActividadesQueryParams];
    return value !== undefined &&
           key !== 'page' &&
           key !== 'limit';
  }).length;

  // TAB 1 - Estadísticas Generales (usa dataset completo cuando está disponible)
  const estadisticasGenerales = useMemo<EstadisticaItem[]>(() => {
    const totalActividades = pagination?.total || 0;
    // Usar dataset completo si está disponible
    const dataset = todasActividadesStats.length > 0 ? todasActividadesStats : actividades;
    const fuenteSubtitulo = todasActividadesStats.length > 0 ? 'Total global' : 'En página actual';

    const activas = dataset.filter((a) => a.estado?.nombre === 'ACTIVA').length;
    const finalizadas = dataset.filter((a) => a.estado?.nombre === 'FINALIZADA').length;
    const conParticipantes = dataset.filter((a) => a._count?.participacion_actividades && a._count.participacion_actividades > 0).length;

    return [
      {
        label: 'Total Actividades',
        value: totalActividades,
        icon: Event,
        color: 'primary',
        formato: 'numero',
      },
      {
        label: 'Activas',
        value: activas,
        icon: CheckCircle,
        color: 'success',
        formato: 'numero',
        subtitle: fuenteSubtitulo,
      },
      {
        label: 'Finalizadas',
        value: finalizadas,
        icon: Cancel,
        color: 'error',
        formato: 'numero',
        subtitle: fuenteSubtitulo,
      },
      {
        label: 'Con Participantes',
        value: conParticipantes,
        icon: People,
        color: 'info',
        formato: 'numero',
        subtitle: fuenteSubtitulo,
      },
    ];
  }, [pagination?.total, todasActividadesStats, actividades]);

  // TAB 2 - Estadísticas por Tipo (datos globales)
  const estadisticasPorTipo = useMemo<EstadisticaItem[]>(() => {
    // Usar dataset completo si está disponible, sino la página actual como fallback
    const dataset = todasActividadesStats.length > 0 ? todasActividadesStats : actividades;
    const fuenteSubtitulo = todasActividadesStats.length > 0 ? 'Total global' : 'En página actual';

    const tiposCount: Record<string, number> = {};
    dataset.forEach((actividad) => {
      const tipoNombre = actividad.tipo?.nombre || 'Sin tipo';
      tiposCount[tipoNombre] = (tiposCount[tipoNombre] || 0) + 1;
    });

    const stats = Object.entries(tiposCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([nombre, count], index) => ({
        label: nombre,
        value: count,
        icon: [Event, Category, LocalOffer, EmojiEvents][index] || Event,
        color: (['primary', 'secondary', 'success', 'info'] as const)[index],
        formato: 'numero' as const,
        subtitle: fuenteSubtitulo,
      }));

    if (stats.length === 0) {
      return [
        {
          label: 'Sin datos',
          value: 0,
          icon: Event,
          color: 'primary',
          formato: 'numero',
          subtitle: 'No hay actividades',
        },
      ];
    }

    return stats;
  }, [todasActividadesStats, actividades]);

  // TAB 3 - Estadísticas por Categoría (datos globales)
  const estadisticasPorCategoria = useMemo<EstadisticaItem[]>(() => {
    // Usar dataset completo si está disponible, sino la página actual como fallback
    const dataset = todasActividadesStats.length > 0 ? todasActividadesStats : actividades;
    const fuenteSubtitulo = todasActividadesStats.length > 0 ? 'Total global' : 'En página actual';

    const categoriasCount: Record<string, number> = {};
    dataset.forEach((actividad) => {
      const categoriaNombre = actividad.categoria?.nombre || 'Sin categoría';
      categoriasCount[categoriaNombre] = (categoriasCount[categoriaNombre] || 0) + 1;
    });

    const stats = Object.entries(categoriasCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([nombre, count], index) => ({
        label: nombre,
        value: count,
        icon: [Category, LocalOffer, EmojiEvents, Event][index] || Category,
        color: (['primary', 'secondary', 'success', 'info'] as const)[index],
        formato: 'numero' as const,
        subtitle: fuenteSubtitulo,
      }));

    if (stats.length === 0) {
      return [
        {
          label: 'Sin datos',
          value: 0,
          icon: Category,
          color: 'primary',
          formato: 'numero',
          subtitle: 'No hay actividades',
        },
      ];
    }

    return stats;
  }, [todasActividadesStats, actividades]);

  // ============================================
  // RENDERIZADO
  // ============================================

  if (catalogosLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <SeccionPaginaTitulo
        titulo="Gestión de Actividades"
        subtitulo={`${pagination.total} ${pagination.total === 1 ? 'actividad encontrada' : 'actividades encontradas'}`}
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Actividades' },
        ]}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="large"
            onClick={handleCreateNew}
          >
            Nueva Actividad
          </Button>
        }
      />

      {/* Tabs Principal: Vista General | Estadísticas */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs value={mainTab} onChange={(_, newValue) => setMainTab(newValue)}>
            <Tab icon={<ListViewIcon />} label="Vista General" iconPosition="start" />
            <Tab icon={<BarChartIcon />} label="Estadísticas" iconPosition="start" />
          </Tabs>

          <Box display="flex" gap={2} alignItems="center" sx={{ pr: 2 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" color="text.secondary">
                Vista:
              </Typography>
              {activeFiltersCount > 0 && (
                <Chip
                  size="small"
                  label={`${activeFiltersCount} filtro${activeFiltersCount > 1 ? 's' : ''} activo${activeFiltersCount > 1 ? 's' : ''}`}
                  color="primary"
                  sx={{ height: 20 }}
                />
              )}
            </Box>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, value) => value && setViewMode(value)}
              size="small"
            >
              <ToggleButton value="card">
                <CardViewIcon sx={{ mr: 0.5 }} />
                Tarjetas
              </ToggleButton>
              <ToggleButton value="list">
                <ListViewIcon sx={{ mr: 0.5 }} />
                Lista
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Box>

      {/* TAB 0: Vista General (Estado + Filtros + Tabla) */}
      {mainTab === 0 && (
        <>
          {/* Tabs de Estado (Filtro rápido) */}
          <Paper sx={{ mb: 3 }}>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="fullWidth">
              <Tab label="Todas" />
              <Tab label="Activas" />
              <Tab label="Inactivas" />
              <Tab label="Finalizadas" />
            </Tabs>
          </Paper>

          {/* Filtros */}
          <FiltrosAccordion
        expanded={filtrosExpanded}
        onToggle={() => setFiltrosExpanded(!filtrosExpanded)}
        activeCount={activeFiltersCount}
        onClearFilters={handleClearFilters}
        title="Filtros de Búsqueda"
      >
        <Grid container spacing={2}>
          {/* Búsqueda por texto */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label="Buscar"
              placeholder="Nombre o código..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              size="small"
            />
          </Grid>

          {/* Filtro por tipo */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select
                value={filters.tipoActividadId || ''}
                onChange={(e) => handleFilterChange('tipoActividadId', e.target.value || undefined)}
                label="Tipo"
              >
                <MenuItem value="">Todos los tipos</MenuItem>
                {catalogos?.tiposActividades?.map((tipo) => (
                  <MenuItem key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Filtro por categoría */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Categoría</InputLabel>
              <Select
                value={filters.categoriaId || ''}
                onChange={(e) => handleFilterChange('categoriaId', e.target.value || undefined)}
                label="Categoría"
              >
                <MenuItem value="">Todas las categorías</MenuItem>
                {catalogos?.categoriasActividades?.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Filtro activa (boolean) */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado Activo</InputLabel>
              <Select
                value={filters.activa === undefined ? '' : filters.activa.toString()}
                onChange={(e) => {
                  const val = e.target.value;
                  handleFilterChange('activa', val === '' ? undefined : val === 'true');
                }}
                label="Estado Activo"
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="true">Solo activas</MenuItem>
                <MenuItem value="false">Solo inactivas</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </FiltrosAccordion>

          {/* Mensajes de Error */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => refetch()}>
              {error}
            </Alert>
          )}

          {/* Loading */}
          {loading && (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          )}

          {/* Lista de Actividades - Vista Tarjetas */}
      {!loading && viewMode === 'card' && (
        <>
          {actividades.length === 0 ? (
            <Paper sx={{ p: 4 }}>
              <Typography align="center" color="text.secondary">
                No se encontraron actividades con los filtros seleccionados
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {actividades.map((actividad) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={actividad.id}>
                  <ActividadCard
                    actividad={actividad}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    onDuplicate={handleDuplicate}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Lista de Actividades - Vista Lista/Tabla */}
      {!loading && viewMode === 'list' && (
        <ActividadesTable
          actividades={actividades}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onDuplicate={handleDuplicate}
        />
      )}

          {/* Paginación */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1}
            mt={2}
          >
            <Button
              variant={verTodos ? 'contained' : 'outlined'}
              size="small"
              color="secondary"
              onClick={handleToggleVerTodos}
              startIcon={<ListViewIcon />}
            >
              {verTodos
                ? `Mostrando todas (${pagination?.total ?? 0} actividades)`
                : 'Ver todas'}
            </Button>

            {!verTodos && (
              <TablePagination
                component="div"
                count={pagination?.total ?? 0}
                page={(pagination?.page ?? 1) - 1}
                onPageChange={handlePageChange}
                rowsPerPage={filters.limit ?? 20}
                onRowsPerPageChange={handleRowsPerPageChange}
                rowsPerPageOptions={[10, 20, 50, 100]}
                labelRowsPerPage="Registros por página:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}–${to} de ${count} actividades`
                }
              />
            )}
          </Box>
        </>
      )}

      {/* TAB 1: Panel de Estadísticas (Pantalla Completa) */}
      {mainTab === 1 && (
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
          <Stack spacing={4}>
            {/* BLOQUE 1: Estadísticas Generales */}
            <Box>
              <Typography
                variant="h6"
                color="primary"
                gutterBottom
                sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
              >
                📊 Estadísticas Generales
              </Typography>
              <Grid container spacing={2}>
                {estadisticasGenerales.map((stat, index) => (
                  <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center', height: '100%' }}>
                      <Box display="flex" justifyContent="center" mb={1}>
                        {React.createElement(stat.icon, {
                          color: stat.color,
                          sx: { fontSize: 40 },
                        })}
                      </Box>
                      <Typography variant="h4" fontWeight="bold" color={`${stat.color}.main`}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                        {stat.label}
                      </Typography>
                      {stat.subtitle && (
                        <Typography variant="caption" display="block" color="text.disabled" sx={{ mt: 0.5 }}>
                          {stat.subtitle}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Divider />

            {/* BLOQUE 2: Distribución por Tipo */}
            <Box>
              <Typography
                variant="h6"
                color="primary"
                gutterBottom
                sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
              >
                🎭 Distribución por Tipo
              </Typography>
              <Grid container spacing={2}>
                {estadisticasPorTipo.map((stat, index) => (
                  <Grid key={index} size={{ xs: 6, sm: 3 }}>
                    <Paper elevation={2} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                      <Box display="flex" justifyContent="center" mb={1}>
                        {React.createElement(stat.icon, {
                          color: stat.color,
                          sx: { fontSize: 32 },
                        })}
                      </Box>
                      <Typography variant="h5" fontWeight="bold" color={`${stat.color}.main`}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {stat.label}
                      </Typography>
                      {stat.subtitle && (
                        <Typography variant="caption" display="block" color="text.disabled" sx={{ mt: 0.5 }}>
                          {stat.subtitle}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Divider />

            {/* BLOQUE 3: Por Categoría (Top 4) */}
            <Box>
              <Typography
                variant="h6"
                color="primary"
                gutterBottom
                sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
              >
                📈 Por Categoría (Top 4)
              </Typography>
              <Grid container spacing={2}>
                {estadisticasPorCategoria.map((stat, index) => (
                  <Grid key={index} size={{ xs: 6, sm: 3 }}>
                    <Paper elevation={2} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                      <Box display="flex" justifyContent="center" mb={1}>
                        {React.createElement(stat.icon, {
                          color: stat.color,
                          sx: { fontSize: 32 },
                        })}
                      </Box>
                      <Typography variant="h5" fontWeight="bold" color={`${stat.color}.main`}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {stat.label}
                      </Typography>
                      {stat.subtitle && (
                        <Typography variant="caption" display="block" color="text.disabled" sx={{ mt: 0.5 }}>
                          {stat.subtitle}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* Dialog de Confirmación de Eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar la actividad <strong>"{actividadToDelete?.nombre}"</strong>?
            <br />
            Esta acción no se puede deshacer.
            {actividadToDelete?._count?.participacion_actividades && actividadToDelete._count.participacion_actividades > 0 && (
              <>
                <br /><br />
                <Alert severity="warning">
                  Esta actividad tiene {actividadToDelete._count.participacion_actividades} participante(s) inscrito(s).
                </Alert>
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={mutationLoading}>
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={mutationLoading}>
            {mutationLoading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActividadesPage;
