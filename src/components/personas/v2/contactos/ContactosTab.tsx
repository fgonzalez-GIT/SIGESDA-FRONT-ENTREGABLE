import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Paper,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  ContactPhone as ContactIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { ContactoItem } from './ContactoItem';
import { AgregarContactoModal } from './AgregarContactoModal';
import { usePersonaContactos } from '../../../../hooks/usePersonas';
import type { Contacto, CreateContactoDTO, CatalogosPersonas } from '../../../../types/persona.types';
import { useAppDispatch } from '../../../../hooks/redux';
import { showNotification } from '../../../../store/slices/uiSlice';

interface ContactosTabProps {
  personaId: number;
  catalogos: CatalogosPersonas | null;
}

/**
 * Tab completo para gestión de contactos de una persona
 * Incluye lista de contactos, agregar, editar, eliminar y marcar como principal
 *
 * @example
 * ```tsx
 * <ContactosTab personaId={persona.id} catalogos={catalogos} />
 * ```
 */
export const ContactosTab: React.FC<ContactosTabProps> = ({ personaId, catalogos }) => {
  const dispatch = useAppDispatch();

  // Hook de gestión de contactos
  const {
    contactos,
    loading,
    error,
    addContacto,
    updateContacto,
    deleteContacto,
    setPrincipal,
  } = usePersonaContactos(personaId);

  // Estados de UI
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedContacto, setSelectedContacto] = useState<Contacto | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactoToDelete, setContactoToDelete] = useState<Contacto | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Handlers de modal
  const handleAddClick = () => {
    setSelectedContacto(null);
    setModalOpen(true);
  };

  const handleEditClick = (contacto: Contacto) => {
    setSelectedContacto(contacto);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedContacto(null);
  };

  // Handler de submit del formulario
  const handleSubmitContacto = async (data: CreateContactoDTO) => {
    try {
      setActionLoading(true);

      if (selectedContacto) {
        // Actualizar contacto existente
        await updateContacto(selectedContacto.id, data);
        dispatch(
          showNotification({
            message: 'Contacto actualizado exitosamente',
            severity: 'success',
          })
        );
      } else {
        // Agregar nuevo contacto
        await addContacto(data);
        dispatch(
          showNotification({
            message: 'Contacto agregado exitosamente',
            severity: 'success',
          })
        );
      }

      handleCloseModal();
    } catch (error: any) {
      console.error('Error al guardar contacto:', error);

      dispatch(
        showNotification({
          message: 'No es posible realizar la acción en este momento',
          severity: 'error',
        })
      );

      // Re-throw para que el modal no se cierre
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  // Handler de eliminación
  const handleDeleteClick = (contacto: Contacto) => {
    setContactoToDelete(contacto);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contactoToDelete) return;

    try {
      setActionLoading(true);
      await deleteContacto(contactoToDelete.id);

      dispatch(
        showNotification({
          message: 'Contacto eliminado exitosamente',
          severity: 'success',
        })
      );

      setDeleteDialogOpen(false);
      setContactoToDelete(null);
    } catch (error: any) {
      console.error('Error al eliminar contacto:', error);

      dispatch(
        showNotification({
          message: 'No es posible realizar la acción en este momento',
          severity: 'error',
        })
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Handler para marcar como principal
  const handleSetPrincipal = async (contacto: Contacto) => {
    try {
      setActionLoading(true);
      await setPrincipal(contacto.id);

      dispatch(
        showNotification({
          message: 'Contacto marcado como principal',
          severity: 'success',
        })
      );
    } catch (error: any) {
      console.error('Error al establecer contacto principal:', error);

      dispatch(
        showNotification({
          message: 'No es posible realizar la acción en este momento',
          severity: 'error',
        })
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Handler para copiar al portapapeles
  const handleCopy = (valor: string) => {
    navigator.clipboard.writeText(valor).then(
      () => {
        dispatch(
          showNotification({
            message: 'Copiado al portapapeles',
            severity: 'success',
          })
        );
      },
      () => {
        dispatch(
          showNotification({
            message: 'Error al copiar al portapapeles',
            severity: 'error',
          })
        );
      }
    );
  };

  // Separar contacto principal de los demás
  const contactoPrincipal = contactos.find((c) => c.principal && c.activo);
  const otrosContactos = contactos.filter((c) => !c.principal || !c.activo);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <ContactIcon color="primary" />
          <Typography variant="h6">Contactos</Typography>
          {contactos.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              ({contactos.length} {contactos.length === 1 ? 'contacto' : 'contactos'})
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
          size="small"
          disabled={!catalogos || actionLoading}
        >
          Agregar Contacto
        </Button>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading inicial */}
      {loading && contactos.length === 0 && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Sin contactos */}
      {!loading && contactos.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ContactIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No hay contactos registrados
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Agrega contactos adicionales como WhatsApp, redes sociales, etc.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddClick}>
            Agregar Primer Contacto
          </Button>
        </Paper>
      )}

      {/* Lista de contactos */}
      {contactos.length > 0 && (
        <Stack spacing={3}>
          {/* Contacto principal */}
          {contactoPrincipal && (
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <StarIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600} color="primary">
                  Contacto Principal
                </Typography>
              </Box>
              <ContactoItem
                contacto={contactoPrincipal}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onCopy={handleCopy}
                compact
              />
            </Box>
          )}

          {/* Otros contactos */}
          {otrosContactos.length > 0 && (
            <Box>
              {contactoPrincipal && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                    Otros Contactos
                  </Typography>
                </>
              )}
              <Stack spacing={1.5} mt={2}>
                {otrosContactos.map((contacto) => (
                  <ContactoItem
                    key={contacto.id}
                    contacto={contacto}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                    onSetPrincipal={handleSetPrincipal}
                    onCopy={handleCopy}
                    compact
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      )}

      {/* Modal de agregar/editar */}
      <AgregarContactoModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitContacto}
        contacto={selectedContacto}
        catalogos={catalogos}
        loading={actionLoading}
      />

      {/* Diálogo de confirmación de eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !actionLoading && setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar este contacto?
            {contactoToDelete && (
              <>
                <br />
                <strong>{contactoToDelete.valor}</strong>
              </>
            )}
            <br />
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={actionLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContactosTab;
