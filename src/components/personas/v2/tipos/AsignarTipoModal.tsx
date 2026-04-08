import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Divider,
  FormHelperText,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { personasApi } from '../../../../services/personasApi';
import type { CreatePersonaTipoDTO, TipoPersona, CatalogosPersonas } from '../../../../types/persona.types';
import { handleApiError, getErrorMessage } from '../../../../utils/errorHandling';

interface AsignarTipoModalProps {
  open: boolean;
  onClose: () => void;
  personaId: number;
  personaNombre: string;
  catalogos: CatalogosPersonas | null;
  tiposAsignados: string[]; // Códigos de tipos ya asignados
  onSuccess: () => void;
}

/**
 * Modal para asignar un nuevo tipo a una persona
 * Maneja validaciones específicas por tipo (SOCIO/DOCENTE/PROVEEDOR/NO_SOCIO)
 *
 * Validaciones:
 * - SOCIO requiere categoriaId
 * - DOCENTE requiere especialidadId y honorariosPorHora
 * - PROVEEDOR requiere cuit y razonSocial
 * - NO_SOCIO no requiere campos adicionales
 * - SOCIO y NO_SOCIO son mutuamente excluyentes
 */
export const AsignarTipoModal: React.FC<AsignarTipoModalProps> = ({
  open,
  onClose,
  personaId,
  personaNombre,
  catalogos,
  tiposAsignados,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>('');
  const [categoriaId, setCategoriaId] = useState<string>('');
  const [especialidadId, setEspecialidadId] = useState<number | ''>('');
  const [honorariosPorHora, setHonorariosPorHora] = useState<number | ''>('');
  const [cuit, setCuit] = useState<string>('');
  const [razonSocial, setRazonSocial] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');

  // Validación de errores de campos
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form cuando se abre/cierra
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setTipoSeleccionado('');
    setCategoriaId('');
    setEspecialidadId('');
    setHonorariosPorHora('');
    setCuit('');
    setRazonSocial('');
    setObservaciones('');
    setError(null);
    setErrors({});
  };

  // Tipos disponibles (excluir ya asignados)
  const tiposDisponibles = catalogos?.tiposPersona?.filter(
    (tipo) => !tiposAsignados.includes(tipo.codigo)
  ) || [];

  // Validar campos según el tipo seleccionado
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!tipoSeleccionado) {
      newErrors.tipo = 'Debes seleccionar un tipo';
      setErrors(newErrors);
      return false;
    }

    // Validar exclusión mutua SOCIO ↔ NO_SOCIO
    const tipoUpper = tipoSeleccionado.toUpperCase();
    if (tipoUpper === 'SOCIO' && tiposAsignados.includes('NO_SOCIO')) {
      newErrors.tipo = 'No se puede asignar SOCIO: la persona ya tiene tipo NO_SOCIO (son mutuamente excluyentes)';
      setErrors(newErrors);
      return false;
    }
    if (tipoUpper === 'NO_SOCIO' && tiposAsignados.includes('SOCIO')) {
      newErrors.tipo = 'No se puede asignar NO_SOCIO: la persona ya tiene tipo SOCIO (son mutuamente excluyentes)';
      setErrors(newErrors);
      return false;
    }

    switch (tipoUpper) {
      case 'SOCIO':
        if (!categoriaId) {
          newErrors.categoriaId = 'La categoría es obligatoria para tipo SOCIO';
        }
        break;

      case 'DOCENTE':
        if (!especialidadId) {
          newErrors.especialidadId = 'La especialidad es obligatoria para tipo DOCENTE';
        }
        if (honorariosPorHora === '' || honorariosPorHora == null) {
          newErrors.honorariosPorHora = 'Los honorarios son obligatorios';
        } else if (Number(honorariosPorHora) < 0) {
          newErrors.honorariosPorHora = 'Los honorarios no pueden ser negativos';
        }
        break;

      case 'PROVEEDOR':
        if (!cuit) {
          newErrors.cuit = 'El CUIT es obligatorio para tipo PROVEEDOR';
        } else if (!/^\d{11}$/.test(cuit.replace(/-/g, ''))) {
          newErrors.cuit = 'El CUIT debe tener 11 dígitos';
        }
        if (!razonSocial) {
          newErrors.razonSocial = 'La razón social es obligatoria para tipo PROVEEDOR';
        }
        break;

      case 'NO_SOCIO':
        // Sin campos adicionales requeridos
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dto: CreatePersonaTipoDTO = {
        tipoPersonaCodigo: tipoSeleccionado,
        observaciones: observaciones || undefined,
      };

      // Agregar campos específicos según el tipo
      switch (tipoSeleccionado.toUpperCase()) {
        case 'SOCIO':
          dto.categoriaId = Number(categoriaId);
          break;

        case 'DOCENTE':
          dto.especialidadId = Number(especialidadId);
          dto.honorariosPorHora = Number(honorariosPorHora);
          break;

        case 'PROVEEDOR':
          dto.cuit = cuit.replace(/-/g, ''); // Remover guiones
          dto.razonSocialId = Number(razonSocial);
          break;
      }

      await personasApi.asignarTipo(personaId, dto);

      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      console.error('Error al asignar tipo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // Renderizar campos específicos por tipo
  const renderCamposEspecificos = () => {
    if (!tipoSeleccionado) return null;

    const tipoUpper = tipoSeleccionado.toUpperCase();

    switch (tipoUpper) {
      case 'SOCIO':
        return (
          <FormControl fullWidth error={!!errors.categoriaId}>
            <InputLabel>Categoría *</InputLabel>
            <Select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              label="Categoría *"
              disabled={loading}
            >
              {catalogos?.categoriasSocio?.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.nombre}
                </MenuItem>
              ))}
            </Select>
            {errors.categoriaId && (
              <FormHelperText>{errors.categoriaId}</FormHelperText>
            )}
          </FormControl>
        );

      case 'DOCENTE':
        return (
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControl fullWidth error={!!errors.especialidadId}>
              <InputLabel>Especialidad *</InputLabel>
              <Select
                value={especialidadId}
                onChange={(e) => setEspecialidadId(e.target.value as number)}
                label="Especialidad *"
                disabled={loading}
              >
                {catalogos?.especialidadesDocentes?.map((esp) => (
                  <MenuItem key={esp.id} value={esp.id}>
                    {esp.nombre}
                  </MenuItem>
                ))}
              </Select>
              {errors.especialidadId && (
                <FormHelperText>{errors.especialidadId}</FormHelperText>
              )}
            </FormControl>

            <TextField
              fullWidth
              type="number"
              label="Honorarios por Hora *"
              value={honorariosPorHora}
              onChange={(e) => setHonorariosPorHora(Number(e.target.value))}
              error={!!errors.honorariosPorHora}
              helperText={errors.honorariosPorHora}
              disabled={loading}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
              }}
            />
          </Box>
        );

      case 'PROVEEDOR':
        return (
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              fullWidth
              label="CUIT *"
              placeholder="20-12345678-9"
              value={cuit}
              onChange={(e) => setCuit(e.target.value)}
              error={!!errors.cuit}
              helperText={errors.cuit || '11 dígitos (pueden incluir guiones)'}
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Razón Social *"
              value={razonSocial}
              onChange={(e) => setRazonSocial(e.target.value)}
              error={!!errors.razonSocial}
              helperText={errors.razonSocial}
              disabled={loading}
            />
          </Box>
        );

      case 'NO_SOCIO':
        return (
          <Alert severity="info" sx={{ mt: 1 }}>
            El tipo NO_SOCIO no requiere datos adicionales
          </Alert>
        );

      default:
        return null;
    }
  };

  // Alerta informativa sobre exclusión mutua SOCIO/NO_SOCIO (ahora prevenido en validación)
  const showExclusionInfo = () => {
    const tipoUpper = tipoSeleccionado.toUpperCase();
    if ((tipoUpper === 'SOCIO' || tipoUpper === 'NO_SOCIO') &&
        !(tiposAsignados.includes('SOCIO') || tiposAsignados.includes('NO_SOCIO'))) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          ℹ️ Los tipos SOCIO y NO_SOCIO son mutuamente excluyentes. No se podrá asignar el otro tipo mientras este esté activo.
        </Alert>
      );
    }
    return null;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle>
        <Typography variant="h6">Asignar Tipo a Persona</Typography>
        <Typography variant="body2" color="text.secondary">
          {personaNombre}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box display="flex" flexDirection="column" gap={2.5} pt={1}>
          {/* Selector de tipo */}
          <FormControl fullWidth error={!!errors.tipo}>
            <InputLabel>Tipo de Persona *</InputLabel>
            <Select
              value={tipoSeleccionado}
              onChange={(e) => setTipoSeleccionado(e.target.value)}
              label="Tipo de Persona *"
              disabled={loading}
            >
              {tiposDisponibles.length === 0 ? (
                <MenuItem value="" disabled>
                  No hay tipos disponibles
                </MenuItem>
              ) : (
                tiposDisponibles.map((tipo) => (
                  <MenuItem key={tipo.id} value={tipo.codigo}>
                    {tipo.nombre}
                  </MenuItem>
                ))
              )}
            </Select>
            {errors.tipo && <FormHelperText>{errors.tipo}</FormHelperText>}
          </FormControl>

          {/* Campos específicos por tipo */}
          {tipoSeleccionado && (
            <>
              <Divider />
              <Typography variant="subtitle2" color="text.secondary">
                Datos específicos del tipo
              </Typography>
              {renderCamposEspecificos()}
            </>
          )}

          {/* Observaciones */}
          {tipoSeleccionado && (
            <>
              <Divider />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observaciones (opcional)"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Agrega notas o comentarios sobre esta asignación..."
                disabled={loading}
              />
            </>
          )}

          {/* Información sobre exclusión mutua */}
          {showExclusionInfo()}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          startIcon={<CloseIcon />}
          color="inherit"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || tiposDisponibles.length === 0}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
        >
          {loading ? 'Asignando...' : 'Asignar Tipo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AsignarTipoModal;
