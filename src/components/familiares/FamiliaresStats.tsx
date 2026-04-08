/**
 * FamiliaresStats - Estadísticas rápidas de relaciones familiares (FASE 2)
 *
 * Muestra:
 * - Total de relaciones activas
 * - Relaciones con permisos específicos
 * - Relaciones con descuento
 * - Descuento promedio
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Tooltip,
  Grid,
} from '@mui/material';
import {
  FamilyRestroom as FamilyIcon,
  Percent as PercentIcon,
  AccountBalance as FinanceIcon,
  Phone as PhoneIcon,
  DirectionsWalk as WalkIcon,
} from '@mui/icons-material';

interface EstadisticasData {
  totalRelaciones: number;
  totalActivas: number;
  conPermisoRF: number;
  conPermisoCE: number;
  conPermisoAR: number;
  conDescuento: number;
  descuentoPromedio: number;
}

interface FamiliaresStatsProps {
  estadisticas: EstadisticasData;
}

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  tooltip?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  tooltip,
}) => {
  const content = (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
          <Box
            sx={{
              bgcolor: `${color}.light`,
              color: `${color}.main`,
              p: 0.75,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography variant="h5" fontWeight="bold" color={`${color}.main`} sx={{ mb: 0.25 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ fontSize: '0.8rem', lineHeight: 1.2 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', mt: 0.25 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return tooltip ? (
    <Tooltip title={tooltip} arrow>
      {content}
    </Tooltip>
  ) : (
    content
  );
};

export const FamiliaresStats: React.FC<FamiliaresStatsProps> = ({ estadisticas }) => {
  return (
    <Box mb={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" color="text.secondary">
          Estadísticas Rápidas
        </Typography>
        <Chip
          label={`${estadisticas.totalActivas} de ${estadisticas.totalRelaciones} activas`}
          color="primary"
          size="small"
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(6, 1fr)',
          },
          gap: 1.5,
        }}
      >
        {/* Total de Relaciones */}
        <StatCard
          title="Total Relaciones"
          value={estadisticas.totalRelaciones}
          subtitle="Registradas en el sistema"
          icon={<FamilyIcon />}
          color="primary"
          tooltip="Número total de relaciones familiares registradas"
        />

        {/* Con Permiso RF */}
        <StatCard
          title="Responsables Financieros"
          value={estadisticas.conPermisoRF}
          subtitle="Con permiso RF"
          icon={<FinanceIcon />}
          color="success"
          tooltip="Relaciones con permiso de Responsable Financiero"
        />

        {/* Con Permiso CE */}
        <StatCard
          title="Contactos de Emergencia"
          value={estadisticas.conPermisoCE}
          subtitle="Con permiso CE"
          icon={<PhoneIcon />}
          color="warning"
          tooltip="Relaciones con permiso de Contacto de Emergencia"
        />

        {/* Con Permiso AR */}
        <StatCard
          title="Autorizados Retiro"
          value={estadisticas.conPermisoAR}
          subtitle="Con permiso AR"
          icon={<WalkIcon />}
          color="info"
          tooltip="Relaciones con permiso de Autorizado para Retiro"
        />

        {/* Con Descuento */}
        <StatCard
          title="Con Descuento"
          value={estadisticas.conDescuento}
          subtitle={`${((estadisticas.conDescuento / estadisticas.totalRelaciones) * 100).toFixed(1)}% del total`}
          icon={<PercentIcon />}
          color="secondary"
          tooltip="Relaciones con descuento aplicado"
        />

        {/* Descuento Promedio */}
        <StatCard
          title="Descuento Promedio"
          value={`${estadisticas.descuentoPromedio.toFixed(1)}%`}
          subtitle="Entre relaciones con desc."
          icon={<PercentIcon />}
          color="primary"
          tooltip="Promedio de descuento aplicado en relaciones que tienen descuento"
        />
      </Box>
    </Box>
  );
};

export default FamiliaresStats;
