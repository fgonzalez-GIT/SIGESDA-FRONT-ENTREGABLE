import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Alert,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import { ContentCopy, Close } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clonarTipoItemSchema, ClonarTipoItemFormData } from '@/schemas/item-cuota.schema';
import { TipoItemCuota } from '@/types/cuota.types';
import { catalogosItemsAdminApi } from '@/services/catalogosItemsAdminApi';

interface ClonacionDialogProps {
  open: boolean;
  onClose: () => void;
  tipoOriginal: TipoItemCuota | null;
  onSuccess: (nuevoTipo: TipoItemCuota) => void;
}

/**
 * Diálogo para clonar un tipo de ítem existente
 * Permite crear una copia con nuevo código y nombre
 */
export const ClonacionDialog: React.FC<ClonacionDialogProps> = ({
  open,
  onClose,
  tipoOriginal,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClonarTipoItemFormData>({
    resolver: zodResolver(clonarTipoItemSchema),
    defaultValues: {
      codigo: tipoOriginal ? `${tipoOriginal.codigo}_COPIA` : '',
      nombre: tipoOriginal ? `${tipoOriginal.nombre} (Copia)` : '',
    },
  });

  /**
   * Cerrar y resetear formulario
   */
  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  /**
   * Enviar clonación
   */
  const onSubmit = async (data: ClonarTipoItemFormData) => {
    if (!tipoOriginal) {
      setError('No se ha seleccionado un tipo para clonar');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await catalogosItemsAdminApi.clonarTipoItem(
        tipoOriginal.id,
        data.codigo,
        data.nombre
      );

      if (response.success && response.data) {
        onSuccess(response.data);
        handleClose();
      } else {
        setError(response.message || 'Error al clonar tipo de ítem');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Error al clonar tipo de ítem';
      setError(errorMsg);
      console.error('Error al clonar tipo:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!tipoOriginal) {
    return null;
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <ContentCopy />
          <Typography variant="h6">Clonar Tipo de Ítem</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {/* Información del tipo original */}
          <Alert severity="info" sx={{ py: 0.5 }}>
            <Typography variant="body2">
              Se clonará el tipo <strong>{tipoOriginal.nombre}</strong> con toda su configuración
              (descripción, categoría, fórmula, etc.)
            </Typography>
          </Alert>

          {/* Detalles del tipo original */}
          <Box>
            <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
              Tipo original:
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              <Chip label={`Código: ${tipoOriginal.codigo}`} size="small" variant="outlined" />
              <Chip
                label={tipoOriginal.esCalculado ? 'Calculado' : 'Manual'}
                size="small"
                color={tipoOriginal.esCalculado ? 'primary' : 'default'}
              />
              <Chip
                label={tipoOriginal.categoriaItem.nombre}
                size="small"
                color="secondary"
              />
            </Stack>
          </Box>

          {/* Formulario de clonación */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2}>
              <Controller
                name="codigo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Código del nuevo tipo"
                    fullWidth
                    required
                    error={!!errors.codigo}
                    helperText={errors.codigo?.message || 'Solo mayúsculas, números y guiones bajos'}
                    disabled={submitting}
                    placeholder="TIPO_NUEVO"
                  />
                )}
              />

              <Controller
                name="nombre"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre del nuevo tipo"
                    fullWidth
                    required
                    error={!!errors.nombre}
                    helperText={errors.nombre?.message}
                    disabled={submitting}
                    placeholder="Tipo Nuevo"
                  />
                )}
              />

              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
            </Stack>
          </form>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleClose}
          disabled={submitting}
          startIcon={<Close />}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={submitting}
          startIcon={<ContentCopy />}
        >
          {submitting ? 'Clonando...' : 'Clonar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClonacionDialog;
