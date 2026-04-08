import React from 'react';
import { Box, Stack, Tooltip } from '@mui/material';
import type { PersonaTipo, TipoPersona } from '../../../../types/persona.types';
import { TipoBadge } from './TipoBadge';

interface TiposBadgesProps {
  tipos: (PersonaTipo | TipoPersona | string)[];
  max?: number;
  size?: 'small' | 'medium';
  variant?: 'filled' | 'outlined';
  showIcon?: boolean;
  direction?: 'row' | 'column';
  spacing?: number;
  onClickTipo?: (tipo: PersonaTipo | TipoPersona | string) => void;
}

/**
 * Componente para mostrar múltiples tipos como badges
 * Soporta colapsar tipos adicionales cuando hay muchos
 *
 * @example
 * ```tsx
 * <TiposBadges tipos={persona.tipos} max={3} />
 * <TiposBadges tipos={['SOCIO', 'DOCENTE']} showIcon direction="column" />
 * ```
 */
export const TiposBadges: React.FC<TiposBadgesProps> = ({
  tipos,
  max,
  size = 'small',
  variant = 'filled',
  showIcon = true,
  direction = 'row',
  spacing = 1,
  onClickTipo,
}) => {
  if (!tipos || tipos.length === 0) {
    return null;
  }

  // Filtrar solo tipos activos si son PersonaTipo
  const tiposActivos = tipos.filter((tipo) => {
    if (typeof tipo === 'string') return true;
    if ('activo' in tipo) return tipo.activo;
    return true;
  });

  const displayTipos = max ? tiposActivos.slice(0, max) : tiposActivos;
  const remainingCount = tiposActivos.length - displayTipos.length;

  const getTipoNombre = (tipo: PersonaTipo | TipoPersona | string): string => {
    if (typeof tipo === 'string') return tipo;
    // PersonaTipo: usar tipoPersona.nombre (relación)
    if ('tipoPersonaId' in tipo && tipo.tipoPersona) return tipo.tipoPersona.nombre;
    // TipoPersona: usar nombre directo
    if ('nombre' in tipo) return tipo.nombre;
    return '';
  };

  const renderRemainingBadge = () => {
    if (remainingCount <= 0) return null;

    const remainingNames = tiposActivos
      .slice(max)
      .map((t) => getTipoNombre(t))
      .join(', ');

    return (
      <Tooltip title={remainingNames} placement="top">
        <Box
          component="span"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 1.5,
            py: 0.5,
            borderRadius: '16px',
            backgroundColor: 'action.selected',
            color: 'text.secondary',
            fontSize: size === 'small' ? '0.75rem' : '0.875rem',
            fontWeight: 500,
            cursor: 'default',
          }}
        >
          +{remainingCount}
        </Box>
      </Tooltip>
    );
  };

  return (
    <Stack direction={direction} spacing={spacing} flexWrap="wrap" useFlexGap>
      {displayTipos.map((tipo, index) => (
        <TipoBadge
          key={index}
          tipo={tipo}
          size={size}
          variant={variant}
          showIcon={showIcon}
          showTooltip
          onClick={onClickTipo ? () => onClickTipo(tipo) : undefined}
        />
      ))}
      {renderRemainingBadge()}
    </Stack>
  );
};

export default TiposBadges;
