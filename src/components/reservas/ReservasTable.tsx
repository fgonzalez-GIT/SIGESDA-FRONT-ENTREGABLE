import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  TablePagination,
  TextField,
  Autocomplete,
  FormControlLabel,
  Checkbox,
  Button,
  Collapse,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import type { Reserva } from '@/types/reserva.types';
import type { Aula } from '@/types/aula.types';
import type { Persona } from '@/types/persona.types';
import type { EstadoReserva } from '@/types/reserva.types';
import {
  formatDateTimeES,
  formatTimeES,
  calculateDuration,
  formatDuration,
  isCurrentlyActive,
} from '@/utils/dateHelpers';
import {
  getEstadoReservaColor,
  canEditReserva,
  canDeleteReserva,
} from '@/utils/reservaValidations';

interface ReservasTableProps {
  reservas: Reserva[];
  aulas?: Aula[];
  docentes?: Persona[];
  estadosReservas?: EstadoReserva[];
  onEdit?: (reserva: Reserva) => void;
  onDelete?: (reserva: Reserva) => void;
  loading?: boolean;
}

interface Filters {
  estadoIds: number[];
  aulaId: number | null;
  docenteId: number | null;
  fechaDesde: string;
  fechaHasta: string;
  soloActivas: boolean;
}

/**
 * Tabla de reservas con filtros avanzados
 *
 * Features:
 * - Filtros por estado, aula, docente, rango de fechas
 * - Paginación
 * - Acciones condicionales (editar/eliminar según estado)
 * - Color coding por estado
 * - Indicador de reserva activa en este momento
 */
const ReservasTable: React.FC<ReservasTableProps> = ({
  reservas,
  aulas = [],
  docentes = [],
  estadosReservas = [],
  onEdit,
  onDelete,
  loading = false,
}) => {
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    estadoIds: [],
    aulaId: null,
    docenteId: null,
    fechaDesde: '',
    fechaHasta: '',
    soloActivas: false,
  });

  // Aplicar filtros
  const filteredReservas = reservas.filter((reserva) => {
    // Filtro por estados
    if (filters.estadoIds.length > 0 && !filters.estadoIds.includes(reserva.estadoReservaId)) {
      return false;
    }

    // Filtro por aula
    if (filters.aulaId && reserva.aulaId !== filters.aulaId) {
      return false;
    }

    // Filtro por docente
    if (filters.docenteId && reserva.docenteId !== filters.docenteId) {
      return false;
    }

    // Filtro por fecha desde
    if (filters.fechaDesde && new Date(reserva.fechaInicio) < new Date(filters.fechaDesde)) {
      return false;
    }

    // Filtro por fecha hasta
    if (filters.fechaHasta && new Date(reserva.fechaInicio) > new Date(filters.fechaHasta)) {
      return false;
    }

    // Filtro solo activas
    if (filters.soloActivas && !reserva.activa) {
      return false;
    }

    return true;
  });

  // Ordenar por fecha (más reciente primero)
  const sortedReservas = [...filteredReservas].sort(
    (a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
  );

  // Paginación
  const paginatedReservas = sortedReservas.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({
      estadoIds: [],
      aulaId: null,
      docenteId: null,
      fechaDesde: '',
      fechaHasta: '',
      soloActivas: false,
    });
    setPage(0);
  };

  const handleViewDetail = (reserva: Reserva) => {
    navigate(`/reservas/${reserva.id}`);
  };

  const handleEdit = (reserva: Reserva) => {
    const validation = canEditReserva(reserva);
    if (!validation.valid) {
      alert(validation.errors.join('\n'));
      return;
    }
    onEdit?.(reserva);
  };

  const handleDelete = (reserva: Reserva) => {
    const validation = canDeleteReserva(reserva);
    if (!validation.valid) {
      alert(validation.errors.join('\n'));
      return;
    }

    if (window.confirm('¿Está seguro de eliminar esta reserva?')) {
      onDelete?.(reserva);
    }
  };

  return (
    <Paper>
      {/* Filtros */}
      <Box p={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Button
            startIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setShowFilters(!showFilters)}
            variant="outlined"
            size="small"
          >
            {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
          </Button>

          {(filters.estadoIds.length > 0 ||
            filters.aulaId ||
            filters.docenteId ||
            filters.fechaDesde ||
            filters.fechaHasta ||
            filters.soloActivas) && (
            <Button onClick={handleClearFilters} size="small" variant="text">
              Limpiar Filtros
            </Button>
          )}
        </Box>

        <Collapse in={showFilters}>
          <Grid container spacing={2}>
            {/* Estados */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                multiple
                options={estadosReservas}
                getOptionLabel={(option) => option.nombre}
                value={estadosReservas.filter((e) => filters.estadoIds.includes(e.id))}
                onChange={(_, newValue) =>
                  setFilters({ ...filters, estadoIds: newValue.map((e) => e.id) })
                }
                renderInput={(params) => <TextField {...params} label="Estados" size="small" />}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </Grid>

            {/* Aula */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={aulas}
                getOptionLabel={(option) => option.nombre}
                value={aulas.find((a) => a.id === filters.aulaId) || null}
                onChange={(_, newValue) => setFilters({ ...filters, aulaId: newValue?.id || null })}
                renderInput={(params) => <TextField {...params} label="Aula" size="small" />}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </Grid>

            {/* Docente */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={docentes}
                getOptionLabel={(option) => `${option.nombre} ${option.apellido}`}
                value={docentes.find((d) => d.id === filters.docenteId) || null}
                onChange={(_, newValue) =>
                  setFilters({ ...filters, docenteId: newValue?.id || null })
                }
                renderInput={(params) => <TextField {...params} label="Docente" size="small" />}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </Grid>

            {/* Fecha desde */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                type="date"
                label="Desde"
                size="small"
                fullWidth
                value={filters.fechaDesde}
                onChange={(e) => setFilters({ ...filters, fechaDesde: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Fecha hasta */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                type="date"
                label="Hasta"
                size="small"
                fullWidth
                value={filters.fechaHasta}
                onChange={(e) => setFilters({ ...filters, fechaHasta: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Solo activas */}
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.soloActivas}
                    onChange={(e) => setFilters({ ...filters, soloActivas: e.target.checked })}
                  />
                }
                label="Solo mostrar reservas activas"
              />
            </Grid>
          </Grid>
        </Collapse>
      </Box>

      {/* Tabla */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Aula</TableCell>
              <TableCell>Docente</TableCell>
              <TableCell>Actividad</TableCell>
              <TableCell>Fecha/Hora</TableCell>
              <TableCell>Duración</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : paginatedReservas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No se encontraron reservas
                </TableCell>
              </TableRow>
            ) : (
              paginatedReservas.map((reserva) => {
                const isActive = isCurrentlyActive(reserva.fechaInicio, reserva.fechaFin);
                const canEdit = canEditReserva(reserva).valid;
                const canDelete = canDeleteReserva(reserva).valid;
                const duracion = calculateDuration(reserva.fechaInicio, reserva.fechaFin);

                return (
                  <TableRow
                    key={reserva.id}
                    hover
                    sx={{
                      backgroundColor: isActive ? 'rgba(76, 175, 80, 0.08)' : 'inherit',
                      borderLeft: isActive ? '4px solid #4caf50' : 'none',
                    }}
                  >
                    <TableCell>{reserva.id}</TableCell>
                    <TableCell>{reserva.aula?.nombre || `Aula #${reserva.aulaId}`}</TableCell>
                    <TableCell>
                      {reserva.personas
                        ? `${reserva.personas.nombre} ${reserva.personas.apellido}`
                        : `Docente #${reserva.docenteId}`}
                    </TableCell>
                    <TableCell>
                      {reserva.actividades?.nombre || (reserva.actividadId ? `#${reserva.actividadId}` : '-')}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <div>{formatDateTimeES(reserva.fechaInicio)}</div>
                        <div style={{ fontSize: '0.85em', color: 'gray' }}>
                          hasta {formatTimeES(reserva.fechaFin)}
                        </div>
                      </Box>
                    </TableCell>
                    <TableCell>{formatDuration(duracion)}</TableCell>
                    <TableCell>
                      <Chip
                        label={reserva.estadoReserva?.nombre || 'Desconocido'}
                        color={getEstadoReservaColor(reserva.estadoReserva?.codigo || '')}
                        size="small"
                      />
                      {isActive && (
                        <Chip
                          label="EN CURSO"
                          color="success"
                          size="small"
                          sx={{ ml: 0.5 }}
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={0.5} justifyContent="center">
                        <Tooltip title="Ver detalle">
                          <IconButton size="small" onClick={() => handleViewDetail(reserva)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {canEdit && onEdit && (
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => handleEdit(reserva)} color="primary">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {canDelete && onDelete && (
                          <Tooltip title="Eliminar">
                            <IconButton size="small" onClick={() => handleDelete(reserva)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación */}
      <TablePagination
        component="div"
        count={sortedReservas.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />
    </Paper>
  );
};

export default ReservasTable;
