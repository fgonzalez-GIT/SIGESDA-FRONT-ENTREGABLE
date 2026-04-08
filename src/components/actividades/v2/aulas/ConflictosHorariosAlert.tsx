/**
 * Componente para mostrar conflictos horarios detectados al asignar un aula
 * Muestra lista detallada de actividades, reservas o secciones que ocupan el aula
 */

import React from 'react';
import {
  Alert,
  AlertTitle,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import {
  Event as EventIcon,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import type { ConflictoHorario } from '@/types/actividad-aula.types';

interface ConflictosHorariosAlertProps {
  conflictos: ConflictoHorario[];
  aulaNombre?: string;
}

const ConflictosHorariosAlert: React.FC<ConflictosHorariosAlertProps> = ({
  conflictos,
  aulaNombre,
}) => {
  if (!conflictos || conflictos.length === 0) {
    return null;
  }

  // Obtener icono según tipo de conflicto
  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'ACTIVIDAD':
        return <EventIcon fontSize="small" />;
      case 'RESERVA':
        return <CalendarIcon fontSize="small" />;
      case 'SECCION':
        return <ScheduleIcon fontSize="small" />;
      default:
        return <EventIcon fontSize="small" />;
    }
  };

  // Obtener color según tipo
  const getTipoColor = (tipo: string): 'error' | 'warning' | 'info' => {
    switch (tipo) {
      case 'ACTIVIDAD':
        return 'error';
      case 'RESERVA':
        return 'warning';
      case 'SECCION':
        return 'info';
      default:
        return 'warning';
    }
  };

  // Agrupar conflictos por día de la semana
  const conflictosPorDia = conflictos.reduce((acc, conflicto) => {
    const dia = conflicto.diaSemana;
    if (!acc[dia]) {
      acc[dia] = [];
    }
    acc[dia].push(conflicto);
    return acc;
  }, {} as Record<string, ConflictoHorario[]>);

  const diasOrdenados = ['LUNES', 'MARTES', 'MIÉRCOLES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'SABADO', 'DOMINGO'];
  const diasConConflictos = Object.keys(conflictosPorDia).sort(
    (a, b) => diasOrdenados.indexOf(a) - diasOrdenados.indexOf(b)
  );

  return (
    <Alert severity="error" sx={{ mt: 2 }}>
      <AlertTitle>⚠️ Conflictos Horarios Detectados</AlertTitle>

      <Typography variant="body2" sx={{ mb: 2 }}>
        {aulaNombre ? `El aula "${aulaNombre}"` : 'Esta aula'} NO está disponible en los
        siguientes horarios:
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {diasConConflictos.map((dia) => (
          <Box key={dia}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              {dia}
            </Typography>

            {conflictosPorDia[dia].map((conflicto) => (
              <Card
                key={conflicto.id}
                sx={{
                  mb: 1,
                  bgcolor: 'error.light',
                  color: 'error.contrastText',
                  border: '1px solid',
                  borderColor: 'error.main',
                }}
              >
                <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Chip
                      icon={getTipoIcon(conflicto.tipo)}
                      label={conflicto.tipo}
                      color={getTipoColor(conflicto.tipo)}
                      size="small"
                    />

                    <Typography variant="body2" fontWeight={600}>
                      {conflicto.nombre}
                    </Typography>

                    <Chip
                      label={`${conflicto.horaInicio} - ${conflicto.horaFin}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  {conflicto.aulaNombre && (
                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                      Aula: {conflicto.aulaNombre}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        ))}
      </Box>

      <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
        Esta aula NO puede ser asignada debido a estos conflictos. Por favor, seleccione
        otra aula o ajuste los horarios de la actividad.
      </Typography>
    </Alert>
  );
};

export default ConflictosHorariosAlert;
