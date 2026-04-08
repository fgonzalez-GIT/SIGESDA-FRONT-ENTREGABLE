import React, { useEffect, useState } from 'react';
import { Chip, Tooltip, CircularProgress } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { equipamientosApi } from '@/services/equipamientosApi';
import type { DisponibilidadInfo } from '@/types/equipamiento.types';

interface DisponibilidadChipProps {
  equipamientoId: number;
  showTooltip?: boolean; // Mostrar tooltip con detalles
  size?: 'small' | 'medium';
}

/**
 * Chip compacto que muestra la disponibilidad de un equipamiento
 *
 * Colores:
 * - Verde: Disponible (cantidadDisponible >= 20% del total)
 * - Amarillo: Stock bajo (cantidadDisponible < 20% del total)
 * - Rojo: Déficit (cantidadDisponible < 0)
 */
export const DisponibilidadChip: React.FC<DisponibilidadChipProps> = ({
  equipamientoId,
  showTooltip = true,
  size = 'small',
}) => {
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchDisponibilidad = async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await equipamientosApi.getDisponibilidad(equipamientoId);
        setDisponibilidad(data.disponibilidad);
      } catch (err) {
        console.error('Error al cargar disponibilidad:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDisponibilidad();
  }, [equipamientoId]);

  if (loading) {
    return (
      <Chip
        label={<CircularProgress size={12} />}
        size={size}
        variant="outlined"
        disabled
      />
    );
  }

  if (error || !disponibilidad) {
    return (
      <Chip
        label="N/D"
        size={size}
        color="default"
        variant="outlined"
        title="No disponible"
      />
    );
  }

  const { cantidadTotal, cantidadAsignada, cantidadDisponible, tieneDeficit } = disponibilidad;

  // Determinar color y estado
  let chipColor: 'success' | 'warning' | 'error' | 'default' = 'success';
  let chipIcon = <CheckCircleIcon fontSize="small" />;
  let statusText = 'Disponible';

  if (tieneDeficit) {
    chipColor = 'error';
    chipIcon = <ErrorIcon fontSize="small" />;
    statusText = 'Déficit';
  } else if (cantidadDisponible === 0) {
    chipColor = 'warning';
    chipIcon = <WarningIcon fontSize="small" />;
    statusText = 'Sin stock';
  } else if (cantidadTotal > 0 && cantidadDisponible < cantidadTotal * 0.2) {
    chipColor = 'warning';
    chipIcon = <WarningIcon fontSize="small" />;
    statusText = 'Stock bajo';
  }

  const chipLabel = `${cantidadDisponible} / ${cantidadTotal}`;

  const tooltipTitle = `
    Stock Total: ${cantidadTotal}
    Asignadas: ${cantidadAsignada}
    Disponibles: ${cantidadDisponible}
    ${tieneDeficit ? `⚠️ Déficit de ${Math.abs(cantidadDisponible)} unidades` : ''}
  `.trim();

  const chip = (
    <Chip
      label={chipLabel}
      size={size}
      color={chipColor}
      icon={chipIcon}
      variant={tieneDeficit ? 'filled' : 'outlined'}
    />
  );

  return showTooltip ? (
    <Tooltip title={tooltipTitle} arrow>
      {chip}
    </Tooltip>
  ) : (
    chip
  );
};

export default DisponibilidadChip;
