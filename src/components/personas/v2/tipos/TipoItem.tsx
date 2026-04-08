import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Stack,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  Category as CategoryIcon,
  School as SchoolIcon,
  AttachMoney as MoneyIcon,
  Business as BusinessIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import type { PersonaTipo } from '../../../../types/persona.types';
import { TipoBadge } from './TipoBadge';

interface TipoItemProps {
  tipo: PersonaTipo;
  onEdit?: (tipo: PersonaTipo) => void;
  onDelete?: (tipo: PersonaTipo) => void;
  onToggle?: (tipo: PersonaTipo) => void;
  showActions?: boolean;
  compact?: boolean;
}

/**
 * Componente para mostrar un tipo asignado a una persona con sus detalles
 *
 * @example
 * ```tsx
 * <TipoItem
 *   tipo={personaTipo}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onToggle={handleToggle}
 * />
 * ```
 */
export const TipoItem: React.FC<TipoItemProps> = ({
  tipo,
  onEdit,
  onDelete,
  onToggle,
  showActions = true,
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

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const renderDetallesCamposEspecificos = () => {
    const codigo = tipo.tipoPersona?.codigo?.toUpperCase() || '';

    switch (codigo) {
      case 'SOCIO':
        return (
          <Stack spacing={1}>
            {tipo.categoria && (
              <Box display="flex" alignItems="center" gap={1}>
                <CategoryIcon fontSize="small" color="primary" />
                <Typography variant="body2" fontWeight={500}>
                  Categoría:
                </Typography>
                <Chip
                  label={tipo.categoria.nombre}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
            )}
            {tipo.numeroSocio && (
              <Box display="flex" alignItems="center" gap={1}>
                <InfoIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Nº Socio: <strong>{tipo.numeroSocio}</strong>
                </Typography>
              </Box>
            )}
          </Stack>
        );

      case 'DOCENTE':
        return (
          <Stack spacing={1}>
            {tipo.especialidad && (
              <Box display="flex" alignItems="center" gap={1}>
                <SchoolIcon fontSize="small" color="success" />
                <Typography variant="body2" fontWeight={500}>
                  Especialidad:
                </Typography>
                <Chip
                  label={tipo.especialidad.nombre}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              </Box>
            )}
            {tipo.honorariosPorHora !== undefined && (
              <Box display="flex" alignItems="center" gap={1}>
                <MoneyIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Honorarios/hora: <strong>{formatCurrency(tipo.honorariosPorHora)}</strong>
                </Typography>
              </Box>
            )}
          </Stack>
        );

      case 'PROVEEDOR':
        return (
          <Stack spacing={1}>
            {tipo.razonSocial && (
              <Box display="flex" alignItems="center" gap={1}>
                <BusinessIcon fontSize="small" color="warning" />
                <Typography variant="body2" fontWeight={500}>
                  Razón Social:
                </Typography>
                <Typography variant="body2">{tipo.razonSocial}</Typography>
              </Box>
            )}
            {tipo.cuit && (
              <Box display="flex" alignItems="center" gap={1}>
                <InfoIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  CUIT: <strong>{tipo.cuit}</strong>
                </Typography>
              </Box>
            )}
          </Stack>
        );

      default:
        return null;
    }
  };

  if (compact) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        p={1}
        sx={{
          backgroundColor: tipo.activo ? 'background.paper' : 'action.disabledBackground',
          borderRadius: 1,
          border: '1px solid',
          borderColor: tipo.activo ? 'divider' : 'action.disabled',
          opacity: tipo.activo ? 1 : 0.6,
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <TipoBadge tipo={tipo} size="small" />
          {!tipo.activo && (
            <Chip label="Inactivo" size="small" color="default" variant="outlined" />
          )}
        </Box>
        {showActions && (
          <Box display="flex" gap={0.5}>
            {onToggle && (
              <Tooltip title={tipo.activo ? 'Desactivar' : 'Activar'}>
                <IconButton size="small" onClick={() => onToggle(tipo)}>
                  {tipo.activo ? <ToggleOnIcon color="primary" /> : <ToggleOffIcon />}
                </IconButton>
              </Tooltip>
            )}
            {onEdit && (
              <Tooltip title="Editar">
                <IconButton size="small" onClick={() => onEdit(tipo)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title="Eliminar">
                <IconButton size="small" color="error" onClick={() => onDelete(tipo)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Card
      variant="outlined"
      sx={{
        backgroundColor: tipo.activo ? 'background.paper' : 'action.disabledBackground',
        opacity: tipo.activo ? 1 : 0.6,
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <TipoBadge tipo={tipo} showIcon showTooltip />
            {!tipo.activo && (
              <Chip label="Inactivo" size="small" color="default" variant="outlined" />
            )}
          </Box>
          {showActions && (
            <Stack direction="row" spacing={0.5}>
              {onToggle && (
                <Tooltip title={tipo.activo ? 'Desactivar' : 'Activar'}>
                  <IconButton size="small" onClick={() => onToggle(tipo)}>
                    {tipo.activo ? <ToggleOnIcon color="primary" /> : <ToggleOffIcon />}
                  </IconButton>
                </Tooltip>
              )}
              {onEdit && (
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={() => onEdit(tipo)} color="primary">
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip title="Eliminar">
                  <IconButton size="small" onClick={() => onDelete(tipo)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          )}
        </Box>

        {renderDetallesCamposEspecificos()}

        <Divider sx={{ my: 2 }} />

        <Stack spacing={1}>
          <Box display="flex" gap={2}>
            <Typography variant="caption" color="text.secondary">
              Asignado: <strong>{formatDate(tipo.fechaAsignacion)}</strong>
            </Typography>
            {tipo.updatedAt && tipo.updatedAt !== tipo.createdAt && (
              <Typography variant="caption" color="text.secondary">
                Modificado: <strong>{formatDate(tipo.updatedAt)}</strong>
              </Typography>
            )}
          </Box>

          {tipo.observaciones && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Observaciones:
              </Typography>
              <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                {tipo.observaciones}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TipoItem;
