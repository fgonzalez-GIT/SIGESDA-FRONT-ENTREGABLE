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
  TextField,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { Add as AddIcon, ContentCopy, Assignment, AddCircle, RemoveCircle } from '@mui/icons-material';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateCodigoFromNombre } from '@/utils/string.helpers';
import {
  CatalogoTable,
  CatalogoDetailDialog,
  type CatalogoColumn,
  type CatalogoDetailField,
  renderEstadoChip,
  renderValueOrEmpty,
  renderFecha,
} from '@/components/personas/v2/admin';
import {
  catalogosItemsAdminApi,
  type CreateTipoItemDTO,
  type UpdateTipoItemDTO,
} from '@/services/catalogosItemsAdminApi';
import { itemsCuotaService } from '@/services/itemsCuotaService';
import {
  createTipoItemSchema,
  updateTipoItemSchema,
  type CreateTipoItemFormData,
  type UpdateTipoItemFormData,
} from '@/schemas/item-cuota.schema';
import type { TipoItemCuota, CategoriaItem } from '@/types/cuota.types';
import { useAppDispatch } from '@/hooks/redux';
import { showNotification } from '@/store/slices/uiSlice';
import { EstadisticasCategoria } from '@/components/Cuotas/Admin/EstadisticasCategoria';
// EditorFormulaJSON removed - formula complexity hidden from users
import { ClonacionDialog } from '@/components/Cuotas/Admin/ClonacionDialog';

/**
 * Página de administración de Tipos de Ítems de Cuotas
 * Permite crear, editar, clonar, activar/desactivar y reordenar tipos
 */
const TiposItemCuotaAdminPage: React.FC = () => {
  const dispatch = useAppDispatch();

  // Estados de datos
  const [tipos, setTipos] = useState<TipoItemCuota[]>([]);
  const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Estados de UI
  const [formOpen, setFormOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clonDialogOpen, setClonDialogOpen] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<TipoItemCuota | null>(null);
  const [tipoToView, setTipoToView] = useState<TipoItemCuota | null>(null);
  const [tipoToDelete, setTipoToDelete] = useState<TipoItemCuota | null>(null);
  const [tipoToClon, setTipoToClon] = useState<TipoItemCuota | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Form state
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTipoItemFormData | UpdateTipoItemFormData>({
    resolver: zodResolver(selectedTipo ? updateTipoItemSchema : createTipoItemSchema),
    defaultValues: {
      codigo: '',
      nombre: '',
      descripcion: '',
      categoriaItemId: undefined,
      esCalculado: false,
      formula: null,
      activo: true,
      orden: undefined,
      configurable: true,
      esDescuento: false,
    },
  });

  const categoriaItemIdWatch = watch('categoriaItemId');
  const esDescuentoWatch = watch('esDescuento' as keyof (CreateTipoItemFormData | UpdateTipoItemFormData));

  // Sugiere el efecto inicial cuando se selecciona una categoría (solo si el usuario no cambió el toggle)
  const efectoSugerido = useMemo(() => {
    if (!categoriaItemIdWatch) return null;
    const cat = categorias.find((c) => c.id === categoriaItemIdWatch);
    return cat?.codigo === 'DESCUENTO' ? true : false;
  }, [categoriaItemIdWatch, categorias]);

  // Helper para el efecto de un tipo ya guardado.
  // Prioridad: (1) formula.descuenta explícito, (2) categoriaItem.codigo === 'DESCUENTO'
  const getEfecto = (tipo: TipoItemCuota) => {
    if (tipo.formula?.descuenta === true) return 'DESCUENTA';
    if (tipo.formula?.descuenta === false) return 'SUMA';
    return tipo.categoriaItem.codigo === 'DESCUENTO' ? 'DESCUENTA' : 'SUMA';
  };

  // Autocompletar código basado en nombre (solo cuando se crea, no al editar)
  const nombreValue = useWatch({ control, name: 'nombre' });

  useEffect(() => {
    if (!selectedTipo && nombreValue) {
      const codigoGenerado = generateCodigoFromNombre(nombreValue);
      setValue('codigo', codigoGenerado);
    }
  }, [selectedTipo, nombreValue, setValue]);

  // Cargar datos al montar
  useEffect(() => {
    cargarDatos();
  }, []);

  /**
   * Cargar tipos y categorías
   */
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [tiposData, categoriasData] = await Promise.all([
        itemsCuotaService.getTiposItems(),
        itemsCuotaService.getCategoriasItems(),
      ]);
      setTipos(tiposData);
      setCategorias(categoriasData);
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      dispatch(
        showNotification({
          message: 'Error al cargar tipos de ítems',
          severity: 'error',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  // Definición de columnas
  const columns = useMemo<CatalogoColumn<TipoItemCuota>[]>(() => [
    {
      id: 'nombre',
      label: 'Nombre',
      width: '200px',
    },
    {
      id: 'categoriaItem',
      label: 'Categoría',
      width: '150px',
      render: (item) => (
        <Chip
          label={item.categoriaItem.nombre}
          size="small"
          color="secondary"
          icon={item.categoriaItem.icono ? <span>{item.categoriaItem.icono}</span> : undefined}
        />
      ),
    },
    {
      id: 'efecto',
      label: 'Efecto en cuota',
      width: '140px',
      align: 'center',
      render: (item) => {
        const descuenta = getEfecto(item) === 'DESCUENTA';
        return (
          <Chip
            label={descuenta ? '− DESCUENTA' : '+ SUMA'}
            color={descuenta ? 'error' : 'success'}
            size="small"
            icon={descuenta ? <RemoveCircle /> : <AddCircle />}
          />
        );
      },
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
      label: 'Categoría',
      render: (item) => (
        <Chip
          label={item.categoriaItem.nombre}
          color="secondary"
          size="small"
          icon={item.categoriaItem.icono ? <span>{item.categoriaItem.icono}</span> : undefined}
        />
      ),
      span: 12,
    },
    {
      label: 'Efecto en cuota',
      render: (item) => {
        const descuenta = getEfecto(item) === 'DESCUENTA';
        return (
          <Chip
            label={descuenta ? '− DESCUENTA del total' : '+ SUMA al total'}
            color={descuenta ? 'error' : 'success'}
            size="small"
            icon={descuenta ? <RemoveCircle /> : <AddCircle />}
          />
        );
      },
      span: 12,
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

  // Handlers
  const handleAddClick = useCallback(() => {
    setSelectedTipo(null);
    reset({
      codigo: '',
      nombre: '',
      descripcion: '',
      categoriaItemId: undefined,
      esCalculado: false,
      formula: null,
      activo: true,
      orden: undefined,
      configurable: true,
      esDescuento: false,
    });
    setFormOpen(true);
  }, [reset]);

  const handleEditClick = useCallback((tipo: TipoItemCuota) => {
    setSelectedTipo(tipo);
    // Pre-popula esDescuento: desde formula.descuenta si existe, o desde codigo de categoría
    const esDescuentoInicial =
      tipo.formula?.descuenta === true ||
      (tipo.formula?.descuenta === undefined && tipo.categoriaItem.codigo === 'DESCUENTO');
    reset({
      codigo: tipo.codigo,
      nombre: tipo.nombre,
      descripcion: tipo.descripcion,
      categoriaItemId: tipo.categoriaItemId,
      esCalculado: false,
      formula: tipo.formula,
      activo: tipo.activo,
      orden: tipo.orden,
      configurable: tipo.configurable,
      esDescuento: esDescuentoInicial,
    });
    setFormOpen(true);
  }, [reset]);

  const handleViewClick = useCallback((tipo: TipoItemCuota) => {
    setTipoToView(tipo);
    setViewDialogOpen(true);
  }, []);

  const handleClonClick = useCallback((tipo: TipoItemCuota) => {
    setTipoToClon(tipo);
    setClonDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback(async (tipo: TipoItemCuota) => {
    try {
      // Verificar relaciones
      const relaciones = await catalogosItemsAdminApi.getRelacionesTipoItem(tipo.id);

      if (!relaciones.data.puedeEliminar) {
        dispatch(
          showNotification({
            message: `No se puede eliminar este tipo porque tiene ${relaciones.data.totalItems} ítems en ${relaciones.data.totalCuotasAfectadas} cuotas`,
            severity: 'warning',
          })
        );
        return;
      }
    } catch (error) {
      console.error('Error al verificar relaciones:', error);
    }

    setTipoToDelete(tipo);
    setDeleteDialogOpen(true);
  }, [dispatch]);

  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setSelectedTipo(null);
    reset();
  }, [reset]);

  const onSubmit = async (data: CreateTipoItemFormData | UpdateTipoItemFormData) => {
    try {
      setSubmitting(true);

      // Extraemos esDescuento (campo UI) y lo convertimos a formula.descuenta para la API.
      // esDescuento NO se envía al backend — se mapea a formula.descuenta.
      const { esDescuento, ...dataRest } = data as CreateTipoItemFormData;
      const payload = {
        ...dataRest,
        esCalculado: false,
        configurable: true,
        formula: { descuenta: esDescuento === true },
      };

      if (selectedTipo) {
        await catalogosItemsAdminApi.updateTipoItem(
          selectedTipo.id,
          payload as UpdateTipoItemDTO
        );
        dispatch(
          showNotification({
            message: 'Tipo actualizado exitosamente',
            severity: 'success',
          })
        );
      } else {
        await catalogosItemsAdminApi.createTipoItem(payload as CreateTipoItemDTO);
        dispatch(
          showNotification({
            message: 'Tipo creado exitosamente',
            severity: 'success',
          })
        );
      }

      setFormOpen(false);
      setSelectedTipo(null);
      setSubmitting(false);
      reset();

      startTransition(() => {
        cargarDatos();
      });
    } catch (error: any) {
      console.error('Error al guardar tipo:', error);

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
    if (!tipoToDelete) return;

    try {
      setSubmitting(true);
      await catalogosItemsAdminApi.deleteTipoItem(tipoToDelete.id);

      dispatch(
        showNotification({
          message: 'Tipo eliminado exitosamente',
          severity: 'success',
        })
      );

      setDeleteDialogOpen(false);
      setTipoToDelete(null);
      setSubmitting(false);

      startTransition(() => {
        cargarDatos();
      });
    } catch (error: any) {
      console.error('Error al eliminar tipo:', error);

      const errorMessage = error.response?.data?.message || 'No es posible eliminar el tipo en este momento';
      dispatch(
        showNotification({
          message: errorMessage,
          severity: 'error',
        })
      );

      setSubmitting(false);
    }
  };

  const handleClonSuccess = (nuevoTipo: TipoItemCuota) => {
    dispatch(
      showNotification({
        message: `Tipo "${nuevoTipo.nombre}" clonado exitosamente`,
        severity: 'success',
      })
    );

    startTransition(() => {
      cargarDatos();
    });
  };

  const handleReorder = async (reorderedItems: TipoItemCuota[]) => {
    try {
      const ids = reorderedItems.map((item) => item.id);
      await catalogosItemsAdminApi.reordenarTiposItems(ids);

      dispatch(
        showNotification({
          message: 'Tipos reordenados exitosamente',
          severity: 'success',
        })
      );

      startTransition(() => {
        cargarDatos();
      });
    } catch (error: any) {
      console.error('Error al reordenar tipos:', error);

      dispatch(
        showNotification({
          message: 'Error al reordenar tipos',
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
            <Assignment color="primary" fontSize="large" />
            <Typography variant="h4">Tipos de Ítems de Cuota</Typography>
          </Stack>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            disabled={loading}
          >
            Nuevo Tipo
          </Button>
        </Stack>

        {/* Información */}
        <Alert severity="info" sx={{ mb: 3 }}>
          Los tipos de ítems son los conceptos que se pueden agregar a una cuota: cuotas base, actividades, descuentos, recargos, etc.
          Cada tipo <strong>suma</strong> o <strong>descuenta</strong> del total según la categoría a la que pertenece.
        </Alert>

        {/* Tabs */}
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
          <Tab label="Gestión" />
          <Tab label="Estadísticas" />
        </Tabs>

        {/* Contenido de tabs */}
        {tabValue === 0 && (
          <Box>
            <Alert severity="info" icon={<ContentCopy />} sx={{ mb: 2 }}>
              Para copiar un tipo existente, usa el botón de clonación en la fila correspondiente.
            </Alert>
            <CatalogoTable<TipoItemCuota>
              items={tipos}
              columns={columns}
              loading={loading}
              onView={handleViewClick}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onReorder={handleReorder}
            />
          </Box>
        )}

        {tabValue === 1 && (
          <EstadisticasCategoria tipo="tipos" />
        )}
      </Paper>

      {/* Formulario custom de crear/editar */}
      <Dialog open={formOpen} onClose={handleFormClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedTipo ? 'Editar Tipo de Ítem' : 'Nuevo Tipo de Ítem'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Controller
              name="nombre"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nombre"
                  fullWidth
                  required
                  error={!!errors.nombre}
                  helperText={errors.nombre?.message}
                  disabled={submitting}
                  placeholder="Cuota Base, Descuento Socio, etc."
                />
              )}
            />

            <Controller
              name="descripcion"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value || ''}
                  label="Descripción"
                  fullWidth
                  multiline
                  rows={3}
                  error={!!errors.descripcion}
                  helperText={errors.descripcion?.message}
                  disabled={submitting}
                  placeholder="Descripción opcional del tipo de ítem"
                />
              )}
            />

            <Controller
              name="categoriaItemId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Categoría"
                  fullWidth
                  select
                  required
                  error={!!errors.categoriaItemId}
                  helperText={errors.categoriaItemId?.message}
                  disabled={submitting}
                >
                  {categorias.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.icono && `${cat.icono} `}{cat.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            {/* Toggle explícito SUMA / DESCUENTA */}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Efecto en el total de la cuota <span style={{ color: 'red' }}>*</span>
              </Typography>
              <Controller
                name="esDescuento"
                control={control}
                render={({ field }) => (
                  <ToggleButtonGroup
                    value={field.value ? 'descuenta' : 'suma'}
                    exclusive
                    onChange={(_, val) => {
                      if (val !== null) field.onChange(val === 'descuenta');
                    }}
                    disabled={submitting}
                    size="medium"
                  >
                    <ToggleButton value="suma" color="success">
                      <AddCircle sx={{ mr: 0.5 }} fontSize="small" />
                      SUMA al total
                    </ToggleButton>
                    <ToggleButton value="descuenta" color="error">
                      <RemoveCircle sx={{ mr: 0.5 }} fontSize="small" />
                      DESCUENTA del total
                    </ToggleButton>
                  </ToggleButtonGroup>
                )}
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                {esDescuentoWatch
                  ? 'Este ítem reduce el monto de la cuota (ej: descuento, bonificación, exención).'
                  : 'Este ítem incrementa el monto de la cuota (ej: cuota base, actividad, recargo).'}
              </Typography>
            </Box>

            <Controller
              name="orden"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value || ''}
                  label="Orden"
                  type="number"
                  fullWidth
                  error={!!errors.orden}
                  helperText={errors.orden?.message || 'Orden de visualización'}
                  disabled={submitting}
                  placeholder="1, 2, 3..."
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFormClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de vista */}
      <CatalogoDetailDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setTipoToView(null);
        }}
        title="Detalles de Tipo de Ítem de Cuota"
        item={tipoToView}
        fields={viewFields}
      />

      {/* Diálogo de eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar el tipo{' '}
            <strong>{tipoToDelete?.nombre}</strong>?
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

      {/* Diálogo de clonación */}
      <ClonacionDialog
        open={clonDialogOpen}
        onClose={() => {
          setClonDialogOpen(false);
          setTipoToClon(null);
        }}
        tipoOriginal={tipoToClon}
        onSuccess={handleClonSuccess}
      />
    </Box>
  );
};

export default TiposItemCuotaAdminPage;
