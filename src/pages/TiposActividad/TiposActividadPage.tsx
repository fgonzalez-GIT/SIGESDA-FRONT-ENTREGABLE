import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  FormControlLabel,
  Switch,
  Paper,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
  Tabs,
  Tab,
  Divider,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Category as CategoryIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ViewList,
  BarChart,
} from '@mui/icons-material';
import { FiltrosAccordion } from '../../components/common/FiltrosAccordion';
import { EstadisticasCards, EstadisticaItem } from '../../components/common/EstadisticasCards';
import { SeccionPaginaTitulo } from '../../components/common/SeccionPaginaTitulo';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  fetchTiposActividad,
  createTipoActividad,
  updateTipoActividad,
  deleteTipoActividad,
  setSelectedTipo,
  clearError,
  setShowInactive,
} from '../../store/slices/tiposActividadSlice';
import type { TipoActividad, CreateTipoActividadDto, UpdateTipoActividadDto } from '../../types/tipoActividad.types';
import { TipoActividadForm } from '../../components/tiposActividad/TipoActividadForm';
import { TipoActividadBadge } from '../../components/tiposActividad/TipoActividadBadge';

// Estilos extraídos fuera del componente para evitar recreación
const dataGridStyle = {
  '& .MuiDataGrid-cell': {
    padding: '8px',
  },
};

// Componentes de celda memoizados para mejor rendimiento
const DescripcionCellRenderer = React.memo(({ value }: { value?: string }) => (
  <>{value || '-'}</>
));
DescripcionCellRenderer.displayName = 'DescripcionCellRenderer';

const ActividadesCountCellRenderer = React.memo(({ count }: { count: number }) => (
  <Chip
    label={count}
    color={count > 0 ? 'primary' : 'default'}
    size="small"
    variant="outlined"
  />
));
ActividadesCountCellRenderer.displayName = 'ActividadesCountCellRenderer';

const EstadoCellRenderer = React.memo(({ activo }: { activo: boolean }) => (
  <Chip
    label={activo ? 'Activo' : 'Inactivo'}
    color={activo ? 'success' : 'error'}
    variant="outlined"
    size="small"
  />
));
EstadoCellRenderer.displayName = 'EstadoCellRenderer';

const TiposActividadPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tipos, loading, error, selectedTipo, showInactive } = useAppSelector(
    (state) => state.tiposActividad
  );

  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [tipoToDelete, setTipoToDelete] = useState<TipoActividad | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtrosExpanded, setFiltrosExpanded] = useState(false);

  // Tab principal (Vista General | Estadísticas)
  const [mainTab, setMainTab] = useState(0);

  useEffect(() => {
    dispatch(fetchTiposActividad({ includeInactive: showInactive }));
  }, [dispatch, showInactive]);

  useEffect(() => {
    if (error) {
      // El error ya se muestra en el Alert, solo lo limpiamos después de 5 segundos
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleOpenDialog = useCallback((tipo?: TipoActividad) => {
    if (tipo) {
      dispatch(setSelectedTipo(tipo));
    } else {
      dispatch(setSelectedTipo(null));
    }
    setOpenDialog(true);
  }, [dispatch]);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    dispatch(setSelectedTipo(null));
  }, [dispatch]);

  const handleSubmit = useCallback(async (data: CreateTipoActividadDto | UpdateTipoActividadDto) => {
    try {
      if (selectedTipo) {
        // Actualizar
        await dispatch(updateTipoActividad({ id: selectedTipo.id, data })).unwrap();
        alert('Tipo de actividad actualizado exitosamente');
      } else {
        // Crear
        await dispatch(createTipoActividad(data as CreateTipoActividadDto)).unwrap();
        alert('Tipo de actividad creado exitosamente');
      }
      handleCloseDialog();
      dispatch(fetchTiposActividad({ includeInactive: showInactive }));
    } catch (err) {
      // El error ya está en el estado, se muestra en el formulario
      console.error('Error al guardar tipo de actividad:', err);
    }
  }, [dispatch, selectedTipo, showInactive, handleCloseDialog]);

  const handleOpenDeleteDialog = useCallback((tipo: TipoActividad) => {
    setTipoToDelete(tipo);
    setOpenDeleteDialog(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setOpenDeleteDialog(false);
    setTipoToDelete(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!tipoToDelete) return;

    try {
      await dispatch(deleteTipoActividad(tipoToDelete.id)).unwrap();
      alert('Tipo de actividad desactivado exitosamente');
      handleCloseDeleteDialog();
      dispatch(fetchTiposActividad({ includeInactive: showInactive }));
    } catch (err) {
      // El error ya está en el estado
      console.error('Error al eliminar tipo de actividad:', err);
    }
  }, [dispatch, tipoToDelete, showInactive, handleCloseDeleteDialog]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    dispatch(setShowInactive(false));
  }, [dispatch]);

  // Filtrado local memoizado
  const filteredTipos = useMemo(() => {
    return tipos.filter((tipo) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === '' ||
        tipo.nombre.toLowerCase().includes(searchLower) ||
        (tipo.descripcion && tipo.descripcion.toLowerCase().includes(searchLower));

      return matchesSearch;
    });
  }, [tipos, searchTerm]);

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'nombre',
      headerName: 'Nombre',
      width: 300,
      renderCell: (params) => <TipoActividadBadge tipo={params.row} />,
    },
    {
      field: 'descripcion',
      headerName: 'Descripción',
      width: 300,
      renderCell: (params) => <DescripcionCellRenderer value={params.value} />,
    },
    {
      field: 'orden',
      headerName: 'Orden',
      width: 100,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: '_count',
      headerName: 'Actividades',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const count = params.row._count?.actividades || 0;
        return <ActividadesCountCellRenderer count={count} />;
      },
    },
    {
      field: 'activo',
      headerName: 'Estado',
      width: 120,
      renderCell: (params) => <EstadoCellRenderer activo={params.value} />,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Acciones',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Editar"
          onClick={() => handleOpenDialog(params.row)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Eliminar"
          onClick={() => handleOpenDeleteDialog(params.row)}
        />,
      ],
    },
  ], [handleOpenDialog, handleOpenDeleteDialog]);

  // Estadísticas memoizadas
  const stats = useMemo(() => ({
    total: tipos.length,
    activos: tipos.filter((t) => t.activo).length,
    inactivos: tipos.filter((t) => !t.activo).length,
  }), [tipos]);

  // Estadísticas para cards
  const estadisticas = useMemo<EstadisticaItem[]>(() => [
    {
      label: 'Total Tipos',
      value: stats.total,
      icon: CategoryIcon,
      color: 'primary',
      formato: 'numero',
    },
    {
      label: 'Activos',
      value: stats.activos,
      icon: CheckCircleIcon,
      color: 'success',
      formato: 'numero',
    },
    {
      label: 'Inactivos',
      value: stats.inactivos,
      icon: CancelIcon,
      color: 'error',
      formato: 'numero',
    },
  ], [stats]);

  // Contar filtros activos
  const filtrosActivos = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (showInactive) count++;
    return count;
  }, [searchTerm, showInactive]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <SeccionPaginaTitulo
        titulo="Tipos de Actividades"
        subtitulo="Los tipos de actividad definen las categorías principales de actividades del sistema (Coro, Clase, Taller, etc.)"
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Actividades', href: '/actividades' },
          { label: 'Tipos de Actividades' },
        ]}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Nuevo Tipo
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
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => dispatch(clearError())}>
              {error}
            </Alert>
          )}

          {/* Filtros con Accordion */}
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
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showInactive}
                  onChange={(e) => dispatch(setShowInactive(e.target.checked))}
                />
              }
              label="Mostrar inactivos"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {filteredTipos.length} de {stats.total} tipos
            </Typography>
          </Grid>
        </Grid>
      </FiltrosAccordion>

      {/* Tabla */}
      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredTipos}
          columns={columns}
          loading={loading}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          sx={dataGridStyle}
        />
      </Box>
        </>
      )}

      {/* TAB 1: Panel de Estadísticas (Pantalla Completa) */}
      {mainTab === 1 && (
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
          <Stack spacing={4}>
            {/* BLOQUE 1: Estadísticas Generales */}
            <Box>
              <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryIcon /> Estadísticas de Tipos de Actividades
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <CategoryIcon color="primary" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      {stats.total}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Total Tipos
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {stats.activos}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Activos
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Paper elevation={2} sx={{ p: 2.5, textAlign: 'center' }}>
                    <Box display="flex" justifyContent="center" mb={1}>
                      <CancelIcon color="error" sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="error.main">
                      {stats.inactivos}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Inactivos
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* Dialog para crear/editar */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedTipo ? 'Editar Tipo de Actividad' : 'Nuevo Tipo de Actividad'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TipoActividadForm
              initialData={selectedTipo}
              onSubmit={handleSubmit}
              onCancel={handleCloseDialog}
              loading={loading}
              error={error}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea desactivar el tipo de actividad{' '}
            <strong>"{tipoToDelete?.nombre}"</strong>?
            <br />
            <br />
            {tipoToDelete?._count?.actividades && tipoToDelete._count.actividades > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Este tipo tiene {tipoToDelete._count.actividades} actividad(es) asociada(s).
                Al desactivarlo, ya no estará disponible para nuevas actividades.
              </Alert>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={loading}>
            {loading ? 'Desactivando...' : 'Desactivar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TiposActividadPage;
