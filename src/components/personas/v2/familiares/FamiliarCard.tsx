import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Divider,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  ContactPhone as PhoneIcon,
  MonetizationOn as MoneyIcon,
  Info as InfoIcon,
  AccountBalance as FinanceIcon,
} from '@mui/icons-material';

interface FamiliarData {
  id: number;
  personaId: number;
  familiarId: number;
  tipoRelacion: string;
  descripcion?: string;
  fechaCreacion: string;
  activo: boolean;
  responsableFinanciero: boolean;
  autorizadoRetiro: boolean;
  contactoEmergencia: boolean;
  porcentajeDescuento?: number;
  familiar?: {
    id: number;
    nombre: string;
    apellido: string;
    dni?: string;
    telefono?: string;
    email?: string;
  };
}

interface FamiliarCardProps {
  relacion: FamiliarData;
  onDelete: () => void;
}

/**
 * Card para mostrar una relación familiar con badges de permisos
 * Diseñado para PersonaDetallePage > Tab Familiares
 */
export const FamiliarCard: React.FC<FamiliarCardProps> = ({ relacion, onDelete }) => {
  const familiar = relacion.familiar;

  // Si no hay datos del familiar, mostrar solo IDs
  if (!familiar) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Familiar ID: {relacion.familiarId} (datos no disponibles)
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Mapear tipo de relación a color
  const getRelacionColor = (tipo: string): 'primary' | 'success' | 'info' | 'secondary' | 'default' => {
    const tipoLower = tipo.toLowerCase();
    if (['padre', 'madre'].includes(tipoLower)) return 'primary';
    if (['hijo', 'hija'].includes(tipoLower)) return 'success';
    if (['hermano', 'hermana'].includes(tipoLower)) return 'info';
    if (['esposo', 'esposa'].includes(tipoLower)) return 'secondary';
    return 'default';
  };

  const tienePermisos =
    relacion.autorizadoRetiro ||
    relacion.contactoEmergencia ||
    relacion.responsableFinanciero;

  const tieneDescuento = relacion.porcentajeDescuento && relacion.porcentajeDescuento > 0;

  return (
    <Card
      variant="outlined"
      sx={{
        opacity: relacion.activo ? 1 : 0.6,
        borderColor: relacion.activo ? 'divider' : 'action.disabled',
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            {/* Nombre del familiar */}
            <Typography variant="h6" gutterBottom>
              {familiar.apellido}, {familiar.nombre}
            </Typography>

            {/* Tipo de relación */}
            <Box display="flex" gap={1} alignItems="center" mb={2}>
              <Chip
                label={relacion.tipoRelacion.toUpperCase()}
                size="small"
                color={getRelacionColor(relacion.tipoRelacion)}
              />
              {!relacion.activo && (
                <Chip
                  label="INACTIVO"
                  size="small"
                  color="default"
                  variant="outlined"
                />
              )}
            </Box>

            {/* DNI y contacto */}
            {(familiar.dni || familiar.telefono || familiar.email) && (
              <Box display="flex" flexDirection="column" gap={0.5} mb={1.5}>
                {familiar.dni && (
                  <Typography variant="body2" color="text.secondary">
                    DNI: <strong>{familiar.dni}</strong>
                  </Typography>
                )}
                {familiar.telefono && (
                  <Typography variant="body2" color="text.secondary">
                    Tel: <strong>{familiar.telefono}</strong>
                  </Typography>
                )}
                {familiar.email && (
                  <Typography variant="body2" color="text.secondary">
                    Email: <strong>{familiar.email}</strong>
                  </Typography>
                )}
              </Box>
            )}

            {/* Permisos y badges */}
            {tienePermisos && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                  PERMISOS Y AUTORIZACIONES
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {relacion.autorizadoRetiro && (
                    <Chip
                      label="Autorizado Retiro"
                      size="small"
                      color="success"
                      variant="outlined"
                      icon={<CheckIcon />}
                    />
                  )}
                  {relacion.contactoEmergencia && (
                    <Chip
                      label="Contacto Emergencia"
                      size="small"
                      color="error"
                      variant="outlined"
                      icon={<PhoneIcon />}
                    />
                  )}
                  {relacion.responsableFinanciero && (
                    <Chip
                      label="Responsable Financiero"
                      size="small"
                      color="warning"
                      variant="outlined"
                      icon={<FinanceIcon />}
                    />
                  )}
                </Stack>
              </>
            )}

            {/* Descuento */}
            {tieneDescuento && (
              <Box mt={1.5}>
                <Chip
                  label={`${relacion.porcentajeDescuento}% Descuento`}
                  size="small"
                  color="info"
                  variant="filled"
                  icon={<MoneyIcon />}
                />
              </Box>
            )}

            {/* Descripción */}
            {relacion.descripcion && (
              <Box mt={1.5} p={1} bgcolor="action.hover" borderRadius={1}>
                <Typography variant="caption" color="text.secondary" display="flex" alignItems="flex-start">
                  <InfoIcon sx={{ fontSize: 14, mr: 0.5, mt: 0.2 }} />
                  {relacion.descripcion}
                </Typography>
              </Box>
            )}

            {/* Fecha de creación */}
            <Box mt={1.5}>
              <Typography variant="caption" color="text.secondary">
                Registrado: {new Date(relacion.fechaCreacion).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </Typography>
            </Box>
          </Box>

          {/* Botón eliminar */}
          <Tooltip title="Eliminar relación familiar">
            <IconButton onClick={onDelete} color="error" size="small">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FamiliarCard;
