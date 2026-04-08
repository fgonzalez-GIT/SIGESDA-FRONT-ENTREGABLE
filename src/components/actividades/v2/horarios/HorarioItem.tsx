import React from 'react';
import {
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Box,
  Typography,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import type { HorarioActividad } from '../../../../types/actividad.types';
import { formatTime } from '../../../../types/actividad.types';
import { getDiaNombre } from '../../../../utils/dateHelpers';

interface HorarioItemProps {
  horario: HorarioActividad; // ← FIX: Removida extensión innecesaria, ya incluye diaSemana
  onEdit: (horario: HorarioActividad) => void;
  onDelete: (horario: HorarioActividad) => void;
}

/**
 * Item individual de horario con acciones de editar y eliminar
 * Muestra día de la semana, hora inicio y hora fin
 * Optimizado con React.memo para evitar re-renders innecesarios
 *
 * **FIX**: Usa helpers getDiaNombre/getDiaCodigo que leen directamente del backend
 * en lugar de buscar en catálogos (soluciona problema de IDs duplicados 15-21 vs 1-7)
 */
export const HorarioItem: React.FC<HorarioItemProps> = React.memo(({
  horario,
  onEdit,
  onDelete
}) => {
  // ✅ FIX: Usar helpers que leen del objeto backend directamente
  const diaNombre = getDiaNombre(horario.diaSemana); // ← Cambiado a singular

  return (
    <ListItem
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        mb: 1,
        bgcolor: 'background.paper',
        '&:hover': {
          bgcolor: 'action.hover'
        }
      }}
    >
      <Box sx={{ mr: 2 }}>
        <ScheduleIcon color="primary" />
      </Box>

      <ListItemText
        primary={
          <Typography variant="body1" fontWeight={500}>
            {diaNombre}
          </Typography>
        }
        secondary={
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {formatTime(horario.horaInicio)} - {formatTime(horario.horaFin)} hs
          </Typography>
        }
      />

      <ListItemSecondaryAction>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Editar horario">
            <IconButton
              edge="end"
              size="small"
              onClick={() => onEdit(horario)}
              sx={{ color: 'primary.main' }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar horario">
            <IconButton
              edge="end"
              size="small"
              onClick={() => onDelete(horario)}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </ListItemSecondaryAction>
    </ListItem>
  );
});

HorarioItem.displayName = 'HorarioItem';

export default HorarioItem;
