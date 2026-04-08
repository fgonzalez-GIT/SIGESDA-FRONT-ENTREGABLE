import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert, Chip, LinearProgress } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { equipamientosApi } from '@/services/equipamientosApi';
import type { DisponibilidadInfo as DisponibilidadInfoType } from '@/types/equipamiento.types';

interface DisponibilidadInfoProps {
  equipamientoId: number;
  equipamientoNombre?: string;
  compact?: boolean; // Mostrar versión compacta
  showProgress?: boolean; // Mostrar barra de progreso
}

/**
 * Componente que muestra la información de disponibilidad de un equipamiento
 *
 * Según guía backend:
 * - cantidadTotal: Stock total en inventario
 * - cantidadAsignada: Suma de cantidades asignadas en aulas
 * - cantidadDisponible: Total - Asignadas (puede ser negativo si hay déficit)
 * - tieneDeficit: true si cantidadDisponible < 0
 */
export const DisponibilidadInfo: React.FC<DisponibilidadInfoProps> = ({
  equipamientoId,
  equipamientoNombre,
  compact = false,
  showProgress = false,
}) => {
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadInfoType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDisponibilidad = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await equipamientosApi.getDisponibilidad(equipamientoId);
        setDisponibilidad(data.disponibilidad);
      } catch (err: any) {
        console.error('Error al cargar disponibilidad:', err);
        setError(err?.message || 'Error al cargar disponibilidad');
      } finally {
        setLoading(false);
      }
    };

    fetchDisponibilidad();
  }, [equipamientoId]);

  if (loading) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={20} />
        <Typography variant="caption" color="text.secondary">
          Cargando disponibilidad...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ py: 0.5 }}>
        {error}
      </Alert>
    );
  }

  if (!disponibilidad) {
    return (
      <Typography variant="caption" color="text.secondary">
        No hay información de disponibilidad
      </Typography>
    );
  }

  const { cantidadTotal, cantidadAsignada, cantidadDisponible, tieneDeficit } = disponibilidad;
  const porcentajeAsignado = cantidadTotal > 0 ? (cantidadAsignada / cantidadTotal) * 100 : 0;

  // Determinar color y estado
  let statusColor: 'success' | 'warning' | 'error' = 'success';
  let statusIcon = <CheckCircleIcon fontSize="small" />;
  let statusText = 'Disponible';

  if (tieneDeficit) {
    statusColor = 'error';
    statusIcon = <ErrorIcon fontSize="small" />;
    statusText = 'Déficit';
  } else if (cantidadDisponible < cantidadTotal * 0.2) {
    // Menos del 20% disponible
    statusColor = 'warning';
    statusIcon = <WarningIcon fontSize="small" />;
    statusText = 'Stock bajo';
  }

  // Versión compacta
  if (compact) {
    return (
      <Box display="inline-flex" alignItems="center" gap={1}>
        <Chip
          label={`${cantidadDisponible} / ${cantidadTotal}`}
          size="small"
          color={statusColor}
          icon={statusIcon}
        />
        {tieneDeficit && (
          <Typography variant="caption" color="error">
            Déficit: {Math.abs(cantidadDisponible)} unidades
          </Typography>
        )}
      </Box>
    );
  }

  // Versión completa
  return (
    <Box>
      {equipamientoNombre && (
        <Typography variant="subtitle2" gutterBottom>
          Disponibilidad: {equipamientoNombre}
        </Typography>
      )}

      <Box display="flex" gap={2} mb={1}>
        <Box flex={1}>
          <Typography variant="caption" color="text.secondary">
            Stock Total
          </Typography>
          <Typography variant="h6" fontWeight="medium">
            {cantidadTotal}
          </Typography>
        </Box>

        <Box flex={1}>
          <Typography variant="caption" color="text.secondary">
            Asignadas
          </Typography>
          <Typography variant="h6" fontWeight="medium">
            {cantidadAsignada}
          </Typography>
        </Box>

        <Box flex={1}>
          <Typography variant="caption" color="text.secondary">
            Disponibles
          </Typography>
          <Typography
            variant="h6"
            fontWeight="medium"
            color={tieneDeficit ? 'error.main' : 'success.main'}
          >
            {cantidadDisponible}
          </Typography>
        </Box>
      </Box>

      {showProgress && (
        <Box mb={1}>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="caption" color="text.secondary">
              Porcentaje asignado
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {porcentajeAsignado.toFixed(0)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(porcentajeAsignado, 100)}
            color={tieneDeficit ? 'error' : porcentajeAsignado > 80 ? 'warning' : 'primary'}
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>
      )}

      {/* Estado y alertas */}
      <Box display="flex" alignItems="center" gap={1}>
        <Chip
          label={statusText}
          size="small"
          color={statusColor}
          icon={statusIcon}
          variant="outlined"
        />
        {tieneDeficit && (
          <Alert severity="error" sx={{ py: 0, flex: 1 }}>
            <Typography variant="caption">
              Hay un déficit de <strong>{Math.abs(cantidadDisponible)} unidades</strong>. Se han
              asignado más equipamientos de los disponibles en stock.
            </Typography>
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default DisponibilidadInfo;
