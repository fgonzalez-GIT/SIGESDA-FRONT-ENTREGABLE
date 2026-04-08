import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Checkbox,
  FormControlLabel,
  Stack,
  Paper,
  Divider,
  Chip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import { Controller, useFieldArray, Control, FieldErrors } from 'react-hook-form';
import type { CreatePersonaFormData } from '../../../../schemas/persona.schema';
import type { CatalogosPersonas } from '../../../../types/persona.types';

interface ContactosFormSectionProps {
  control: Control<CreatePersonaFormData>;
  errors: FieldErrors<CreatePersonaFormData>;
  catalogos: CatalogosPersonas | null;
}

/**
 * Sección de formulario para agregar contactos durante la creación de persona
 * Permite agregar múltiples contactos con validación de contacto principal
 *
 * @example
 * ```tsx
 * <ContactosFormSection
 *   control={control}
 *   errors={errors}
 *   catalogos={catalogos}
 * />
 * ```
 */
export const ContactosFormSection: React.FC<ContactosFormSectionProps> = ({
  control,
  errors,
  catalogos,
}) => {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'contactos',
  });

  const handleAddContacto = () => {
    append({
      tipoContactoId: 0,
      valor: '',
      descripcion: '',
      principal: false,
      observaciones: '',
    });
  };

  const handleTogglePrincipal = (index: number) => {
    const currentContacto = fields[index];
    const newValue = !currentContacto.principal;

    // Si se marca como principal, desmarcar los demás
    if (newValue) {
      fields.forEach((field, i) => {
        if (i !== index && field.principal) {
          update(i, { ...field, principal: false });
        }
      });
    }

    update(index, { ...currentContacto, principal: newValue });
  };

  const tiposContacto = catalogos?.tiposContacto || [];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Contactos (opcional)</Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddContacto}
        >
          Agregar Contacto
        </Button>
      </Box>

      {fields.length === 0 && (
        <Alert severity="info">
          No hay contactos agregados. Puede agregar contactos ahora o después de crear la persona.
        </Alert>
      )}

      {errors.contactos && typeof errors.contactos.message === 'string' && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.contactos.message}
        </Alert>
      )}

      <Stack spacing={2}>
        {fields.map((field, index) => (
          <Paper key={field.id} variant="outlined" sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Contacto #{index + 1}
              </Typography>
              <Box display="flex" gap={1} alignItems="center">
                <IconButton
                  size="small"
                  onClick={() => handleTogglePrincipal(index)}
                  color={field.principal ? 'primary' : 'default'}
                  title={field.principal ? 'Contacto principal' : 'Marcar como principal'}
                >
                  {field.principal ? <StarIcon /> : <StarBorderIcon />}
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => remove(index)}
                  title="Eliminar contacto"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name={`contactos.${index}.tipoContactoId`}
                  control={control}
                  render={({ field: controllerField }) => (
                    <FormControl
                      fullWidth
                      size="small"
                      error={!!errors.contactos?.[index]?.tipoContactoId}
                    >
                      <InputLabel>Tipo de Contacto *</InputLabel>
                      <Select
                        {...controllerField}
                        value={controllerField.value || ''}
                        onChange={(e) => controllerField.onChange(Number(e.target.value))}
                        label="Tipo de Contacto *"
                      >
                        <MenuItem value="">Seleccionar tipo</MenuItem>
                        {tiposContacto
                          .filter((tc) => tc.activo)
                          .map((tipo) => (
                            <MenuItem key={tipo.id} value={tipo.id}>
                              {tipo.nombre}
                            </MenuItem>
                          ))}
                      </Select>
                      {errors.contactos?.[index]?.tipoContactoId && (
                        <FormHelperText>
                          {errors.contactos[index]?.tipoContactoId?.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name={`contactos.${index}.valor`}
                  control={control}
                  render={({ field: controllerField }) => (
                    <TextField
                      {...controllerField}
                      fullWidth
                      size="small"
                      label="Valor *"
                      placeholder="Ej: email@ejemplo.com, +54 9 11 1234-5678"
                      error={!!errors.contactos?.[index]?.valor}
                      helperText={errors.contactos?.[index]?.valor?.message}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  name={`contactos.${index}.descripcion`}
                  control={control}
                  render={({ field: controllerField }) => (
                    <TextField
                      {...controllerField}
                      fullWidth
                      size="small"
                      label="Descripción"
                      placeholder="Ej: Contacto personal, Trabajo, etc."
                      error={!!errors.contactos?.[index]?.descripcion}
                      helperText={errors.contactos?.[index]?.descripcion?.message}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  name={`contactos.${index}.observaciones`}
                  control={control}
                  render={({ field: controllerField }) => (
                    <TextField
                      {...controllerField}
                      fullWidth
                      size="small"
                      label="Observaciones"
                      multiline
                      rows={2}
                      placeholder="Notas adicionales sobre este contacto..."
                      error={!!errors.contactos?.[index]?.observaciones}
                      helperText={errors.contactos?.[index]?.observaciones?.message}
                    />
                  )}
                />
              </Grid>

              {field.principal && (
                <Grid size={{ xs: 12 }}>
                  <Chip
                    icon={<StarIcon />}
                    label="Contacto Principal"
                    color="primary"
                    size="small"
                  />
                </Grid>
              )}
            </Grid>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

export default ContactosFormSection;
