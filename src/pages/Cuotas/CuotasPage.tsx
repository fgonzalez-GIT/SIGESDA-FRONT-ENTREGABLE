import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Alert,
  Snackbar,
  Stack,
  Card,
  CardContent,
  Menu,
  MenuItem as MenuItemMui,
  ListItemIcon,
  ListItemText,
  TablePagination,
  Switch,
  FormControlLabel,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
  Divider,
} from '@mui/material';
import {
  Add,
  FilterList,
  Edit,
  Delete,
  MoreVert,
  TrendingUp,
  AttachMoney,
  Warning,
  CheckCircle,
  Schedule,
  Refresh,
  GetApp,
  Description,
  Visibility,
  Search,
  Clear,
  Receipt,
  Percent,
  Cancel as CancelIcon,
  ViewList,
  BarChart,
  Event,
  InfoOutlined,
} from '@mui/icons-material';
import { SeccionPaginaTitulo } from '@/components/common/SeccionPaginaTitulo';
import { EstadisticasCards, EstadisticaItem } from '@/components/common/EstadisticasCards';
import { FiltrosAccordion } from '@/components/common/FiltrosAccordion';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  fetchCuotas,
  deleteCuota,
  setFilters,
  clearFilters,
  fetchDashboard,
  fetchCuotaById,
  setSelectedCuota,
  exportCuotas,
  fetchAllCuotas
} from '../../store/slices/cuotasSlice';
import { CategoriaSocio, EstadoRecibo } from '../../types/cuota.types';
import { GeneracionCuotasModal } from '../../components/Cuotas/GeneracionCuotasModal';
import DetalleCuotaModal from '../../components/Cuotas/DetalleCuotaModal';
import { PersonaAutocompleteFilter } from '../../components/common/PersonaAutocompleteFilter';
import { useCatalogosPersonas } from '../../hooks/usePersonas';
import {
  getTipoPersonaActivo,
  getCategoriaSocio,
  getNombreCompletoReceptor,
  calcularTotalesCuota,
  decimalToNumber
} from '../../utils/cuota.helpers';
import { formatDateLongES } from '@/utils/dateHelpers';

const CuotasPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    cuotas,
    loading,
    error,
    filters,
    pagination,
    dashboardData,
    selectedCuota
  } = useAppSelector((state) => state.cuotas);

  // V2: Cargar catálogo de categorías para el filtro
  const { catalogos } = useCatalogosPersonas();
  const categoriasSocio = catalogos?.categoriasSocio || [];

  // V2: Generar años disponibles dinámicamente (año actual - 2 hasta año actual + 1)
  const aniosDisponibles = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let year = currentYear - 2; year <= currentYear + 1; year++) {
      years.push(year);
    }
    return years.sort((a, b) => b - a); // Orden descendente (más reciente primero)
  }, []);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedCuotaId, setSelectedCuotaId] = useState<number | null>(null);
  const [openGenerarModal, setOpenGenerarModal] = useState(false);
  const [openDetalleModal, setOpenDetalleModal] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' } | null>(null);
  const [showAll, setShowAll] = useState(false); // Modo "Ver Todas"
  const [exporting, setExporting] = useState(false);
  const [soloSocios, setSoloSocios] = useState(true); // Filtrar solo SOCIOS por defecto
  const [tempPersonaId, setTempPersonaId] = useState<number | null>(null); // Selección temporal de persona

  // Estados para UI
  // Tab principal (Vista General | Estadísticas)
  const [mainTab, setMainTab] = useState(0);

  // Acordeón de filtros (solo en Vista General)
  const [filtrosExpanded, setFiltrosExpanded] = useState(false);

  // Load cuotas whenever filters change (including pagination)
  useEffect(() => {
    dispatch(fetchCuotas(filters));
  }, [dispatch, filters]);

  // Load dashboard only on mount
  useEffect(() => {
    const now = new Date();
    dispatch(fetchDashboard({ mes: now.getMonth() + 1, anio: now.getFullYear() }));
  }, [dispatch]);

  const handleFilterChange = (key: string, value: any) => {
    // Reset page to 1 when any non-pagination filter changes
    dispatch(setFilters({ ...filters, [key]: value, page: 1 }));
  };

  // Handler para cambio de persona (no dispara búsqueda automática)
  const handlePersonaChange = (personaId: number | null) => {
    setTempPersonaId(personaId);
  };

  // Handler para buscar por persona
  const handleBuscarPorPersona = () => {
    handleFilterChange('personaId', tempPersonaId);
  };

  // Handler para limpiar selección de persona
  const handleLimpiarPersona = () => {
    setTempPersonaId(null);
    handleFilterChange('personaId', null);
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    dispatch(setFilters({ ...filters, page: newPage + 1 }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setFilters({ ...filters, limit: parseInt(event.target.value, 10), page: 1 }));
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar esta cuota?')) {
      try {
        await dispatch(deleteCuota(id)).unwrap();
        setSnackbar({ open: true, message: 'Cuota eliminada', severity: 'success' });
      } catch (err: any) {
        setSnackbar({ open: true, message: err, severity: 'error' });
      }
    }
  };

  const handleOpenDetalle = async (id: number) => {
    setSelectedCuotaId(id);
    try {
      // Fetch full cuota details (needed for modal)
      await dispatch(fetchCuotaById(id)).unwrap();
      setOpenDetalleModal(true);
    } catch (error) {
      console.error("Error fetching cuota details:", error);
      setSnackbar({ open: true, message: 'Error al cargar detalles de la cuota', severity: 'error' });
    }
  };

  const getEstadoColor = useCallback((estado: EstadoRecibo) => {
    switch (estado) {
      case 'PAGADO': return 'success';
      case 'PENDIENTE': return 'warning';
      case 'VENCIDO': return 'error';
      case 'ANULADO': return 'default';
      default: return 'default';
    }
  }, []);

  // Handler para alternar entre ver todas y paginadas
  const handleToggleShowAll = async () => {
    const newShowAll = !showAll;
    setShowAll(newShowAll);

    if (newShowAll) {
      // Cargar todas las cuotas con los filtros actuales (sin page/limit)
      const { page, limit, ...filtersWithoutPagination } = filters;
      await dispatch(fetchAllCuotas(filtersWithoutPagination));
    } else {
      // Volver a paginación normal
      dispatch(fetchCuotas(filters));
    }
  };

  // Handler para exportar a CSV
  const handleExportToCSV = async () => {
    try {
      setExporting(true);
      const { page, limit, ...filtersWithoutPagination } = filters;
      const result = await dispatch(exportCuotas(filtersWithoutPagination)).unwrap();

      // Convertir a CSV
      const csvContent = convertToCSV(result.data);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `cuotas_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSnackbar({
        open: true,
        message: `${result.total} cuotas exportadas exitosamente`,
        severity: 'success'
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error || 'Error al exportar cuotas',
        severity: 'error'
      });
    } finally {
      setExporting(false);
    }
  };

  /**
   * V2: Función auxiliar para convertir datos a CSV usando helpers
   * Calcula totales desde items[] en lugar de campos deprecated
   */
  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return '';

    const headers = [
      'ID',
      'Mes',
      'Año',
      'Tipo Persona',
      'Categoría',
      'Cuota Base',
      'Actividades',
      'Descuentos',
      'Recargos',
      'Monto Total',
      'Estado',
      'Persona'
    ];

    const rows = data.map(cuota => {
      // V2: Usar helpers para obtener información
      const tipoPersona = getTipoPersonaActivo(cuota.recibo.receptor);
      const categoria = getCategoriaSocio(cuota.recibo.receptor);
      const nombreCompleto = getNombreCompletoReceptor(cuota);
      const totales = calcularTotalesCuota(cuota);

      return [
        cuota.id,
        cuota.mes,
        cuota.anio,
        tipoPersona?.tipoPersona.nombre || 'N/A',
        categoria?.nombre || 'Sin Categoría',
        totales.base.toFixed(2),
        totales.actividades.toFixed(2),
        totales.descuentos.toFixed(2),
        totales.recargos.toFixed(2),
        totales.total.toFixed(2),
        cuota.recibo?.estado || '-',
        nombreCompleto
      ];
    });

    const csvRows = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ];

    return csvRows.join('\n');
  };

  // Contador de filtros activos
  const filtrosActivos = useMemo(() => {
    let count = 0;
    if (filters.mes) count++;
    if (filters.anio) count++;
    if (filters.categoriaId) count++;
    if (filters.conDescuento) count++;
    if (filters.conRecargo) count++;
    if (filters.personaId) count++;
    return count;
  }, [filters]);

  // TAB 1 - Estadísticas Financieras
  const estadisticasFinancieras = useMemo<EstadisticaItem[]>(() => {
    const recaudado = dashboardData?.metricas?.totalRecaudado || 0;
    const pendiente = dashboardData?.metricas?.totalPendiente || 0;
    const tasaCobro = dashboardData?.metricas?.tasaCobro || 0;
    const totalCuotas = pagination?.total || 0;

    return [
      {
        label: 'Recaudado',
        value: recaudado,
        icon: AttachMoney,
        color: 'primary',
        formato: 'moneda',
        subtitle: dashboardData?.periodo?.nombreMes || 'Mes actual',
      },
      {
        label: 'Pendiente',
        value: pendiente,
        icon: Schedule,
        color: 'warning',
        formato: 'moneda',
      },
      {
        label: 'Tasa de Cobro',
        value: tasaCobro,
        icon: CheckCircle,
        color: 'success',
        formato: 'porcentaje',
      },
      {
        label: 'Total Cuotas',
        value: totalCuotas,
        icon: Receipt,
        color: 'info',
        formato: 'numero',
      },
    ];
  }, [dashboardData, pagination]);

  // TAB 2 - Estadísticas por Estado (datos globales desde dashboardData)
  const estadisticasPorEstado = useMemo<EstadisticaItem[]>(() => {
    const porEstado = dashboardData?.distribucion?.porEstado;

    const cantidadPagado = porEstado?.PAGADO?.cantidad ?? cuotas.filter((c) => c.recibo?.estado === 'PAGADO').length;
    const cantidadPendiente = porEstado?.PENDIENTE?.cantidad ?? cuotas.filter((c) => c.recibo?.estado === 'PENDIENTE').length;
    const cantidadVencido = porEstado?.VENCIDO?.cantidad ?? cuotas.filter((c) => c.recibo?.estado === 'VENCIDO').length;
    const cantidadAnulado = porEstado?.ANULADO?.cantidad ?? cuotas.filter((c) => c.recibo?.estado === 'ANULADO').length;

    const fuenteSubtitulo = porEstado ? 'Total global' : 'En página actual';

    return [
      {
        label: 'Pagadas',
        value: cantidadPagado,
        icon: CheckCircle,
        color: 'success',
        formato: 'numero',
        subtitle: fuenteSubtitulo,
      },
      {
        label: 'Pendientes',
        value: cantidadPendiente,
        icon: Schedule,
        color: 'warning',
        formato: 'numero',
        subtitle: fuenteSubtitulo,
      },
      {
        label: 'Vencidas',
        value: cantidadVencido,
        icon: Warning,
        color: 'error',
        formato: 'numero',
        subtitle: fuenteSubtitulo,
      },
      {
        label: 'Anuladas',
        value: cantidadAnulado,
        icon: CancelIcon,
        color: 'inherit',
        formato: 'numero',
        subtitle: fuenteSubtitulo,
      },
    ];
  }, [dashboardData, cuotas]);

  // TAB 3 - Estadísticas por Categoría (datos globales desde dashboardData)
  const estadisticasPorCategoria = useMemo<EstadisticaItem[]>(() => {
    const porCategoria = dashboardData?.distribucion?.porCategoria;

    if (porCategoria && Object.keys(porCategoria).length > 0) {
      // Usar datos globales del dashboard
      const stats = Object.entries(porCategoria)
        .sort(([, a], [, b]) => b.cantidad - a.cantidad)
        .slice(0, 4)
        .map(([nombre, datos], index) => ({
          label: nombre,
          value: datos.cantidad,
          icon: [TrendingUp, Percent, Receipt, AttachMoney][index] || TrendingUp,
          color: (['primary', 'secondary', 'success', 'info'] as const)[index],
          formato: 'numero' as const,
          subtitle: `$${datos.monto.toLocaleString()}`,
        }));

      if (stats.length > 0) return stats;
    }

    // Fallback: calcular desde página actual si no hay datos de dashboard
    const categoriasCount: Record<string, { nombre: string; count: number; total: number }> = {};
    cuotas.forEach((cuota) => {
      const catNombre = cuota.categoria?.nombre || 'Sin categoría';
      if (!categoriasCount[catNombre]) {
        categoriasCount[catNombre] = { nombre: catNombre, count: 0, total: 0 };
      }
      categoriasCount[catNombre].count++;
      categoriasCount[catNombre].total += decimalToNumber(cuota.montoTotal);
    });

    const stats = Object.values(categoriasCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
      .map((item, index) => ({
        label: item.nombre,
        value: item.count,
        icon: [TrendingUp, Percent, Receipt, AttachMoney][index] || TrendingUp,
        color: (['primary', 'secondary', 'success', 'info'] as const)[index],
        formato: 'numero' as const,
        subtitle: `$${item.total.toLocaleString()} (página actual)`,
      }));

    if (stats.length === 0) {
      return [
        {
          label: 'Sin datos',
          value: 0,
          icon: TrendingUp,
          color: 'primary',
          formato: 'numero',
          subtitle: 'No hay cuotas',
        },
      ];
    }

    return stats;
  }, [dashboardData, cuotas]);

  return (
    <Box>
      {/* Header */}
      <SeccionPaginaTitulo
        titulo="Gestión de Cuotas"
        subtitulo="Administración de cuotas, generación masiva y seguimiento de cobranzas"
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Cuotas' },
        ]}
        actions={
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="outlined"
              startIcon={exporting ? <CircularProgress size={20} /> : <GetApp />}
              onClick={handleExportToCSV}
              disabled={exporting || loading || cuotas.length === 0}
            >
              Exportar CSV
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => setOpenGenerarModal(true)}>
              Generar Cuotas
            </Button>
          </Stack>
        }
      />

      {/* Mensaje informativo sobre bulk delete */}
      <Alert
        severity="info"
        icon={<InfoOutlined />}
        sx={{ mb: 3 }}
        action={
          <Button
            color="inherit"
            size="small"
            startIcon={<Receipt />}
            onClick={() => navigate('/recibos?tipo=CUOTA')}
          >
            Ver Recibos de Cuotas
          </Button>
        }
      >
        <strong>Para eliminar múltiples cuotas:</strong> Utiliza el módulo de Recibos y filtra por tipo "CUOTA".
        Las cuotas se eliminarán automáticamente al eliminar sus recibos asociados.
        {' '}
        <Typography component="span" variant="caption" sx={{ display: 'block', mt: 0.5 }}>
          ℹ️ Las cuotas están vinculadas 1:1 con recibos. La eliminación se gestiona desde el módulo de Recibos para garantizar consistencia.
        </Typography>
      </Alert>

      {/* Tabs Principal: Vista General | Estadísticas */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={mainTab} onChange={(_, newValue) => setMainTab(newValue)}>
          <Tab icon={<ViewList />} label="Vista General" iconPosition="start" />
          <Tab icon={<BarChart />} label="Estadísticas" iconPosition="start" />
        </Tabs>
      </Box>

      {/* TAB 0: Vista General - Filtros + Tabla */}
      {mainTab === 0 && (
        <>
          {/* Filtros */}
      <FiltrosAccordion
        expanded={filtrosExpanded}
        onToggle={() => setFiltrosExpanded(!filtrosExpanded)}
        activeCount={filtrosActivos}
        onClearFilters={() => {
          setTempPersonaId(null);
          dispatch(clearFilters());
          setSoloSocios(true);
        }}
        title="Filtros de Búsqueda"
      >
        <Stack spacing={3}>
          {/* Primera fila: Filtros básicos */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Mes</InputLabel>
                <Select
                  value={filters.mes || ''}
                  label="Mes"
                  onChange={(e) => handleFilterChange('mes', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {[...Array(12)].map((_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleDateString('es-AR', { month: 'long' })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Año</InputLabel>
                <Select
                  value={filters.anio || ''}
                  label="Año"
                  onChange={(e) => handleFilterChange('anio', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {aniosDisponibles.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={filters.categoriaId || ''}
                  label="Categoría"
                  onChange={(e) => handleFilterChange('categoriaId', e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {categoriasSocio?.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.conDescuento || false}
                    onChange={(e) => handleFilterChange('conDescuento', e.target.checked || undefined)}
                    size="small"
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                    Con Descuentos
                  </Typography>
                }
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.conRecargo || false}
                    onChange={(e) => handleFilterChange('conRecargo', e.target.checked || undefined)}
                    size="small"
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                    Con Recargos
                  </Typography>
                }
              />
            </Grid>
          </Grid>

          {/* Segunda fila: Filtro de Persona (Manual) */}
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 5 }}>
              <PersonaAutocompleteFilter
                value={tempPersonaId}
                onChange={handlePersonaChange}
                label="Socio"
                placeholder="Buscar por apellido, nombre o DNI..."
                soloSocios={soloSocios}
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!soloSocios}
                    onChange={(e) => {
                      setSoloSocios(!e.target.checked);
                      // Limpiar selección temporal y filtro al cambiar el tipo
                      setTempPersonaId(null);
                      handleFilterChange('personaId', null);
                    }}
                    size="small"
                  />
                }
                label={
                  <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>
                    Todas las personas
                  </Typography>
                }
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<Search />}
                  onClick={handleBuscarPorPersona}
                  disabled={!tempPersonaId || tempPersonaId === filters.personaId}
                  size="small"
                  fullWidth
                >
                  Buscar
                </Button>
                <Tooltip title="Limpiar selección de persona">
                  <span>
                    <IconButton
                      onClick={handleLimpiarPersona}
                      disabled={!tempPersonaId && !filters.personaId}
                      size="small"
                      color="error"
                    >
                      <Clear />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Grid>
          </Grid>

          {/* Tercera fila: Botón de acción */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => dispatch(fetchCuotas(filters))}
                fullWidth
              >
                Refrescar
              </Button>
            </Grid>
          </Grid>
        </Stack>
      </FiltrosAccordion>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Recibo #</TableCell>
              <TableCell>Socio</TableCell>
              <TableCell>Período</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Monto Total</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Cargando...</TableCell>
              </TableRow>
            ) : !cuotas || cuotas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No hay cuotas registradas</TableCell>
              </TableRow>
            ) : (
              (cuotas || []).map((cuota) => (
                <TableRow key={cuota.id} hover>
                  <TableCell>{cuota.recibo?.numero || '-'}</TableCell>
                  <TableCell>
                    {cuota.recibo?.receptor?.nombre} {cuota.recibo?.receptor?.apellido}
                    <Typography variant="caption" display="block" color="text.secondary">
                      {cuota.recibo?.receptor?.dni}
                    </Typography>
                  </TableCell>
                  <TableCell>{cuota.mes}/{cuota.anio}</TableCell>
                  <TableCell>
                    <Chip label={cuota.categoria?.nombre || 'Sin categoría'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>${calcularTotalesCuota(cuota).total.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={cuota.recibo?.estado}
                      color={getEstadoColor(cuota.recibo?.estado)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Ver Detalle">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDetalle(cuota.id)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <IconButton size="small" onClick={(e) => {
                      setMenuAnchor(e.currentTarget);
                      setSelectedCuotaId(cuota.id);
                    }}>
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} px={1} py={0.5}>
          <Button
            variant={showAll ? 'contained' : 'outlined'}
            size="small"
            color="secondary"
            onClick={handleToggleShowAll}
            disabled={loading}
            startIcon={<ViewList />}
          >
            {showAll ? `Mostrando todas (${pagination.total} cuotas)` : 'Ver todas'}
          </Button>
          {!showAll && (
            <TablePagination
              component="div"
              count={pagination.total}
              page={pagination.currentPage - 1}
              onPageChange={handlePageChange}
              rowsPerPage={pagination.limit}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[10, 20, 50, 100]}
              labelRowsPerPage="Registros por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}–${to} de ${count} cuotas`
              }
            />
          )}
        </Box>
      </TableContainer>
        </>
      )}

      {/* TAB 1: Panel de Estadísticas (Pantalla Completa) */}
      {mainTab === 1 && (
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
          <Stack spacing={4}>
            {/* BLOQUE 1: Estadísticas Financieras */}
            <Box>
              <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney /> Estadísticas Financieras
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <AttachMoney color="primary" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      ${(dashboardData?.metricas?.totalRecaudado || 0).toLocaleString()}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Recaudado
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {dashboardData?.periodo?.nombreMes || 'Mes actual'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <Schedule color="warning" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                      ${(dashboardData?.metricas?.totalPendiente || 0).toLocaleString()}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Pendiente
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <CheckCircle color="success" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {(dashboardData?.metricas?.tasaCobro || 0).toFixed(1)}%
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Tasa de Cobro
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <Receipt color="info" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="info.main">
                      {pagination?.total || 0}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Total Cuotas
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* BLOQUE 2: Distribución por Estado */}
            <Box>
              <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BarChart /> Distribución por Estado
              </Typography>
              <Grid container spacing={2}>
                {estadisticasPorEstado.map((stat, index) => (
                  <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                      <Box display="flex" justifyContent="center" mb={1}>
                        {React.createElement(stat.icon, {
                          color: stat.color === 'inherit' ? 'disabled' : stat.color,
                          sx: { fontSize: 36 }
                        })}
                      </Box>
                      <Typography variant="h3" fontWeight="bold" color={stat.color === 'inherit' ? 'text.secondary' : `${stat.color}.main`}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {stat.label}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {stat.subtitle}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Divider />

            {/* BLOQUE 3: Top 4 Categorías */}
            <Box>
              <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp /> Top Categorías
              </Typography>
              <Grid container spacing={2}>
                {estadisticasPorCategoria.map((stat, index) => (
                  <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                      <Box display="flex" justifyContent="center" mb={1}>
                        {React.createElement(stat.icon, {
                          color: stat.color,
                          sx: { fontSize: 36 }
                        })}
                      </Box>
                      <Typography variant="h3" fontWeight="bold" color={`${stat.color}.main`}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {stat.label}
                      </Typography>
                      {stat.subtitle && (
                        <Typography variant="caption" color="text.disabled">
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

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItemMui onClick={() => {
          if (selectedCuotaId) {
            handleOpenDetalle(selectedCuotaId);
            setMenuAnchor(null);
          }
        }}>
          <ListItemIcon><Description fontSize="small" /></ListItemIcon>
          <ListItemText>Ver Detalle</ListItemText>
        </MenuItemMui>
        <MenuItemMui onClick={() => {
          if (selectedCuotaId) handleDelete(selectedCuotaId);
          setMenuAnchor(null);
        }}>
          <ListItemIcon><Delete fontSize="small" /></ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItemMui>
      </Menu>

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={6000}
        onClose={() => setSnackbar(null)}
        message={snackbar?.message}
      >
        <Alert severity={snackbar?.severity} onClose={() => setSnackbar(null)}>
          {snackbar?.message}
        </Alert>
      </Snackbar>

      <GeneracionCuotasModal
        open={openGenerarModal}
        onClose={() => setOpenGenerarModal(false)}
        tabInicial="masivo"
        onSuccess={(resultado) => {
          dispatch(fetchCuotas(filters));
          dispatch(fetchDashboard({ mes: new Date().getMonth() + 1, anio: new Date().getFullYear() }));
          // Mostrar mensaje de éxito
          setSnackbar({
            open: true,
            message: `${resultado.cuotasGeneradas} cuota(s) generada(s) exitosamente`,
            severity: 'success'
          });
        }}
      />

      <DetalleCuotaModal
        open={openDetalleModal}
        onClose={() => setOpenDetalleModal(false)}
        cuota={selectedCuota}
      />
    </Box>
  );
};

export default CuotasPage;