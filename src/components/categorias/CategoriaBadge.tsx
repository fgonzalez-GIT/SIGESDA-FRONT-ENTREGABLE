import React from 'react';
import { Chip, Tooltip, Box, Typography } from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  FamilyRestroom as FamilyIcon,
  Elderly as ElderlyIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { CategoriaSocio } from '../../types/categoria.types';

interface CategoriaBadgeProps {
  categoria: CategoriaSocio | null | undefined;
  showMonto?: boolean;
  showDescuento?: boolean;
  size?: 'small' | 'medium';
  variant?: 'filled' | 'outlined';
}

/**
 * Componente Badge para mostrar categorías de socios
 * Muestra un chip con el nombre de la categoría y opcionalmente el monto y descuento
 */
export const CategoriaBadge: React.FC<CategoriaBadgeProps> = ({
  categoria,
  showMonto = false,
  showDescuento = false,
  size = 'small',
  variant = 'filled',
}) => {
  // Si no hay categoría, mostrar badge "Sin categoría"
  if (!categoria) {
    return (
      <Chip
        label="Sin categoría"
        size={size}
        variant="outlined"
        color="default"
      />
    );
  }

  // Obtener color según el código de categoría
  const getColor = (codigo: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' => {
    const colorMap: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error'> = {
      'ACTIVO': 'primary',
      'ESTUDIANTE': 'info',
      'FAMILIAR': 'secondary',
      'JUBILADO': 'success',
      'VIP': 'warning',
      'HONORARIO': 'default',
    };
    return colorMap[codigo] || 'default';
  };

  // Obtener icono según el código de categoría
  const getIcon = (codigo: string) => {
    const iconMap: Record<string, React.ReactElement> = {
      'ACTIVO': <PersonIcon />,
      'ESTUDIANTE': <SchoolIcon />,
      'FAMILIAR': <FamilyIcon />,
      'JUBILADO': <ElderlyIcon />,
      'VIP': <StarIcon />,
    };
    return iconMap[codigo] || <PersonIcon />;
  };

  // Formatear monto
  const formatMonto = (monto: string) => {
    const numero = parseFloat(monto);
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numero);
  };

  // Construir label
  let label = categoria.nombre;

  if (showMonto) {
    label += ` - ${formatMonto(categoria.montoCuota)}`;
  }

  if (showDescuento && parseFloat(categoria.descuento) > 0) {
    label += ` (${categoria.descuento}% desc.)`;
  }

  // Construir tooltip
  const tooltipContent = (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
        {categoria.nombre}
      </Typography>
      <Typography variant="caption" display="block">
        Código: {categoria.codigo}
      </Typography>
      {categoria.descripcion && (
        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
          {categoria.descripcion}
        </Typography>
      )}
      <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
        Cuota: {formatMonto(categoria.montoCuota)}
      </Typography>
      {parseFloat(categoria.descuento) > 0 && (
        <Typography variant="caption" display="block" color="success.light">
          Descuento: {categoria.descuento}%
        </Typography>
      )}
      {!categoria.activa && (
        <Typography variant="caption" display="block" color="error.light" sx={{ mt: 0.5 }}>
          ⚠️ Categoría inactiva
        </Typography>
      )}
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow>
      <Chip
        icon={getIcon(categoria.codigo)}
        label={label}
        size={size}
        variant={variant}
        color={getColor(categoria.codigo)}
        sx={{
          opacity: categoria.activa ? 1 : 0.6,
          textDecoration: categoria.activa ? 'none' : 'line-through',
        }}
      />
    </Tooltip>
  );
};

export default CategoriaBadge;
