import React from 'react';
import { Chip } from '@mui/material';
import {
  ChildCare as InfantilIcon,
  School as JuvenilIcon,
  Person as AdultoIcon,
  Groups as GeneralIcon,
  Label as DefaultIcon,
} from '@mui/icons-material';
import type { CategoriaActividadBadgeProps } from '../../types/categoriaActividad.types';

/**
 * Componente Badge reutilizable para mostrar Categorías de Actividad
 * Muestra un chip con color e ícono según el código de la categoría
 */
export const CategoriaActividadBadge: React.FC<CategoriaActividadBadgeProps> = ({
  categoria,
  showCodigo = false,
  size = 'medium',
}) => {
  /**
   * Obtiene el color del chip según el código de la categoría
   */
  const getColor = (): 'primary' | 'success' | 'info' | 'warning' | 'secondary' | 'error' | 'default' => {
    switch (categoria.codigo.toUpperCase()) {
      case 'INFANTIL':
        return 'info';
      case 'JUVENIL':
        return 'success';
      case 'ADULTO':
      case 'ADULTOS':
        return 'primary';
      case 'GENERAL':
        return 'secondary';
      case 'FAMILIAR':
        return 'warning';
      default:
        return 'default';
    }
  };

  /**
   * Obtiene el ícono según el código de la categoría
   */
  const getIcon = () => {
    switch (categoria.codigo.toUpperCase()) {
      case 'INFANTIL':
        return <InfantilIcon />;
      case 'JUVENIL':
        return <JuvenilIcon />;
      case 'ADULTO':
      case 'ADULTOS':
        return <AdultoIcon />;
      case 'GENERAL':
      case 'FAMILIAR':
        return <GeneralIcon />;
      default:
        return <DefaultIcon />;
    }
  };

  /**
   * Genera la etiqueta del chip
   */
  const getLabel = () => {
    if (showCodigo) {
      return `${categoria.codigo} - ${categoria.nombre}`;
    }
    return categoria.nombre;
  };

  return (
    <Chip
      icon={getIcon()}
      label={getLabel()}
      color={getColor()}
      size={size}
      variant={categoria.activo ? 'filled' : 'outlined'}
    />
  );
};

export default CategoriaActividadBadge;
