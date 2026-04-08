import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Collapse,
  IconButton,
  Tooltip,
  TablePagination,
  Stack,
  Divider,
  Checkbox,
  Button,
  ButtonGroup,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AttachMoney as AttachMoneyIcon,
  School as SchoolIcon,
  SelectAll as SelectAllIcon,
  Deselect as DeselectIcon,
  ViewList as ViewListIcon,
} from '@mui/icons-material';
import { ValidacionGeneracionResponse } from '@/types/cuota.types';
import { LOCALE, CURRENCY_FORMAT } from '@/constants/formats';

/**
 * Props del componente TablaDetalleSociosCuotas
 */
interface TablaDetalleSociosCuotasProps {
  /** Datos de validación con detalles de socios */
  validacion: ValidacionGeneracionResponse;
  /** Título de la tabla (opcional) */
  titulo?: string;
  /** Subtítulo de la tabla (opcional) */
  subtitulo?: string;
  /** Altura máxima de la tabla */
  maxHeight?: number;
  /** Mostrar paginación */
  conPaginacion?: boolean;
  /** Habilitar selección de filas */
  conSeleccion?: boolean;
  /** IDs de personas seleccionadas (controlado desde padre) */
  personasSeleccionadas?: number[];
  /** Callback cuando cambia la selección */
  onSeleccionChange?: (personasIds: number[]) => void;
}

/**
 * Componente de tabla detallada de socios con montos de cuotas
 *
 * Muestra:
 * - Nombre del socio
 * - Número de socio
 * - Categoría
 * - Monto Base (cuota mensual)
 * - Monto Actividades
 * - Monto Total
 * - Lista de actividades (expandible)
 *
 * @example
 * ```tsx
 * <TablaDetalleSociosCuotas
 *   validacion={validacionData}
 *   titulo="Detalle de Cuotas a Generar"
 *   maxHeight={500}
 *   conPaginacion={true}
 * />
 * ```
 */
export const TablaDetalleSociosCuotas: React.FC<TablaDetalleSociosCuotasProps> = ({
  validacion,
  titulo = 'Detalle de Cuotas a Generar',
  subtitulo = 'Revisa los montos de cada persona antes de generar',
  maxHeight = 400,
  conPaginacion = false,
  conSeleccion = false,
  personasSeleccionadas = [],
  onSeleccionChange,
}) => {
  // ============================================================================
  // STATE
  // ============================================================================
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [verTodos, setVerTodos] = useState(false);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  /**
   * Datos ordenados alfabéticamente por apellido
   */
  const datosOrdenados = useMemo(() => {
    // Helper para extraer apellido (última palabra del nombre)
    const extraerApellido = (nombreCompleto: string): string => {
      if (!nombreCompleto) return '';
      const palabras = nombreCompleto.trim().split(/\s+/);
      return palabras[palabras.length - 1] || nombreCompleto;
    };

    // Clonar array para no mutar el original
    const sociosOrdenados = [...validacion.detallesSocios];

    // Ordenar alfabéticamente por apellido (última palabra del nombre)
    sociosOrdenados.sort((a, b) => {
      const apellidoA = extraerApellido(a.nombre);
      const apellidoB = extraerApellido(b.nombre);
      return apellidoA.localeCompare(apellidoB, 'es', { sensitivity: 'base' });
    });

    return sociosOrdenados;
  }, [validacion.detallesSocios]);

  /**
   * Datos paginados o completos (ya ordenados)
   */
  const datosMostrados = useMemo(() => {
    if (!conPaginacion || verTodos) {
      return datosOrdenados;
    }
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return datosOrdenados.slice(startIndex, endIndex);
  }, [datosOrdenados, page, rowsPerPage, conPaginacion, verTodos]);

  /**
   * Totales calculados (solo personas seleccionadas si hay selección)
   */
  const totales = useMemo(() => {
    const sociosParaTotales = conSeleccion && personasSeleccionadas.length > 0
      ? validacion.detallesSocios.filter(s => personasSeleccionadas.includes(s.id))
      : validacion.detallesSocios;

    return {
      montoBase: sociosParaTotales.reduce((sum, s) => sum + s.montoBase, 0),
      montoActividades: sociosParaTotales.reduce((sum, s) => sum + s.montoActividades, 0),
      montoTotal: sociosParaTotales.reduce((sum, s) => sum + s.montoTotal, 0),
    };
  }, [validacion, conSeleccion, personasSeleccionadas]);

  /**
   * Estado de selección total
   */
  const todosSeleccionados = useMemo(() => {
    if (!conSeleccion || datosOrdenados.length === 0) {
      return false;
    }
    return datosOrdenados.every(s => personasSeleccionadas.includes(s.id));
  }, [conSeleccion, datosOrdenados, personasSeleccionadas]);

  /**
   * Estado de selección parcial
   */
  const seleccionParcial = useMemo(() => {
    if (!conSeleccion || personasSeleccionadas.length === 0) {
      return false;
    }
    return personasSeleccionadas.length > 0 && !todosSeleccionados;
  }, [conSeleccion, personasSeleccionadas, todosSeleccionados]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Toggle expansión de fila
   */
  const handleToggleRow = (socioId: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(socioId)) {
        newSet.delete(socioId);
      } else {
        newSet.add(socioId);
      }
      return newSet;
    });
  };

  /**
   * Toggle selección de una persona
   */
  const handleToggleSeleccion = (socioId: number) => {
    if (!onSeleccionChange) return;

    const nuevaSeleccion = personasSeleccionadas.includes(socioId)
      ? personasSeleccionadas.filter(id => id !== socioId)
      : [...personasSeleccionadas, socioId];

    onSeleccionChange(nuevaSeleccion);
  };

  /**
   * Seleccionar/Deseleccionar todos
   */
  const handleToggleTodos = () => {
    if (!onSeleccionChange) return;

    if (todosSeleccionados) {
      onSeleccionChange([]);
    } else {
      onSeleccionChange(datosOrdenados.map(s => s.id));
    }
  };

  /**
   * Seleccionar todos
   */
  const handleSeleccionarTodos = () => {
    if (!onSeleccionChange) return;
    onSeleccionChange(datosOrdenados.map(s => s.id));
  };

  /**
   * Deseleccionar todos
   */
  const handleDeseleccionarTodos = () => {
    if (!onSeleccionChange) return;
    onSeleccionChange([]);
  };

  /**
   * Cambiar página
   */
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  /**
   * Cambiar filas por página
   */
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setVerTodos(false); // Resetear "ver todos" al cambiar filas por página
  };

  /**
   * Toggle "Ver todos"
   */
  const handleToggleVerTodos = () => {
    setVerTodos(!verTodos);
    if (!verTodos) {
      setPage(0); // Resetear a primera página al activar "ver todos"
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Formatear moneda
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(LOCALE, CURRENCY_FORMAT).format(amount);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Paper elevation={1} sx={{ mb: 2 }}>
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: 'primary.lighter' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <AttachMoneyIcon color="primary" />
            <Box>
              <Typography variant="h6" color="primary.dark">
                {titulo}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {subtitulo} • Ordenado alfabéticamente
              </Typography>
            </Box>
          </Stack>

          {/* Controles de selección */}
          {conSeleccion && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" color="text.secondary">
                {personasSeleccionadas.length} de {datosOrdenados.length} seleccionado{personasSeleccionadas.length !== 1 ? 's' : ''}
              </Typography>
              <ButtonGroup size="small" variant="outlined">
                <Button
                  onClick={handleSeleccionarTodos}
                  disabled={todosSeleccionados}
                  startIcon={<SelectAllIcon fontSize="small" />}
                >
                  Todos
                </Button>
                <Button
                  onClick={handleDeseleccionarTodos}
                  disabled={personasSeleccionadas.length === 0}
                  startIcon={<DeselectIcon fontSize="small" />}
                >
                  Ninguno
                </Button>
              </ButtonGroup>
            </Stack>
          )}
        </Stack>
      </Box>

      {/* Tabla */}
      <TableContainer sx={{ maxHeight: (conPaginacion && !verTodos) ? undefined : maxHeight }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {conSeleccion && (
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={todosSeleccionados}
                    indeterminate={seleccionParcial}
                    onChange={handleToggleTodos}
                    inputProps={{ 'aria-label': 'Seleccionar todos' }}
                  />
                </TableCell>
              )}
              <TableCell width={50}>#</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell align="center">N° Socio</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell align="right">Base</TableCell>
              <TableCell align="right">Actividades</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell width={50} />
            </TableRow>
          </TableHead>
          <TableBody>
            {datosMostrados.map((socio, index) => {
              const isExpanded = expandedRows.has(socio.id);
              const tieneActividades = socio.actividades && socio.actividades.length > 0;
              const indexGlobal = (conPaginacion && !verTodos) ? page * rowsPerPage + index + 1 : index + 1;
              const isSelected = conSeleccion && personasSeleccionadas.includes(socio.id);

              return (
                <React.Fragment key={socio.id}>
                  {/* Fila principal */}
                  <TableRow
                    hover
                    selected={isSelected}
                    sx={{
                      bgcolor: isSelected ? 'action.selected' : 'inherit'
                    }}
                  >
                    {conSeleccion && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleToggleSeleccion(socio.id)}
                          onClick={(e) => e.stopPropagation()}
                          inputProps={{ 'aria-label': `Seleccionar ${socio.nombre}` }}
                        />
                      </TableCell>
                    )}
                    <TableCell>{indexGlobal}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {socio.nombre}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={socio.numeroSocio || 'S/N'}
                        size="small"
                        variant="outlined"
                        color="default"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={socio.categoria?.nombre || 'Sin categoría'}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(socio.montoBase)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        color={socio.montoActividades > 0 ? 'success.main' : 'text.secondary'}
                      >
                        {formatCurrency(socio.montoActividades)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} color="primary.main">
                        {formatCurrency(socio.montoTotal)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {tieneActividades && (
                        <Tooltip title={isExpanded ? 'Ocultar actividades' : 'Ver actividades'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleRow(socio.id)}
                            aria-label="expandir fila"
                          >
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>

                  {/* Fila expandible (actividades) */}
                  {tieneActividades && (
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={conSeleccion ? 9 : 8}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ py: 2, pl: 6, pr: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <SchoolIcon fontSize="small" color="action" />
                              Actividades Inscritas
                            </Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Actividad</TableCell>
                                  <TableCell align="right">Precio</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {socio.actividades.map((actividad) => (
                                  <TableRow key={actividad.id}>
                                    <TableCell>
                                      <Typography variant="body2">
                                        {actividad.nombre}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography variant="body2" color="success.main">
                                        {formatCurrency(actividad.precio)}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                ))}
                                <TableRow>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight={600}>
                                      Subtotal Actividades
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" fontWeight={600} color="success.main">
                                      {formatCurrency(socio.montoActividades)}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}

            {/* Fila de totales */}
            <TableRow sx={{ bgcolor: 'grey.100', fontWeight: 'bold' }}>
              <TableCell colSpan={conSeleccion ? 5 : 4} align="right">
                <Typography variant="subtitle1" fontWeight={700}>
                  TOTALES
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2" fontWeight={700}>
                  {formatCurrency(totales.montoBase)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2" fontWeight={700} color="success.main">
                  {formatCurrency(totales.montoActividades)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  {formatCurrency(totales.montoTotal)}
                </Typography>
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación y Ver Todos */}
      {conPaginacion && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1, borderTop: 1, borderColor: 'divider' }}>
          <Button
            variant={verTodos ? 'contained' : 'outlined'}
            size="small"
            onClick={handleToggleVerTodos}
            startIcon={<ViewListIcon />}
            color="secondary"
          >
            {verTodos ? `Mostrando todas (${datosOrdenados.length})` : 'Ver Todas'}
          </Button>

          {!verTodos && (
            <TablePagination
              component="div"
              count={datosOrdenados.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}–${to} de ${count} persona${count !== 1 ? 's' : ''}`
              }
            />
          )}
        </Box>
      )}

      {/* Footer informativo */}
      <Box sx={{ p: 2, bgcolor: 'info.lighter', borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="info.dark">
          {conSeleccion && personasSeleccionadas.length > 0 && (
            <>
              <strong>Totales calculados solo para {personasSeleccionadas.length} persona{personasSeleccionadas.length !== 1 ? 's' : ''} seleccionada{personasSeleccionadas.length !== 1 ? 's' : ''}.</strong>
              {' '}
            </>
          )}
          Los montos mostrados son estimaciones basadas en las categorías y actividades actuales de cada socio.
          Los descuentos manuales pueden aplicarse posteriormente desde la vista de detalle de cada cuota.
        </Typography>
      </Box>
    </Paper>
  );
};
