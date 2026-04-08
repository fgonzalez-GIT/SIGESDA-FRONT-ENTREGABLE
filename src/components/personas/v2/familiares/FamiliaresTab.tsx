import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Alert, CircularProgress, Stack } from '@mui/material';
import { Add as AddIcon, FamilyRestroom as FamilyIcon } from '@mui/icons-material';
import { familiaresApiReal } from '../../../../services/familiaresApi';
import { RelacionFamiliarDialog } from '../../../forms/RelacionFamiliarDialog';
import { FamiliarCard } from './FamiliarCard';
import { handleApiError } from '../../../../utils/errorHandling';
import { Persona } from '../../../../types/persona.types';

interface FamiliarData {
  id: number;
  personaId: number;
  familiarId: number;
  tipoRelacion: string;
  descripcion?: string;
  fechaCreacion: string;
  activo: boolean;
  responsableFinanciero: boolean;
  autorizadoRetiro: boolean;
  contactoEmergencia: boolean;
  porcentajeDescuento?: number;
  familiar?: {
    id: number;
    nombre: string;
    apellido: string;
    dni?: string;
    telefono?: string;
    email?: string;
  };
}

interface FamiliaresTabProps {
  personaId: number;
  personaNombre: string;
  personaApellido: string;
  personaPrincipal?: Persona;
}

/**
 * Tab para gestionar familiares de una persona
 * Integrado en PersonaDetallePage
 *
 * Features:
 * - Lista de familiares con permisos y descuentos
 * - Agregar nuevo familiar mediante modal
 * - Eliminar relación familiar con confirmación
 * - Refetch automático tras cambios
 */
export const FamiliaresTab: React.FC<FamiliaresTabProps> = ({
  personaId,
  personaNombre,
  personaApellido,
  personaPrincipal,
}) => {
  const [familiares, setFamiliares] = useState<FamiliarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const cargarFamiliares = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await familiaresApiReal.getRelacionesDePersona(personaId);
      setFamiliares(data);
    } catch (err: any) {
      const errorMsg = err.message || 'Error al cargar familiares';
      setError(errorMsg);
      console.error('Error en cargarFamiliares:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (personaId) {
      cargarFamiliares();
    }
  }, [personaId]);

  const handleEliminar = async (relacionId: number) => {
    const confirmacion = window.confirm(
      '¿Está seguro de eliminar esta relación familiar?\n\nEsta acción no se puede deshacer.'
    );

    if (!confirmacion) return;

    setDeletingId(relacionId);
    setError(null);

    try {
      await familiaresApiReal.eliminarRelacion(relacionId);

      // Refetch para actualizar la lista
      await cargarFamiliares();
    } catch (err: any) {
      const errorMsg = err.message || 'Error al eliminar la relación familiar';
      setError(errorMsg);
      handleApiError(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateRelacion = async (request: any) => {
    try {
      await familiaresApiReal.crearRelacion(request);

      // Llamar a onSuccess que cierra el modal y recarga
      await handleSuccess();
    } catch (err: any) {
      const errorMsg = err.message || 'Error al crear la relación familiar';
      setError(errorMsg);
      handleApiError(err);
      throw err; // Re-throw para que el modal sepa que hubo error
    }
  };

  const handleSuccess = async () => {
    // Cerrar modal
    setDialogOpen(false);

    // Refetch para mostrar el nuevo familiar
    await cargarFamiliares();
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Estado de carga inicial
  if (loading && familiares.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header con botón agregar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" display="flex" alignItems="center" gap={1}>
          <FamilyIcon color="primary" />
          Familiares ({familiares.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          disabled={deletingId !== null}
        >
          Agregar Familiar
        </Button>
      </Box>

      {/* Información contextual */}
      <Alert severity="info" sx={{ mb: 2 }}>
        Gestiona las relaciones familiares de <strong>{personaNombre} {personaApellido}</strong>.
        Puedes asignar permisos de retiro, contacto de emergencia y responsabilidad financiera.
      </Alert>

      {/* Alert de error */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Lista de familiares */}
      {familiares.length === 0 ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={6}
          px={2}
          sx={{
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.default',
          }}
        >
          <FamilyIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay familiares registrados
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={2}>
            {personaNombre} {personaApellido} no tiene familiares asociados.
            Haz clic en "Agregar Familiar" para comenzar.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {familiares.map((relacion) => (
            <Box
              key={relacion.id}
              sx={{
                position: 'relative',
                opacity: deletingId === relacion.id ? 0.5 : 1,
                pointerEvents: deletingId === relacion.id ? 'none' : 'auto',
              }}
            >
              <FamiliarCard
                relacion={relacion}
                onDelete={() => handleEliminar(relacion.id)}
              />
              {deletingId === relacion.id && (
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  sx={{ transform: 'translate(-50%, -50%)' }}
                >
                  <CircularProgress size={40} />
                </Box>
              )}
            </Box>
          ))}
        </Stack>
      )}

      {/* Modal para agregar familiar */}
      <RelacionFamiliarDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        personaSeleccionada={personaId}
        personaPrincipal={personaPrincipal}
        onSubmit={handleCreateRelacion}
        onSuccess={handleSuccess}
      />
    </Box>
  );
};

export default FamiliaresTab;
