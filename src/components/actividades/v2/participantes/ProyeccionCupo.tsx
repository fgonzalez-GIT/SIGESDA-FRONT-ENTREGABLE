import React from 'react';
import { Box, Typography, LinearProgress, Alert } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

interface ProyeccionCupoProps {
  cupoActual: number;
  cupoMaximo: number;
  personasSeleccionadas: number;
  mostrarTextoProyeccion?: boolean;
  mostrarBarraProgreso?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Componente de proyección de cupo en tiempo real
 * Muestra: X% → Y% (visual crítico para inscripción masiva)
 */
export const ProyeccionCupo: React.FC<ProyeccionCupoProps> = ({
  cupoActual,
  cupoMaximo,
  personasSeleccionadas,
  mostrarTextoProyeccion = true,
  mostrarBarraProgreso = true,
  size = 'medium'
}) => {
  // Cálculos
  const cupoProyectado = cupoActual + personasSeleccionadas;
  const porcentajeActual = cupoMaximo > 0 ? (cupoActual / cupoMaximo) * 100 : 0;
  const porcentajeProyectado = cupoMaximo > 0 ? (cupoProyectado / cupoMaximo) * 100 : 0;
  const cuposRestantes = cupoMaximo - cupoProyectado;
  const excedeCapacidad = cupoProyectado > cupoMaximo;

  // Nivel de ocupación
  const getNivelOcupacion = () => {
    if (porcentajeProyectado >= 100) return 'critico';
    if (porcentajeProyectado >= 90) return 'alto';
    if (porcentajeProyectado >= 70) return 'medio';
    return 'bajo';
  };

  const nivelOcupacion = getNivelOcupacion();

  // Colores según nivel
  const getColor = () => {
    switch (nivelOcupacion) {
      case 'critico':
        return 'error.main';
      case 'alto':
        return 'warning.main';
      case 'medio':
        return 'info.main';
      case 'bajo':
        return 'success.main';
      default:
        return 'text.secondary';
    }
  };

  const getColorForProgress = (): 'error' | 'warning' | 'info' | 'success' => {
    switch (nivelOcupacion) {
      case 'critico':
        return 'error';
      case 'alto':
        return 'warning';
      case 'medio':
        return 'info';
      case 'bajo':
        return 'success';
      default:
        return 'info';
    }
  };

  // Íconos según nivel
  const getIcon = () => {
    if (excedeCapacidad) {
      return <WarningIcon sx={{ color: getColor(), fontSize: size === 'small' ? 16 : 20 }} />;
    }
    if (nivelOcupacion === 'bajo') {
      return <CheckCircleIcon sx={{ color: getColor(), fontSize: size === 'small' ? 16 : 20 }} />;
    }
    return <TrendingUpIcon sx={{ color: getColor(), fontSize: size === 'small' ? 16 : 20 }} />;
  };

  // Tamaños de fuente
  const getFontSize = () => {
    switch (size) {
      case 'small':
        return { main: '0.875rem', secondary: '0.75rem' };
      case 'large':
        return { main: '1.25rem', secondary: '0.875rem' };
      default:
        return { main: '1rem', secondary: '0.8125rem' };
    }
  };

  const fontSize = getFontSize();

  return (
    <Box>
      {/* Alerta si excede capacidad */}
      {excedeCapacidad && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>¡Atención!</strong> La selección excede la capacidad máxima en{' '}
          {Math.abs(cuposRestantes)} persona(s).
        </Alert>
      )}

      {/* Texto de proyección: X% → Y% */}
      {mostrarTextoProyeccion && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: mostrarBarraProgreso ? 1 : 0
          }}
        >
          {getIcon()}
          <Typography
            variant="body1"
            sx={{
              fontSize: fontSize.main,
              fontWeight: 600,
              color: getColor()
            }}
          >
            {porcentajeActual.toFixed(0)}% → {porcentajeProyectado.toFixed(0)}%
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: fontSize.secondary,
              color: 'text.secondary',
              ml: 1
            }}
          >
            ({cupoActual} → {cupoProyectado} de {cupoMaximo})
          </Typography>
        </Box>
      )}

      {/* Barra de progreso */}
      {mostrarBarraProgreso && (
        <Box>
          <Box sx={{ position: 'relative', mb: 0.5 }}>
            {/* Barra actual (fondo) */}
            <LinearProgress
              variant="determinate"
              value={Math.min(porcentajeActual, 100)}
              sx={{
                height: size === 'small' ? 6 : size === 'large' ? 10 : 8,
                borderRadius: 1,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'grey.400'
                }
              }}
            />
            {/* Barra proyectada (overlay) */}
            {personasSeleccionadas > 0 && (
              <LinearProgress
                variant="determinate"
                value={Math.min(porcentajeProyectado, 100)}
                color={getColorForProgress()}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: size === 'small' ? 6 : size === 'large' ? 10 : 8,
                  borderRadius: 1,
                  bgcolor: 'transparent',
                  '& .MuiLinearProgress-bar': {
                    opacity: 0.7
                  }
                }}
              />
            )}
          </Box>

          {/* Información adicional */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 0.5
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: fontSize.secondary }}>
              Actual: {cupoActual} ({porcentajeActual.toFixed(0)}%)
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: fontSize.secondary,
                color: getColor(),
                fontWeight: 500
              }}
            >
              {excedeCapacidad ? (
                <>Excede en {Math.abs(cuposRestantes)}</>
              ) : cuposRestantes === 0 ? (
                <>Lleno</>
              ) : (
                <>Quedan {cuposRestantes} cupos</>
              )}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ProyeccionCupo;
