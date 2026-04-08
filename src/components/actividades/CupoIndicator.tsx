/**
 * CupoIndicator - Componente reutilizable para mostrar cupos disponibles
 * Versión simplificada del ProyeccionCupo para uso general
 */

import React from 'react';
import { Box, Chip, LinearProgress, Typography } from '@mui/material';
import type { ChipProps } from '@mui/material';

interface CupoIndicatorProps {
  capacidadMaxima: number | null;
  participantesActivos: number;
  cuposDisponibles?: number; // Calculado automáticamente si no se provee
  variant?: 'compact' | 'detailed';
}

export const CupoIndicator: React.FC<CupoIndicatorProps> = ({
  capacidadMaxima,
  participantesActivos,
  cuposDisponibles: cuposDisponiblesProp,
  variant = 'compact',
}) => {
  // Sin límite de capacidad
  if (capacidadMaxima === null || capacidadMaxima === undefined) {
    return (
      <Chip
        label="Sin límite de cupos"
        color="info"
        size="small"
        variant="outlined"
      />
    );
  }

  // Calcular cupos disponibles
  const cuposDisponibles = cuposDisponiblesProp !== undefined
    ? cuposDisponiblesProp
    : Math.max(0, capacidadMaxima - (participantesActivos || 0));

  const porcentaje = (participantesActivos / capacidadMaxima) * 100;

  // Determinar color basado en disponibilidad
  const getColor = (): ChipProps['color'] => {
    if (cuposDisponibles === 0) return 'error';
    if (cuposDisponibles <= 5) return 'warning';
    return 'success';
  };

  const getColorForProgress = (): 'error' | 'warning' | 'success' => {
    if (cuposDisponibles === 0) return 'error';
    if (cuposDisponibles <= 5) return 'warning';
    return 'success';
  };

  const color = getColor();

  // Variante compacta - solo chip
  if (variant === 'compact') {
    return (
      <Chip
        label={
          cuposDisponibles === 0
            ? 'Sin cupos'
            : `${cuposDisponibles} ${cuposDisponibles === 1 ? 'cupo' : 'cupos'} disponible${cuposDisponibles === 1 ? '' : 's'}`
        }
        color={color}
        size="small"
      />
    );
  }

  // Variante detallada - con barra de progreso
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={1}>
        <Typography variant="body2">
          {participantesActivos} / {capacidadMaxima} inscriptos
        </Typography>
        <Typography
          variant="body2"
          color={`${color}.main`}
          fontWeight="bold"
        >
          {cuposDisponibles} disponible{cuposDisponibles === 1 ? '' : 's'}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(porcentaje, 100)}
        color={getColorForProgress()}
        sx={{ height: 8, borderRadius: 4 }}
      />
      {cuposDisponibles === 0 && (
        <Typography variant="caption" color="error.main" display="block" mt={0.5}>
          ⚠️ Capacidad máxima alcanzada
        </Typography>
      )}
    </Box>
  );
};

export default CupoIndicator;
