import React, { useState, useMemo, useCallback, startTransition, useEffect } from 'react';
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
  Paper,
  Stack,
  Tab,
  Tabs,
} from '@mui/material';
import { Add as AddIcon, Category as CategoryIcon } from '@mui/icons-material';
import {
  CatalogoTable,
  CatalogoFormDialog,
  CatalogoDetailDialog,
  type CatalogoColumn,
  type CatalogoField,
  type CatalogoDetailField,
  renderEstadoChip,
  renderValueOrEmpty,
  renderFecha,
} from '@/components/personas/v2/admin';
import {
  catalogosItemsAdminApi,
  type CreateCategoriaItemDTO,
  type UpdateCategoriaItemDTO,
} from '@/services/catalogosItemsAdminApi';
import { itemsCuotaService } from '@/services/itemsCuotaService';
import {
  createCategoriaItemSchema,
  updateCategoriaItemSchema,
  type CreateCategoriaItemFormData,
  type UpdateCategoriaItemFormData,
} from '@/schemas/item-cuota.schema';
import type { CategoriaItem } from '@/types/cuota.types';
import { useAppDispatch } from '@/hooks/redux';
import { showNotification } from '@/store/slices/uiSlice';
import { EstadisticasCategoria } from '@/components/Cuotas/Admin/EstadisticasCategoria';

/**
 * Página de administración de Categorías de Ítems
 * Permite crear, editar, activar/desactivar y reordenar categorías
 */
const CategoriasItemAdminPage: React.FC = () => {
  const dispatch = useAppDispatch();

  // Estados de datos
  const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Estados de UI
  const [formOpen, setFormOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaItem | null>(null);
  const [categoriaToView, setCategoriaToView] = useState<CategoriaItem | null>(null);
  const [categoriaToDelete, setCategoriaToDelete] = useState<CategoriaItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Cargar categorías al montar el componente
  useEffect(() => {
    cargarCategorias();
  }, []);

  /**
   * Cargar categorías desde la API
   */
  const cargarCategorias = async () => {
    setLoading(true);
    try {
      const data = await itemsCuotaService.getCategoriasItems();
      setCategorias(data);
    } catch (error: any) {
      console.error('Error al cargar categorías:', error);
      dispatch(
        showNotification({
          message: 'Error al cargar categorías de ítems',
          severity: 'error',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  // Definición de columnas de la tabla (memoizada)
  const columns = useMemo<CatalogoColumn<CategoriaItem>[]>(() => [
    {
      id: 'nombre',
      label: 'Nombre',
      width: '200px',
      render: (item) => (
        <Stack direction="row" spacing={1} alignItems="center">
          {item.icono && <Typography>{item.icono}</Typography>}
          <Typography>{item.nombre}</Typography>
        </Stack>
      ),
    },
    {
      id: 'descripcion',
      label: 'Descripción',
      render: (item) => item.descripcion || '-',
    },
    {
      id: 'color',
      label: 'Color',
      width: '120px',
      render: (item) => item.color ? (
        <Box
          sx={{
            display: 'inline-block',
            width: 60,
            height: 24,
            bgcolor: item.color,
            border: '1px solid #ccc',
            borderRadius: 1,
          }}
        />
      ) : '-',
    },
    {
      id: 'activo',
      label: 'Estado',
      width: '100px',
      align: 'center',
      render: (item) => item.activo ? (
        <Chip label="Activo" color="success" size="small" />
      ) : (
        <Chip label="Inactivo" size="small" />
      ),
    },
    {
      id: 'orden',
      label: 'Orden',
      width: '80px',
      align: 'center',
    },
  ], []);

  // Definición de campos del formulario (memoizada)
  const formFields = useMemo<CatalogoField[]>(() => [
    {
      name: 'codigo',
      label: 'Código',
      type: 'text',
      placeholder: 'Se genera automáticamente...',
      helperText: 'Generado automáticamente a partir del nombre',
      required: true,
      readOnly: true, // Siempre solo lectura (se genera automáticamente)
    },
    {
      name: 'nombre',
      label: 'Nombre',
      type: 'text',
      placeholder: 'Categoría Base, Categoría Actividad, etc.',
      required: true,
    },
    {
      name: 'descripcion',
      label: 'Descripción',
      type: 'textarea',
      placeholder: 'Descripción opcional de la categoría',
      rows: 3,
    },
    {
      name: 'icono',
      label: 'Icono (Emoji)',
      type: 'text',
      placeholder: '📋',
      helperText: 'Icono emoji o texto corto (máx 10 caracteres)',
    },
    {
      name: 'color',
      label: 'Color',
      type: 'text',
      placeholder: '#1976d2 o blue',
      helperText: 'Código hex (#FFFFFF) o nombre de color CSS',
    },
    {
      name: 'orden',
      label: 'Orden',
      type: 'number',
      placeholder: '1, 2, 3...',
      helperText: 'Orden de visualización',
    },
  ], [selectedCategoria]);

  // Definición de campos para vista (memoizada)
  const viewFields = useMemo<CatalogoDetailField[]>(() => [
    {
      label: 'Estado',
      render: (item) => renderEstadoChip(item.activo),
      span: 12,
    },
    {
      label: 'Nombre',
      render: (item) => item.nombre,
      span: 12,
    },
    {
      label: 'Descripción',
      render: (item) => renderValueOrEmpty(item.descripcion),
      span: 12,
    },
    {
      label: 'Icono',
      render: (item) => (
        <Typography variant="h6">{renderValueOrEmpty(item.icono, '-')}</Typography>
      ),
      span: 6,
    },
    {
      label: 'Color',
      render: (item) => item.color ? (
        <Box
          sx={{
            display: 'inline-block',
            width: 80,
            height: 32,
            bgcolor: item.color,
            border: '1px solid #ccc',
            borderRadius: 1,
          }}
        />
      ) : '-',
      span: 6,
    },
    {
      label: 'Orden',
      render: (item) => item.orden,
      span: 6,
    },
    {
      label: 'Creado',
      render: (item) => renderFecha(item.createdAt),
      span: 6,
    },
    {
      label: 'Última modificación',
      render: (item) => renderFecha(item.updatedAt),
      span: 12,
    },
  ], []);

  // Handlers (memoizados)
  const handleAddClick = useCallback(() => {
    setSelectedCategoria(null);
    setFormOpen(true);
  }, []);

  const handleEditClick = useCallback((categoria: CategoriaItem) => {
    setSelectedCategoria(categoria);
    setFormOpen(true);
  }, []);

  const handleViewClick = useCallback((categoria: CategoriaItem) => {
    setCategoriaToView(categoria);
    setViewDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback(async (categoria: CategoriaItem) => {
    try {
      // Verificar relaciones antes de eliminar
      const relaciones = await catalogosItemsAdminApi.getRelacionesCategoriaItem(categoria.id);

      if (!relaciones.data.puedeEliminar) {
        dispatch(
          showNotification({
            message: `No se puede eliminar esta categoría porque tiene ${relaciones.data.totalTipos} tipos asociados (${relaciones.data.totalTiposActivos} activos)`,
            severity: 'warning',
          })
        );
        return;
      }
    } catch (error) {
      console.error('Error al verificar relaciones:', error);
    }

    setCategoriaToDelete(categoria);
    setDeleteDialogOpen(true);
  }, [dispatch]);

  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setSelectedCategoria(null);
  }, []);

  const handleFormSubmit = async (
    data: CreateCategoriaItemFormData | UpdateCategoriaItemFormData
  ) => {
    try {
      setSubmitting(true);

      if (selectedCategoria) {
        // Actualizar categoría existente
        await catalogosItemsAdminApi.updateCategoriaItem(
          selectedCategoria.id,
          data as UpdateCategoriaItemDTO
        );
        dispatch(
          showNotification({
            message: 'Categoría actualizada exitosamente',
            severity: 'success',
          })
        );
      } else {
        // Crear nueva categoría
        await catalogosItemsAdminApi.createCategoriaItem(data as CreateCategoriaItemDTO);
        dispatch(
          showNotification({
            message: 'Categoría creada exitosamente',
            severity: 'success',
          })
        );
      }

      // Cerrar el formulario inmediatamente
      setFormOpen(false);
      setSelectedCategoria(null);
      setSubmitting(false);

      // Refrescar categorías en segundo plano
      startTransition(() => {
        cargarCategorias();
      });
    } catch (error: any) {
      console.error('Error al guardar categoría:', error);

      const errorMessage = error.response?.data?.message || 'No es posible realizar la acción en este momento';
      dispatch(
        showNotification({
          message: errorMessage,
          severity: 'error',
        })
      );

      setSubmitting(false);
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!categoriaToDelete) return;

    try {
      setSubmitting(true);
      await catalogosItemsAdminApi.deleteCategoriaItem(categoriaToDelete.id);

      dispatch(
        showNotification({
          message: 'Categoría eliminada exitosamente',
          severity: 'success',
        })
      );

      setDeleteDialogOpen(false);
      setCategoriaToDelete(null);
      setSubmitting(false);

      // Refrescar categorías
      startTransition(() => {
        cargarCategorias();
      });
    } catch (error: any) {
      console.error('Error al eliminar categoría:', error);

      const errorMessage = error.response?.data?.message || 'No es posible eliminar la categoría en este momento';
      dispatch(
        showNotification({
          message: errorMessage,
          severity: 'error',
        })
      );

      setSubmitting(false);
    }
  };

  const handleReorder = async (reorderedItems: CategoriaItem[]) => {
    try {
      const ids = reorderedItems.map((item) => item.id);
      await catalogosItemsAdminApi.reordenarCategoriasItems(ids);

      dispatch(
        showNotification({
          message: 'Categorías reordenadas exitosamente',
          severity: 'success',
        })
      );

      // Refrescar categorías
      startTransition(() => {
        cargarCategorias();
      });
    } catch (error: any) {
      console.error('Error al reordenar categorías:', error);

      dispatch(
        showNotification({
          message: 'Error al reordenar categorías',
          severity: 'error',
        })
      );
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CategoryIcon color="primary" fontSize="large" />
            <Typography variant="h4">Categorías de Ítems</Typography>
          </Stack>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            disabled={loading}
          >
            Nueva Categoría
          </Button>
        </Stack>

        {/* Información */}
        <Alert severity="info" sx={{ mb: 3 }}>
          Las categorías de ítems agrupan los diferentes tipos de conceptos que pueden incluirse en las cuotas.
          Cada tipo de ítem pertenece a una categoría.
        </Alert>

        {/* Tabs */}
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
          <Tab label="Gestión" />
          <Tab label="Estadísticas" />
        </Tabs>

        {/* Contenido de tabs */}
        {tabValue === 0 && (
          <CatalogoTable<CategoriaItem>
            items={categorias}
            columns={columns}
            loading={loading}
            onView={handleViewClick}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onReorder={handleReorder}
          />
        )}

        {tabValue === 1 && (
          <EstadisticasCategoria tipo="categorias" />
        )}
      </Paper>

      {/* Formulario de crear/editar */}
      <CatalogoFormDialog
        open={formOpen}
        title={selectedCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
        fields={formFields}
        schema={selectedCategoria ? updateCategoriaItemSchema : createCategoriaItemSchema}
        defaultValues={selectedCategoria || {}}
        isEdit={!!selectedCategoria}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        autoGenerateCodigo={true}
        hideCodigoField={true}
      />

      {/* Diálogo de vista */}
      <CatalogoDetailDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setCategoriaToView(null);
        }}
        title="Detalles de Categoría de Ítem"
        item={categoriaToView}
        fields={viewFields}
      />

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar la categoría{' '}
            <strong>{categoriaToDelete?.nombre}</strong>?
            {' '}Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={submitting}
          >
            {submitting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoriasItemAdminPage;
