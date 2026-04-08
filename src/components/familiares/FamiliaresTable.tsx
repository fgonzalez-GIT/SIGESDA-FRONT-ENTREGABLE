/**
 * FamiliaresTable - Tabla bidireccional de relaciones familiares (FASE 2)
 *
 * Características:
 * - Vista bidireccional: muestra ambas personas de la relación
 * - Paginación
 * - Acciones de edición y eliminación
 * - Badges de permisos (RF, CE, AR)
 * - Indicador de descuento
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Box,
  Typography,
  Avatar,
  Stack,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapHoriz as SwapIcon,
} from '@mui/icons-material';
import type { PersonaTipo } from '@/types/persona.types';
import { TiposBadges } from '@/components/personas/v2/tipos';

interface PersonaBasica {
  id: number;
  nombre: string;
  apellido: string;
  tipos?: PersonaTipo[];
}

interface RelacionCompleta {
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
  familiar?: PersonaBasica;
  // Datos de la persona principal (pueden venir del backend o ser agregados)
  persona?: PersonaBasica;
}

interface FamiliaresTableProps {
  relaciones: RelacionCompleta[];
  personas: PersonaBasica[]; // Lista completa de personas para mapear IDs
  loading?: boolean;
  onEdit: (relacion: RelacionCompleta) => void;
  onDelete: (id: number) => void;
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

// Función removida: getTipoPersonaColor ya no es necesaria
// El componente TiposBadges maneja los colores automáticamente

export const FamiliaresTable: React.FC<FamiliaresTableProps> = ({
  relaciones,
  personas,
  loading = false,
  onEdit,
  onDelete,
}) => {
  // Helper para obtener datos de persona por ID
  const getPersonaData = (id: number): PersonaBasica => {
    const persona = personas.find(p => p.id === id);
    return persona || { id, nombre: 'Desconocido', apellido: '', tipos: undefined };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (relaciones.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No se encontraron relaciones familiares
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Persona 1</TableCell>
              <TableCell align="center" sx={{ minWidth: 120 }}>
                <SwapIcon sx={{ verticalAlign: 'middle' }} />
              </TableCell>
              <TableCell>Persona 2</TableCell>
              <TableCell>Permisos</TableCell>
              <TableCell align="center">Descuento</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {relaciones.map((relacion) => {
              const persona1 = getPersonaData(relacion.personaId);
              const persona2 = relacion.familiar || getPersonaData(relacion.familiarId);

              return (
                <TableRow
                  key={relacion.id}
                  hover
                  sx={{
                    opacity: relacion.activo ? 1 : 0.6,
                    backgroundColor: relacion.activo ? 'inherit' : 'action.hover',
                  }}
                >
                  {/* Persona 1 */}
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: 'primary.main',
                          fontSize: '0.875rem',
                        }}
                      >
                        {persona1.nombre[0]}{persona1.apellido[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {persona1.nombre} {persona1.apellido}
                        </Typography>
                        {persona1.tipos && persona1.tipos.length > 0 && (
                          <TiposBadges
                            tipos={persona1.tipos}
                            max={2}
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Relación */}
                  <TableCell align="center">
                    <Box>
                      <Chip
                        label={formatRelacionTipo(relacion.tipoRelacion)}
                        size="small"
                        color="info"
                        sx={{ fontWeight: 'bold' }}
                      />
                      {relacion.descripcion && (
                        <Typography variant="caption" display="block" color="text.secondary" mt={0.5}>
                          {relacion.descripcion}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  {/* Persona 2 */}
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: 'secondary.main',
                          fontSize: '0.875rem',
                        }}
                      >
                        {persona2.nombre[0]}{persona2.apellido[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {persona2.nombre} {persona2.apellido}
                        </Typography>
                        {persona2.tipos && persona2.tipos.length > 0 && (
                          <TiposBadges
                            tipos={persona2.tipos}
                            max={2}
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Permisos */}
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {relacion.responsableFinanciero && (
                        <Tooltip title="Responsable Financiero">
                          <Chip label="RF" size="small" color="success" sx={{ height: 20 }} />
                        </Tooltip>
                      )}
                      {relacion.contactoEmergencia && (
                        <Tooltip title="Contacto de Emergencia">
                          <Chip label="CE" size="small" color="warning" sx={{ height: 20 }} />
                        </Tooltip>
                      )}
                      {relacion.autorizadoRetiro && (
                        <Tooltip title="Autorizado para Retiro">
                          <Chip label="AR" size="small" color="info" sx={{ height: 20 }} />
                        </Tooltip>
                      )}
                      {!relacion.responsableFinanciero &&
                        !relacion.contactoEmergencia &&
                        !relacion.autorizadoRetiro && (
                          <Typography variant="caption" color="text.secondary">
                            Sin permisos
                          </Typography>
                        )}
                    </Stack>
                  </TableCell>

                  {/* Descuento */}
                  <TableCell align="center">
                    {relacion.porcentajeDescuento && relacion.porcentajeDescuento > 0 ? (
                      <Chip
                        label={`${relacion.porcentajeDescuento}%`}
                        size="small"
                        color="primary"
                        sx={{ fontWeight: 'bold' }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>

                  {/* Estado */}
                  <TableCell align="center">
                    <Chip
                      label={relacion.activo ? 'Activo' : 'Inactivo'}
                      size="small"
                      color={relacion.activo ? 'success' : 'default'}
                      variant={relacion.activo ? 'filled' : 'outlined'}
                    />
                  </TableCell>

                  {/* Acciones */}
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="Editar relación">
                        <IconButton
                          size="small"
                          onClick={() => onEdit(relacion)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar relación">
                        <IconButton
                          size="small"
                          onClick={() => onDelete(relacion.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default FamiliaresTable;
