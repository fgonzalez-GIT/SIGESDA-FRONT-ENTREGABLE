import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  FormControlLabel,
  Checkbox,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Close as CloseIcon,
  ContactPhone as ContactIcon,
} from '@mui/icons-material';
import type {
  Contacto,
  CreateContactoDTO,
  CatalogosPersonas,
} from '../../../../types/persona.types';
import {
  createContactoSchema,
  type CreateContactoFormData,
} from '../../../../schemas/persona.schema';
import {
  validatePattern,
  getPatternErrorMessage,
  getPlaceholderByTipoCodigo,
  getHelperTextByTipoCodigo,
} from '../../../../utils/contacto.utils';

interface AgregarContactoModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateContactoDTO) => Promise<void>;
  contacto?: Contacto | null;
  catalogos: CatalogosPersonas | null;
  loading?: boolean;
}

/**
 * Modal para agregar o editar un contacto
 * Usa React Hook Form + Zod para validaciones
 *
 * @example
 * ```tsx
 * <AgregarContactoModal
 *   open={modalOpen}
 *   onClose={handleClose}
 *   onSubmit={handleSubmit}
 *   catalogos={catalogos}
 *   contacto={selectedContacto}
 * />
 * ```
 */
export const AgregarContactoModal: React.FC<AgregarContactoModalProps> = ({
  open,
  onClose,
  onSubmit,
  contacto,
  catalogos,
  loading = false,
}) => {
  const isEditing = !!contacto;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateContactoFormData>({
    resolver: zodResolver(createContactoSchema),
    defaultValues: {
      tipoContactoId: 0,
      valor: '',
      descripcion: '',
      principal: false,
    },
  });

  const tipoContactoIdWatch = watch('tipoContactoId');
  const valorWatch = watch('valor');

  // Estado para error de validación de pattern
  const [patternError, setPatternError] = useState<string | null>(null);

  // Validar pattern cuando cambia el valor o el tipo
  useEffect(() => {
    if (!tipoContactoIdWatch || !valorWatch) {
      setPatternError(null);
      return;
    }

    const tipo = catalogos?.tiposContacto.find(t => t.id === tipoContactoIdWatch);
    if (!tipo) {
      setPatternError(null);
      return;
    }

    if (!validatePattern(valorWatch, tipo.pattern)) {
      setPatternError(getPatternErrorMessage(tipo.nombre));
    } else {
      setPatternError(null);
    }
  }, [tipoContactoIdWatch, valorWatch, catalogos]);

  useEffect(() => {
    if (contacto) {
      // Modo edición: cargar datos del contacto
      reset({
        tipoContactoId: contacto.tipoContactoId,
        valor: contacto.valor,
        descripcion: contacto.descripcion || '',
        principal: contacto.principal,
      });
    } else {
      // Modo creación: resetear formulario
      reset({
        tipoContactoId: 0,
        valor: '',
        descripcion: '',
        principal: false,
      });
    }
  }, [contacto, reset, open]);

  const handleFormSubmit = async (data: CreateContactoFormData) => {
    try {
      await onSubmit(data as CreateContactoDTO);
      reset();
      onClose();
    } catch (error) {
      console.error('Error en formulario de contacto:', error);
      // El error se maneja en el componente padre
      throw error;
    }
  };

  // Obtener tipo seleccionado
  const tipoSeleccionado = catalogos?.tiposContacto.find(t => t.id === tipoContactoIdWatch);

  const getPlaceholder = (): string => {
    if (!tipoSeleccionado) return 'Ingrese el valor del contacto';
    return getPlaceholderByTipoCodigo(tipoSeleccionado.codigo);
  };

  const getHelperText = (): string => {
    if (!tipoSeleccionado) return '';
    return getHelperTextByTipoCodigo(tipoSeleccionado.codigo, tipoSeleccionado.descripcion);
  };

  if (!catalogos) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <ContactIcon />
          {isEditing ? 'Editar Contacto' : 'Agregar Contacto'}
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Tipo de contacto */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="tipoContactoId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.tipoContactoId}>
                    <InputLabel>Tipo de Contacto *</InputLabel>
                    <Select
                      {...field}
                      label="Tipo de Contacto *"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    >
                      <MenuItem value={0} disabled>
                        Seleccionar tipo de contacto
                      </MenuItem>
                      {catalogos.tiposContacto
                        .filter((t) => t.activo)
                        .map((tipo) => (
                          <MenuItem key={tipo.id} value={tipo.id}>
                            {tipo.nombre}
                          </MenuItem>
                        ))}
                    </Select>
                    {errors.tipoContactoId && (
                      <FormHelperText>{errors.tipoContactoId.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Valor */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="valor"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Valor *"
                    placeholder={getPlaceholder()}
                    error={!!errors.valor || !!patternError}
                    helperText={
                      errors.valor?.message || patternError || getHelperText()
                    }
                  />
                )}
              />
            </Grid>

            {/* Descripción */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="descripcion"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Descripción"
                    placeholder="Ej: Contacto laboral, Personal, etc."
                    multiline
                    rows={2}
                    error={!!errors.descripcion}
                    helperText={errors.descripcion?.message}
                  />
                )}
              />
            </Grid>

            {/* Es principal */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="principal"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Marcar como contacto principal"
                  />
                )}
              />
              <FormHelperText>
                Solo puede haber un contacto principal por tipo de contacto
              </FormHelperText>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} startIcon={<CloseIcon />} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={loading || !!patternError}
          >
            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Agregar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AgregarContactoModal;
