import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Typography,
  IconButton,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { DocenteSelect } from './DocenteSelect';
import { RolDocenteSelect } from './RolDocenteSelect';
import { asignarDocente } from '../../services/actividadesApi';
import { AsignarDocenteDTO } from '../../types/actividad.types';

interface AsignarDocenteDialogProps {
  open: boolean;
  onClose: () => void;
  actividadId: number;
  onSuccess?: () => void;
  docentesExistentes?: Array<{ docente_id: number; rol_docente_id: number }>;
}

const steps = ['Seleccionar Docente', 'Asignar Rol', 'Confirmar'];

export const AsignarDocenteDialog: React.FC<AsignarDocenteDialogProps> = ({
  open,
  onClose,
  actividadId,
  onSuccess,
  docentesExistentes = [],
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [docenteId, setDocenteId] = useState<number | string>('');
  const [rolDocenteId, setRolDocenteId] = useState<number | undefined>(undefined);
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Errores de validación por campo
  const [docenteError, setDocenteError] = useState<string>('');
  const [rolError, setRolError] = useState<string>('');

  // Reset form cuando se cierra
  const handleClose = () => {
    setActiveStep(0);
    setDocenteId('');
    setRolDocenteId(undefined);
    setObservaciones('');
    setError(null);
    setDocenteError('');
    setRolError('');
    onClose();
  };

  // Validar paso actual
  const validateCurrentStep = (): boolean => {
    setDocenteError('');
    setRolError('');

    if (activeStep === 0) {
      if (!docenteId) {
        setDocenteError('Debe seleccionar un docente');
        return false;
      }

      // Validar que el docente no esté ya asignado (independientemente del rol)
      const yaAsignado = docentesExistentes.some(
        (d) => Number(d.docente_id) === Number(docenteId)
      );

      if (yaAsignado) {
        setDocenteError('Este docente ya está asignado a la actividad. Un docente solo puede tener un rol por actividad.');
        return false;
      }
    }

    if (activeStep === 1) {
      if (!rolDocenteId) {
        setRolError('Debe seleccionar un rol para el docente');
        return false;
      }
    }

    return true;
  };

  // Avanzar al siguiente paso
  const handleNext = () => {
    if (!validateCurrentStep()) return;

    if (activeStep === steps.length - 1) {
      // Último paso: asignar
      handleAsignar();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  // Retroceder al paso anterior
  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Asignar docente
  const handleAsignar = async () => {
    if (!docenteId || !rolDocenteId) {
      setError('Debe completar todos los campos requeridos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data: AsignarDocenteDTO = {
        docenteId: Number(docenteId), // Convertir a número
        rolDocenteId,
        observaciones: observaciones.trim() || undefined,
      };

      await asignarDocente(actividadId, data);

      // Éxito
      if (onSuccess) {
        onSuccess();
      }
      handleClose();
    } catch (err: any) {
      console.error('Error al asignar docente:', err);
      setError(err.message || 'Error al asignar el docente a la actividad');
    } finally {
      setLoading(false);
    }
  };

  // Contenido de cada paso
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Seleccione el docente que desea asignar a esta actividad.
            </Typography>
            <DocenteSelect
              value={docenteId}
              onChange={(id) => {
                setDocenteId(id);
                setDocenteError('');
              }}
              error={docenteError}
              required
              label="Docente"
              fullWidth
              excludeDocenteIds={docentesExistentes.map((d) => d.docente_id)}
            />
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Seleccione el rol que tendrá el docente en esta actividad.
            </Typography>
            <RolDocenteSelect
              value={rolDocenteId}
              onChange={(id) => {
                setRolDocenteId(id);
                setRolError('');
              }}
              error={rolError}
              required
              label="Rol del Docente"
              fullWidth
              showDescription
            />
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Agregue observaciones adicionales si lo desea (opcional).
            </Typography>
            <TextField
              label="Observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              fullWidth
              multiline
              rows={4}
              placeholder="Ej: Docente suplente por el mes de enero..."
              helperText="Información adicional sobre la asignación"
            />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAddIcon />
            <Typography variant="h6">Asignar Docente</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Error general */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Contenido del paso actual */}
        {renderStepContent()}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Box sx={{ flex: 1 }} />
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Atrás
          </Button>
        )}
        <Button
          onClick={handleNext}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {activeStep === steps.length - 1 ? 'Asignar Docente' : 'Siguiente'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AsignarDocenteDialog;
