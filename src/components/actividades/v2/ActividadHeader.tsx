import React from 'react';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { EstadoBadge } from '../EstadoBadge';
import { DownloadListadoAsistenciaButton } from './DownloadListadoAsistenciaButton';
import type { ActividadHeaderProps } from '../../../types/actividadV2.types';

/**
 * Componente de encabezado para ActividadDetallePageV2
 * Muestra título, código, estado y botón volver
 */
export const ActividadHeader: React.FC<ActividadHeaderProps> = ({
  actividadId,
  nombre,
  codigo,
  estado,
  onVolver,
  actividad
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        mb: 3,
        pb: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      {/* Botón Volver */}
      <IconButton
        onClick={onVolver}
        sx={{
          bgcolor: 'action.hover',
          '&:hover': {
            bgcolor: 'action.selected'
          }
        }}
        aria-label="Volver"
      >
        <ArrowBackIcon />
      </IconButton>

      {/* Información de Actividad */}
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Typography variant="h5" component="h1" fontWeight={600}>
            {nombre}
          </Typography>
          <EstadoBadge estado={estado} />
        </Box>

        <Typography variant="body2" color="text.secondary">
          Código: {codigo}
        </Typography>
      </Box>

      {/* Botón Descargar Listado de Asistencia */}
      {actividad && (
        <DownloadListadoAsistenciaButton
          actividad={actividad}
          variant="outlined"
          size="small"
          label="Listado de Asistencia"
        />
      )}

      {/* Botón Ver V1 (temporal para desarrollo) */}
      <Chip
        label="Ver Versión Anterior"
        size="small"
        variant="outlined"
        onClick={() => {
          window.location.href = `/actividades/${actividadId}`;
        }}
        sx={{
          display: { xs: 'none', sm: 'inline-flex' }
        }}
      />
    </Box>
  );
};

export default ActividadHeader;
