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
  fetchCategoriasActividad,
  createCategoriaActividad,
  updateCategoriaActividad,
  deleteCategoriaActividad,
  setSelectedCategoria,
  clearError,
  setShowInactive,
} from '../../store/slices/categoriasActividadSlice';
import type { CategoriaActividad, CreateCategoriaActividadDto, UpdateCategoriaActividadDto } from '../../types/categoriaActividad.types';
import { CategoriaActividadForm } from '../../components/categoriasActividad/CategoriaActividadForm';
import { CategoriaActividadBadge } from '../../components/categoriasActividad/CategoriaActividadBadge';

const CategoriasActividadPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { categorias, loading, error, selectedCategoria, showInactive } = useAppSelector(
    (state) => state.categoriasActividad
  );

  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [categoriaToDelete, setCategoriaToDelete] = useState<CategoriaActividad | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtrosExpanded, setFiltrosExpanded] = useState(false);
  const [mainTab, setMainTab] = useState(0);

  useEffect(() => {
    dispatch(fetchCategoriasActividad({ includeInactive: showInactive }));
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

  const handleOpenDialog = (categoria?: CategoriaActividad) => {
    if (categoria) {
      dispatch(setSelectedCategoria(categoria));
    } else {
      dispatch(setSelectedCategoria(null));
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    dispatch(setSelectedCategoria(null));
  };

  const handleSubmit = async (data: CreateCategoriaActividadDto | UpdateCategoriaActividadDto) => {
    try {
      if (selectedCategoria) {
        // Actualizar
        await dispatch(updateCategoriaActividad({ id: selectedCategoria.id, data })).unwrap();
        alert('Categoría de actividad actualizada exitosamente');
      } else {
        // Crear
        await dispatch(createCategoriaActividad(data as CreateCategoriaActividadDto)).unwrap();
        alert('Categoría de actividad creada exitosamente');
      }
      handleCloseDialog();
      dispatch(fetchCategoriasActividad({ includeInactive: showInactive }));
    } catch (err) {
      // El error ya está en el estado, se muestra en el formulario
      console.error('Error al guardar categoría de actividad:', err);
    }
  };

  const handleOpenDeleteDialog = (categoria: CategoriaActividad) => {
    setCategoriaToDelete(categoria);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setCategoriaToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!categoriaToDelete) return;

    try {
      await dispatch(deleteCategoriaActividad(categoriaToDelete.id)).unwrap();
      alert('Categoría de actividad desactivada exitosamente');
      handleCloseDeleteDialog();
      dispatch(fetchCategoriasActividad({ includeInactive: showInactive }));
    } catch (err) {
      // El error ya está en el estado
      console.error('Error al eliminar categoría de actividad:', err);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    dispatch(setShowInactive(false));
  };

  // Filtrado local
  const filteredCategorias = categorias.filter((categoria) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      searchTerm === '' ||
      categoria.nombre.toLowerCase().includes(searchLower) ||
      (categoria.descripcion && categoria.descripcion.toLowerCase().includes(searchLower));

    return matchesSearch;
  });

  const columns: GridColDef[] = [
    {
      field: 'nombre',
      headerName: 'Nombre',
      width: 300,
      renderCell: (params) => <CategoriaActividadBadge categoria={params.row} />,
    },
    {
      field: 'descripcion',
      headerName: 'Descripción',
      width: 300,
      renderCell: (params) => params.value || '-',
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
        return (
          <Chip
            label={count}
            color={count > 0 ? 'primary' : 'default'}
            size="small"
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'activo',
      headerName: 'Estado',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Activo' : 'Inactivo'}
          color={params.value ? 'success' : 'error'}
          variant="outlined"
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Acciones',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Editar"
          onClick={() => handleOpenDialog(params.row)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Eliminar"
          onClick={() => handleOpenDeleteDialog(params.row)}
        />,
      ],
    },
  ];

  const totalCategorias = categorias.length;
  const activasCategorias = categorias.filter((c) => c.activo).length;
  const inactivasCategorias = categorias.filter((c) => !c.activo).length;

  // Estadísticas para cards
  const estadisticas = useMemo<EstadisticaItem[]>(() => [
    {
      label: 'Total Categorías',
      value: totalCategorias,
      icon: CategoryIcon,
      color: 'primary',
      formato: 'numero',
    },
    {
      label: 'Activas',
      value: activasCategorias,
      icon: CheckCircleIcon,
      color: 'success',
      formato: 'numero',
    },
    {
      label: 'Inactivas',
      value: inactivasCategorias,
      icon: CancelIcon,
      color: 'error',
      formato: 'numero',
    },
  ], [totalCategorias, activasCategorias, inactivasCategorias]);

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
        titulo="Categorías de Actividades"
        subtitulo="Las categorías de actividad clasifican las actividades según el público objetivo (Infantil, Juvenil, Adulto, etc.)"
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Actividades', href: '/actividades' },
          { label: 'Categorías de Actividades' },
        ]}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Nueva Categoría
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

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
                  label="Mostrar inactivas"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  {filteredCategorias.length} de {totalCategorias} categorías
                </Typography>
              </Grid>
            </Grid>
          </FiltrosAccordion>

          {/* Tabla */}
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={filteredCategorias}
              columns={columns}
              loading={loading}
              paginationModel={{ pageSize: 10, page: 0 }}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              sx={{
                '& .MuiDataGrid-cell': {
                  padding: '8px',
                },
              }}
            />
          </Box>
        </>
      )}

      {/* TAB 1: Panel de Estadísticas */}
      {mainTab === 1 && (
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
          <Stack spacing={4}>
            <Box>
              <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryIcon /> Estadísticas de Categorías de Actividades
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <CategoryIcon color="primary" sx={{ fontSize: 40 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Total Categorías
                          </Typography>
                          <Typography variant="h4" color="primary">
                            {totalCategorias}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Activas
                          </Typography>
                          <Typography variant="h4" color="success.main">
                            {activasCategorias}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <CancelIcon color="error" sx={{ fontSize: 40 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Inactivas
                          </Typography>
                          <Typography variant="h4" color="error.main">
                            {inactivasCategorias}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* Dialog para crear/editar */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedCategoria ? 'Editar Categoría de Actividad' : 'Nueva Categoría de Actividad'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <CategoriaActividadForm
              initialData={selectedCategoria}
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
            ¿Está seguro que desea desactivar la categoría de actividad{' '}
            <strong>"{categoriaToDelete?.nombre}"</strong>?
            <br />
            <br />
            {categoriaToDelete?._count?.actividades && categoriaToDelete._count.actividades > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Esta categoría tiene {categoriaToDelete._count.actividades} actividad(es) asociada(s).
                Al desactivarla, ya no estará disponible para nuevas actividades.
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

export default CategoriasActividadPage;
