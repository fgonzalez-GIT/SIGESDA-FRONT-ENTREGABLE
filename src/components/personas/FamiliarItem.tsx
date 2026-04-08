import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

interface FamiliarData {
  id: number;
  nombre: string;
  apellido: string;
  tipo?: string;
}

interface RelacionFamiliarConDatos {
  id: number;
  personaId: number;
  familiarId: number;
  tipoRelacion: 'padre' | 'madre' | 'hijo' | 'hija' | 'esposo' | 'esposa' | 'hermano' | 'hermana' | 'abuelo' | 'abuela' | 'nieto' | 'nieta' | 'tio' | 'tia' | 'primo' | 'prima' | 'otro';
  descripcion?: string;
  fechaCreacion: string;
  activo: boolean;
  responsableFinanciero: boolean;
  autorizadoRetiro: boolean;
  contactoEmergencia: boolean;
  porcentajeDescuento?: number;
  familiar: FamiliarData;
}

interface FamiliarItemProps {
  relacion: RelacionFamiliarConDatos;
  onEdit: () => void;
  onDelete: () => void;
}

const formatRelacionTipo = (tipo: string): string => {
  const tiposMap: Record<string, string> = {
    padre: 'Padre',
    madre: 'Madre',
    hijo: 'Hijo',
    hija: 'Hija',
    esposo: 'Esposo',
    esposa: 'Esposa',
    hermano: 'Hermano',
    hermana: 'Hermana',
    abuelo: 'Abuelo',
    abuela: 'Abuela',
    nieto: 'Nieto',
    nieta: 'Nieta',
    tio: 'Tío',
    tia: 'Tía',
    primo: 'Primo',
    prima: 'Prima',
    otro: 'Otro',
  };
  return tiposMap[tipo] || tipo;
};

const getInitials = (nombre: string, apellido: string): string => {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
};

export const FamiliarItem: React.FC<FamiliarItemProps> = ({
  relacion,
  onEdit,
  onDelete,
}) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        '&:hover': {
          boxShadow: 1,
          borderColor: 'primary.main',
        },
        transition: 'all 0.2s',
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        {/* Información del familiar */}
        <Box flex={1}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: 'primary.main',
                fontSize: '0.875rem',
              }}
            >
              {getInitials(relacion.familiar.nombre, relacion.familiar.apellido)}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {relacion.familiar.nombre} {relacion.familiar.apellido}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatRelacionTipo(relacion.tipoRelacion)}
                {relacion.descripcion && ` • ${relacion.descripcion}`}
              </Typography>
            </Box>
          </Box>

          {/* Badges de permisos y descuentos */}
          {(relacion.responsableFinanciero ||
            relacion.contactoEmergencia ||
            relacion.autorizadoRetiro ||
            (relacion.porcentajeDescuento && relacion.porcentajeDescuento > 0)) && (
            <Stack direction="row" spacing={0.5} mt={1} flexWrap="wrap" gap={0.5}>
              {relacion.responsableFinanciero && (
                <Tooltip title="Responsable Financiero">
                  <Chip
                    label="RF"
                    size="small"
                    color="success"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Tooltip>
              )}
              {relacion.contactoEmergencia && (
                <Tooltip title="Contacto de Emergencia">
                  <Chip
                    label="CE"
                    size="small"
                    color="warning"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Tooltip>
              )}
              {relacion.autorizadoRetiro && (
                <Tooltip title="Autorizado para Retiro">
                  <Chip
                    label="AR"
                    size="small"
                    color="info"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Tooltip>
              )}
              {relacion.porcentajeDescuento && relacion.porcentajeDescuento > 0 && (
                <Tooltip title="Descuento Familiar">
                  <Chip
                    label={`${relacion.porcentajeDescuento}% desc.`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Tooltip>
              )}
            </Stack>
          )}
        </Box>

        {/* Acciones */}
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Editar relación">
            <IconButton size="small" onClick={onEdit} color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar relación">
            <IconButton size="small" onClick={onDelete} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Paper>
  );
};

export default FamiliarItem;
