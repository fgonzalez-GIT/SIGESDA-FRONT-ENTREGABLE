/**
 * Componente de tabla para listar actividades
 * Vista alternativa a ActividadCard
 */

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Box,
  Typography,
  Chip,
  TableSortLabel,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ContentCopy as CopyIcon,
  MoreVert as MoreVertIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import type { Actividad } from '../../types/actividad.types';
import { getCupoDisponible, hasCupoDisponible, formatTime } from '../../types/actividad.types';
import { EstadoBadge } from './EstadoBadge';
import { useCatalogosContext } from '../../providers/CatalogosProvider';
import { getDiaNombre } from '../../utils/dateHelpers';

interface ActividadesTableProps {
  actividades: Actividad[];
  onView?: (actividad: Actividad) => void;
  onEdit?: (actividad: Actividad) => void;
  onDelete?: (actividad: Actividad) => void;
  onDuplicate?: (actividad: Actividad) => void;
}

type OrderBy = 'nombre' | 'tipo' | 'categoria' | 'estado' | 'cupo' | 'costo';
type Order = 'asc' | 'desc';

export const ActividadesTable: React.FC<ActividadesTableProps> = ({
  actividades,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<OrderBy>('nombre');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedActividad, setSelectedActividad] = useState<Actividad | null>(null);

  // Hook para acceder a los catálogos globales
  const { catalogos } = useCatalogosContext();

  // Funciones helper para hacer lookup de catálogos
  const getTipoNombre = (tipoId: number) => {
    return catalogos?.tiposActividades?.find(t => t.id === tipoId)?.nombre || 'N/A';
  };

  const getCategoriaNombre = (categoriaId: number) => {
    return catalogos?.categoriasActividades?.find(c => c.id === categoriaId)?.nombre || 'N/A';
  };

  const getEstado = (estadoId: number) => {
    return catalogos?.estadosActividades?.find(e => e.id === estadoId);
  };

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, actividad: Actividad) => {
    setAnchorEl(event.currentTarget);
    setSelectedActividad(actividad);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedActividad(null);
  };

  const handleAction = (action: () => void) => {
    action();
    handleMenuClose();
  };

  // Función de ordenamiento
  const sortedActividades = React.useMemo(() => {
    const comparator = (a: Actividad, b: Actividad) => {
      let aValue: any;
      let bValue: any;

      switch (orderBy) {
        case 'nombre':
          aValue = a.nombre.toLowerCase();
          bValue = b.nombre.toLowerCase();
          break;
        case 'tipo':
          aValue = getTipoNombre(a.tipoActividadId);
          bValue = getTipoNombre(b.tipoActividadId);
          break;
        case 'categoria':
          aValue = getCategoriaNombre(a.categoriaId);
          bValue = getCategoriaNombre(b.categoriaId);
          break;
        case 'estado':
          aValue = getEstado(a.estadoId)?.nombre || '';
          bValue = getEstado(b.estadoId)?.nombre || '';
          break;
        case 'cupo':
          aValue = getCupoDisponible(a);
          bValue = getCupoDisponible(b);
          break;
        case 'costo':
          aValue = Number(a.costo);
          bValue = Number(b.costo);
          break;
        default:
          aValue = '';
          bValue = '';
      }

      if (aValue < bValue) {
        return order === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    };

    return [...actividades].sort(comparator);
  }, [actividades, order, orderBy]);

  if (actividades.length === 0) {
    return (
      <Paper sx={{ p: 4 }}>
        <Typography align="center" color="text.secondary">
          No se encontraron actividades con los filtros seleccionados
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'nombre'}
                  direction={orderBy === 'nombre' ? order : 'asc'}
                  onClick={() => handleRequestSort('nombre')}
                >
                  <strong>Nombre</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'tipo'}
                  direction={orderBy === 'tipo' ? order : 'asc'}
                  onClick={() => handleRequestSort('tipo')}
                >
                  <strong>Tipo</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'categoria'}
                  direction={orderBy === 'categoria' ? order : 'asc'}
                  onClick={() => handleRequestSort('categoria')}
                >
                  <strong>Categoría</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'estado'}
                  direction={orderBy === 'estado' ? order : 'asc'}
                  onClick={() => handleRequestSort('estado')}
                >
                  <strong>Estado</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <strong>Horarios</strong>
              </TableCell>
              <TableCell align="center">
                <strong>Docentes</strong>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === 'cupo'}
                  direction={orderBy === 'cupo' ? order : 'asc'}
                  onClick={() => handleRequestSort('cupo')}
                >
                  <strong>Cupo</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'costo'}
                  direction={orderBy === 'costo' ? order : 'asc'}
                  onClick={() => handleRequestSort('costo')}
                >
                  <strong>Costo</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <strong>Acciones</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedActividades.map((actividad) => {
              const cupoDisponible = getCupoDisponible(actividad);
              const tieneCupo = hasCupoDisponible(actividad);
              const participantesActuales = actividad.capacidadMaxima ? actividad.capacidadMaxima - cupoDisponible : 0;
              const horariosCount = actividad.horarios_actividades?.filter(h => h.activo).length || 0;
              const docentesCount = actividad.docentes_actividades?.filter(d => d.activo).length || 0;

              return (
                <TableRow
                  key={actividad.id}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>
                    <Tooltip title={actividad.descripcion || 'Sin descripción'} arrow>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {actividad.nombre}
                        </Typography>
                      </Box>
                    </Tooltip>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={getTipoNombre(actividad.tipoActividadId)}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={getCategoriaNombre(actividad.categoriaId)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>

                  <TableCell>
                    {getEstado(actividad.estadoId) && (
                      <EstadoBadge estado={getEstado(actividad.estadoId)!} />
                    )}
                  </TableCell>

                  <TableCell align="center">
                    {horariosCount > 0 ? (
                      <Tooltip
                        title={
                          <Box>
                            {actividad.horarios_actividades?.filter(h => h.activo).slice(0, 5).map((h) => (
                              <Typography key={h.id} variant="caption" display="block">
                                {getDiaNombre(h.diaSemana)}: {formatTime(h.horaInicio)} - {formatTime(h.horaFin)}
                              </Typography>
                            ))}
                            {horariosCount > 5 && (
                              <Typography variant="caption" display="block">
                                +{horariosCount - 5} más...
                              </Typography>
                            )}
                          </Box>
                        }
                        arrow
                      >
                        <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                          <ScheduleIcon fontSize="small" color="action" />
                          <Typography variant="body2">{horariosCount}</Typography>
                        </Box>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>

                  <TableCell align="center">
                    {docentesCount > 0 ? (
                      <Tooltip
                        title={
                          <Box>
                            {actividad.docentes_actividades?.filter(d => d.activo).slice(0, 5).map((d) => (
                              <Typography key={d.id} variant="caption" display="block">
                                {d.personas?.apellido}, {d.personas?.nombre} ({d.rolesDocentes?.nombre})
                              </Typography>
                            ))}
                            {docentesCount > 5 && (
                              <Typography variant="caption" display="block">
                                +{docentesCount - 5} más...
                              </Typography>
                            )}
                          </Box>
                        }
                        arrow
                      >
                        <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                          <SchoolIcon fontSize="small" color="action" />
                          <Typography variant="body2">{docentesCount}</Typography>
                        </Box>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>

                  <TableCell align="center">
                    {actividad.capacidadMaxima ? (
                      <Tooltip
                        title={`${participantesActuales} inscripto(s), ${cupoDisponible} disponible(s)`}
                        arrow
                      >
                        <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                          <PeopleIcon fontSize="small" color={tieneCupo ? 'success' : 'error'} />
                          <Typography variant="body2" color={tieneCupo ? 'success.main' : 'error.main'}>
                            {participantesActuales}/{actividad.capacidadMaxima}
                          </Typography>
                        </Box>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Sin límite</Typography>
                    )}
                  </TableCell>

                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={500}>
                      ${Number(actividad.costo).toLocaleString('es-AR')}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Box display="flex" justifyContent="center" gap={0.5}>
                      {onView && (
                        <Tooltip title="Ver detalles">
                          <IconButton size="small" color="primary" onClick={() => onView(actividad)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      <Tooltip title="Más acciones">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, actividad)}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Menú contextual de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {onEdit && selectedActividad && (
          <MenuItem onClick={() => handleAction(() => onEdit(selectedActividad))}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
        )}

        {onDuplicate && selectedActividad && (
          <MenuItem onClick={() => handleAction(() => onDuplicate(selectedActividad))}>
            <ListItemIcon>
              <CopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Duplicar</ListItemText>
          </MenuItem>
        )}

        {onDelete && selectedActividad && (
          <MenuItem onClick={() => handleAction(() => onDelete(selectedActividad))}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText sx={{ color: 'error.main' }}>Eliminar</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default ActividadesTable;
