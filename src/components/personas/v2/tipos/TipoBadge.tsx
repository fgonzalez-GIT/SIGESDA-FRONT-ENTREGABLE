import React from 'react';
import { Chip, ChipProps, Tooltip } from '@mui/material';
import {
  Group as GroupIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import type { TipoPersona, PersonaTipo } from '../../../../types/persona.types';

interface TipoBadgeProps {
  tipo: TipoPersona | PersonaTipo | string;
  size?: ChipProps['size'];
  variant?: ChipProps['variant'];
  showIcon?: boolean;
  showTooltip?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Badge para mostrar el tipo de persona con ícono y color
 *
 * @example
 * ```tsx
 * <TipoBadge tipo={tipoPersona} size="small" />
 * <TipoBadge tipo="SOCIO" showIcon showTooltip />
 * ```
 */
export const TipoBadge: React.FC<TipoBadgeProps> = ({
  tipo,
  size = 'small',
  variant = 'filled',
  showIcon = true,
  showTooltip = false,
  className,
  onClick,
}) => {
  // Determinar el código del tipo
  const getTipoCodigo = (): string => {
    if (typeof tipo === 'string') return tipo;
    // PersonaTipo: usar tipoPersona.codigo (relación)
    if ('tipoPersonaId' in tipo && tipo.tipoPersona) return tipo.tipoPersona.codigo;
    // Fallback para compatibilidad: tipoPersonaCodigo (DEPRECATED)
    if ('tipoPersonaCodigo' in tipo && tipo.tipoPersonaCodigo) return tipo.tipoPersonaCodigo;
    // TipoPersona: usar codigo directo
    if ('codigo' in tipo) return tipo.codigo;
    return '';
  };

  // Obtener nombre del tipo
  const getTipoNombre = (): string => {
    if (typeof tipo === 'string') return tipo;
    // PersonaTipo: usar tipoPersona.nombre (relación)
    if ('tipoPersonaId' in tipo && tipo.tipoPersona) return tipo.tipoPersona.nombre;
    // TipoPersona: usar nombre directo
    if ('nombre' in tipo) return tipo.nombre;
    return getTipoCodigo();
  };

  // Obtener descripción para tooltip
  const getTipoDescripcion = (): string => {
    if (typeof tipo === 'string') return '';
    // PersonaTipo: usar tipoPersona.descripcion (relación)
    if ('tipoPersonaId' in tipo && tipo.tipoPersona) {
      return tipo.tipoPersona.descripcion || '';
    }
    // TipoPersona: usar descripcion directo
    if ('descripcion' in tipo) return tipo.descripcion || '';
    return '';
  };

  const codigo = getTipoCodigo().toUpperCase();
  const nombre = getTipoNombre();
  const descripcion = getTipoDescripcion();

  // Configuración de colores e íconos por tipo
  const getTipoConfig = () => {
    switch (codigo) {
      case 'SOCIO':
        return {
          color: 'primary' as const,
          icon: <GroupIcon fontSize="small" />,
        };
      case 'NO_SOCIO':
        return {
          color: 'default' as const,
          icon: <PersonIcon fontSize="small" />,
        };
      case 'DOCENTE':
        return {
          color: 'success' as const,
          icon: <WorkIcon fontSize="small" />,
        };
      case 'ESTUDIANTE':
        return {
          color: 'secondary' as const,
          icon: <SchoolIcon fontSize="small" />,
        };
      case 'PROVEEDOR':
        return {
          color: 'warning' as const,
          icon: <BusinessIcon fontSize="small" />,
        };
      default:
        return {
          color: 'default' as const,
          icon: <HelpIcon fontSize="small" />,
        };
    }
  };

  const { color, icon } = getTipoConfig();

  const chip = (
    <Chip
      label={nombre}
      color={color}
      size={size}
      variant={variant}
      icon={showIcon ? icon : undefined}
      className={className}
      onClick={onClick}
      clickable={!!onClick}
    />
  );

  if (showTooltip && descripcion) {
    return (
      <Tooltip title={descripcion} placement="top">
        {chip}
      </Tooltip>
    );
  }

  return chip;
};

export default TipoBadge;
