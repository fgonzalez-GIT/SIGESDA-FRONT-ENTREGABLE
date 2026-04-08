import React from 'react';
import { Chip } from '@mui/material';
import {
  School as DocenteIcon,
  CardMembership as SocioIcon,
  Person as PersonIcon,
  MenuBook as EstudianteIcon
} from '@mui/icons-material';
import type { TipoPersona } from '../../../types/actividadV2.types';

interface RolBadgeProps {
  tipo: string;
  size?: 'small' | 'medium';
}

/**
 * Badge de rol para personas con colores distintivos
 * - DOCENTE: Rojo
 * - SOCIO: Azul
 * - NO_SOCIO: Gris
 * - ESTUDIANTE: Verde
 */
export const RolBadge: React.FC<RolBadgeProps> = ({ tipo, size = 'small' }) => {
  const tipoNormalizado = tipo.toUpperCase().replace(/\s+/g, '_') as TipoPersona;

  const getConfig = () => {
    switch (tipoNormalizado) {
      case 'DOCENTE':
        return {
          label: 'Docente',
          color: 'error' as const,
          icon: <DocenteIcon sx={{ fontSize: size === 'small' ? 14 : 16 }} />
        };
      case 'SOCIO':
        return {
          label: 'Socio',
          color: 'primary' as const,
          icon: <SocioIcon sx={{ fontSize: size === 'small' ? 14 : 16 }} />
        };
      case 'NO_SOCIO':
        return {
          label: 'No Socio',
          color: 'default' as const,
          icon: <PersonIcon sx={{ fontSize: size === 'small' ? 14 : 16 }} />
        };
      case 'ESTUDIANTE':
        return {
          label: 'Estudiante',
          color: 'success' as const,
          icon: <EstudianteIcon sx={{ fontSize: size === 'small' ? 14 : 16 }} />
        };
      default:
        return {
          label: tipo,
          color: 'default' as const,
          icon: <PersonIcon sx={{ fontSize: size === 'small' ? 14 : 16 }} />
        };
    }
  };

  const config = getConfig();

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      color={config.color}
      size={size}
      sx={{
        fontWeight: 500,
        fontSize: size === 'small' ? '0.7rem' : '0.8rem'
      }}
    />
  );
};

export default RolBadge;
