import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Stack,
  Tooltip,
  Typography,
  Collapse,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import type { Persona } from '../../../types/persona.types';
import { TiposBadges } from './tipos';
import { getNombreCompleto } from '../../../types/persona.types';

interface PersonasTableProps {
  personas: Persona[];
  onView?: (persona: Persona) => void;
  onEdit?: (persona: Persona) => void;
  onDelete?: (persona: Persona) => void;
  showActions?: boolean;
  expandable?: boolean;
}

/**
 * Tabla modular para mostrar listado de personas
 * Soporta filas expandibles con información de contacto
 *
 * @example
 * ```tsx
 * <PersonasTable
 *   personas={personas}
 *   onView={handleView}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   expandable
 * />
 * ```
 */
export const PersonasTable: React.FC<PersonasTableProps> = ({
  personas,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  expandable = true,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRowExpansion = (personaId: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(personaId)) {
        newSet.delete(personaId);
      } else {
        newSet.add(personaId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  /**
   * Mapear campo 'activo' (boolean) a 'estado' (enum)
   * El backend envía activo: true/false, el frontend espera estado: ACTIVO/INACTIVO
   */
  const getEstado = (persona: Persona): string => {
    // Intentar usar el campo estado si existe
    if (persona.estado) return persona.estado;
    // Fallback: mapear desde campo activo
    return persona.activo ? 'ACTIVO' : 'INACTIVO';
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

  /**
   * Obtener fecha de ingreso de la persona
   * - Primero intenta obtenerla desde tipos[] (SOCIO tiene fechaIngreso)
   * - Luego desde el campo legacy persona.fechaIngreso
   */
  const getFechaIngreso = (persona: Persona): string | undefined => {
    // Buscar fecha de ingreso en tipo SOCIO (nueva estructura)
    const tipoSocio = persona.tipos?.find(
      (t) => t.tipoPersona?.codigo === 'SOCIO' && t.activo
    );
    if (tipoSocio?.fechaIngreso) {
      return tipoSocio.fechaIngreso;
    }
    // Fallback: campo legacy
    return persona.fechaIngreso || undefined;
  };

  if (personas.length === 0) {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {expandable && <TableCell sx={{ width: 40 }} />}
              <TableCell>Nombre Completo</TableCell>
              <TableCell>DNI</TableCell>
              <TableCell>Tipos</TableCell>
              <TableCell>Contacto</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Ingreso</TableCell>
              {showActions && <TableCell align="center">Acciones</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={expandable ? 8 : 7} align="center">
                <Typography variant="body2" color="text.secondary" py={3}>
                  No se encontraron personas
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {expandable && <TableCell sx={{ width: 40 }} />}
            <TableCell>Nombre Completo</TableCell>
            <TableCell>DNI</TableCell>
            <TableCell>Tipos</TableCell>
            <TableCell>Contacto</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Ingreso</TableCell>
            {showActions && <TableCell align="center">Acciones</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {personas.map((persona) => {
            const isExpanded = expandedRows.has(persona.id);
            const hasEmail = !!persona.email;
            const hasPhone = !!persona.telefono;
            const hasContactInfo = hasEmail || hasPhone || !!persona.direccion;

            return (
              <React.Fragment key={persona.id}>
                <TableRow
                  hover
                  sx={{
                    backgroundColor: !persona.activo ? 'action.disabledBackground' : 'inherit',
                    opacity: !persona.activo ? 0.7 : 1,
                  }}
                >
                  {/* Botón expandir */}
                  {expandable && (
                    <TableCell sx={{ padding: '4px' }}>
                      <IconButton
                        size="small"
                        onClick={() => toggleRowExpansion(persona.id)}
                        disabled={!hasContactInfo}
                      >
                        {isExpanded ? (
                          <KeyboardArrowDownIcon />
                        ) : (
                          <KeyboardArrowRightIcon />
                        )}
                      </IconButton>
                    </TableCell>
                  )}

                  {/* Nombre completo */}
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Tooltip title={getNombreCompleto(persona)} placement="top">
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{
                            maxWidth: 200,
                            textDecoration: !persona.activo ? 'line-through' : 'none',
                            color: !persona.activo ? 'text.disabled' : 'text.primary',
                          }}
                        >
                          {getNombreCompleto(persona)}
                        </Typography>
                      </Tooltip>
                      {!persona.activo && (
                        <Chip
                          label="Eliminada"
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', height: 18 }}
                        />
                      )}
                    </Box>
                  </TableCell>

                  {/* DNI */}
                  <TableCell>
                    <Typography variant="body2">{persona.dni}</Typography>
                  </TableCell>

                  {/* Tipos */}
                  <TableCell>
                    {persona.tipos && persona.tipos.length > 0 ? (
                      <TiposBadges tipos={persona.tipos} max={2} size="small" />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Sin tipos
                      </Typography>
                    )}
                  </TableCell>

                  {/* Contacto (íconos) */}
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {hasEmail ? (
                        <EmailIcon fontSize="small" color="primary" />
                      ) : (
                        <EmailIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                      )}
                      {hasPhone ? (
                        <PhoneIcon fontSize="small" color="primary" />
                      ) : (
                        <PhoneIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                      )}
                    </Box>
                  </TableCell>

                  {/* Estado */}
                  <TableCell>
                    {(() => {
                      const estado = getEstado(persona);
                      return (
                        <Chip
                          label={estado}
                          color={getEstadoColor(estado) as any}
                          size="small"
                          variant={estado === 'ACTIVO' ? 'filled' : 'outlined'}
                        />
                      );
                    })()}
                  </TableCell>

                  {/* Fecha de ingreso */}
                  <TableCell>
                    <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                      {formatDate(getFechaIngreso(persona))}
                    </Typography>
                  </TableCell>

                  {/* Acciones */}
                  {showActions && (
                    <TableCell>
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        {onView && (
                          <Tooltip title="Ver detalles">
                            <IconButton size="small" onClick={() => onView(persona)} color="primary">
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onEdit && (
                          <Tooltip title={!persona.activo ? "No se puede editar una persona eliminada" : "Editar"}>
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => onEdit(persona)}
                                color="primary"
                                disabled={!persona.activo}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                        {onDelete && (
                          <Tooltip title={!persona.activo ? "Persona ya eliminada" : "Eliminar"}>
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => onDelete(persona)}
                                color="error"
                                disabled={!persona.activo}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>

                {/* Fila expandible con información de contacto */}
                {expandable && hasContactInfo && (
                  <TableRow>
                    <TableCell
                      colSpan={showActions ? 8 : 7}
                      sx={{ py: 0, backgroundColor: 'action.hover' }}
                    >
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2, px: 4 }}>
                          <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                            Información de Contacto
                          </Typography>
                          <Stack spacing={1} sx={{ mt: 1 }}>
                            {hasEmail && (
                              <Box display="flex" alignItems="center" gap={1}>
                                <EmailIcon fontSize="small" color="primary" />
                                <Typography variant="body2" fontWeight={500}>
                                  Email:
                                </Typography>
                                <Typography variant="body2">{persona.email}</Typography>
                              </Box>
                            )}
                            {hasPhone && (
                              <Box display="flex" alignItems="center" gap={1}>
                                <PhoneIcon fontSize="small" color="primary" />
                                <Typography variant="body2" fontWeight={500}>
                                  Teléfono:
                                </Typography>
                                <Typography variant="body2">{persona.telefono}</Typography>
                              </Box>
                            )}
                            {persona.direccion && (
                              <Box display="flex" alignItems="center" gap={1}>
                                <LocationIcon fontSize="small" color="action" />
                                <Typography variant="body2" fontWeight={500}>
                                  Dirección:
                                </Typography>
                                <Typography variant="body2">{persona.direccion}</Typography>
                              </Box>
                            )}
                          </Stack>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PersonasTable;
