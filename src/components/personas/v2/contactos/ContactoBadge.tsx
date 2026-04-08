import React from 'react';
import { Chip, ChipProps, Tooltip } from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Language as WebIcon,
  ContactPhone as ContactIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import type { TipoContacto, Contacto } from '../../../../types/persona.types';

interface ContactoBadgeProps {
  tipoContacto: TipoContacto | Contacto | string;
  size?: ChipProps['size'];
  variant?: ChipProps['variant'];
  showIcon?: boolean;
  showTooltip?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Badge para mostrar el tipo de contacto con ícono y color
 *
 * @example
 * ```tsx
 * <ContactoBadge tipoContacto={tipoContacto} size="small" />
 * <ContactoBadge tipoContacto="WHATSAPP" showIcon showTooltip />
 * ```
 */
export const ContactoBadge: React.FC<ContactoBadgeProps> = ({
  tipoContacto,
  size = 'small',
  variant = 'outlined',
  showIcon = true,
  showTooltip = false,
  className,
  onClick,
}) => {
  // Determinar el código del tipo de contacto
  const getTipoContactoCodigo = (): string => {
    if (typeof tipoContacto === 'string') return tipoContacto;
    if ('tipoContactoId' in tipoContacto && tipoContacto.tipoContacto) {
      return tipoContacto.tipoContacto.codigo;
    }
    if ('codigo' in tipoContacto) return tipoContacto.codigo;
    return '';
  };

  // Obtener nombre del tipo de contacto
  const getTipoContactoNombre = (): string => {
    if (typeof tipoContacto === 'string') return tipoContacto;
    if ('tipoContactoId' in tipoContacto && tipoContacto.tipoContacto) {
      return tipoContacto.tipoContacto.nombre;
    }
    if ('nombre' in tipoContacto) return tipoContacto.nombre;
    return getTipoContactoCodigo();
  };

  // Obtener descripción para tooltip
  const getTipoContactoDescripcion = (): string => {
    if (typeof tipoContacto === 'string') return '';
    if ('tipoContactoId' in tipoContacto && tipoContacto.tipoContacto) {
      return tipoContacto.tipoContacto.descripcion || '';
    }
    if ('descripcion' in tipoContacto) return tipoContacto.descripcion || '';
    return '';
  };

  const codigo = getTipoContactoCodigo().toUpperCase();
  const nombre = getTipoContactoNombre();
  const descripcion = getTipoContactoDescripcion();

  // Configuración de colores e íconos por tipo de contacto
  const getTipoContactoConfig = () => {
    switch (codigo) {
      case 'WHATSAPP':
        return {
          color: 'success' as const,
          icon: <WhatsAppIcon fontSize="small" />,
        };
      case 'EMAIL':
        return {
          color: 'primary' as const,
          icon: <EmailIcon fontSize="small" />,
        };
      case 'TELEFONO':
      case 'PHONE':
        return {
          color: 'info' as const,
          icon: <PhoneIcon fontSize="small" />,
        };
      case 'FACEBOOK':
        return {
          color: 'primary' as const,
          icon: <FacebookIcon fontSize="small" />,
        };
      case 'INSTAGRAM':
        return {
          color: 'secondary' as const,
          icon: <InstagramIcon fontSize="small" />,
        };
      case 'TWITTER':
      case 'X':
        return {
          color: 'info' as const,
          icon: <TwitterIcon fontSize="small" />,
        };
      case 'LINKEDIN':
        return {
          color: 'primary' as const,
          icon: <LinkedInIcon fontSize="small" />,
        };
      case 'WEBSITE':
      case 'WEB':
        return {
          color: 'default' as const,
          icon: <WebIcon fontSize="small" />,
        };
      case 'OTRO':
      case 'OTHER':
        return {
          color: 'default' as const,
          icon: <ContactIcon fontSize="small" />,
        };
      default:
        return {
          color: 'default' as const,
          icon: <HelpIcon fontSize="small" />,
        };
    }
  };

  const { color, icon } = getTipoContactoConfig();

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

export default ContactoBadge;
