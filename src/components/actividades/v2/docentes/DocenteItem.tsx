import React from 'react';
import {
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Box,
  Chip,
  Typography,
  Tooltip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import type { DocenteActividad } from '../../../../types/actividad.types';

interface DocenteItemProps {
  docente: DocenteActividad & {
    personas?: {
      id: number;
      nombre: string;
      apellido: string;
      especialidad?: string;
    };
    rolesDocentes?: {
      id: number;
      nombre: string;
      codigo: string;
    };
  };
  onDelete: (docente: any) => void;
}

/**
 * Item de lista para mostrar un docente asignado
 * Optimizado con React.memo para evitar re-renders innecesarios
 */
export const DocenteItem: React.FC<DocenteItemProps> = React.memo(({ docente, onDelete }) => {
  const nombreCompleto = docente.personas
    ? `${docente.personas.apellido}, ${docente.personas.nombre}`
    : 'Docente desconocido';

  const rolNombre = docente.rolesDocentes?.nombre || 'Sin rol';

  // Color del chip según el rol
  const getRolColor = (rol: string): 'primary' | 'secondary' | 'default' | 'info' => {
    const rolUpper = rol.toUpperCase();
    if (rolUpper.includes('TITULAR') || rolUpper.includes('PROFESOR')) return 'primary';
    if (rolUpper.includes('ASISTENTE') || rolUpper.includes('AYUDANTE')) return 'secondary';
    if (rolUpper.includes('INVITADO')) return 'info';
    return 'default';
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
        <Tooltip title="Desasignar docente">
          <IconButton
            edge="end"
            aria-label="delete"
            onClick={() => onDelete(docente)}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      }
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <SchoolIcon />
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography component="span" variant="subtitle1" fontWeight={500}>
              {nombreCompleto}
            </Typography>
            <Chip
              label={rolNombre}
              size="small"
              color={getRolColor(rolNombre)}
              sx={{ fontWeight: 500 }}
            />
          </Box>
        }
        secondary={
          <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
            {docente.personas?.especialidad && (
              <Typography variant="caption" display="block" color="text.secondary">
                Especialidad: {docente.personas.especialidad}
              </Typography>
            )}
            {docente.observaciones && (
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                Obs: {docente.observaciones}
              </Typography>
            )}
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
              Asignado: {new Date(docente.fechaAsignacion).toLocaleDateString('es-ES')}
            </Typography>
          </Box>
        }
      />
    </ListItem>
  );
});

DocenteItem.displayName = 'DocenteItem';

export default DocenteItem;
