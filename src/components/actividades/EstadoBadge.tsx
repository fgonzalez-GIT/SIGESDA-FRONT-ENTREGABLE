/**
 * Componente Badge de Estado para Actividades V2
 * Muestra el estado de una actividad con colores diferenciados
 */

import React from 'react';
import { Chip } from '@mui/material';
import type { EstadoActividad } from '../../types/actividad.types';

interface EstadoBadgeProps {
  estado: EstadoActividad;
  size?: 'small' | 'medium';
  variant?: 'filled' | 'outlined';
}

const ESTADO_COLORS: Record<string, 'success' | 'default' | 'error' | 'warning'> = {
  'ACTIVA': 'success',
  'INACTIVA': 'default',
  'FINALIZADA': 'default',
  'CANCELADA': 'error',
};

export const EstadoBadge: React.FC<EstadoBadgeProps> = ({
  estado,
  size = 'small',
  variant = 'filled',
}) => {
  const color = ESTADO_COLORS[estado.codigo] || 'default';

  return (
    <Chip
      label={estado.nombre}
      color={color}
      size={size}
      variant={variant}
    />
  );
};

export default EstadoBadge;
