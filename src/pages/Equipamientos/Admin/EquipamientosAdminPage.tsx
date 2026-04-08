import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Alert,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  InputAdornment,
  Tabs,
  Tab,
  Grid,
  Divider,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Restore as RestoreIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp,
  ViewList,
  BarChart,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import FormHelperText from '@mui/material/FormHelperText';

import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { showNotification } from '@/store/slices/uiSlice';
import {
  fetchEquipamientos,
  createEquipamiento,
  updateEquipamiento,
  deleteEquipamiento,
  reactivateEquipamiento,
} from '@/store/slices/equipamientosSlice';
import {
  createEquipamientoSchema,
  updateEquipamientoSchema,
  type CreateEquipamientoFormData,
  type UpdateEquipamientoFormData,
} from '@/schemas/equipamiento.schema';
import type { Equipamiento, CategoriaEquipamiento, EstadoEquipamiento } from '@/types/equipamiento.types';
import {
  getCategoriaLabel,
  getCategoriaColor,
  getEstadoLabel,
  getEstadoColor,
} from '@/types/equipamiento.types';
import { equipamientosApi } from '@/services/equipamientosApi';
import { SeccionPaginaTitulo } from '@/components/common/SeccionPaginaTitulo';
import { EstadisticasCards, type EstadisticaItem } from '@/components/common/EstadisticasCards';
import { FiltrosAccordion } from '@/components/common/FiltrosAccordion';
import { formatDateLongES } from '@/utils/dateHelpers';

/**
 * Página de administración de Equipamientos
 * Permite crear, editar y eliminar equipamientos disponibles para aulas
 */
const EquipamientosAdminPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.equipamientos);

  // Estados de UI
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Equipamiento | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Equipamiento | null>(null);
  const [itemToView, setItemToView] = useState<Equipamiento | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // Estados para Tabs y Accordion
  // Tab principal (Vista General | Estadísticas)
  const [mainTab, setMainTab] = useState(0);

  // Acordeón de filtros (solo en Vista General)
  const [filtrosExpanded, setFiltrosExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [verTodos, setVerTodos] = useState(false);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoriaId, setFiltroCategoriaId] = useState<number | ''>('');
  const [filtroEstadoId, setFiltroEstadoId] = useState<number | ''>('');
  const [filtroSoloConStock, setFiltroSoloConStock] = useState(false);

  // Estado para categorías
  const [categorias, setCategorias] = useState<CategoriaEquipamiento[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);

  // NUEVO: Estado para estados de equipamiento
  const [estados, setEstados] = useState<EstadoEquipamiento[]>([]);
  const [loadingEstados, setLoadingEstados] = useState(false);

  // Cargar equipamientos, categorías y estados al montar
  useEffect(() => {
    // Cargar todos los equipamientos (activos e inactivos)
    // El filtrado se hace en el frontend según showInactive
    dispatch(fetchEquipamientos({ includeInactive: true, limit: 100 }));

    // Cargar categorías desde API
    const loadCategorias = async () => {
      setLoadingCategorias(true);
      try {
        const cats = await equipamientosApi.getCategorias();
        setCategorias(cats);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      } finally {
        setLoadingCategorias(false);
      }
    };

    // NUEVO: Cargar estados desde API
    const loadEstados = async () => {
      setLoadingEstados(true);
      try {
        const ests = await equipamientosApi.getEstados();
        setEstados(ests);
      } catch (error) {
        console.error('Error al cargar estados:', error);
      } finally {
        setLoadingEstados(false);
      }
    };

    loadCategorias();
    loadEstados();
  }, [dispatch]);

  // Form hook
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateEquipamientoFormData | UpdateEquipamientoFormData>({
    resolver: zodResolver(selectedItem ? updateEquipamientoSchema : createEquipamientoSchema),
    defaultValues: selectedItem
      ? {
          nombre: selectedItem.nombre,
          descripcion: selectedItem.descripcion || '',
          observaciones: selectedItem.observaciones || '',
          categoriaEquipamientoId: selectedItem.categoriaEquipamiento?.id,
          estadoEquipamientoId: selectedItem.estadoEquipamientoId, // NUEVO
          cantidad: selectedItem.cantidad || 1, // NUEVO
        }
      : {
          nombre: '',
          descripcion: '',
          observaciones: '',
          categoriaEquipamientoId: '' as any,
          estadoEquipamientoId: '' as any, // NUEVO
          cantidad: 1, // NUEVO: Default 1
        },
  });

  // Resetear form cuando cambia selectedItem
  useEffect(() => {
    if (selectedItem) {
      reset({
        nombre: selectedItem.nombre,
        descripcion: selectedItem.descripcion || '',
        observaciones: selectedItem.observaciones || '',
        categoriaEquipamientoId: selectedItem.categoriaEquipamiento?.id,
        estadoEquipamientoId: selectedItem.estadoEquipamientoId, // NUEVO
        cantidad: selectedItem.cantidad || 1, // NUEVO
      });
    } else {
      reset({
        nombre: '',
        descripcion: '',
        observaciones: '',
        categoriaEquipamientoId: '' as any,
        estadoEquipamientoId: '' as any, // NUEVO
        cantidad: 1, // NUEVO
      });
    }
  }, [selectedItem, reset]);

  // Handlers
  const handleAddClick = () => {
    setSelectedItem(null);
    setFormOpen(true);
  };

  const handleEditClick = (item: Equipamiento) => {
    setSelectedItem(item);
    setFormOpen(true);
  };

  const handleDeleteClick = (item: Equipamiento) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleViewClick = (item: Equipamiento) => {
    setItemToView(item);
    setDetailDialogOpen(true);
  };

  const handleDetailDialogClose = () => {
    setDetailDialogOpen(false);
    setItemToView(null);
  };

  const handleEditFromDetail = () => {
    if (itemToView) {
      const itemToEdit = itemToView;

      // Guardar referencia al botón enfocado antes de cerrar
      const activeElement = document.activeElement;

      // Mover el foco a un elemento seguro (body) antes de cerrar el dialog
      if (activeElement instanceof HTMLElement && activeElement.blur) {
        activeElement.blur();
      }

      // Enfocar temporalmente en body para liberar el foco del dialog
      if (document.body) {
        document.body.focus();
      }

      // Primero cerrar el dialog de detalle completamente
      setDetailDialogOpen(false);
      setItemToView(null);

      // Delay para asegurar que el dialog de detalle se cierre completamente y
      // MUI quite el aria-hidden del root antes de abrir el de edición
      setTimeout(() => {
        setSelectedItem(itemToEdit);
        setFormOpen(true);
      }, 300);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedItem(null);
    reset();
  };

  const handleFormSubmit = async (data: CreateEquipamientoFormData | UpdateEquipamientoFormData) => {
    try {
      if (selectedItem) {
        // Actualizar existente
        await dispatch(
          updateEquipamiento({
            id: selectedItem.id,
            data: data as UpdateEquipamientoFormData,
          })
        ).unwrap();

        dispatch(
          showNotification({
            message: 'Equipamiento actualizado exitosamente',
            severity: 'success',
          })
        );
      } else {
        // Crear nuevo
        await dispatch(createEquipamiento(data as CreateEquipamientoFormData)).unwrap();

        dispatch(
          showNotification({
            message: 'Equipamiento creado exitosamente',
            severity: 'success',
          })
        );
      }

      handleFormClose();
    } catch (error: any) {
      console.error('Error al guardar equipamiento:', error);

      dispatch(
        showNotification({
          message: error || 'Error al guardar equipamiento',
          severity: 'error',
        })
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      await dispatch(deleteEquipamiento(itemToDelete.id)).unwrap();

      dispatch(
        showNotification({
          message: 'Equipamiento eliminado exitosamente',
          severity: 'success',
        })
      );

      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error: any) {
      console.error('Error al eliminar equipamiento:', error);

      dispatch(
        showNotification({
          message: error || 'Error al eliminar equipamiento',
          severity: 'error',
        })
      );
    }
  };

  const handleReactivate = async (item: Equipamiento) => {
    if (window.confirm(`¿Está seguro que desea reactivar el equipamiento "${item.nombre}"?`)) {
      try {
        await dispatch(reactivateEquipamiento(item.id)).unwrap();

        dispatch(
          showNotification({
            message: `Equipamiento "${item.nombre}" reactivado exitosamente`,
            severity: 'success',
          })
        );
      } catch (error: any) {
        console.error('Error al reactivar equipamiento:', error);

        dispatch(
          showNotification({
            message: error || 'Error al reactivar equipamiento',
            severity: 'error',
          })
        );
      }
    }
  };

  // Función para limpiar filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setFiltroCategoriaId('');
    setFiltroEstadoId('');
    setFiltroSoloConStock(false);
  };

  // Filtrar según múltiples criterios
  const itemsFiltrados = items.filter((item) => {
    // Filtro por activo/inactivo
    if (!showInactive && !item.activo) return false;

    // Filtro de búsqueda (nombre o descripción)
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' ||
      item.nombre.toLowerCase().includes(searchLower) ||
      (item.descripcion && item.descripcion.toLowerCase().includes(searchLower));

    // Filtro por categoría
    const matchesCategoria = filtroCategoriaId === '' || item.categoriaEquipamiento?.id === filtroCategoriaId;

    // Filtro por estado de equipamiento
    const matchesEstado = filtroEstadoId === '' || item.estadoEquipamientoId === filtroEstadoId;

    // Filtro por stock (solo con cantidad > 0)
    const matchesStock = !filtroSoloConStock || (item.cantidad && item.cantidad > 0);

    return matchesSearch && matchesCategoria && matchesEstado && matchesStock;
  });

  // Ordenar items filtrados (por nombre)
  const itemsOrdenados = [...itemsFiltrados].sort((a, b) => {
    return a.nombre.localeCompare(b.nombre);
  });

  // Slice para paginación client-side
  const itemsPaginados = verTodos
    ? itemsOrdenados
    : itemsOrdenados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleEquipamientosPageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleEquipamientosRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setVerTodos(false);
  };

  const handleToggleVerTodosEquipamientos = () => {
    setVerTodos(prev => !prev);
    setPage(0);
  };

  // TAB 1 - Estadísticas Generales
  const estadisticasGenerales = useMemo<EstadisticaItem[]>(() => {
    const totalEquipamientos = items.length;
    const equipamientosActivos = items.filter((e) => e.activo).length;
    const totalStock = items.reduce((sum, e) => sum + (e.cantidad || 0), 0);
    const conStock = items.filter((e) => (e.cantidad || 0) > 0).length;

    return [
      {
        label: 'Total Equipamientos',
        value: totalEquipamientos,
        icon: InventoryIcon,
        color: 'primary',
        formato: 'numero',
        subtitle: `${equipamientosActivos} activos`,
      },
      {
        label: 'Con Stock',
        value: conStock,
        icon: CheckCircleIcon,
        color: 'success',
        formato: 'numero',
        subtitle: 'Disponibles',
      },
      {
        label: 'Stock Total',
        value: totalStock,
        icon: TrendingUp,
        color: 'info',
        formato: 'numero',
        subtitle: 'Unidades totales',
      },
    ];
  }, [items]);

  // TAB 2 - Por Categoría (Top 4)
  const estadisticasPorCategoria = useMemo<EstadisticaItem[]>(() => {
    const categoriasCount: Record<string, { nombre: string; count: number; stock: number }> = {};
    items.forEach((item) => {
      const catNombre = item.categoriaEquipamiento?.nombre || 'Sin categoría';
      if (!categoriasCount[catNombre]) {
        categoriasCount[catNombre] = { nombre: catNombre, count: 0, stock: 0 };
      }
      categoriasCount[catNombre].count++;
      categoriasCount[catNombre].stock += item.cantidad || 0;
    });

    return Object.values(categoriasCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
      .map((cat) => ({
        label: cat.nombre,
        value: cat.count,
        icon: CategoryIcon,
        color: 'secondary',
        formato: 'numero',
        subtitle: `${cat.stock} unidades`,
      }));
  }, [items]);

  // TAB 3 - Por Estado (Top 4)
  const estadisticasPorEstado = useMemo<EstadisticaItem[]>(() => {
    const estadosCount: Record<string, { nombre: string; count: number }> = {};
    items.forEach((item) => {
      const estadoNombre = item.estadoEquipamiento?.nombre || 'Sin estado';
      if (!estadosCount[estadoNombre]) {
        estadosCount[estadoNombre] = { nombre: estadoNombre, count: 0 };
      }
      estadosCount[estadoNombre].count++;
    });

    return Object.values(estadosCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
      .map((est) => ({
        label: est.nombre,
        value: est.count,
        icon: CheckCircleIcon,
        color: 'warning',
        formato: 'numero',
      }));
  }, [items]);

  // Contador de filtros activos
  const filtrosActivos =
    (searchTerm ? 1 : 0) +
    (filtroCategoriaId !== '' ? 1 : 0) +
    (filtroEstadoId !== '' ? 1 : 0) +
    (filtroSoloConStock ? 1 : 0) +
    (showInactive ? 1 : 0);

  return (
    <Box>
      {/* Header */}
      <SeccionPaginaTitulo
        titulo="Administración de Equipamientos"
        subtitulo="Gestiona los equipamientos disponibles para asignar a las aulas"
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Equipamientos' },
        ]}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            size="large"
            disabled={loading}
          >
            Nuevo Equipamiento
          </Button>
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
          {/* Sección de Búsqueda y Filtros */}
      <FiltrosAccordion
        expanded={filtrosExpanded}
        onToggle={() => setFiltrosExpanded(!filtrosExpanded)}
        activeCount={filtrosActivos}
        onClearFilters={handleClearFilters}
      >
        <Grid container spacing={2}>
          {/* Campo de Búsqueda */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Filtro por Categoría */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Categoría</InputLabel>
              <Select
                value={filtroCategoriaId}
                onChange={(e) => setFiltroCategoriaId(e.target.value as number | '')}
                label="Categoría"
                disabled={loadingCategorias}
              >
                <MenuItem value="">Todas</MenuItem>
                {categorias.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Filtro por Estado */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filtroEstadoId}
                onChange={(e) => setFiltroEstadoId(e.target.value as number | '')}
                label="Estado"
                disabled={loadingEstados}
              >
                <MenuItem value="">Todos</MenuItem>
                {estados.map((est) => (
                  <MenuItem key={est.id} value={est.id}>
                    {est.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Filtro Solo con Stock */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={filtroSoloConStock}
                  onChange={(e) => setFiltroSoloConStock(e.target.checked)}
                  color="primary"
                />
              }
              label="Solo con stock"
            />
          </Grid>

          {/* Mostrar Eliminados */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  color="warning"
                />
              }
              label="Mostrar eliminados"
            />
          </Grid>

          {/* Contador de Resultados */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {itemsFiltrados.length} de {items.length} equipamientos
            </Typography>
          </Grid>
        </Grid>
      </FiltrosAccordion>

      {/* Info */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Los equipamientos son recursos que pueden estar disponibles en las aulas (ej: Piano,
        Proyector, Pizarra). Una vez creados, podrán ser asignados a las aulas desde el módulo de
        Gestión de Aulas.
      </Alert>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabla */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="200px">Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell width="150px" align="center">
                Categoría
              </TableCell>
              <TableCell width="100px" align="center">
                Estado Equip.
              </TableCell>
              <TableCell width="80px" align="center">
                Cantidad
              </TableCell>
              <TableCell width="100px" align="center">
                Activo
              </TableCell>
              <TableCell width="80px" align="center">
                Orden
              </TableCell>
              <TableCell width="120px" align="center">
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress size={40} />
                </TableCell>
              </TableRow>
            ) : itemsOrdenados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No hay equipamientos creados
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              itemsPaginados.map((item) => {
                const isInactive = !item.activo;

                return (
                  <TableRow key={item.id} hover sx={{ opacity: isInactive ? 0.6 : 1 }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span style={{ opacity: isInactive ? 0.7 : 1 }}>{item.nombre}</span>
                        {isInactive && (
                          <Chip
                            label="ELIMINADO"
                            color="error"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ opacity: isInactive ? 0.7 : 1 }}>
                      {item.descripcion || '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getCategoriaLabel(item.categoriaEquipamiento)}
                        color={getCategoriaColor(item.categoriaEquipamiento)}
                        size="small"
                      />
                    </TableCell>
                    {/* NUEVO: Columna de Estado del Equipamiento */}
                    <TableCell align="center">
                      {item.estadoEquipamiento ? (
                        <Chip
                          label={getEstadoLabel(item.estadoEquipamiento)}
                          color={getEstadoColor(item.estadoEquipamiento)}
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    {/* NUEVO: Columna de Cantidad */}
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="medium">
                        {item.cantidad || 0}
                      </Typography>
                    </TableCell>
                    {/* Columna de Activo (soft delete) */}
                    <TableCell align="center">
                      <Chip
                        label={item.activo ? 'Activo' : 'Inactivo'}
                        color={item.activo ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver detalles">
                        <IconButton size="small" onClick={() => handleViewClick(item)} color="info">
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      {isInactive ? (
                        <Tooltip title="Reactivar">
                          <IconButton size="small" onClick={() => handleReactivate(item)} color="success">
                            <RestoreIcon />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <>
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => handleEditClick(item)} color="primary">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton size="small" onClick={() => handleDeleteClick(item)} color="error">
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} px={1} py={0.5}>
          <Button
            variant={verTodos ? 'contained' : 'outlined'}
            size="small"
            color="secondary"
            onClick={handleToggleVerTodosEquipamientos}
            startIcon={<ViewList />}
          >
            {verTodos ? `Mostrando todos (${itemsFiltrados.length} equipamientos)` : 'Ver todos'}
          </Button>
          {!verTodos && (
            <TablePagination
              component="div"
              count={itemsFiltrados.length}
              page={page}
              onPageChange={handleEquipamientosPageChange}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleEquipamientosRowsPerPageChange}
              rowsPerPageOptions={[10, 20, 50, 100]}
              labelRowsPerPage="Registros por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}–${to} de ${count} equipamientos`
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
            {/* BLOQUE 1: Estadísticas Generales */}
            <Box>
              <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InventoryIcon /> Estadísticas Generales
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <InventoryIcon color="primary" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      {items.length}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Total Equipamientos
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {items.filter((e) => e.activo).length} activos
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {items.filter((e) => (e.cantidad || 0) > 0).length}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Con Stock
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      Disponibles
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <TrendingUp color="info" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="info.main">
                      {items.reduce((sum, e) => sum + (e.cantidad || 0), 0)}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Stock Total
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      Unidades totales
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* BLOQUE 2: Top 4 Categorías */}
            <Box>
              <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryIcon /> Top Categorías
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

            <Divider />

            {/* BLOQUE 3: Top 4 Estados */}
            <Box>
              <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon /> Por Estado
              </Typography>
              <Grid container spacing={2}>
                {estadisticasPorEstado.map((stat, index) => (
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
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* Formulario Dialog */}
      <Dialog
        open={formOpen}
        onClose={handleFormClose}
        maxWidth="sm"
        fullWidth
        disableEnforceFocus
        disableRestoreFocus
      >
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogTitle>
            {selectedItem ? 'Editar Equipamiento' : 'Nuevo Equipamiento'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Controller
                name="nombre"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre"
                    placeholder="Piano, Proyector, etc."
                    error={!!errors.nombre}
                    helperText={errors.nombre?.message}
                    required
                    fullWidth
                  />
                )}
              />

              <Controller
                name="descripcion"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Descripción"
                    placeholder="Descripción opcional del equipamiento"
                    error={!!errors.descripcion}
                    helperText={errors.descripcion?.message}
                    multiline
                    rows={3}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="observaciones"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Observaciones"
                    placeholder="Observaciones internas (opcional)"
                    error={!!errors.observaciones}
                    helperText={errors.observaciones?.message}
                    multiline
                    rows={4}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="categoriaEquipamientoId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.categoriaEquipamientoId} required>
                    <InputLabel>Categoría</InputLabel>
                    <Select {...field} label="Categoría" disabled={loadingCategorias}>
                      {loadingCategorias ? (
                        <MenuItem value="">Cargando...</MenuItem>
                      ) : categorias.length === 0 ? (
                        <MenuItem value="">No hay categorías disponibles</MenuItem>
                      ) : (
                        categorias.map((cat) => (
                          <MenuItem key={cat.id} value={cat.id}>
                            {cat.nombre}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                    {errors.categoriaEquipamientoId && (
                      <FormHelperText>{errors.categoriaEquipamientoId.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />

              {/* NUEVO: Campo de estado de equipamiento */}
              <Controller
                name="estadoEquipamientoId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.estadoEquipamientoId}>
                    <InputLabel>Estado</InputLabel>
                    <Select {...field} label="Estado" disabled={loadingEstados}>
                      <MenuItem value="">
                        <em>Sin estado</em>
                      </MenuItem>
                      {loadingEstados ? (
                        <MenuItem value="" disabled>Cargando...</MenuItem>
                      ) : estados.length === 0 ? (
                        <MenuItem value="" disabled>No hay estados disponibles</MenuItem>
                      ) : (
                        estados.map((est) => (
                          <MenuItem key={est.id} value={est.id}>
                            {est.nombre}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                    {errors.estadoEquipamientoId && (
                      <FormHelperText>{errors.estadoEquipamientoId.message}</FormHelperText>
                    )}
                    <FormHelperText>
                      Estado del equipamiento (Nuevo, Usado, etc.)
                    </FormHelperText>
                  </FormControl>
                )}
              />

              {/* NUEVO: Campo de cantidad */}
              <Controller
                name="cantidad"
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <TextField
                    {...field}
                    value={value ?? 1}
                    onChange={(e) => onChange(parseInt(e.target.value) || 1)}
                    label="Cantidad"
                    type="number"
                    placeholder="1"
                    error={!!errors.cantidad}
                    helperText={errors.cantidad?.message || 'Stock total del equipamiento (mínimo: 1)'}
                    inputProps={{ min: 1 }}
                    fullWidth
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleFormClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : selectedItem ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Detalle Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleDetailDialogClose}
        maxWidth="md"
        fullWidth
        disableEnforceFocus
      >
        <DialogTitle>Detalles del Equipamiento</DialogTitle>
        <DialogContent>
          {itemToView && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    ID
                  </Typography>
                  <Typography variant="body1">{itemToView.id}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Nombre
                  </Typography>
                  <Typography variant="body1">{itemToView.nombre}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Categoría
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={getCategoriaLabel(itemToView.categoriaEquipamiento)}
                      color={getCategoriaColor(itemToView.categoriaEquipamiento)}
                      size="small"
                    />
                  </Box>
                </Box>

                {/* NUEVO: Estado del Equipamiento */}
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Estado del Equipamiento
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    {itemToView.estadoEquipamiento ? (
                      <Chip
                        label={getEstadoLabel(itemToView.estadoEquipamiento)}
                        color={getEstadoColor(itemToView.estadoEquipamiento)}
                        size="small"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Sin estado
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* NUEVO: Cantidad */}
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Cantidad/Stock
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {itemToView.cantidad || 0} unidades
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Activo
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={itemToView.activo ? 'Activo' : 'Inactivo'}
                      color={itemToView.activo ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>

                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="caption" color="text.secondary">
                    Descripción
                  </Typography>
                  <Typography variant="body1">{itemToView.descripcion || '-'}</Typography>
                </Box>

                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="caption" color="text.secondary">
                    Observaciones
                  </Typography>
                  <Typography variant="body1">{itemToView.observaciones || '-'}</Typography>
                </Box>

                {itemToView.createdAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Creado
                    </Typography>
                    <Typography variant="body2">
                      {formatDateLongES(itemToView.createdAt)}
                    </Typography>
                  </Box>
                )}

                {itemToView.updatedAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Última modificación
                    </Typography>
                    <Typography variant="body2">
                      {formatDateLongES(itemToView.updatedAt)}
                    </Typography>
                  </Box>
                )}

                {itemToView._count?.aulas_equipamientos !== undefined && (
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="caption" color="text.secondary">
                      Aulas asignadas
                    </Typography>
                    <Typography variant="body1">
                      {itemToView._count.aulas_equipamientos === 0
                        ? 'No asignado a ninguna aula'
                        : `Asignado a ${itemToView._count.aulas_equipamientos} aula${itemToView._count.aulas_equipamientos > 1 ? 's' : ''}`}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDetailDialogClose}>Cerrar</Button>
          <Button onClick={handleEditFromDetail} variant="contained" startIcon={<EditIcon />}>
            Editar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        disableEnforceFocus
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar el equipamiento <strong>{itemToDelete?.nombre}</strong>?
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EquipamientosAdminPage;
