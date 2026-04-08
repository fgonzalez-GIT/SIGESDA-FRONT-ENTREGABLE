/**
 * Componente para mostrar un item de aula asignada a una actividad
 * Siguiendo el patrón de DocenteItem y ParticipanteItem
 * Optimizado con React.memo para evitar re-renders innecesarios
 */

import React from 'react';
import {
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Typography,
  Chip,
  Box,
  Tooltip,
} from '@mui/material';
import {
  Room as RoomIcon,
  SwapHoriz as SwapHorizIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import type { ActividadAula } from '@/types/actividad-aula.types';

interface AulaAsignadaItemProps {
  aula: ActividadAula;
  onCambiar: (aula: ActividadAula) => void;
  onDesasignar: (aula: ActividadAula) => void;
}

const AulaAsignadaItem: React.FC<AulaAsignadaItemProps> = ({
  aula,
  onCambiar,
  onDesasignar,
}) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const esPrincipal = aula.prioridad === 1;

  return (
    <ListItem
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        mb: 1,
        backgroundColor: 'background.paper',
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      }}
    >
      <ListItemAvatar>
        <Avatar
          sx={{
            bgcolor: esPrincipal ? 'primary.main' : 'secondary.main',
          }}
        >
          <RoomIcon />
        </Avatar>
      </ListItemAvatar>

      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Typography variant="subtitle1" fontWeight={esPrincipal ? 600 : 500}>
              {aula.aulas.nombre}
            </Typography>

            {esPrincipal && (
              <Chip
                icon={<StarIcon />}
                label="PRINCIPAL"
                size="small"
                color="primary"
                variant="filled"
              />
            )}

            {!esPrincipal && aula.prioridad && (
              <Chip
                label={`Prioridad ${aula.prioridad}`}
                size="small"
                color="default"
                variant="outlined"
              />
            )}

            {aula.aulas.tipoAula && (
              <Chip
                label={aula.aulas.tipoAula.nombre}
                size="small"
                color="info"
                variant="outlined"
              />
            )}
          </Box>
        }
        secondary={
          <>
            <Typography variant="body2" color="text.secondary" component="span" display="block">
              Capacidad: {aula.aulas.capacidad} personas
              {aula.aulas.ubicacion && ` • Ubicación: ${aula.aulas.ubicacion}`}
            </Typography>

            {aula.observaciones && (
              <Typography
                variant="caption"
                color="text.secondary"
                component="span"
                display="block"
                sx={{ fontStyle: 'italic', mt: 0.5 }}
              >
                Obs: {aula.observaciones}
              </Typography>
            )}

            <Typography variant="caption" color="text.secondary" component="span" display="block" sx={{ mt: 0.5 }}>
              Asignada: {formatDate(aula.fechaAsignacion)}
            </Typography>

            {aula.fechaDesasignacion && (
              <Typography variant="caption" color="error" component="span" display="block">
                Desasignada: {formatDate(aula.fechaDesasignacion)}
              </Typography>
            )}
          </>
        }
      />

      <ListItemSecondaryAction>
        <Tooltip title="Cambiar aula">
          <IconButton
            edge="end"
            onClick={() => onCambiar(aula)}
            sx={{ mr: 1 }}
            size="small"
          >
            <SwapHorizIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Desasignar aula">
          <IconButton
            edge="end"
            onClick={() => onDesasignar(aula)}
            color="error"
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

// Optimización: evita re-renders innecesarios comparando props
export default React.memo(AulaAsignadaItem);
