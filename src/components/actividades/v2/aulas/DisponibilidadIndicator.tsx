/**
 * Componente para mostrar el estado de disponibilidad de un aula
 * Muestra si está disponible, capacidad, y conflictos si los hay
 */

import React from 'react';
import { Box, Chip, Typography, Alert, AlertTitle } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import type { DisponibilidadAula } from '@/types/actividad-aula.types';

interface DisponibilidadIndicatorProps {
  disponibilidad: DisponibilidadAula;
}

const DisponibilidadIndicator: React.FC<DisponibilidadIndicatorProps> = ({
  disponibilidad,
}) => {
  const {
    disponible,
    capacidadSuficiente,
    participantesActuales,
    capacidadAula,
    conflictos,
    observaciones,
  } = disponibilidad;

  const porcentajeOcupacion = capacidadAula > 0
    ? Math.round((participantesActuales / capacidadAula) * 100)
    : 0;

  // Determinar color según ocupación
  const getCapacidadColor = () => {
    if (!capacidadSuficiente) return 'error';
    if (porcentajeOcupacion >= 90) return 'warning';
    if (porcentajeOcupacion >= 70) return 'info';
    return 'success';
  };

  // Determinar severidad general
  const getSeverity = () => {
    if (!disponible || !capacidadSuficiente) return 'error';
    if ((conflictos && conflictos.length > 0) || porcentajeOcupacion >= 90) return 'warning';
    return 'success';
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
        {/* Chip de disponibilidad */}
        {disponible ? (
          <Chip
            icon={<CheckCircleIcon />}
            label="✅ Aula Disponible"
            color="success"
            variant="filled"
          />
        ) : (
          <Chip
            icon={<ErrorIcon />}
            label="❌ No Disponible"
            color="error"
            variant="filled"
          />
        )}

        {/* Chip de capacidad */}
        <Chip
          icon={capacidadSuficiente ? <CheckCircleIcon /> : <ErrorIcon />}
          label={`Capacidad: ${participantesActuales}/${capacidadAula} (${porcentajeOcupacion}%)`}
          color={getCapacidadColor()}
          size="small"
        />

        {/* Chip de conflictos */}
        {conflictos && conflictos.length > 0 && (
          <Chip
            icon={<WarningIcon />}
            label={`${conflictos.length} conflicto${conflictos.length > 1 ? 's' : ''}`}
            color="warning"
            size="small"
          />
        )}
      </Box>

      {/* Alert principal */}
      <Alert severity={getSeverity()} sx={{ mt: 2 }}>
        <AlertTitle>
          {disponible && capacidadSuficiente
            ? '✅ El aula cumple todos los requisitos'
            : '⚠️ Problemas detectados'}
        </AlertTitle>

        {/* Mensajes de capacidad */}
        {!capacidadSuficiente && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Capacidad insuficiente:</strong> El aula tiene capacidad para{' '}
            {capacidadAula} personas, pero la actividad tiene{' '}
            {participantesActuales} participantes activos.
          </Typography>
        )}

        {capacidadSuficiente && porcentajeOcupacion >= 90 && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Capacidad al límite:</strong> El aula está al {porcentajeOcupacion}%
            de su capacidad. Puede llenarse pronto.
          </Typography>
        )}

        {/* Observaciones adicionales */}
        {observaciones && observaciones.length > 0 && (
          <Box sx={{ mt: 1 }}>
            {observaciones.map((obs, index) => (
              <Typography key={index} variant="caption" display="block" sx={{ mb: 0.5 }}>
                • {obs}
              </Typography>
            ))}
          </Box>
        )}

        {/* Mensaje de éxito */}
        {disponible && capacidadSuficiente && porcentajeOcupacion < 90 && (
          <Typography variant="body2">
            Esta aula cumple con todos los requisitos para la actividad.
            Puede proceder con la asignación.
          </Typography>
        )}
      </Alert>
    </Box>
  );
};

export default DisponibilidadIndicator;
