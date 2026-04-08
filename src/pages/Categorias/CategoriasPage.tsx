import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Stack,
  Tooltip,
  Switch,
  FormControlLabel,
  Alert,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Category as CategoryIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  VisibilityOff as VisibilityOffIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  ViewList,
  BarChart,
  TrendingUp,
} from '@mui/icons-material';
import { FiltrosAccordion } from '../../components/common/FiltrosAccordion';
import { EstadisticasCards, EstadisticaItem } from '../../components/common/EstadisticasCards';
import { SeccionPaginaTitulo } from '../../components/common/SeccionPaginaTitulo';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  toggleCategoria,
  setSelectedCategoria,
  clearError,
} from '../../store/slices/categoriasSlice';
import { showNotification } from '../../store/slices/uiSlice';
import { CategoriaSocio } from '../../types/categoria.types';
import CategoriaForm from '../../components/forms/CategoriaForm';

const CategoriasPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { categorias, loading, error, selectedCategoria, showInactive } = useAppSelector(
    (state) => state.categorias
  );

  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoriaToDelete, setCategoriaToDelete] = useState<CategoriaSocio | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtrosExpanded, setFiltrosExpanded] = useState(false);

  // Tab principal (Vista General | Estadísticas)
  const [mainTab, setMainTab] = useState(0);

  // Cargar categorías al montar el componente
  useEffect(() => {
    dispatch(fetchCategorias({ includeInactive }));
  }, [dispatch, includeInactive]);

  // Mostrar notificación de error si existe
  useEffect(() => {
    if (error) {
      dispatch(
        showNotification({
          message: error,
          severity: 'error',
        })
      );
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleAddClick = useCallback(() => {
    dispatch(setSelectedCategoria(null));
    setFormOpen(true);
  }, [dispatch]);

  const handleEditClick = useCallback((categoria: CategoriaSocio) => {
    dispatch(setSelectedCategoria(categoria));
    setFormOpen(true);
  }, [dispatch]);

  const handleDeleteClick = useCallback((categoria: CategoriaSocio) => {
    setCategoriaToDelete(categoria);
    setDeleteDialogOpen(true);
  }, []);

  const handleToggleClick = useCallback(async (categoria: CategoriaSocio) => {
    try {
      await dispatch(toggleCategoria(categoria.id)).unwrap();
      dispatch(
        showNotification({
          message: `Categoría ${categoria.activa ? 'desactivada' : 'activada'} exitosamente`,
          severity: 'success',
        })
      );
    } catch (error: any) {
      dispatch(
        showNotification({
          message: error || 'Error al cambiar el estado de la categoría',
          severity: 'error',
        })
      );
    }
  }, [dispatch]);

  const handleFormSubmit = useCallback(async (data: any) => {
    try {
      if (selectedCategoria) {
        // Actualizar categoría existente
        await dispatch(
          updateCategoria({
            id: selectedCategoria.id,
            data,
          })
        ).unwrap();
        dispatch(
          showNotification({
            message: 'Categoría actualizada exitosamente',
            severity: 'success',
          })
        );
      } else {
        // Crear nueva categoría
        await dispatch(createCategoria(data)).unwrap();
        dispatch(
          showNotification({
            message: 'Categoría creada exitosamente',
            severity: 'success',
          })
        );
      }
      setFormOpen(false);
      // Remover recarga innecesaria - el slice ya actualiza el estado
    } catch (error: any) {
      // El error se manejará en el formulario
      throw error;
    }
  }, [dispatch, selectedCategoria]);

  const handleDeleteConfirm = useCallback(async () => {
    if (categoriaToDelete) {
      try {
        await dispatch(deleteCategoria(categoriaToDelete.id)).unwrap();
        dispatch(
          showNotification({
            message: 'Categoría eliminada exitosamente',
            severity: 'success',
          })
        );
        setDeleteDialogOpen(false);
        setCategoriaToDelete(null);
      } catch (error: any) {
        dispatch(
          showNotification({
            message: error || 'Error al eliminar la categoría',
            severity: 'error',
          })
        );
      }
    }
  }, [dispatch, categoriaToDelete]);

  const formatMonto = useCallback((monto: string) => {
    const numero = parseFloat(monto);
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numero);
  }, []);

  // Función para limpiar filtros
  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
  }, []);

  // Filtrar y ordenar categorías memoizadas
  const categoriasFiltered = useMemo(() => {
    return categorias.filter((cat) => {
      // Filtro por estado activo/inactivo
      const matchesActive = includeInactive || cat.activa;

      // Filtro de búsqueda (nombre, descripción)
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' ||
        cat.nombre.toLowerCase().includes(searchLower) ||
        (cat.descripcion && cat.descripcion.toLowerCase().includes(searchLower));

      return matchesActive && matchesSearch;
    });
  }, [categorias, includeInactive, searchTerm]);

  const categoriasOrdenadas = useMemo(() => {
    return [...categoriasFiltered].sort((a, b) => a.orden - b.orden);
  }, [categoriasFiltered]);

  // Calcular estadísticas
  const estadisticas = useMemo<EstadisticaItem[]>(() => {
    const total = categorias.length;
    const activas = categorias.filter((c) => c.activa).length;
    const inactivas = total - activas;

    return [
      {
        label: 'Total Categorías',
        value: total,
        icon: CategoryIcon,
        color: 'primary',
        formato: 'numero',
      },
      {
        label: 'Activas',
        value: activas,
        icon: CheckCircleIcon,
        color: 'success',
        formato: 'numero',
      },
      {
        label: 'Inactivas',
        value: inactivas,
        icon: CancelIcon,
        color: 'error',
        formato: 'numero',
      },
    ];
  }, [categorias]);

  // Contar filtros activos
  const filtrosActivos = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    return count;
  }, [searchTerm]);

  return (
    <Box>
      {/* Header */}
      <SeccionPaginaTitulo
        titulo="Gestión de Categorías de Socios"
        subtitulo="Administre las categorías de socios, montos de cuota y descuentos."
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Categorías' },
        ]}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            size="large"
          >
            Nueva Categoría
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
          {/* Controles */}
      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <FormControlLabel
          control={
            <Switch
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
          }
          label="Mostrar categorías inactivas"
        />
        <Typography variant="body2" color="text.secondary">
          Mostrando: {categoriasOrdenadas.length} de {categorias.length} categorías
        </Typography>
      </Box>

      {/* Sección de Filtros con Accordion */}
      <FiltrosAccordion
        expanded={filtrosExpanded}
        onToggle={() => setFiltrosExpanded(!filtrosExpanded)}
        activeCount={filtrosActivos}
        onClearFilters={handleClearFilters}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
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
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary">
              {categoriasOrdenadas.length} de {categorias.length} categorías
            </Typography>
          </Grid>
        </Grid>
      </FiltrosAccordion>

      {/* Información */}
      {categoriasOrdenadas.length === 0 && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {includeInactive
            ? 'No hay categorías registradas en el sistema.'
            : 'No hay categorías activas. Active el switch para ver las inactivas.'}
        </Alert>
      )}

      {/* Tabla */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Orden</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell align="right">Monto Cuota</TableCell>
              <TableCell align="center">Descuento</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="center">Uso</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Cargando categorías...
                </TableCell>
              </TableRow>
            )}
            {!loading && categoriasOrdenadas.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No hay categorías para mostrar
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              categoriasOrdenadas.map((categoria) => (
                <TableRow
                  key={categoria.id}
                  hover
                  sx={{
                    opacity: categoria.activa ? 1 : 0.6,
                    backgroundColor: categoria.activa ? 'inherit' : 'action.hover',
                  }}
                >
                  <TableCell>
                    <Chip label={categoria.orden} size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">{categoria.nombre}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {categoria.descripcion || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" fontWeight="medium">
                      {formatMonto(categoria.montoCuota)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {parseFloat(categoria.descuento) > 0 ? (
                      <Chip
                        label={`${categoria.descuento}%`}
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip
                      title={categoria.activa ? 'Click para desactivar' : 'Click para activar'}
                    >
                      <Chip
                        label={categoria.activa ? 'Activa' : 'Inactiva'}
                        color={categoria.activa ? 'success' : 'default'}
                        size="small"
                        variant={categoria.activa ? 'filled' : 'outlined'}
                        onClick={() => handleToggleClick(categoria)}
                        sx={{ cursor: 'pointer' }}
                        icon={categoria.activa ? <ViewIcon /> : <VisibilityOffIcon />}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    {categoria._count ? (
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Socios con esta categoría">
                          <Chip
                            label={`${categoria._count.personas} socios`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Tooltip>
                        <Tooltip title="Cuotas generadas">
                          <Chip
                            label={`${categoria._count.cuotas} cuotas`}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        </Tooltip>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Editar categoría">
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(categoria)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip
                        title={
                          categoria._count &&
                          (categoria._count.personas > 0 || categoria._count.cuotas > 0)
                            ? 'No se puede eliminar: tiene socios o cuotas asociadas'
                            : 'Eliminar categoría'
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(categoria)}
                            color="error"
                            disabled={
                              categoria._count &&
                              (categoria._count.personas > 0 || categoria._count.cuotas > 0)
                            }
                          >
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
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
                <CategoryIcon /> Estadísticas de Categorías
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <CategoryIcon color="primary" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      {categorias.length}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Total Categorías
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {categorias.filter((c) => c.activa).length}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Activas
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <CancelIcon color="error" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="error.main">
                      {categorias.length - categorias.filter((c) => c.activa).length}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Inactivas
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* BLOQUE 2: Uso de Categorías (Si hay datos de _count) */}
            <Box>
              <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp /> Uso de Categorías
              </Typography>
              <Grid container spacing={2}>
                {categorias
                  .filter(c => c._count && (c._count.personas > 0 || c._count.cuotas > 0))
                  .sort((a, b) => (b._count?.personas || 0) - (a._count?.personas || 0))
                  .slice(0, 4)
                  .map((categoria, index) => (
                    <Grid key={categoria.id} size={{ xs: 12, sm: 6, md: 3 }}>
                      <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                        <Box display="flex" justifyContent="center" mb={1}>
                          <CategoryIcon color={(['primary', 'secondary', 'success', 'info'] as const)[index]} sx={{ fontSize: 36 }} />
                        </Box>
                        <Typography variant="h3" fontWeight="bold" color={`${(['primary', 'secondary', 'success', 'info'] as const)[index]}.main`}>
                          {categoria._count?.personas || 0}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" noWrap>
                          {categoria.nombre}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {categoria._count?.cuotas || 0} cuotas
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                {categorias.every(c => !c._count || (c._count.personas === 0 && c._count.cuotas === 0)) && (
                  <Grid size={{ xs: 12 }}>
                    <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary">
                        No hay información de uso disponible
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* Formulario */}
      <CategoriaForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        categoria={selectedCategoria}
        loading={loading}
      />

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar la categoría{' '}
            <strong>{categoriaToDelete?.nombre}</strong>?
            <br />
            <br />
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

export default CategoriasPage;
