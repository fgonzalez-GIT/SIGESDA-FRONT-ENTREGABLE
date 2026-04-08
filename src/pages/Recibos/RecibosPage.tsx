import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  TextField,
  InputAdornment,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Grid,
  Divider,
  Checkbox,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  Print,
  Download,
  Send,
  Payment,
  Cancel,
  MoreVert,
  Receipt,
  AttachMoney,
  Schedule,
  CheckCircle,
  Warning,
  Email,
  Visibility,
  Edit,
  Delete,
  Refresh,
  Description,
  Event,
  ViewList,
  BarChart,
} from '@mui/icons-material';
import { SeccionPaginaTitulo } from '../../components/common/SeccionPaginaTitulo';
import { EstadisticasCards, EstadisticaItem } from '../../components/common/EstadisticasCards';
import { FiltrosAccordion } from '../../components/common/FiltrosAccordion';
import { BulkSelectionToolbar } from '../../components/common/BulkSelectionToolbar';
import { BulkDeleteConfirmDialog } from '../../components/common/BulkDeleteConfirmDialog';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  fetchRecibos,
  setFilters,
  clearFilters,
  generarRecibo,
  pagarRecibo,
  enviarRecibo,
  anularRecibo,
  setCurrentRecibo,
  bulkDeleteRecibos,
  clearBulkDeleteError,
  Recibo,
  RecibosFilters,
} from '../../store/slices/recibosSlice';
import { safeBulkDeleteValidation } from '../../schemas/bulkDelete.schema';
import { fetchPersonas } from '../../store/slices/personasSlice';
import { fetchCuotas } from '../../store/slices/cuotasSlice';
import { useCatalogosPersonas } from '../../hooks/usePersonas';
import GenerarReciboDialog from '../../components/forms/GenerarReciboDialog';
import ReciboViewer from '../../components/recibos/ReciboViewer';
import CrearReciboLibreDialog, { ReciboLibreFormData } from '../../components/forms/CrearReciboLibreDialog';
import ProcesarPagoModal from '../../components/recibos/ProcesarPagoModal';
import recibosService from '../../services/recibosService';
import { MAX_API_LIMIT } from '../../constants/api';
import { formatDateES, formatDateLongES } from '@/utils/dateHelpers';
import { generarTituloRecibo, generarResumenItems } from '@/utils/recibo.helpers';
import { generarReciboPdf } from '@/utils/pdf/generators/recibosPdfGenerator';
import { ExportMenuButton, ExportFormat } from '@/components/Recibos/ExportMenuButton';
import { ExportProgressDialog } from '@/components/Recibos/ExportProgressDialog';
import { useRecibosExport } from '@/hooks/useRecibosExport';

// Constantes de mapeo de estado (fuera del componente para evitar recreación)
const ESTADO_COLOR_MAP = {
  pendiente: 'warning',
  pagado: 'success',
  vencido: 'error',
  cancelado: 'default',
  parcial: 'info',
} as const;

// Función helper para obtener íconos (evita problemas con ReactNode en constantes)
const getEstadoIconElement = (estado: Recibo['estado']): React.ReactElement => {
  switch (estado) {
    case 'pendiente':
      return <Schedule fontSize="small" />;
    case 'pagado':
      return <CheckCircle fontSize="small" />;
    case 'vencido':
      return <Warning fontSize="small" />;
    case 'cancelado':
      return <Cancel fontSize="small" />;
    case 'parcial':
      return <AttachMoney fontSize="small" />;
    default:
      return <Schedule fontSize="small" />;
  }
};

// Componente memoizado para cada fila de recibo
interface ReciboRowProps {
  recibo: Recibo;
  generatingPdf: boolean;
  getEstadoColor: (estado: Recibo['estado']) => string;
  getEstadoIcon: (estado: Recibo['estado']) => React.ReactElement;
  onPagar: (reciboId: number) => void;
  onDescargarPdf: (reciboId: number) => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, reciboId: number) => void;
  selected: boolean;
  onToggleSelect: (reciboId: number) => void;
  selectable: boolean;
}

const ReciboRow = React.memo<ReciboRowProps>(({
  recibo,
  generatingPdf,
  getEstadoColor,
  getEstadoIcon,
  onPagar,
  onDescargarPdf,
  onMenuOpen,
  selected,
  onToggleSelect,
  selectable
}) => {
  return (
    <TableRow hover selected={selected}>
      <TableCell padding="checkbox">
        <Checkbox
          checked={selected}
          onChange={() => onToggleSelect(recibo.id)}
          disabled={!selectable}
          title={!selectable ? 'Este recibo no puede ser eliminado (está pagado o tiene pagos registrados)' : ''}
        />
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight="medium">
          {recibo.numero}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatDateES(recibo.fechaEmision)}
        </Typography>
      </TableCell>
      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {recibo.personaNombre} {recibo.personaApellido}
          </Typography>
          <Chip
            label={recibo.personaTipo}
            size="small"
            color={
              recibo.personaTipo === 'socio' ? 'primary' :
              recibo.personaTipo === 'docente' ? 'secondary' : 'default'
            }
          />
        </Box>
      </TableCell>
      <TableCell>
        <Box>
          {/* Título destacado */}
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
            {generarTituloRecibo(recibo)}
          </Typography>

          {/* Resumen de items */}
          <Typography variant="caption" color="text.secondary">
            {generarResumenItems(recibo.conceptos.length)}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight="medium">
          ${recibo.total.toLocaleString()}
        </Typography>
        {recibo.montoPagado > 0 && recibo.estado !== 'pagado' && (
          <Typography variant="caption" color="text.secondary">
            Pagado: ${recibo.montoPagado.toLocaleString()}
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <Chip
          icon={getEstadoIcon(recibo.estado)}
          label={recibo.estado}
          color={getEstadoColor(recibo.estado)}
          size="small"
        />
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {formatDateES(recibo.fechaVencimiento)}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={recibo.enviado ? 'Sí' : 'No'}
          size="small"
          color={recibo.enviado ? 'success' : 'default'}
          variant="outlined"
        />
      </TableCell>
      <TableCell align="right">
        <Box display="flex" justifyContent="flex-end">
          {recibo.estado === 'pendiente' && (
            <Tooltip title="Registrar pago">
              <IconButton
                size="small"
                onClick={() => onPagar(recibo.id)}
                color="success"
              >
                <Payment />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Descargar PDF">
            <IconButton
              size="small"
              onClick={() => onDescargarPdf(recibo.id)}
              color="primary"
              disabled={generatingPdf}
            >
              <Download />
            </IconButton>
          </Tooltip>
          <IconButton
            size="small"
            onClick={(e) => onMenuOpen(e, recibo.id)}
          >
            <MoreVert />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
});

ReciboRow.displayName = 'ReciboRow';

const RecibosPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    filteredRecibos,
    loading,
    error,
    filters,
    pagination,
    estadisticas,
    totalFacturado,
    totalCobrado,
    totalPendiente,
    generatingPdf,
  } = useAppSelector((state) => state.recibos);

  const { catalogos } = useCatalogosPersonas();

  const [generarReciboOpen, setGenerarReciboOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Tab principal (Vista General | Estadísticas)
  const [mainTab, setMainTab] = useState(0);

  // Acordeón de filtros (solo en Vista General)
  const [filtrosExpanded, setFiltrosExpanded] = useState(false);

  // Modo "Ver Todos" — muestra todos los registros sin paginación
  const [verTodos, setVerTodos] = useState(false);
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
  const [menuReciboId, setMenuReciboId] = useState<number | null>(null);
  const [anularDialog, setAnularDialog] = useState<{
    open: boolean;
    reciboId: number | null;
    motivo: string;
  }>({
    open: false,
    reciboId: null,
    motivo: '',
  });

  const [detallesDialog, setDetallesDialog] = useState<{
    open: boolean;
    recibo: Recibo | null;
    loading: boolean;
  }>({
    open: false,
    recibo: null,
    loading: false,
  });

  const [reciboLibreDialog, setReciboLibreDialog] = useState<{
    open: boolean;
    datosIniciales: Partial<ReciboLibreFormData> | null;
    modo: 'crear' | 'duplicar';
  }>({
    open: false,
    datosIniciales: null,
    modo: 'crear',
  });

  const [pagoModal, setPagoModal] = useState<{
    open: boolean;
    recibo: Recibo | null;
  }>({
    open: false,
    recibo: null,
  });

  // Estados para bulk delete
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const bulkDeleteLoading = useAppSelector((state) => state.recibos.bulkDeleteLoading);
  const bulkDeleteError = useAppSelector((state) => state.recibos.bulkDeleteError);

  // Hook para exportación
  const {
    progress: exportProgress,
    exportToCSV,
    exportToExcel,
    exportToPdfListado,
    exportToPdfZip,
    resetProgress: resetExportProgress,
  } = useRecibosExport();

  // Generar años disponibles dinámicamente
  const aniosDisponibles = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let year = currentYear - 2; year <= currentYear + 1; year++) {
      years.push(year);
    }
    return years.sort((a, b) => b - a); // Más recientes primero
  }, []);

  useEffect(() => {
    dispatch(fetchRecibos(filters));
    // Limpiar selección cuando cambian los filtros
    setSelectedIds([]);
  }, [dispatch, filters]);

  // Limpiar selección cuando se recarga la página
  useEffect(() => {
    return () => {
      dispatch(clearBulkDeleteError());
    };
  }, [dispatch]);

  // Cargar personas y cuotas cuando se abre el diálogo de generar recibo
  useEffect(() => {
    if (generarReciboOpen) {
      dispatch(fetchPersonas({}));
      // Cargar solo cuotas impagas para generar recibos
      dispatch(fetchCuotas({ soloImpagas: true }));
    }
  }, [generarReciboOpen, dispatch]);

  const handleFilterChange = (newFilters: Partial<RecibosFilters>) => {
    dispatch(setFilters({ ...filters, ...newFilters }));
  };

  const handleClearFilters = () => {
    setVerTodos(false);
    dispatch(clearFilters());
    setSearchTerm('');
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    dispatch(setFilters({ ...filters, page: newPage + 1 }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVerTodos(false);
    dispatch(setFilters({
      ...filters,
      limit: parseInt(event.target.value, 10),
      page: 1,
    }));
  };

  const handleToggleVerTodos = () => {
    if (!verTodos) {
      setVerTodos(true);
      dispatch(setFilters({ ...filters, limit: MAX_API_LIMIT, page: 1 }));
    } else {
      setVerTodos(false);
      dispatch(setFilters({ ...filters, limit: 20, page: 1 }));
    }
  };

  const handleGenerarRecibo = async (request: any) => {
    try {
      await dispatch(generarRecibo(request)).unwrap();
      setGenerarReciboOpen(false);
      setSnackbar({
        open: true,
        message: 'Recibo generado exitosamente',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al generar el recibo',
        severity: 'error',
      });
    }
  };

  const handlePagarRecibo = (reciboId: number) => {
    // Buscar el recibo en la lista
    const recibo = filteredRecibos.find(r => r.id === reciboId);
    if (recibo) {
      setPagoModal({
        open: true,
        recibo,
      });
    }
  };

  const handlePagoExitoso = () => {
    setPagoModal({
      open: false,
      recibo: null,
    });
    // Recargar lista de recibos
    dispatch(fetchRecibos(filters));
    setSnackbar({
      open: true,
      message: 'Pago procesado exitosamente',
      severity: 'success',
    });
  };

  const handleDescargarPdf = async (reciboId: number) => {
    try {
      // Buscar el recibo completo en la lista filtrada
      const recibo = filteredRecibos.find((r: Recibo) => r.id === reciboId);

      if (!recibo) {
        throw new Error('Recibo no encontrado');
      }

      // Generar PDF en el frontend usando jsPDF
      await generarReciboPdf(recibo);

      setSnackbar({
        open: true,
        message: 'PDF generado y descargado exitosamente',
        severity: 'success',
      });
    } catch (error: any) {
      console.error('Error al generar PDF:', error);
      setSnackbar({
        open: true,
        message: error?.message || 'Error al generar el PDF',
        severity: 'error',
      });
    }
  };

  const handleExport = async (format: ExportFormat) => {
    try {
      // Construir filtros actuales para exportación
      const exportFilters: RecibosFilters = {
        ...filters,
        searchTerm,
      };

      // Si está en modo "Ver Todos", usar límite alto
      if (verTodos) {
        exportFilters.limit = MAX_API_LIMIT;
      }

      switch (format) {
        case 'csv':
          await exportToCSV(exportFilters);
          break;
        case 'excel':
          await exportToExcel(exportFilters);
          break;
        case 'pdf-listado':
          // Para PDF listado necesitamos los recibos actuales
          await exportToPdfListado(filteredRecibos, exportFilters);
          break;
        case 'pdf-zip':
          // Para PDF ZIP necesitamos los recibos actuales
          await exportToPdfZip(filteredRecibos, exportFilters);
          break;
      }
    } catch (error: any) {
      console.error('Error al exportar:', error);
      setSnackbar({
        open: true,
        message: error?.message || 'Error al exportar',
        severity: 'error',
      });
    }
  };

  const handleEnviarRecibo = async (reciboId: number) => {
    try {
      await dispatch(enviarRecibo({ reciboId })).unwrap();
      setSnackbar({
        open: true,
        message: 'Recibo enviado exitosamente',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al enviar el recibo',
        severity: 'error',
      });
    }
  };

  const handleAnularRecibo = async () => {
    if (!anularDialog.reciboId || !anularDialog.motivo.trim()) return;

    try {
      await dispatch(anularRecibo({
        reciboId: anularDialog.reciboId,
        motivo: anularDialog.motivo,
      })).unwrap();
      setAnularDialog({ open: false, reciboId: null, motivo: '' });
      setSnackbar({
        open: true,
        message: 'Recibo anulado exitosamente',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al anular el recibo',
        severity: 'error',
      });
    }
  };

  const handleVerDetalles = async (reciboId: number) => {
    try {
      setDetallesDialog({ open: true, recibo: null, loading: true });
      const recibo = await recibosService.getReciboById(reciboId);
      setDetallesDialog({ open: true, recibo, loading: false });
    } catch (error) {
      setDetallesDialog({ open: false, recibo: null, loading: false });
      setSnackbar({
        open: true,
        message: 'Error al cargar los detalles del recibo',
        severity: 'error',
      });
    }
  };

  const handleDuplicarRecibo = async (reciboId: number) => {
    try {
      // Llamar al endpoint que prepara los datos duplicados
      const datosPreparados = await recibosService.duplicarRecibo(reciboId);

      // Convertir los datos del backend al formato del formulario
      const datosFormulario: Partial<ReciboLibreFormData> = {
        tipo: datosPreparados.tipo as any,
        concepto: datosPreparados.concepto,
        importe: parseFloat(datosPreparados.importe || '0'),
        fechaEmision: datosPreparados.fechaEmision ? new Date(datosPreparados.fechaEmision) : new Date(),
        fechaVencimiento: datosPreparados.fechaVencimiento ? new Date(datosPreparados.fechaVencimiento) : null,
        emisorId: datosPreparados.emisorId || null,
        receptorId: datosPreparados.receptorId || null,
        observaciones: datosPreparados.observaciones || '',
      };

      // Abrir el diálogo con los datos pre-llenados
      setReciboLibreDialog({
        open: true,
        datosIniciales: datosFormulario,
        modo: 'duplicar',
      });

    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al preparar duplicación del recibo',
        severity: 'error',
      });
    }
  };

  const handleCrearReciboLibre = async (data: ReciboLibreFormData) => {
    try {
      await recibosService.createReciboLibre(data);
      setReciboLibreDialog({ open: false, datosIniciales: null, modo: 'crear' });
      setSnackbar({
        open: true,
        message: reciboLibreDialog.modo === 'duplicar'
          ? 'Recibo duplicado exitosamente'
          : 'Recibo creado exitosamente',
        severity: 'success',
      });
      // Recargar la lista de recibos
      dispatch(fetchRecibos(filters));
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al crear el recibo',
        severity: 'error',
      });
    }
  };

  // Funciones memoizadas para evitar recreación en cada render
  const getEstadoColor = useCallback((estado: Recibo['estado']) => {
    return ESTADO_COLOR_MAP[estado] as any;
  }, []);

  const getEstadoIcon = useCallback((estado: Recibo['estado']) => {
    return getEstadoIconElement(estado);
  }, []);

  // Memoizar el filtrado de datos para evitar recálculos innecesarios
  const filteredData = useMemo(() => {
    return filteredRecibos.filter(recibo =>
      searchTerm === '' ||
      recibo.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recibo.personaNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recibo.personaApellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recibo.conceptos.some(c => c.concepto.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [filteredRecibos, searchTerm]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, reciboId: number) => {
    setMenuAnchor(event.currentTarget);
    setMenuReciboId(reciboId);
  };

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
    setMenuReciboId(null);
  }, []);

  // Handlers para bulk delete
  const handleToggleSelect = useCallback((reciboId: number) => {
    setSelectedIds(prev =>
      prev.includes(reciboId)
        ? prev.filter(id => id !== reciboId)
        : [...prev, reciboId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === filteredData.length) {
      setSelectedIds([]);
    } else {
      // Solo seleccionar recibos eliminables (no pagados, sin medios de pago)
      const eliminables = filteredData
        .filter(r => r.estado !== 'pagado' && (!r.mediosPago || r.mediosPago.length === 0))
        .map(r => r.id);
      setSelectedIds(eliminables);
    }
  }, [selectedIds.length, filteredData]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

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
      await dispatch(bulkDeleteRecibos(selectedIds)).unwrap();

      setSnackbar({
        open: true,
        message: `✅ ${selectedIds.length} recibo(s) eliminado(s) exitosamente`,
        severity: 'success',
      });

      // Limpiar selección y cerrar dialog
      setSelectedIds([]);
      setBulkDeleteDialog(false);

      // Refrescar datos
      dispatch(fetchRecibos(filters));
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: `❌ Error: ${error || bulkDeleteError || 'No se pudieron eliminar los recibos'}`,
        severity: 'error',
      });
    }
  };

  const isReciboSelectable = useCallback((recibo: Recibo) => {
    return recibo.estado !== 'pagado' && (!recibo.mediosPago || recibo.mediosPago.length === 0);
  }, []);

  // Memoizar handlers para evitar recreación y re-renders de ReciboRow
  const memoizedHandlePagarRecibo = useCallback(handlePagarRecibo, [filteredRecibos]);
  const memoizedHandleDescargarPdf = useCallback(handleDescargarPdf, [filteredRecibos]);
  const memoizedHandleMenuOpen = useCallback(handleMenuOpen, []);

  // Estadísticas para tabs
  const estadisticasFinancieras = useMemo<EstadisticaItem[]>(() => [
    {
      label: 'Total Facturado',
      value: totalFacturado,
      icon: Receipt,
      color: 'primary',
      formato: 'moneda',
    },
    {
      label: 'Total Cobrado',
      value: totalCobrado,
      icon: CheckCircle,
      color: 'success',
      formato: 'moneda',
    },
    {
      label: 'Total Pendiente',
      value: totalPendiente,
      icon: Schedule,
      color: 'warning',
      formato: 'moneda',
    },
    {
      label: 'Recibos Vencidos',
      value: estadisticas.vencidos,
      icon: Warning,
      color: 'error',
      formato: 'numero',
    },
  ], [totalFacturado, totalCobrado, totalPendiente, estadisticas.vencidos]);

  const estadisticasPorEstado = useMemo<EstadisticaItem[]>(() => [
    {
      label: 'Pendientes',
      value: estadisticas.pendientes,
      icon: Schedule,
      color: 'warning',
      formato: 'numero',
    },
    {
      label: 'Pagados',
      value: estadisticas.pagados,
      icon: CheckCircle,
      color: 'success',
      formato: 'numero',
    },
    {
      label: 'Vencidos',
      value: estadisticas.vencidos,
      icon: Warning,
      color: 'error',
      formato: 'numero',
    },
    {
      label: 'Cancelados',
      value: estadisticas.cancelados || 0,
      icon: Cancel,
      color: 'default',
      formato: 'numero',
    },
  ], [estadisticas]);

  const estadisticasGenerales = useMemo<EstadisticaItem[]>(() => [
    {
      label: 'Total Recibos',
      value: pagination.total,
      icon: Description,
      color: 'primary',
      formato: 'numero',
    },
    {
      label: 'Este Mes',
      value: estadisticas.esteMes || 0,
      icon: Event,
      color: 'secondary',
      formato: 'numero',
      subtitle: formatDateLongES(new Date().toISOString()),
    },
    {
      label: 'Enviados por Email',
      value: estadisticas.enviados || 0,
      icon: Email,
      color: 'info',
      formato: 'numero',
    },
  ], [pagination.total, estadisticas]);

  // Contar filtros activos
  const filtrosActivos = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (filters.estado) count++;
    if (filters.mes) count++;
    if (filters.anio) count++;
    if (filters.personaTipo) count++;
    if (filters.enviado !== undefined) count++;
    if (filters.fechaDesde || filters.fechaHasta) count++;
    return count;
  }, [searchTerm, filters]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box>
        {/* Header */}
        <SeccionPaginaTitulo
          titulo="Gestión de Recibos"
          subtitulo="Administra la facturación y cobranza del sistema"
          breadcrumbs={[
            { label: 'Inicio', href: '/' },
            { label: 'Recibos' },
          ]}
          actions={
            <Stack direction="row" spacing={2}>
              <ExportMenuButton
                onExport={handleExport}
                disabled={loading || filteredRecibos.length === 0}
                loading={exportProgress.open && exportProgress.status === 'processing'}
              />
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setGenerarReciboOpen(true)}
              >
                Generar desde Cuotas
              </Button>
              <Button
                variant="outlined"
                startIcon={<Receipt />}
                onClick={() => setReciboLibreDialog({ open: true, datosIniciales: null, modo: 'crear' })}
              >
                Crear Recibo Libre
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
            {/* Filtros con Accordion */}
        <FiltrosAccordion
          expanded={filtrosExpanded}
          onToggle={() => setFiltrosExpanded(!filtrosExpanded)}
          activeCount={filtrosActivos}
          onClearFilters={handleClearFilters}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por número, persona o concepto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filters.estado || ''}
                  onChange={(e) => handleFilterChange({ estado: e.target.value as any })}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                  <MenuItem value="PAGADO">Pagado</MenuItem>
                  <MenuItem value="VENCIDO">Vencido</MenuItem>
                  <MenuItem value="PARCIAL">Pago Parcial</MenuItem>
                  <MenuItem value="CANCELADO">Cancelado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Mes</InputLabel>
                <Select
                  value={filters.mes || ''}
                  onChange={(e) => handleFilterChange({ mes: e.target.value as any })}
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
              <FormControl fullWidth size="small">
                <InputLabel>Año</InputLabel>
                <Select
                  value={filters.anio || ''}
                  onChange={(e) => handleFilterChange({ anio: e.target.value as any })}
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

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo Persona</InputLabel>
                <Select
                  value={filters.personaTipo || ''}
                  onChange={(e) => handleFilterChange({ personaTipo: e.target.value as any })}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {catalogos?.tiposPersona
                    ?.filter((tipo) => tipo.activo)
                    .sort((a, b) => a.orden - b.orden)
                    .map((tipo) => (
                      <MenuItem key={tipo.id} value={tipo.codigo}>
                        {tipo.nombre}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Enviado</InputLabel>
                <Select
                  value={filters.enviado === undefined ? '' : filters.enviado ? 'si' : 'no'}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFilterChange({
                      enviado: value === '' ? undefined : value === 'si'
                    });
                  }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="si">Enviados</MenuItem>
                  <MenuItem value="no">No enviados</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={() => dispatch(fetchRecibos(filters))}
                startIcon={<Refresh />}
              >
                Actualizar
              </Button>
            </Grid>
          </Grid>
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

        {/* Tabla de recibos */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedIds.length > 0 && selectedIds.length < filteredData.length}
                    checked={filteredData.length > 0 && selectedIds.length === filteredData.filter(r => isReciboSelectable(r)).length}
                    onChange={handleSelectAll}
                    disabled={filteredData.length === 0}
                  />
                </TableCell>
                <TableCell>Número</TableCell>
                <TableCell>Persona</TableCell>
                <TableCell>Conceptos</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Vencimiento</TableCell>
                <TableCell>Enviado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    Cargando...
                  </TableCell>
                </TableRow>
              )}
              {!loading && filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No se encontraron recibos
                  </TableCell>
                </TableRow>
              )}
              {filteredData.map((recibo) => (
                <ReciboRow
                  key={recibo.id}
                  recibo={recibo}
                  generatingPdf={generatingPdf}
                  getEstadoColor={getEstadoColor}
                  getEstadoIcon={getEstadoIcon}
                  onPagar={memoizedHandlePagarRecibo}
                  onDescargarPdf={memoizedHandleDescargarPdf}
                  onMenuOpen={memoizedHandleMenuOpen}
                  selected={selectedIds.includes(recibo.id)}
                  onToggleSelect={handleToggleSelect}
                  selectable={isReciboSelectable(recibo)}
                />
              ))}
            </TableBody>
          </Table>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1}
          >
            <Button
              variant={verTodos ? 'contained' : 'outlined'}
              size="small"
              color="secondary"
              onClick={handleToggleVerTodos}
              startIcon={<ViewList />}
            >
              {verTodos
                ? `Mostrando todos (${pagination.total} recibos)`
                : 'Ver todos'}
            </Button>

            {!verTodos && (
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
                  `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
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
                        <Receipt color="primary" sx={{ fontSize: 40 }} />
                      </Box>
                      <Typography variant="h4" fontWeight="bold" color="primary.main">
                        ${totalFacturado.toLocaleString()}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Total Facturado
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                      <Box display="flex" justifyContent="center" mb={1}>
                        <CheckCircle color="success" sx={{ fontSize: 40 }} />
                      </Box>
                      <Typography variant="h4" fontWeight="bold" color="success.main">
                        ${totalCobrado.toLocaleString()}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Total Cobrado
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                      <Box display="flex" justifyContent="center" mb={1}>
                        <Schedule color="warning" sx={{ fontSize: 40 }} />
                      </Box>
                      <Typography variant="h4" fontWeight="bold" color="warning.main">
                        ${totalPendiente.toLocaleString()}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Total Pendiente
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                      <Box display="flex" justifyContent="center" mb={1}>
                        <Warning color="error" sx={{ fontSize: 40 }} />
                      </Box>
                      <Typography variant="h4" fontWeight="bold" color="error.main">
                        {estadisticas.vencidos}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Recibos Vencidos
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
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                      <Box display="flex" justifyContent="center" mb={1}>
                        <Schedule color="warning" sx={{ fontSize: 36 }} />
                      </Box>
                      <Typography variant="h3" fontWeight="bold" color="warning.main">
                        {estadisticas.pendientes}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Pendientes
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                      <Box display="flex" justifyContent="center" mb={1}>
                        <CheckCircle color="success" sx={{ fontSize: 36 }} />
                      </Box>
                      <Typography variant="h3" fontWeight="bold" color="success.main">
                        {estadisticas.pagados}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Pagados
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                      <Box display="flex" justifyContent="center" mb={1}>
                        <Warning color="error" sx={{ fontSize: 36 }} />
                      </Box>
                      <Typography variant="h3" fontWeight="bold" color="error.main">
                        {estadisticas.vencidos}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Vencidos
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                      <Box display="flex" justifyContent="center" mb={1}>
                        <Cancel color="disabled" sx={{ fontSize: 36 }} />
                      </Box>
                      <Typography variant="h3" fontWeight="bold" color="text.secondary">
                        {estadisticas.cancelados || 0}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Cancelados
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* BLOQUE 3: Información General */}
              <Box>
                <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Description /> Información General
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                      <Box display="flex" justifyContent="center" mb={1}>
                        <Description color="primary" sx={{ fontSize: 36 }} />
                      </Box>
                      <Typography variant="h3" fontWeight="bold" color="primary.main">
                        {pagination.total}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Total Recibos
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                      <Box display="flex" justifyContent="center" mb={1}>
                        <Event color="secondary" sx={{ fontSize: 36 }} />
                      </Box>
                      <Typography variant="h3" fontWeight="bold" color="secondary.main">
                        {estadisticas.esteMes || 0}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Este Mes
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {formatDateLongES(new Date().toISOString())}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                      <Box display="flex" justifyContent="center" mb={1}>
                        <Email color="info" sx={{ fontSize: 36 }} />
                      </Box>
                      <Typography variant="h3" fontWeight="bold" color="info.main">
                        {estadisticas.enviados || 0}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Enviados por Email
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
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => {
            if (menuReciboId) handleEnviarRecibo(menuReciboId);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <Email fontSize="small" />
            </ListItemIcon>
            <ListItemText>Enviar por Email</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            if (menuReciboId) handleVerDetalles(menuReciboId);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            <ListItemText>Ver Detalles</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            if (menuReciboId) handleDuplicarRecibo(menuReciboId);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <Receipt fontSize="small" />
            </ListItemIcon>
            <ListItemText>Duplicar</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            if (menuReciboId) {
              setAnularDialog({ open: true, reciboId: menuReciboId, motivo: '' });
            }
            handleMenuClose();
          }}>
            <ListItemIcon>
              <Cancel fontSize="small" />
            </ListItemIcon>
            <ListItemText>Anular</ListItemText>
          </MenuItem>
        </Menu>

        {/* Diálogo para generar recibo */}
        <GenerarReciboDialog
          open={generarReciboOpen}
          onClose={() => setGenerarReciboOpen(false)}
          onSubmit={handleGenerarRecibo}
          loading={loading}
        />

        {/* Diálogo para anular recibo */}
        <Dialog
          open={anularDialog.open}
          onClose={() => setAnularDialog({ open: false, reciboId: null, motivo: '' })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Anular Recibo</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Motivo de anulación"
              fullWidth
              multiline
              rows={4}
              value={anularDialog.motivo}
              onChange={(e) => setAnularDialog(prev => ({ ...prev, motivo: e.target.value }))}
              placeholder="Ingrese el motivo por el cual se anula este recibo..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAnularDialog({ open: false, reciboId: null, motivo: '' })}>
              Cancelar
            </Button>
            <Button
              onClick={handleAnularRecibo}
              color="error"
              disabled={!anularDialog.motivo.trim()}
            >
              Anular Recibo
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo para ver detalles del recibo */}
        <ReciboViewer
          open={detallesDialog.open}
          onClose={() => setDetallesDialog({ open: false, recibo: null, loading: false })}
          recibo={detallesDialog.recibo}
          onDownload={(id) => handleDescargarPdf(id)}
          onSend={(id) => handleEnviarRecibo(id)}
          loading={detallesDialog.loading || generatingPdf}
        />

        {/* Diálogo para crear/duplicar recibo libre */}
        <CrearReciboLibreDialog
          open={reciboLibreDialog.open}
          onClose={() => setReciboLibreDialog({ open: false, datosIniciales: null, modo: 'crear' })}
          onSubmit={handleCrearReciboLibre}
          loading={loading}
          datosIniciales={reciboLibreDialog.datosIniciales || undefined}
          modo={reciboLibreDialog.modo}
        />

        {/* Modal de Procesar Pago */}
        {pagoModal.recibo && (
          <ProcesarPagoModal
            open={pagoModal.open}
            onClose={() => setPagoModal({ open: false, recibo: null })}
            recibo={pagoModal.recibo}
            onSuccess={handlePagoExitoso}
          />
        )}

        {/* Dialog de Confirmación Bulk Delete */}
        <BulkDeleteConfirmDialog
          open={bulkDeleteDialog}
          onClose={() => setBulkDeleteDialog(false)}
          onConfirm={handleBulkDelete}
          selectedCount={selectedIds.length}
          entityName="recibos"
          loading={bulkDeleteLoading}
        />

        {/* Dialog de Progreso de Exportación */}
        <ExportProgressDialog
          progress={exportProgress}
          onClose={resetExportProgress}
        />

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Error global */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default RecibosPage;