/**
 * Modal de 2 pasos para asignar un aula a una actividad
 * Paso 1: Seleccionar aula con validación en tiempo real
 * Paso 2: Confirmar y asignar (prioridad, observaciones)
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Alert,
} from '@mui/material';
import {
  Lightbulb as LightbulbIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { fetchAulas } from '@/store/slices/aulasSlice';
import { useDisponibilidadAula, useAulasMutations } from '@/hooks/useActividadesAulas';
import { showNotification } from '@/store/slices/uiSlice';
import DisponibilidadIndicator from './DisponibilidadIndicator';
import ConflictosHorariosAlert from './ConflictosHorariosAlert';
import type { Aula } from '@/types/aula.types';
import type { ActividadAula, AsignarAulaDto } from '@/types/actividad-aula.types';

interface AsignarAulaModalProps {
  open: boolean;
  actividadId: number;
  actividadNombre: string;
  aulasExistentes: ActividadAula[];
  onClose: () => void;
  onSuccess: () => void;
}

const STEPS = ['Seleccionar Aula', 'Confirmar Asignación'];

const AsignarAulaModal: React.FC<AsignarAulaModalProps> = ({
  open,
  actividadId,
  actividadNombre,
  aulasExistentes,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const { aulas, loading: loadingAulas } = useAppSelector((state) => state.aulas);

  // Estado del wizard
  const [activeStep, setActiveStep] = useState(0);

  // Estado de selección
  const [aulaSeleccionadaId, setAulaSeleccionadaId] = useState<number | ''>('');
  const [prioridad, setPrioridad] = useState<number>(1);
  const [observaciones, setObservaciones] = useState('');

  // Hooks
  const { verificar, disponibilidad, loading: validando, reset } = useDisponibilidadAula(actividadId);
  const { asignar, loading: asignando } = useAulasMutations(actividadId, handleSuccess);

  // Cargar aulas al montar si no están cargadas
  useEffect(() => {
    if (open && aulas.length === 0) {
      dispatch(fetchAulas({ activa: true }));
    }
  }, [open, aulas.length, dispatch]);

  // Reset al abrir/cerrar modal
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setAulaSeleccionadaId('');
      setPrioridad(1);
      setObservaciones('');
      reset();
    }
  }, [open, reset]);

  function handleSuccess() {
    dispatch(showNotification({
      message: 'Aula asignada exitosamente',
      severity: 'success'
    }));
    onSuccess();
    onClose();
  }

  // IDs de aulas ya asignadas (activas)
  const aulasYaAsignadasIds = aulasExistentes
    .filter((a) => a.activa)
    .map((a) => a.aulaId);

  // Aulas disponibles (activas y no asignadas)
  const aulasDisponibles = aulas.filter(
    (aula) => aula.activa && !aulasYaAsignadasIds.includes(aula.id)
  );

  // Obtener aula seleccionada
  const aulaSeleccionada = aulas.find((a) => a.id === aulaSeleccionadaId);

  // Handler al cambiar aula: validar disponibilidad automáticamente
  const handleAulaChange = async (aulaId: number | '') => {
    setAulaSeleccionadaId(aulaId);
    reset();

    if (aulaId && typeof aulaId === 'number') {
      // Verificar disponibilidad en tiempo real
      await verificar({ aulaId });
    }
  };

  // Handler siguiente paso
  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  // Handler paso anterior
  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Handler asignar aula
  const handleAsignar = async () => {
    if (!aulaSeleccionadaId || typeof aulaSeleccionadaId !== 'number') return;

    try {
      const data: AsignarAulaDto = {
        aulaId: aulaSeleccionadaId,
        prioridad,
        observaciones: observaciones || undefined,
      };

      await asignar(data);
      // handleSuccess() es llamado automáticamente por el hook
    } catch (error: any) {
      dispatch(showNotification({
        message: error.message || 'Error al asignar aula',
        severity: 'error'
      }));
    }
  };

  // Validar si puede avanzar al siguiente paso
  const puedeAvanzar = () => {
    if (activeStep === 0) {
      return (
        aulaSeleccionadaId &&
        disponibilidad &&
        disponibilidad.disponible &&
        disponibilidad.capacidadSuficiente
      );
    }
    return false;
  };

  // Renderizar contenido según paso activo
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            {/* Selector de aula */}
            <FormControl fullWidth required sx={{ mb: 2 }}>
              <InputLabel>Seleccionar Aula</InputLabel>
              <Select
                value={aulaSeleccionadaId}
                onChange={(e) => handleAulaChange(e.target.value as number | '')}
                label="Seleccionar Aula"
                disabled={loadingAulas}
              >
                <MenuItem value="">
                  <em>Seleccione un aula</em>
                </MenuItem>
                {aulasDisponibles.map((aula) => (
                  <MenuItem key={aula.id} value={aula.id}>
                    {aula.nombre} - Cap: {aula.capacidad} - {aula.ubicacion || 'Sin ubicación'}
                    {aula.tipoAula && ` (${aula.tipoAula.nombre})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {aulasDisponibles.length === 0 && !loadingAulas && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                No hay aulas disponibles. Todas las aulas activas ya están asignadas a esta actividad.
              </Alert>
            )}

            {/* Indicador de carga */}
            {validando && (
              <Box display="flex" alignItems="center" gap={1} sx={{ mt: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Verificando disponibilidad...
                </Typography>
              </Box>
            )}

            {/* Indicador de disponibilidad */}
            {disponibilidad && !validando && (
              <DisponibilidadIndicator disponibilidad={disponibilidad} />
            )}

            {/* Alerta de conflictos */}
            {disponibilidad && disponibilidad.conflictos && disponibilidad.conflictos.length > 0 && (
              <ConflictosHorariosAlert
                conflictos={disponibilidad.conflictos}
                aulaNombre={aulaSeleccionada?.nombre}
              />
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Confirmar Asignación
            </Typography>

            {/* Resumen */}
            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Actividad:
              </Typography>
              <Typography variant="body1" fontWeight={600} gutterBottom>
                {actividadNombre}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                Aula seleccionada:
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {aulaSeleccionada?.nombre}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Capacidad: {aulaSeleccionada?.capacidad} personas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ubicación: {aulaSeleccionada?.ubicacion || 'No especificada'}
              </Typography>
            </Box>

            {/* Campo de prioridad */}
            <TextField
              fullWidth
              type="number"
              label="Prioridad"
              value={prioridad}
              onChange={(e) => setPrioridad(Number(e.target.value))}
              helperText="1 = Mayor prioridad. Usado cuando una actividad tiene múltiples aulas."
              inputProps={{ min: 1, max: 10 }}
              sx={{ mb: 2 }}
            />

            {/* Campo de observaciones */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              helperText="Observaciones opcionales sobre esta asignación"
              placeholder="Ej: Aula principal del coro"
            />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={asignando}
    >
      <DialogTitle>Asignar Aula a Actividad</DialogTitle>

      <DialogContent>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Contenido del paso */}
        {renderStepContent()}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={asignando}>
          Cancelar
        </Button>

        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={asignando} startIcon={<BackIcon />}>
            Anterior
          </Button>
        )}

        {activeStep < STEPS.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!puedeAvanzar() || validando}
            endIcon={<NextIcon />}
          >
            Siguiente
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleAsignar}
            disabled={asignando || !aulaSeleccionadaId}
          >
            {asignando ? 'Asignando...' : 'Asignar Aula'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AsignarAulaModal;
