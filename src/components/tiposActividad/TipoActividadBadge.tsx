import React, { useMemo } from 'react';
import { Chip } from '@mui/material';
import {
  MusicNote as CoroIcon,
  Mic as CantoIcon,
  Piano as InstrumentoIcon,
  Palette as TallerIcon,
  Event as EventoIcon,
  Category as DefaultIcon,
} from '@mui/icons-material';
import type { TipoActividadBadgeProps } from '../../types/tipoActividad.types';

/**
 * Componente Badge reutilizable para mostrar Tipos de Actividad
 * Muestra un chip con color e ícono según el código del tipo
 * Optimizado con React.memo y useMemo para evitar re-renders innecesarios
 */
export const TipoActividadBadge: React.FC<TipoActividadBadgeProps> = React.memo(({
  tipo,
  showCodigo = false,
  size = 'medium',
}) => {
  /**
   * Obtiene el color del chip según el código del tipo (memoizado)
   */
  const color = useMemo((): 'primary' | 'success' | 'info' | 'warning' | 'secondary' | 'default' => {
    switch (tipo.codigo.toUpperCase()) {
      case 'CORO':
        return 'primary';
      case 'CLASE_CANTO':
      case 'CANTO':
        return 'success';
      case 'CLASE_INSTRUMENTO':
      case 'INSTRUMENTO':
        return 'info';
      case 'TALLER':
        return 'warning';
      case 'EVENTO':
        return 'secondary';
      default:
        return 'default';
    }
  }, [tipo.codigo]);

  /**
   * Obtiene el ícono según el código del tipo (memoizado)
   */
  const icon = useMemo(() => {
    switch (tipo.codigo.toUpperCase()) {
      case 'CORO':
        return <CoroIcon />;
      case 'CLASE_CANTO':
      case 'CANTO':
        return <CantoIcon />;
      case 'CLASE_INSTRUMENTO':
      case 'INSTRUMENTO':
        return <InstrumentoIcon />;
      case 'TALLER':
        return <TallerIcon />;
      case 'EVENTO':
        return <EventoIcon />;
      default:
        return <DefaultIcon />;
    }
  }, [tipo.codigo]);

  /**
   * Genera la etiqueta del chip (memoizada)
   */
  const label = useMemo(() => {
    if (showCodigo) {
      return `${tipo.codigo} - ${tipo.nombre}`;
    }
    return tipo.nombre;
  }, [showCodigo, tipo.codigo, tipo.nombre]);

  return (
    <Chip
      icon={icon}
      label={label}
      color={color}
      size={size}
      variant={tipo.activo ? 'filled' : 'outlined'}
    />
  );
});

export default TipoActividadBadge;
