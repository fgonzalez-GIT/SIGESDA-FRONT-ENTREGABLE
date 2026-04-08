import React from 'react';
import { Alert, AlertTitle, Box, Chip, Typography } from '@mui/material';
import {
  Warning as WarningIcon,
  Event as EventIcon,
  Room as RoomIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import type { Reserva, ConflictoRecurrente, ConflictosAllResponse } from '@/types/reserva.types';
import { formatDateTimeES, formatTimeES } from '@/utils/dateHelpers';

interface ConflictosAlertProps {
  conflictos: ConflictosAllResponse | null;
  onClose?: () => void;
}

/**
 * Componente para mostrar alertas de conflictos de reservas
 *
 * Muestra tanto conflictos puntuales como recurrentes con información detallada
 */
const ConflictosAlert: React.FC<ConflictosAlertProps> = ({ conflictos, onClose }) => {
  if (!conflictos || !conflictos.hasConflicts) {
    return null;
  }

  const { puntuales = [], recurrentes = [], totalConflicts } = conflictos;

  return (
    <Alert
      severity="error"
      icon={<WarningIcon />}
      onClose={onClose}
      sx={{ mb: 2 }}
    >
      <AlertTitle>
        <strong>⚠️ Conflictos de horario detectados ({totalConflicts})</strong>
      </AlertTitle>

      <Typography variant="body2" gutterBottom>
        El horario seleccionado tiene conflictos con las siguientes reservas:
      </Typography>

      {/* Conflictos Puntuales */}
      {puntuales.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            📅 Reservas Puntuales ({puntuales.length})
          </Typography>
          {puntuales.map((reserva: Reserva) => (
            <Box
              key={reserva.id}
              sx={{
                p: 1.5,
                mb: 1,
                backgroundColor: 'rgba(211, 47, 47, 0.1)',
                borderLeft: '4px solid #d32f2f',
                borderRadius: 1,
              }}
            >
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <Chip
                  icon={<RoomIcon />}
                  label={reserva.aula?.nombre || `Aula #${reserva.aulaId}`}
                  size="small"
                  color="primary"
                />
                <Chip
                  icon={<PersonIcon />}
                  label={
                    reserva.personas
                      ? `${reserva.personas.nombre} ${reserva.personas.apellido}`
                      : `Docente #${reserva.docenteId}`
                  }
                  size="small"
                />
                <Chip
                  icon={<EventIcon />}
                  label={formatDateTimeES(reserva.fechaInicio)}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<TimeIcon />}
                  label={`${formatTimeES(reserva.fechaInicio)} - ${formatTimeES(reserva.fechaFin)}`}
                  size="small"
                  variant="outlined"
                />
              </Box>
              {reserva.actividades && (
                <Typography variant="caption" display="block" sx={{ mt: 0.5, ml: 0.5 }}>
                  Actividad: <strong>{reserva.actividades.nombre}</strong>
                </Typography>
              )}
              {reserva.observaciones && (
                <Typography variant="caption" display="block" sx={{ mt: 0.5, ml: 0.5, fontStyle: 'italic' }}>
                  {reserva.observaciones}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Conflictos Recurrentes */}
      {recurrentes.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            🔄 Reservas Recurrentes ({recurrentes.length})
          </Typography>
          {recurrentes.map((conflicto: ConflictoRecurrente, index: number) => (
            <Box
              key={index}
              sx={{
                p: 1.5,
                mb: 1,
                backgroundColor: 'rgba(237, 108, 2, 0.1)',
                borderLeft: '4px solid #ed6c02',
                borderRadius: 1,
              }}
            >
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <Chip
                  icon={<RoomIcon />}
                  label={conflicto.aula?.nombre || `Aula #${conflicto.aulaId}`}
                  size="small"
                  color="warning"
                />
                <Chip
                  label={`🔄 ${conflicto.diaSemana}`}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
                <Chip
                  icon={<TimeIcon />}
                  label={`${conflicto.horaInicio} - ${conflicto.horaFin}`}
                  size="small"
                  variant="outlined"
                />
              </Box>
              {conflicto.seccion && (
                <Typography variant="caption" display="block" sx={{ mt: 0.5, ml: 0.5 }}>
                  Sección: <strong>{conflicto.seccion.nombre}</strong>
                  {conflicto.seccion.actividades && (
                    <> - Actividad: <strong>{conflicto.seccion.actividades.nombre}</strong></>
                  )}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ mt: 2, p: 1, backgroundColor: 'rgba(0, 0, 0, 0.05)', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          💡 <strong>Sugerencia:</strong> Cambia el horario o selecciona otra aula para evitar conflictos.
        </Typography>
      </Box>
    </Alert>
  );
};

export default ConflictosAlert;
