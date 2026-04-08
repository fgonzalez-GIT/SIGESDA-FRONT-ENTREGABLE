import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Stack,
  Tooltip,
  Link,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material';
import type { Contacto } from '../../../../types/persona.types';
import { ContactoBadge } from './ContactoBadge';

interface ContactoItemProps {
  contacto: Contacto;
  onEdit?: (contacto: Contacto) => void;
  onDelete?: (contacto: Contacto) => void;
  onSetPrincipal?: (contacto: Contacto) => void;
  onCopy?: (valor: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

/**
 * Componente para mostrar un contacto individual con sus acciones
 *
 * @example
 * ```tsx
 * <ContactoItem
 *   contacto={contacto}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onSetPrincipal={handleSetPrincipal}
 *   onCopy={handleCopy}
 * />
 * ```
 */
export const ContactoItem: React.FC<ContactoItemProps> = ({
  contacto,
  onEdit,
  onDelete,
  onSetPrincipal,
  onCopy,
  showActions = true,
  compact = false,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getContactoUrl = (): string | null => {
    if (!contacto.tipoContacto) return null;

    const codigo = contacto.tipoContacto.codigo.toUpperCase();
    const valor = contacto.valor;

    switch (codigo) {
      case 'WHATSAPP':
        // Eliminar caracteres no numéricos
        const phoneNumber = valor.replace(/\D/g, '');
        return `https://wa.me/${phoneNumber}`;
      case 'EMAIL':
        return `mailto:${valor}`;
      case 'TELEFONO':
      case 'PHONE':
        return `tel:${valor}`;
      case 'FACEBOOK':
        return valor.startsWith('http') ? valor : `https://facebook.com/${valor}`;
      case 'INSTAGRAM':
        return valor.startsWith('http') ? valor : `https://instagram.com/${valor}`;
      case 'TWITTER':
      case 'X':
        return valor.startsWith('http') ? valor : `https://twitter.com/${valor}`;
      case 'LINKEDIN':
        return valor.startsWith('http') ? valor : `https://linkedin.com/in/${valor}`;
      case 'WEBSITE':
      case 'WEB':
        return valor.startsWith('http') ? valor : `https://${valor}`;
      default:
        return null;
    }
  };

  const contactoUrl = getContactoUrl();

  const handleCopyClick = () => {
    if (onCopy) {
      onCopy(contacto.valor);
    }
  };

  if (compact) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        p={1.5}
        sx={{
          backgroundColor: contacto.activo ? 'background.paper' : 'action.disabledBackground',
          borderRadius: 1,
          border: '1px solid',
          borderColor: contacto.principal ? 'primary.main' : 'divider',
          opacity: contacto.activo ? 1 : 0.6,
          borderWidth: contacto.principal ? 2 : 1,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5} flex={1}>
          {contacto.principal && (
            <Tooltip title="Contacto principal">
              <StarIcon color="primary" fontSize="small" />
            </Tooltip>
          )}
          <ContactoBadge tipoContacto={contacto} size="small" />
          <Box flex={1}>
            <Typography variant="body2" fontWeight={500}>
              {contacto.valor}
            </Typography>
            {contacto.descripcion && (
              <Typography variant="caption" color="text.secondary">
                {contacto.descripcion}
              </Typography>
            )}
          </Box>
        </Box>

        {showActions && (
          <Stack direction="row" spacing={0.5}>
            {onCopy && (
              <Tooltip title="Copiar">
                <IconButton size="small" onClick={handleCopyClick}>
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {contactoUrl && (
              <Tooltip title="Abrir">
                <IconButton
                  size="small"
                  component="a"
                  href={contactoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <LaunchIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onSetPrincipal && !contacto.principal && (
              <Tooltip title="Marcar como principal">
                <IconButton size="small" onClick={() => onSetPrincipal(contacto)}>
                  <StarBorderIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onEdit && (
              <Tooltip title="Editar">
                <IconButton size="small" onClick={() => onEdit(contacto)} color="primary">
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title="Eliminar">
                <IconButton size="small" onClick={() => onDelete(contacto)} color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        )}
      </Box>
    );
  }

  return (
    <Card
      variant="outlined"
      sx={{
        backgroundColor: contacto.activo ? 'background.paper' : 'action.disabledBackground',
        opacity: contacto.activo ? 1 : 0.6,
        borderColor: contacto.principal ? 'primary.main' : 'divider',
        borderWidth: contacto.principal ? 2 : 1,
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            {contacto.principal && (
              <Tooltip title="Contacto principal">
                <StarIcon color="primary" />
              </Tooltip>
            )}
            <ContactoBadge tipoContacto={contacto} showIcon showTooltip />
          </Box>

          {showActions && (
            <Stack direction="row" spacing={0.5}>
              {onCopy && (
                <Tooltip title="Copiar valor">
                  <IconButton size="small" onClick={handleCopyClick}>
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {contactoUrl && (
                <Tooltip title="Abrir/Contactar">
                  <IconButton
                    size="small"
                    component="a"
                    href={contactoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="primary"
                  >
                    <LaunchIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {onSetPrincipal && !contacto.principal && (
                <Tooltip title="Marcar como principal">
                  <IconButton size="small" onClick={() => onSetPrincipal(contacto)}>
                    <StarBorderIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {onEdit && (
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={() => onEdit(contacto)} color="primary">
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip title="Eliminar">
                  <IconButton size="small" onClick={() => onDelete(contacto)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          )}
        </Box>

        <Box mb={2}>
          <Typography variant="h6" gutterBottom>
            {contactoUrl ? (
              <Link href={contactoUrl} target="_blank" rel="noopener noreferrer" underline="hover">
                {contacto.valor}
              </Link>
            ) : (
              contacto.valor
            )}
          </Typography>

          {contacto.descripcion && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {contacto.descripcion}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={1}>
          <Box display="flex" gap={2}>
            <Typography variant="caption" color="text.secondary">
              Creado: <strong>{formatDate(contacto.createdAt)}</strong>
            </Typography>
            {contacto.updatedAt && contacto.updatedAt !== contacto.createdAt && (
              <Typography variant="caption" color="text.secondary">
                Modificado: <strong>{formatDate(contacto.updatedAt)}</strong>
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ContactoItem;
