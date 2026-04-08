/**
 * Componente Lista de Horarios para Actividades V2
 * Muestra los horarios de una actividad con opción de eliminar
 */

import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Paper,
  Stack,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import type { HorarioActividad } from '../../types/actividad.types';
import { formatTime } from '../../types/actividad.types';
import { getDiaNombre } from '../../utils/dateHelpers';

interface HorariosListaV2Props {
  horarios: HorarioActividad[];
  onDelete?: (horarioId: number) => void;
  showActions?: boolean;
  dense?: boolean;
}

export const HorariosListaV2: React.FC<HorariosListaV2Props> = ({
  horarios,
  onDelete,
  showActions = false,
  dense = false,
}) => {
  if (horarios.length === 0) {
    return (
      <Box p={2}>
        <Typography variant="body2" color="text.secondary" align="center">
          No hay horarios definidos
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={dense ? 1 : 2}>
      {horarios.map((horario) => (
        <Paper
          key={horario.id}
          variant="outlined"
          sx={{
            p: dense ? 1.5 : 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            {/*
              ✅ FIX: Usa helper getDiaNombre que lee directamente del objeto backend
              en lugar de buscar en catálogos (soluciona problema de IDs duplicados)
            */}
            <Chip
              label={getDiaNombre(horario.diaSemana)}
              color="primary"
              variant="outlined"
              size="small"
            />
            <Typography variant={dense ? 'body2' : 'body1'}>
              {formatTime(horario.horaInicio)} - {formatTime(horario.horaFin)}
            </Typography>
            {!horario.activo && (
              <Chip
                label="Inactivo"
                color="default"
                size="small"
                variant="outlined"
              />
            )}
          </Box>

          {showActions && onDelete && (
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(horario.id)}
              aria-label="Eliminar horario"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Paper>
      ))}
    </Stack>
  );
};

export default HorariosListaV2;
