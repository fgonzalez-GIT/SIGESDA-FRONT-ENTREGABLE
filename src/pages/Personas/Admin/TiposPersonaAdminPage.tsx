import React, { useState, useMemo, useCallback, startTransition } from 'react';
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
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import {
  CatalogoTable,
  CatalogoFormDialog,
  type CatalogoColumn,
  type CatalogoField,
} from '../../../components/personas/v2/admin';
import { useCatalogosPersonas } from '../../../hooks/usePersonas';
import personasApi from '../../../services/personasApi';
import {
  createTipoPersonaSchema,
  updateTipoPersonaSchema,
  type CreateTipoPersonaFormData,
  type UpdateTipoPersonaFormData,
} from '../../../schemas/persona.schema';
import type { TipoPersona } from '../../../types/persona.types';
import { useAppDispatch } from '../../../hooks/redux';
import { showNotification } from '../../../store/slices/uiSlice';

/**
 * Página de administración de Tipos de Persona
 * Permite crear, editar, activar/desactivar y reordenar tipos
 */
const TiposPersonaAdminPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { catalogos, loading: catalogosLoading, refetch } = useCatalogosPersonas();

  // Estados de UI
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<TipoPersona | null>(null);
  const [tipoToDelete, setTipoToDelete] = useState<TipoPersona | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Definición de columnas de la tabla (memoizada para evitar re-renders)
  const columns = useMemo<CatalogoColumn<TipoPersona>[]>(() => [
    {
      id: 'nombre',
      label: 'Nombre',
      width: '200px',
    },
    {
      id: 'descripcion',
      label: 'Descripción',
      render: (item) => item.descripcion || '-',
    },
    {
      id: 'requiresCategoria',
      label: 'Req. Categoría',
      width: '130px',
      align: 'center',
      render: (item) =>
        item.requiresCategoria ? (
          <Chip label="Sí" color="primary" size="small" />
        ) : (
          <Chip label="No" size="small" />
        ),
    },
    {
      id: 'requiresEspecialidad',
      label: 'Req. Especialidad',
      width: '150px',
      align: 'center',
      render: (item) =>
        item.requiresEspecialidad ? (
          <Chip label="Sí" color="success" size="small" />
        ) : (
          <Chip label="No" size="small" />
        ),
    },
    {
      id: 'requiresCuit',
      label: 'Req. CUIT',
      width: '110px',
      align: 'center',
      render: (item) =>
        item.requiresCuit ? (
          <Chip label="Sí" color="warning" size="small" />
        ) : (
          <Chip label="No" size="small" />
        ),
    },
    {
      id: 'activo',
      label: 'Estado',
      width: '100px',
      align: 'center',
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
      placeholder: 'SOCIO, DOCENTE, etc.',
      helperText: 'Solo letras mayúsculas y guiones bajos',
      required: true,
      readOnly: !!selectedTipo, // No permitir editar código en actualización
    },
    {
      name: 'nombre',
      label: 'Nombre',
      type: 'text',
      placeholder: 'Socio, Docente, etc.',
      required: true,
    },
    {
      name: 'descripcion',
      label: 'Descripción',
      type: 'textarea',
      placeholder: 'Descripción opcional del tipo de persona',
      rows: 3,
    },
    {
      name: 'requiresCategoria',
      label: 'Requiere Categoría de Socio',
      type: 'switch',
    },
    {
      name: 'requiresEspecialidad',
      label: 'Requiere Especialidad Docente',
      type: 'switch',
    },
    {
      name: 'requiresCuit',
      label: 'Requiere CUIT (Proveedor)',
      type: 'switch',
    },
    {
      name: 'orden',
      label: 'Orden',
      type: 'number',
      placeholder: '1, 2, 3...',
      helperText: 'Orden de visualización',
    },
  ], [selectedTipo]);

  // Handlers (memoizados para evitar re-renders)
  const handleAddClick = useCallback(() => {
    setSelectedTipo(null);
    setFormOpen(true);
  }, []);

  const handleEditClick = useCallback((tipo: TipoPersona) => {
    setSelectedTipo(tipo);
    setFormOpen(true);
  }, []);

  const handleDeleteClick = useCallback((tipo: TipoPersona) => {
    setTipoToDelete(tipo);
    setDeleteDialogOpen(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setSelectedTipo(null);
  }, []);

  const handleFormSubmit = async (
    data: CreateTipoPersonaFormData | UpdateTipoPersonaFormData
  ) => {
    try {
      setSubmitting(true);

      if (selectedTipo) {
        // Actualizar tipo existente
        await personasApi.admin.updateTipoPersona(
          selectedTipo.id,
          data as UpdateTipoPersonaFormData
        );
        dispatch(
          showNotification({
            message: 'Tipo de persona actualizado exitosamente',
            severity: 'success',
          })
        );
      } else {
        // Crear nuevo tipo
        await personasApi.admin.createTipoPersona(data as CreateTipoPersonaFormData);
        dispatch(
          showNotification({
            message: 'Tipo de persona creado exitosamente',
            severity: 'success',
          })
        );
      }

      // Cerrar el formulario inmediatamente para mejor UX
      setFormOpen(false);
      setSelectedTipo(null);
      setSubmitting(false);

      // Refrescar catálogos en segundo plano (no bloqueante)
      startTransition(() => {
        refetch();
      });
    } catch (error: any) {
      console.error('Error al guardar tipo de persona:', error);

      dispatch(
        showNotification({
          message: 'No es posible realizar la acción en este momento',
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
      await personasApi.admin.deleteTipoPersona(tipoToDelete.id);

      dispatch(
        showNotification({
          message: 'Tipo de persona eliminado exitosamente',
          severity: 'success',
        })
      );

      // Cerrar el diálogo inmediatamente
      setDeleteDialogOpen(false);
      setTipoToDelete(null);
      setSubmitting(false);

      // Refrescar catálogos en segundo plano (no bloqueante)
      startTransition(() => {
        refetch();
      });
    } catch (error: any) {
      console.error('Error al eliminar tipo de persona:', error);

      dispatch(
        showNotification({
          message: 'No es posible realizar la acción en este momento',
          severity: 'error',
        })
      );
      setSubmitting(false);
    }
  };

  // Memoizar tiposPersona para evitar re-renders innecesarios
  const tiposPersona = useMemo(
    () => catalogos?.tiposPersona || [],
    [catalogos?.tiposPersona]
  );

  // Memoizar defaultValues para evitar que cambien en cada render
  const defaultValues = useMemo(
    () =>
      selectedTipo
        ? {
            nombre: selectedTipo.nombre,
            descripcion: selectedTipo.descripcion || '',
            requiresCategoria: selectedTipo.requiresCategoria || false,
            requiresEspecialidad: selectedTipo.requiresEspecialidad || false,
            requiresCuit: selectedTipo.requiresCuit || false,
            orden: selectedTipo.orden,
            activo: selectedTipo.activo,
          }
        : {
            codigo: '',
            nombre: '',
            descripcion: '',
            requiresCategoria: false,
            requiresEspecialidad: false,
            requiresCuit: false,
          },
    [selectedTipo]
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Administración de Tipos de Persona
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona los tipos dinámicos de persona (SOCIO, DOCENTE, PROVEEDOR, etc.)
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
          size="large"
        >
          Nuevo Tipo
        </Button>
      </Box>

      {/* Info */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Los tipos de persona determinan qué campos adicionales se solicitan al crear una
        persona. Por ejemplo, un SOCIO requiere categoría, un DOCENTE requiere especialidad
        y honorarios, y un PROVEEDOR requiere CUIT.
      </Alert>

      {/* Tabla */}
      {catalogosLoading ? (
        <Typography>Cargando...</Typography>
      ) : (
        <CatalogoTable
          items={tiposPersona}
          columns={columns}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          emptyMessage="No hay tipos de persona creados"
        />
      )}

      {/* Formulario */}
      <CatalogoFormDialog
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        title="Tipo de Persona"
        fields={formFields}
        schema={selectedTipo ? updateTipoPersonaSchema : createTipoPersonaSchema}
        defaultValues={defaultValues}
        isEdit={!!selectedTipo}
        loading={submitting}
        autoGenerateCodigo={true}
        hideCodigoField={true}
      />

      {/* Diálogo de confirmación de eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !submitting && setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar el tipo{' '}
            <strong>{tipoToDelete?.nombre}</strong>?
            <br />
            <br />
            Esta acción no se puede deshacer y puede afectar a las personas que ya tienen
            este tipo asignado.
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

export default TiposPersonaAdminPage;
