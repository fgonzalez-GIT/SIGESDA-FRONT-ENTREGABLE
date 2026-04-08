import React from 'react';
import { Box, Typography, Paper, Chip, Stack, Divider } from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import type { Persona } from '../../../types/persona.types';
import { TiposBadges } from './tipos';
import { getNombreCompleto } from '../../../types/persona.types';

interface PersonaHeaderProps {
  persona: Persona;
  showContactInfo?: boolean;
  showDates?: boolean;
  compact?: boolean;
}

/**
 * Header con información resumida de una persona
 * Muestra nombre, DNI, tipos, estado y datos de contacto
 *
 * @example
 * ```tsx
 * <PersonaHeader persona={persona} showContactInfo showDates />
 * ```
 */
export const PersonaHeader: React.FC<PersonaHeaderProps> = ({
  persona,
  showContactInfo = true,
  showDates = true,
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

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'ACTIVO':
        return 'success';
      case 'INACTIVO':
        return 'default';
      case 'SUSPENDIDO':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (compact) {
    return (
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Box flex={1}>
          <Typography variant="h6" component="h2">
            {getNombreCompleto(persona)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            DNI: {persona.dni}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          {persona.tipos && <TiposBadges tipos={persona.tipos} max={3} />}
          <Chip
            label={persona.estado}
            color={getEstadoColor(persona.estado) as any}
            size="small"
          />
        </Stack>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box flex={1}>
          <Typography variant="h4" component="h1" gutterBottom>
            {getNombreCompleto(persona)}
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body1" color="text.secondary">
              DNI: <strong>{persona.dni}</strong>
            </Typography>
            {persona.fechaNacimiento && (
              <Typography variant="body2" color="text.secondary">
                Nacimiento: {formatDate(persona.fechaNacimiento)}
              </Typography>
            )}
          </Stack>
        </Box>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          {persona.tipos && <TiposBadges tipos={persona.tipos} direction="column" />}
          <Chip
            label={persona.estado}
            color={getEstadoColor(persona.estado) as any}
            size="medium"
          />
        </Stack>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Stack spacing={2}>
        {showContactInfo && (
          <Box>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Información de Contacto
            </Typography>
            <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
              {persona.email && (
                <Box display="flex" alignItems="center" gap={1}>
                  <EmailIcon fontSize="small" color="primary" />
                  <Typography variant="body2">{persona.email}</Typography>
                </Box>
              )}
              {persona.telefono && (
                <Box display="flex" alignItems="center" gap={1}>
                  <PhoneIcon fontSize="small" color="primary" />
                  <Typography variant="body2">{persona.telefono}</Typography>
                </Box>
              )}
              {persona.direccion && (
                <Box display="flex" alignItems="center" gap={1}>
                  <LocationIcon fontSize="small" color="action" />
                  <Typography variant="body2">{persona.direccion}</Typography>
                </Box>
              )}
            </Stack>
          </Box>
        )}

        {showDates && (
          <Box>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Fechas
            </Typography>
            <Stack direction="row" spacing={3}>
              {persona.fechaIngreso && (
                <Box display="flex" alignItems="center" gap={1}>
                  <CalendarIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    Ingreso: <strong>{formatDate(persona.fechaIngreso)}</strong>
                  </Typography>
                </Box>
              )}
              {persona.fechaBaja && (
                <Box display="flex" alignItems="center" gap={1}>
                  <CalendarIcon fontSize="small" color="error" />
                  <Typography variant="body2" color="error">
                    Baja: <strong>{formatDate(persona.fechaBaja)}</strong>
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        )}

        {persona.observaciones && (
          <Box>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Observaciones
            </Typography>
            <Box display="flex" gap={1}>
              <InfoIcon fontSize="small" color="action" />
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                {persona.observaciones}
              </Typography>
            </Box>
          </Box>
        )}

        {persona.motivoBaja && (
          <Box>
            <Typography variant="subtitle2" gutterBottom color="error">
              Motivo de Baja
            </Typography>
            <Typography variant="body2" color="error">
              {persona.motivoBaja}
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};

export default PersonaHeader;
