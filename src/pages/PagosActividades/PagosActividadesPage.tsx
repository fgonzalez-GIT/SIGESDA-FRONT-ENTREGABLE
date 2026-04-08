import React, { useEffect, useState, useMemo } from 'react';
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
  TablePagination,
  IconButton,
  Chip,
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
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Grid,
  FormControlLabel,
  Switch,
  Badge,
  Tabs,
  Tab,
  Divider,
  Checkbox,
} from '@mui/material';
import {
  Add,
  FilterList,
  Download,
  Visibility,
  Delete,
  Refresh,
  AttachMoney,
  Schedule,
  CheckCircle,
  Warning,
  Cancel as CancelIcon,
  Receipt as ReceiptIcon,
  MoreVert,
  Assessment,
  CalendarMonth,
  Search,
  Clear,
  FilterAlt,
  TrendingUp,
  Payment,
  EventNote,
  ViewList,
  BarChart,
} from '@mui/icons-material';
import { SeccionPaginaTitulo } from '@/components/common/SeccionPaginaTitulo';
import { EstadisticasCards, EstadisticaItem } from '@/components/common/EstadisticasCards';
import { FiltrosAccordion } from '@/components/common/FiltrosAccordion';
import { BulkSelectionToolbar } from '@/components/common/BulkSelectionToolbar';
import { BulkDeleteConfirmDialog } from '@/components/common/BulkDeleteConfirmDialog';
import { useNavigate } from 'react-router-dom';
import { formatDateES } from '@/utils/dateHelpers';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import {
  fetchPagosActividades,
  fetchEstadisticas,
  setFilters,
  clearFilters,
  deletePago,
  downloadExportacion,
  selectPago,
  bulkDeletePagosActividades,
  clearBulkDeleteError,
} from '@/store/slices/pagosActividadesSlice';
import { safeBulkDeleteValidation } from '@/schemas/bulkDelete.schema';
import { fetchActividades } from '@/store/slices/actividadesSlice';
import GenerarPagosMensualesModal from '@/components/PagosActividades/GenerarPagosMensualesModal';
import DetallePagoActividadModal from '@/components/PagosActividades/DetallePagoActividadModal';
import { PersonaAutocompleteFilter } from '@/components/common/PersonaAutocompleteFilter';
import {
  PieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { PagoActividad } from '@/types/pagosActividades.types';
import recibosService from '@/services/recibosService';

const PagosActividadesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    pagos,
    loading,
    error,
    filters,
    pagination,
    lastGeneration,
    estadisticas,
  } = useAppSelector((state) => state.pagosActividades);

  const { actividades } = useAppSelector((state) => state.actividades);

  const [generarModalOpen, setGenerarModalOpen] = useState(false);
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);
  const [selectedPagoLocal, setSelectedPagoLocal] = useState<PagoActividad | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuPagoId, setMenuPagoId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pagoToDelete, setPagoToDelete] = useState<number | null>(null);

  // Estados para bulk delete
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const bulkDeleteLoading = useAppSelector((state) => state.pagosActividades.bulkDeleteLoading);
  const bulkDeleteError = useAppSelector((state) => state.pagosActividades.bulkDeleteError);

  // Estado temporal para filtro de persona (manual, requiere botón "Buscar")
  const [tempPersonaId, setTempPersonaId] = useState<number | null>(null);
  const [soloNoSocios, setSoloNoSocios] = useState(true); // Por defecto buscar NO_SOCIOS

  // Estado para "Ver Todas"
  const [verTodas, setVerTodas] = useState(false);

  // Estados para UI
  // Tab principal (Vista General | Estadísticas)
  const [mainTab, setMainTab] = useState(0);

  // Acordeón de filtros (solo en Vista General)
  const [filtrosExpanded, setFiltrosExpanded] = useState(false);

  // Generar años disponibles dinámicamente
  const aniosDisponibles = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let year = currentYear - 2; year <= currentYear + 1; year++) {
      years.push(year);
    }
    return years.sort((a, b) => b - a); // Más recientes primero
  }, []);

  // Calcular cantidad de filtros activos
  const filtrosActivos = useMemo(() => {
    let count = 0;
    if (filters.mes) count++;
    if (filters.anio) count++;
    if (filters.estado) count++;
    if (filters.personaId) count++;
    if (filters.actividadId) count++;
    return count;
  }, [filters]);

  // Cargar actividades al montar
  useEffect(() => {
    dispatch(fetchActividades({ estado: 'activo' }));
  }, [dispatch]);

  // Cargar datos cuando cambian los filtros
  useEffect(() => {
    const finalFilters = {
      ...filters,
      limit: verTodas ? 'all' : filters.limit,
    };
    dispatch(fetchPagosActividades(finalFilters));
    // Limpiar selección cuando cambian los filtros
    setSelectedIds([]);
  }, [dispatch, filters, verTodas]);

  // Limpiar error de bulk delete al desmontar
  useEffect(() => {
    return () => {
      dispatch(clearBulkDeleteError());
    };
  }, [dispatch]);

  // Cargar estadísticas globales (siempre, al montar y cuando cambian mes/año)
  useEffect(() => {
    dispatch(fetchEstadisticas({ mes: filters.mes, anio: filters.anio }));
  }, [dispatch, filters.mes, filters.anio]);

  useEffect(() => {
    if (lastGeneration) {
      setSnackbar({
        open: true,
        message: lastGeneration.mensaje,
        severity: 'success',
      });
    }
  }, [lastGeneration]);

  // Handler genérico para cambiar filtros (automático)
  const handleFilterChange = (key: string, value: any) => {
    dispatch(setFilters({ ...filters, [key]: value, page: 1 }));
  };

  // Handler para búsqueda manual por persona
  const handleBuscarPorPersona = () => {
    handleFilterChange('personaId', tempPersonaId);
  };

  // Handler para limpiar selección de persona
  const handleLimpiarPersona = () => {
    setTempPersonaId(null);
    handleFilterChange('personaId', null);
  };

  const handleClearFilters = () => {
    setTempPersonaId(null);
    dispatch(clearFilters());
  };

  const handleRefresh = () => {
    const finalFilters = {
      ...filters,
      limit: verTodas ? 'all' : filters.limit,
    };
    dispatch(fetchPagosActividades(finalFilters));
  };

  // Handler para botón "Ver Todas"
  const handleVerTodasChange = () => {
    setVerTodas(prev => !prev);
  };

  // Handlers de paginación
  const handlePageChange = (event: unknown, newPage: number) => {
    dispatch(setFilters({ ...filters, page: newPage + 1 })); // MUI usa 0-index, backend 1-index
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setFilters({
      ...filters,
      limit: parseInt(event.target.value, 10),
      page: 1,
    }));
  };

  // Handlers para bulk delete
  const handleToggleSelect = (pagoId: number) => {
    setSelectedIds(prev =>
      prev.includes(pagoId)
        ? prev.filter(id => id !== pagoId)
        : [...prev, pagoId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === pagos.length) {
      setSelectedIds([]);
    } else {
      // Solo seleccionar pagos eliminables (estado PENDIENTE)
      const eliminables = pagos
        .filter(p => p.estado === 'PENDIENTE')
        .map(p => p.id);
      setSelectedIds(eliminables);
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    // Validar con Zod
    const validation = safeBulkDeleteValidation(selectedIds);

    if (!validation.success) {
      setSnackbar({
        open: true,
        message: validation.error || 'Error de validación',
        severity: 'error',
      });
      return;
    }

    try {
      await dispatch(bulkDeletePagosActividades(selectedIds)).unwrap();

      setSnackbar({
        open: true,
        message: `✅ ${selectedIds.length} pago(s) eliminado(s) exitosamente`,
        severity: 'success',
      });

      // Limpiar selección y cerrar dialog
      setSelectedIds([]);
      setBulkDeleteDialog(false);

      // Refrescar datos
      const finalFilters = { ...filters, limit: verTodas ? 'all' : filters.limit };
      dispatch(fetchPagosActividades(finalFilters));
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: `❌ Error: ${error || bulkDeleteError || 'No se pudieron eliminar los pagos'}`,
        severity: 'error',
      });
    }
  };

  const isPagoSelectable = (pago: PagoActividad) => {
    return pago.estado === 'PENDIENTE';
  };

  const handleVerDetalle = (pago: PagoActividad) => {
    setSelectedPagoLocal(pago);
    setDetalleModalOpen(true);
  };

  const handleEliminar = async (pagoId: number) => {
    try {
      await dispatch(deletePago(pagoId)).unwrap();
      setSnackbar({
        open: true,
        message: 'Pago eliminado exitosamente',
        severity: 'success',
      });
      handleRefresh();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error || 'Error al eliminar el pago',
        severity: 'error',
      });
    }
    setDeleteDialogOpen(false);
    setPagoToDelete(null);
  };

  const handleDescargarPdf = async (reciboId: number) => {
    try {
      await recibosService.descargarPdf(reciboId);
      setSnackbar({
        open: true,
        message: 'PDF descargado exitosamente',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al descargar el PDF',
        severity: 'error',
      });
    }
  };

  const handleExportar = async (formato: 'excel' | 'csv') => {
    try {
      await dispatch(
        downloadExportacion({
          filters,
          formato,
        })
      ).unwrap();
      setSnackbar({
        open: true,
        message: `Exportación ${formato.toUpperCase()} descargada exitosamente`,
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al exportar',
        severity: 'error',
      });
    }
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, pagoId: number) => {
    setMenuAnchor(event.currentTarget);
    setMenuPagoId(pagoId);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setMenuPagoId(null);
  };

  const handleMenuAction = (action: string) => {
    if (!menuPagoId) return;

    const pago = pagos.find((p) => p.id === menuPagoId);
    if (!pago) return;

    switch (action) {
      case 'ver':
        handleVerDetalle(pago);
        break;
      case 'descargar':
        handleDescargarPdf(pago.reciboId);
        break;
      case 'eliminar':
        setPagoToDelete(menuPagoId);
        setDeleteDialogOpen(true);
        break;
    }

    handleCloseMenu();
  };

  const getEstadoChip = (estado: string) => {
    switch (estado) {
      case 'PAGADO':
        return <Chip label="Pagado" color="success" size="small" icon={<CheckCircle />} />;
      case 'PENDIENTE':
        return <Chip label="Pendiente" color="warning" size="small" icon={<Schedule />} />;
      case 'VENCIDO':
        return <Chip label="Vencido" color="error" size="small" icon={<Warning />} />;
      case 'CANCELADO':
        return <Chip label="Cancelado" color="default" size="small" icon={<CancelIcon />} />;
      default:
        return <Chip label={estado} size="small" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  // Usar estadísticas del endpoint si están disponibles, sino calcular localmente
  const stats = useMemo(() => {
    if (estadisticas) {
      return {
        totalGenerado: estadisticas.montoTotalGenerado,
        totalCobrado: estadisticas.montoTotalCobrado,
        totalPendiente: estadisticas.montoTotalPendiente,
        totalVencido: estadisticas.montoTotalVencido,
        cantidadPendiente: estadisticas.totalPendientes,
        cantidadVencidos: estadisticas.totalVencidos,
      };
    }

    // Fallback: calcular localmente si no hay estadísticas del endpoint
    return {
      totalGenerado: pagos.reduce((sum, p) => sum + p.total, 0),
      totalCobrado: pagos.filter((p) => p.estado === 'PAGADO').reduce((sum, p) => sum + p.montoPagado, 0),
      totalPendiente: pagos.filter((p) => p.estado === 'PENDIENTE').reduce((sum, p) => sum + p.total, 0),
      totalVencido: pagos.filter((p) => p.estado === 'VENCIDO').reduce((sum, p) => sum + p.total, 0),
      cantidadPendiente: pagos.filter((p) => p.estado === 'PENDIENTE').length,
      cantidadVencidos: pagos.filter((p) => p.estado === 'VENCIDO').length,
    };
  }, [estadisticas, pagos]);

  // TAB 1 - Estadísticas Financieras
  const estadisticasFinancieras = useMemo<EstadisticaItem[]>(
    () => [
      {
        label: 'Total Generado',
        value: stats.totalGenerado,
        icon: AttachMoney,
        color: 'primary',
        formato: 'moneda',
        subtitle: estadisticas ? 'Desde endpoint' : `${pagos.length} pagos`,
      },
      {
        label: 'Cobrado',
        value: stats.totalCobrado,
        icon: CheckCircle,
        color: 'success',
        formato: 'moneda',
      },
      {
        label: 'Pendiente',
        value: stats.totalPendiente,
        icon: Schedule,
        color: 'warning',
        formato: 'moneda',
        subtitle: `${stats.cantidadPendiente} pagos`,
      },
      {
        label: 'Vencido',
        value: stats.totalVencido,
        icon: Warning,
        color: 'error',
        formato: 'moneda',
        subtitle: `${stats.cantidadVencidos} pagos`,
      },
    ],
    [stats, estadisticas, pagos.length]
  );

  // TAB 2 - Estadísticas por Estado (datos globales desde endpoint)
  const estadisticasPorEstado = useMemo<EstadisticaItem[]>(() => {
    const cantidadPagado = estadisticas?.totalPagados ?? pagos.filter((p) => p.estado === 'PAGADO').length;
    const cantidadPendiente = estadisticas?.totalPendientes ?? pagos.filter((p) => p.estado === 'PENDIENTE').length;
    const cantidadVencido = estadisticas?.totalVencidos ?? pagos.filter((p) => p.estado === 'VENCIDO').length;
    const cantidadCancelado = estadisticas?.totalCancelados ?? pagos.filter((p) => p.estado === 'CANCELADO').length;

    const fuenteSubtitulo = estadisticas ? 'Total global' : 'En página actual';

    return [
      {
        label: 'Pagados',
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
        label: 'Vencidos',
        value: cantidadVencido,
        icon: Warning,
        color: 'error',
        formato: 'numero',
        subtitle: fuenteSubtitulo,
      },
      {
        label: 'Cancelados',
        value: cantidadCancelado,
        icon: CancelIcon,
        color: 'inherit',
        formato: 'numero',
        subtitle: fuenteSubtitulo,
      },
    ];
  }, [estadisticas, pagos]);

  // TAB 3 - Estadísticas por Actividad (datos globales desde endpoint, Top 4)
  const estadisticasPorActividad = useMemo<EstadisticaItem[]>(() => {
    // Usar datos globales del endpoint si están disponibles
    if (estadisticas?.recaudacionPorActividad && estadisticas.recaudacionPorActividad.length > 0) {
      const stats = estadisticas.recaudacionPorActividad
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 4)
        .map((item, index) => ({
          label: item.actividadNombre,
          value: item.cantidad,
          icon: [EventNote, Payment, TrendingUp, Assessment][index] || EventNote,
          color: (['primary', 'secondary', 'success', 'info'] as const)[index],
          formato: 'numero' as const,
          subtitle: formatCurrency(item.monto),
        }));
      return stats;
    }

    // Fallback: agrupar pagos de la página actual
    const actividadesCount: Record<string, { nombre: string; count: number; total: number }> = {};
    pagos.forEach((pago) => {
      const key = pago.actividadNombre || 'Sin actividad';
      if (!actividadesCount[key]) {
        actividadesCount[key] = { nombre: key, count: 0, total: 0 };
      }
      actividadesCount[key].count++;
      actividadesCount[key].total += pago.total;
    });

    const stats = Object.values(actividadesCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
      .map((item, index) => ({
        label: item.nombre,
        value: item.count,
        icon: [EventNote, Payment, TrendingUp, Assessment][index] || EventNote,
        color: (['primary', 'secondary', 'success', 'info'] as const)[index],
        formato: 'numero' as const,
        subtitle: `${formatCurrency(item.total)} (pág. actual)`,
      }));

    if (stats.length === 0) {
      return [
        {
          label: 'Sin datos',
          value: 0,
          icon: EventNote,
          color: 'primary',
          formato: 'numero',
          subtitle: 'No hay pagos',
        },
      ];
    }

    return stats;
  }, [estadisticas, pagos]);

  return (
    <Box>
      {/* Header */}
      <SeccionPaginaTitulo
        titulo="Pagos de Actividades"
        subtitulo="Sistema de pagos para personas NO_SOCIO"
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Pagos de Actividades' },
        ]}
        actions={
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Assessment />}
              onClick={() => navigate('/pagos-actividades/estadisticas')}
            >
              Estadísticas
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setGenerarModalOpen(true)}
            >
              Generar Pagos Mensuales
            </Button>
          </Stack>
        }
      />

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
        onClearFilters={handleClearFilters}
        title="Filtros de Búsqueda"
      >
        <Stack spacing={3}>
          {/* Filtros básicos */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Mes</InputLabel>
                <Select
                  value={filters.mes ?? ''}
                  label="Mes"
                  onChange={(e) => handleFilterChange('mes', e.target.value || undefined)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value={1}>Enero</MenuItem>
                  <MenuItem value={2}>Febrero</MenuItem>
                  <MenuItem value={3}>Marzo</MenuItem>
                  <MenuItem value={4}>Abril</MenuItem>
                  <MenuItem value={5}>Mayo</MenuItem>
                  <MenuItem value={6}>Junio</MenuItem>
                  <MenuItem value={7}>Julio</MenuItem>
                  <MenuItem value={8}>Agosto</MenuItem>
                  <MenuItem value={9}>Septiembre</MenuItem>
                  <MenuItem value={10}>Octubre</MenuItem>
                  <MenuItem value={11}>Noviembre</MenuItem>
                  <MenuItem value={12}>Diciembre</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Año</InputLabel>
                <Select
                  value={filters.anio ?? ''}
                  label="Año"
                  onChange={(e) => handleFilterChange('anio', e.target.value || undefined)}
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
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filters.estado ?? ''}
                  label="Estado"
                  onChange={(e) => handleFilterChange('estado', e.target.value || undefined)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                  <MenuItem value="PAGADO">Pagado</MenuItem>
                  <MenuItem value="VENCIDO">Vencido</MenuItem>
                  <MenuItem value="CANCELADO">Cancelado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Actividad</InputLabel>
                <Select
                  value={filters.actividadId ?? ''}
                  label="Actividad"
                  onChange={(e) => handleFilterChange('actividadId', e.target.value || undefined)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {(actividades || []).map((actividad) => (
                    <MenuItem key={actividad.id} value={actividad.id}>
                      {actividad.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Tercera fila: Filtro de Persona (Manual) */}
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 5 }}>
              <PersonaAutocompleteFilter
                value={tempPersonaId}
                onChange={(personaId) => setTempPersonaId(personaId)}
                label="Persona"
                placeholder="Buscar por apellido, nombre o DNI..."
                soloSocios={!soloNoSocios} // Invertido: si soloNoSocios=true, enviamos soloSocios=false
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!soloNoSocios}
                    onChange={(e) => {
                      setSoloNoSocios(!e.target.checked);
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

          {/* Cuarta fila: Botones de acción */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRefresh}
                fullWidth
              >
                Actualizar
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => handleExportar('excel')}
                fullWidth
              >
                Exportar Excel
              </Button>
            </Grid>
          </Grid>
        </Stack>
      </FiltrosAccordion>

      {/* Toolbar de selección múltiple */}
      {selectedIds.length > 0 && (
        <BulkSelectionToolbar
          selectedCount={selectedIds.length}
          onBulkDelete={() => setBulkDeleteDialog(true)}
          onClearSelection={handleClearSelection}
          maxSelection={100}
        />
      )}

      {/* Tabla */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedIds.length > 0 && selectedIds.length < pagos.length}
                    checked={pagos.length > 0 && selectedIds.length === pagos.filter(p => isPagoSelectable(p)).length}
                    onChange={handleSelectAll}
                    disabled={pagos.length === 0}
                  />
                </TableCell>
                <TableCell>N° Recibo</TableCell>
                <TableCell>Período</TableCell>
                <TableCell>Persona</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>F. Emisión</TableCell>
                <TableCell>F. Vencimiento</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : pagos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No se encontraron pagos
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                pagos.map((pago) => (
                  <TableRow key={pago.id} hover selected={selectedIds.includes(pago.id)}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.includes(pago.id)}
                        onChange={() => handleToggleSelect(pago.id)}
                        disabled={!isPagoSelectable(pago)}
                        title={!isPagoSelectable(pago) ? 'Solo se pueden eliminar pagos en estado PENDIENTE' : ''}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {pago.numero}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {pago.mes}/{pago.anio}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {pago.personaNombre} {pago.personaApellido}
                      </Typography>
                      {pago.personaDni && (
                        <Typography variant="caption" color="text.secondary">
                          DNI: {pago.personaDni}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(pago.total)}
                      </Typography>
                      {pago.precioEspecial && (
                        <Chip label="Precio Especial" size="small" color="info" sx={{ ml: 1 }} />
                      )}
                    </TableCell>
                    <TableCell>{getEstadoChip(pago.estado)}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDateES(pago.fechaEmision)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDateES(pago.fechaVencimiento)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleOpenMenu(e, pago.id)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación con botón "Ver Todas" */}
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} px={1} py={0.5}>
          <Button
            variant={verTodas ? 'contained' : 'outlined'}
            size="small"
            color="secondary"
            onClick={handleVerTodasChange}
            startIcon={<ViewList />}
          >
            {verTodas ? `Mostrando todas (${pagination.total} pagos)` : 'Ver todas'}
          </Button>
          {!verTodas && (
            <TablePagination
              component="div"
              count={pagination.total}
              page={(pagination.currentPage || 1) - 1}
              onPageChange={handlePageChange}
              rowsPerPage={[10, 20, 50, 100].includes(pagination.limit) ? pagination.limit : 20}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[10, 20, 50, 100]}
              labelRowsPerPage="Registros por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          )}
        </Box>
      </Paper>
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
                      {formatCurrency(stats.totalGenerado)}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Total Generado
                    </Typography>
                    {estadisticas && (
                      <Typography variant="caption" color="text.disabled">
                        Desde endpoint
                      </Typography>
                    )}
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <CheckCircle color="success" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {formatCurrency(stats.totalCobrado)}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Cobrado
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <Schedule color="warning" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                      {formatCurrency(stats.totalPendiente)}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Pendiente
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {stats.cantidadPendiente} pagos
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <Warning color="error" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="error.main">
                      {formatCurrency(stats.totalVencido)}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Vencido
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {stats.cantidadVencidos} pagos
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

            {/* BLOQUE 3: Top 4 Actividades */}
            <Box>
              <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp /> Top Actividades
              </Typography>
              <Grid container spacing={2}>
                {estadisticasPorActividad.map((stat, index) => (
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

            {/* BLOQUE 4: Proyección de Cobranza */}
            {estadisticas?.proyeccion && (
              <>
                <Divider />
                <Box>
                  <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assessment /> Proyección de Cobranza
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">Esperado</Typography>
                        <Typography variant="h5" fontWeight="bold">
                          {formatCurrency(estadisticas.proyeccion.totalEsperado)}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">Cobrado</Typography>
                        <Typography variant="h5" fontWeight="bold" color="success.main">
                          {formatCurrency(estadisticas.proyeccion.totalCobrado)}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">% Cobranza</Typography>
                        <Typography variant="h5" fontWeight="bold" color="primary">
                          {estadisticas.proyeccion.porcentajeCobranza.toFixed(1)}%
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </>
            )}

            {/* BLOQUE 5: Gráficos */}
            {estadisticas && (
              <>
                <Divider />
                <Box>
                  <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BarChart /> Gráficos de Distribución
                  </Typography>
                  <Grid container spacing={3}>
                    {/* PieChart: Distribución por estado */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper elevation={2} sx={{ p: 2.5 }}>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                          Distribución por Estado
                        </Typography>
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie
                              data={(estadisticas.distribucionEstados || []).map(item => ({
                                name: item.estado,
                                value: item.cantidad,
                                monto: item.monto,
                              }))}
                              cx="50%"
                              cy="50%"
                              outerRadius={90}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, value }) => `${name} (${value})`}
                              labelLine={false}
                            >
                              {(estadisticas.distribucionEstados || []).map((entry, index) => {
                                const COLORES: Record<string, string> = {
                                  PENDIENTE: '#ff9800',
                                  PAGADO: '#4caf50',
                                  VENCIDO: '#f44336',
                                  CANCELADO: '#9e9e9e',
                                };
                                return <Cell key={`cell-${index}`} fill={COLORES[entry.estado] || '#999'} />;
                              })}
                            </Pie>
                            <RechartsTooltip
                              formatter={(value: any, name: any, props: any) => [
                                `${value} pagos`,
                                name,
                              ]}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Paper>
                    </Grid>
                    {/* BarChart: Recaudación por Actividad */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper elevation={2} sx={{ p: 2.5 }}>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                          Recaudación por Actividad
                        </Typography>
                        <ResponsiveContainer width="100%" height={280}>
                          <RechartsBarChart data={(estadisticas.recaudacionPorActividad || []).map(item => ({
                            nombre: item.actividadNombre,
                            monto: item.monto,
                            cantidad: item.cantidad,
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="nombre" angle={-30} textAnchor="end" height={70} tick={{ fontSize: 11 }} />
                            <YAxis tickFormatter={(v) => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} />
                            <RechartsTooltip />
                            <Legend />
                            <Bar dataKey="monto" fill="#1976d2" name="Monto" />
                            <Bar dataKey="cantidad" fill="#ff9800" name="Cantidad" />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </>
            )}
          </Stack>
        </Paper>
      )}

      {/* Menu de acciones */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => handleMenuAction('ver')}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver Detalle</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('descargar')}>
          <ListItemIcon>
            <Download fontSize="small" />
          </ListItemIcon>
          <ListItemText>Descargar PDF</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('eliminar')}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItem>
      </Menu>

      {/* Modales */}
      <GenerarPagosMensualesModal
        open={generarModalOpen}
        onClose={() => setGenerarModalOpen(false)}
        onSuccess={handleRefresh}
      />

      <DetallePagoActividadModal
        open={detalleModalOpen}
        pago={selectedPagoLocal}
        onClose={() => {
          setDetalleModalOpen(false);
          setSelectedPagoLocal(null);
        }}
      />

      {/* Dialog de Confirmación Bulk Delete */}
      <BulkDeleteConfirmDialog
        open={bulkDeleteDialog}
        onClose={() => setBulkDeleteDialog(false)}
        onConfirm={handleBulkDelete}
        selectedCount={selectedIds.length}
        entityName="pagos de actividades"
        loading={bulkDeleteLoading}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PagosActividadesPage;
