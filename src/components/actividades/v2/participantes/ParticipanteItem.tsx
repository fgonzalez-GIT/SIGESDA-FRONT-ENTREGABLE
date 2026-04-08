import React from 'react';
import {
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Box,
  Typography,
  Tooltip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { RolBadge } from '../RolBadge';
import type { ParticipacionActividad } from '../../../../types/actividad.types';

interface ParticipanteItemProps {
  participante: ParticipacionActividad & {
    personas?: {
      id: number;
      nombre: string;
      apellido: string;
      email?: string;
      tipo?: string;
    };
  };
  onDelete: (participante: any) => void;
}

/**
 * Item de lista para mostrar un participante inscrito
 * Optimizado con React.memo para evitar re-renders innecesarios
 */
export const ParticipanteItem: React.FC<ParticipanteItemProps> = React.memo(({
  participante,
  onDelete
}) => {
  const nombreCompleto = participante.personas
    ? `${participante.personas.apellido}, ${participante.personas.nombre}`
    : 'Participante desconocido';

  const tipo = participante.personas?.tipo || 'NO_SOCIO';

  // Color del avatar según el tipo
  const getAvatarColor = (tipo: string) => {
    const tipoUpper = tipo.toUpperCase();
    if (tipoUpper === 'DOCENTE') return 'error.main';
    if (tipoUpper === 'SOCIO') return 'primary.main';
    if (tipoUpper === 'ESTUDIANTE') return 'success.main';
    return 'grey.500';
  };

  return (
    <ListItem
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        mb: 1.5,
        bgcolor: 'background.paper',
        '&:hover': {
          bgcolor: 'action.hover'
        }
      }}
      secondaryAction={
        <Tooltip title="Eliminar participante">
          <IconButton
            edge="end"
            aria-label="delete"
            onClick={() => onDelete(participante)}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      }
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: getAvatarColor(tipo) }}>
          <PersonIcon />
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography component="span" variant="subtitle1" fontWeight={500}>
              {nombreCompleto}
            </Typography>
            <RolBadge tipo={tipo} size="small" />
          </Box>
        }
        secondary={
          <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
            {participante.personas?.email && (
              <Typography variant="caption" display="block" color="text.secondary">
                Email: {participante.personas.email}
              </Typography>
            )}
            {participante.observaciones && (
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Obs: {participante.observaciones}
              </Typography>
            )}
            <Typography
              variant="caption"
              display="block"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              Inscrito: {new Date(participante.fechaInicio).toLocaleDateString('es-ES')}
            </Typography>
          </Box>
        }
      />
    </ListItem>
  );
});

ParticipanteItem.displayName = 'ParticipanteItem';

export default ParticipanteItem;
