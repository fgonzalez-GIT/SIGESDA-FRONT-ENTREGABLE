/**
 * Componente Selector de Horarios para Actividades V2
 * Permite seleccionar día de semana, hora inicio y hora fin
 */

import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { usePreferences } from '../../hooks/usePreferences';
import type { DiaSemana, CreateHorarioDTO } from '../../types/actividad.types';

interface HorarioSelectorProps {
  value: Partial<CreateHorarioDTO>;
  onChange: (value: Partial<CreateHorarioDTO>) => void;
  diasSemana: DiaSemana[];
  error?: {
    diaSemanaId?: string;
    horaInicio?: string;
    horaFin?: string;
  };
  disabled?: boolean;
}

export const HorarioSelector: React.FC<HorarioSelectorProps> = ({
  value,
  onChange,
  diasSemana,
  error,
  disabled = false,
}) => {
  const { is12Hour } = usePreferences();
  const horaInicio = value.horaInicio ? new Date(`2000-01-01T${value.horaInicio}`) : null;
  const horaFin = value.horaFin ? new Date(`2000-01-01T${value.horaFin}`) : null;

  const handleDiaChange = (diaSemanaId: number) => {
    onChange({ ...value, diaSemanaId });
  };

  const handleHoraInicioChange = (date: Date | null) => {
    const horaInicio = date ? date.toTimeString().slice(0, 5) : '';
    onChange({ ...value, horaInicio });
  };

  const handleHoraFinChange = (date: Date | null) => {
    const horaFin = date ? date.toTimeString().slice(0, 5) : '';
    onChange({ ...value, horaFin });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box display="flex" gap={2} alignItems="flex-start">
        <FormControl fullWidth error={!!error?.diaSemanaId} disabled={disabled}>
          <InputLabel>Día</InputLabel>
          <Select
            value={value.diaSemanaId || ''}
            onChange={(e) => handleDiaChange(Number(e.target.value))}
            label="Día"
          >
            <MenuItem value="">Seleccione día...</MenuItem>
            {diasSemana.map((dia) => (
              <MenuItem key={dia.id} value={dia.id}>
                {dia.nombre}
              </MenuItem>
            ))}
          </Select>
          {error?.diaSemanaId && <FormHelperText>{error.diaSemanaId}</FormHelperText>}
        </FormControl>

        <TimePicker
          label="Hora Inicio"
          value={horaInicio}
          onChange={handleHoraInicioChange}
          ampm={is12Hour}
          disabled={disabled}
          slotProps={{
            textField: {
              fullWidth: true,
              error: !!error?.horaInicio,
              helperText: error?.horaInicio,
            },
          }}
        />

        <TimePicker
          label="Hora Fin"
          value={horaFin}
          onChange={handleHoraFinChange}
          ampm={is12Hour}
          disabled={disabled}
          slotProps={{
            textField: {
              fullWidth: true,
              error: !!error?.horaFin,
              helperText: error?.horaFin,
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default HorarioSelector;
