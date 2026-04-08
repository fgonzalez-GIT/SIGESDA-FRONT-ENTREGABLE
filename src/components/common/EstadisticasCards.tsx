import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  SxProps,
  Theme,
} from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';

export type EstadisticaFormatoValor = 'numero' | 'moneda' | 'porcentaje' | 'texto';

export interface EstadisticaItem {
  /**
   * Label descriptivo de la estadística
   */
  label: string;

  /**
   * Valor a mostrar (puede ser número, string, etc.)
   */
  value: string | number;

  /**
   * Icono de MUI a mostrar a la izquierda
   */
  icon?: SvgIconComponent;

  /**
   * Color del icono
   * @default "primary"
   */
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'inherit';

  /**
   * Subtítulo opcional (texto adicional debajo del label)
   */
  subtitle?: string;

  /**
   * Formato del valor
   * @default "numero"
   */
  formato?: EstadisticaFormatoValor;
}

export interface EstadisticasCardsProps {
  /**
   * Array de estadísticas a mostrar
   */
  estadisticas: EstadisticaItem[];

  /**
   * Breakpoints responsive para Grid
   * @default { xs: 12, sm: 6, md: 3 }
   */
  gridSize?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };

  /**
   * Spacing entre cards
   * @default 3
   */
  spacing?: number;

  /**
   * Sx adicional para el Grid container
   */
  sx?: SxProps<Theme>;

  /**
   * Mostrar iconos grandes (48px) en lugar de pequeños (24px)
   * @default false
   */
  largeIcons?: boolean;
}

/**
 * Formatea un valor según el tipo especificado
 */
const formatearValor = (valor: string | number, formato: EstadisticaFormatoValor): string => {
  if (formato === 'texto') {
    return String(valor);
  }

  const numerico = typeof valor === 'number' ? valor : parseFloat(String(valor).replace(/[^0-9.-]/g, ''));

  if (isNaN(numerico)) {
    return String(valor);
  }

  switch (formato) {
    case 'moneda':
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numerico);

    case 'porcentaje':
      return `${numerico.toFixed(1)}%`;

    case 'numero':
    default:
      return new Intl.NumberFormat('es-AR').format(numerico);
  }
};

/**
 * Componente para mostrar estadísticas en formato de cards con iconos.
 *
 * Proporciona una interfaz consistente para mostrar métricas clave
 * en todas las páginas del sistema.
 *
 * @example
 * ```tsx
 * <EstadisticasCards
 *   estadisticas={[
 *     {
 *       label: 'Total Recaudado',
 *       value: 125000,
 *       icon: AttachMoney,
 *       color: 'success',
 *       formato: 'moneda',
 *       subtitle: 'Enero 2026'
 *     },
 *     {
 *       label: 'Tasa de Cobro',
 *       value: 85.5,
 *       icon: CheckCircle,
 *       color: 'primary',
 *       formato: 'porcentaje'
 *     }
 *   ]}
 * />
 * ```
 */
export const EstadisticasCards: React.FC<EstadisticasCardsProps> = ({
  estadisticas,
  gridSize = { xs: 12, sm: 6, md: 3 },
  spacing = 3,
  sx,
  largeIcons = false,
}) => {
  if (!estadisticas || estadisticas.length === 0) {
    return null;
  }

  return (
    <Grid container spacing={spacing} sx={{ mb: 3, ...sx }}>
      {estadisticas.map((stat, index) => {
        const IconComponent = stat.icon;
        const valorFormateado = formatearValor(
          stat.value,
          stat.formato || 'numero'
        );

        return (
          <Grid
            key={`stat-${index}-${stat.label}`}
            size={gridSize}
          >
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                transition: 'box-shadow 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ width: '100%' }}>
                <Box display="flex" alignItems="center">
                  {IconComponent && (
                    <IconComponent
                      color={stat.color || 'primary'}
                      sx={{
                        mr: 2,
                        fontSize: largeIcons ? 48 : 32,
                      }}
                    />
                  )}
                  <Box flex={1}>
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      color="text.primary"
                      sx={{
                        wordBreak: 'break-word',
                      }}
                    >
                      {valorFormateado}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {stat.label}
                    </Typography>
                    {stat.subtitle && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.25 }}
                      >
                        {stat.subtitle}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default EstadisticasCards;
