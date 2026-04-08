import React, { useState } from 'react';
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  AlertTitle,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { SelectorPersonasCuotas } from './SelectorPersonasCuotas';
import { TablaDetalleSociosCuotas } from './TablaDetalleSociosCuotas';
import { ConfiguracionCompartida, GenerarCuotasBatchResponse } from '../GeneracionCuotasModal';
import { ValidacionGeneracionResponse } from '@/types/cuota.types';
import cuotasService from '@/services/cuotasService';
import { LOCALE, CURRENCY_FORMAT } from '@/constants/formats';

/**
 * Props del TabPorPersonas
 */
interface TabPorPersonasProps {
  /** Paso actual del wizard (0-2) */
  pasoActual: number;
  /** Configuración compartida */
  configuracion: ConfiguracionCompartida;
  /** Callback para actualizar configuración */
  onConfiguracionChange: (config: Partial<ConfiguracionCompartida>) => void;
  /** Callback para avanzar paso */
  onNextStep: () => void;
  /** Callback para retroceder paso */
  onBackStep: () => void;
  /** Callback cuando la generación es exitosa */
  onGeneracionExitosa: (resultado: GenerarCuotasBatchResponse) => void;
  /** Callback para cerrar modal */
  onClose: () => void;
}

/**
 * Nombres de meses en español
 */
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Tab "Por Personas" - Generación selectiva de cuotas
 *
 * Flujo de 3 pasos:
 * 1. Configuración: Mes, año y observaciones
 * 2. Selección: Buscar y seleccionar personas
 * 3. Resultado: Mostrar cuotas generadas
 */
export const TabPorPersonas: React.FC<TabPorPersonasProps> = ({
  pasoActual,
  configuracion,
  onConfiguracionChange,
  onNextStep,
  onBackStep,
  onGeneracionExitosa,
  onClose,
}) => {
  // ============================================================================
  // STATE
  // ============================================================================
  const [personasSeleccionadas, setPersonasSeleccionadas] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingValidacion, setLoadingValidacion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<GenerarCuotasBatchResponse | null>(null);
  const [validacion, setValidacion] = useState<ValidacionGeneracionResponse | null>(null);
  const [mostrarValidacion, setMostrarValidacion] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Validar y avanzar desde paso 1
   */
  const handleNextFromPaso1 = () => {
    // Validaciones
    if (configuracion.mes < 1 || configuracion.mes > 12) {
      setError('Mes inválido');
      return;
    }
    if (configuracion.anio < 2020 || configuracion.anio > 2100) {
      setError('Año inválido');
      return;
    }

    setError(null);
    onNextStep();
  };

  /**
   * Validar cuotas antes de generar
   */
  const handleValidarCuotas = async () => {
    // Validar que hay personas seleccionadas
    if (personasSeleccionadas.length === 0) {
      setError('Debe seleccionar al menos una persona');
      return;
    }

    setLoadingValidacion(true);
    setError(null);

    try {
      // Llamar al endpoint de validación sin filtro de categorías
      // (el backend filtrará por las personas seleccionadas después)
      const resultado = await cuotasService.validarGeneracion(
        configuracion.mes,
        configuracion.anio,
        undefined // sin filtro de categorías
      );

      // Filtrar solo los socios seleccionados
      const sociosFiltrados = resultado.detallesSocios.filter((socio) =>
        personasSeleccionadas.includes(socio.id)
      );

      // Calcular totales de las personas seleccionadas
      const totalesFiltrados = {
        montoBase: sociosFiltrados.reduce((sum, s) => sum + s.montoBase, 0),
        montoActividades: sociosFiltrados.reduce((sum, s) => sum + s.montoActividades, 0),
        montoTotal: sociosFiltrados.reduce((sum, s) => sum + s.montoTotal, 0),
      };

      // Crear validación filtrada
      const validacionFiltrada: ValidacionGeneracionResponse = {
        ...resultado,
        detallesSocios: sociosFiltrados,
        sociosPendientes: sociosFiltrados.length,
        totales: totalesFiltrados,
      };

      setValidacion(validacionFiltrada);
      setMostrarValidacion(true);
      setError(null);
    } catch (err: any) {
      console.error('Error validando cuotas:', err);
      setError(err.response?.data?.message || 'Error al validar cuotas');
      setValidacion(null);
    } finally {
      setLoadingValidacion(false);
    }
  };

  /**
   * Generar cuotas (después de validación)
   */
  const handleGenerarCuotas = async () => {
    if (!validacion) {
      setError('Debe validar primero');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request = {
        mes: configuracion.mes,
        anio: configuracion.anio,
        personaIds: personasSeleccionadas,
        observaciones: configuracion.observaciones || undefined,
      };

      const resultado = await cuotasService.generarCuotasBatch(request);

      // Guardar resultado con referencia a validación para cálculos de montos
      setResultado({
        ...resultado,
        _validacionPrevia: validacion, // Guardar validación para calcular montos
        _personasGeneradas: personasSeleccionadas, // IDs de personas que se generaron
      } as any);

      onGeneracionExitosa(resultado);
      setError(null);
    } catch (err: any) {
      console.error('Error generando cuotas:', err);
      setError(err.response?.data?.message || 'Error al generar cuotas');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Volver a selección (cancelar validación)
   */
  const handleVolverASeleccion = () => {
    setMostrarValidacion(false);
    setValidacion(null);
    setError(null);
  };

  /**
   * Formatear moneda
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(LOCALE, CURRENCY_FORMAT).format(amount);
  };

  /**
   * Obtener nombre del mes
   */
  const getNombreMes = (mes: number): string => {
    return MESES[mes - 1] || '';
  };

  // ============================================================================
  // RENDER PASOS
  // ============================================================================

  /**
   * PASO 1: Configuración
   */
  const renderPaso1 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Configuración de Generación
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Selecciona el período para el cual deseas generar cuotas
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel>Mes</InputLabel>
            <Select
              value={configuracion.mes}
              onChange={(e) => onConfiguracionChange({ mes: Number(e.target.value) })}
              label="Mes"
            >
              {MESES.map((mes, index) => (
                <MenuItem key={index + 1} value={index + 1}>
                  {mes}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="Año"
            value={configuracion.anio}
            onChange={(e) => onConfiguracionChange({ anio: Number(e.target.value) })}
            inputProps={{ min: 2020, max: 2100 }}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Observaciones (Opcional)"
            value={configuracion.observaciones}
            onChange={(e) => onConfiguracionChange({ observaciones: e.target.value })}
            placeholder="Ej: Generación manual por alta tardía"
            inputProps={{ maxLength: 500 }}
            helperText={`${configuracion.observaciones.length}/500 caracteres`}
          />
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
        <Button onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleNextFromPaso1}
        >
          Siguiente
        </Button>
      </Box>
    </Box>
  );

  /**
   * PASO 2: Selección de Personas
   */
  const renderPaso2 = () => (
    <Box>
      {!mostrarValidacion ? (
        <>
          {/* Fase 1: Selección de Personas */}
          <Typography variant="h6" gutterBottom>
            Buscar y Seleccionar Personas
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Busca y selecciona las personas para las cuales deseas generar cuotas
          </Typography>

          <SelectorPersonasCuotas
            onPersonasChange={setPersonasSeleccionadas}
            personasSeleccionadas={personasSeleccionadas}
            soloSocios={true}
            disabled={loadingValidacion}
          />

          <Divider sx={{ my: 3 }} />

          {/* Resumen */}
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" gutterBottom>
              Resumen
            </Typography>
            <List dense>
              <ListItem disablePadding>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <InfoIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={`Personas seleccionadas: ${personasSeleccionadas.length}`}
                />
              </ListItem>
              <ListItem disablePadding>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <InfoIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={`Período: ${getNombreMes(configuracion.mes)} ${configuracion.anio}`}
                />
              </ListItem>
            </List>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button onClick={onBackStep} disabled={loadingValidacion}>
              Atrás
            </Button>
            <Button
              variant="contained"
              onClick={handleValidarCuotas}
              disabled={personasSeleccionadas.length === 0 || loadingValidacion}
              startIcon={loadingValidacion ? <CircularProgress size={20} /> : null}
            >
              {loadingValidacion ? 'Validando...' : 'Validar y Continuar'}
            </Button>
          </Box>
        </>
      ) : (
        <>
          {/* Fase 2: Validación y Confirmación */}
          <Typography variant="h6" gutterBottom>
            Confirmación de Generación
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Revisa los montos de cada cuota antes de generar
          </Typography>

          {loadingValidacion ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : validacion ? (
            <>
              {/* Tabla de Detalles con Montos y Selección */}
              <TablaDetalleSociosCuotas
                validacion={validacion}
                titulo={`Detalle de ${validacion.detallesSocios.length} Cuota${validacion.detallesSocios.length !== 1 ? 's' : ''} Disponible${validacion.detallesSocios.length !== 1 ? 's' : ''}`}
                subtitulo="Puedes deseleccionar personas antes de generar las cuotas"
                maxHeight={500}
                conPaginacion={validacion.detallesSocios.length > 10}
                conSeleccion={true}
                personasSeleccionadas={personasSeleccionadas}
                onSeleccionChange={setPersonasSeleccionadas}
              />

              <Divider sx={{ my: 3 }} />

              {/* Confirmación */}
              <Paper variant="outlined" sx={{ p: 3, bgcolor: 'warning.lighter' }}>
                <Typography variant="h6" color="warning.dark" gutterBottom>
                  Confirmación
                </Typography>
                <Typography variant="body2" paragraph>
                  Se generarán cuotas para{' '}
                  <strong>{personasSeleccionadas.length} persona{personasSeleccionadas.length !== 1 ? 's' : ''} seleccionada{personasSeleccionadas.length !== 1 ? 's' : ''}</strong>
                  {' '}para el período{' '}
                  <strong>
                    {getNombreMes(configuracion.mes)} {configuracion.anio}
                  </strong>
                  .
                </Typography>
                {personasSeleccionadas.length > 0 && validacion.detallesSocios && (() => {
                  // Calcular totales solo de personas seleccionadas
                  const sociosSeleccionados = validacion.detallesSocios.filter(s => personasSeleccionadas.includes(s.id));
                  const montoTotalSeleccionados = sociosSeleccionados.reduce((sum, s) => sum + s.montoTotal, 0);

                  return (
                    <Typography variant="body2">
                      Monto total estimado:{' '}
                      <strong>
                        {formatCurrency(montoTotalSeleccionados)}
                      </strong>
                    </Typography>
                  );
                })()}
                <Typography variant="body2" sx={{ mt: 2 }}>
                  ¿Desea continuar?
                </Typography>
                {personasSeleccionadas.length === 0 && (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    ⚠️ Debe seleccionar al menos una persona para continuar
                  </Typography>
                )}
              </Paper>
            </>
          ) : (
            <Alert severity="error">
              {error || 'No se pudo cargar la validación'}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button onClick={handleVolverASeleccion} disabled={loading}>
              Volver a Selección
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerarCuotas}
              disabled={!validacion || loading || personasSeleccionadas.length === 0}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Generando...' : `Generar ${personasSeleccionadas.length} Cuota${personasSeleccionadas.length !== 1 ? 's' : ''}`}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );

  /**
   * PASO 3: Resultado
   */
  const renderPaso3 = () => {
    if (!resultado) {
      return (
        <Alert severity="info">
          No hay resultados disponibles
        </Alert>
      );
    }

    const tieneErrores = resultado.errores && resultado.errores.length > 0;

    return (
      <Box>
        {/* Alerta de éxito/advertencia */}
        {!tieneErrores ? (
          <Alert
            severity="success"
            icon={<CheckCircleIcon />}
            sx={{ mb: 3 }}
          >
            <AlertTitle>Cuotas Generadas Exitosamente</AlertTitle>
            Se generaron {resultado.cuotasGeneradas} cuota(s) correctamente
          </Alert>
        ) : (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <AlertTitle>Cuotas Generadas con Advertencias</AlertTitle>
            Se generaron {resultado.cuotasGeneradas} cuota(s), pero hubo {resultado.errores.length} error(es)
          </Alert>
        )}

        {/* Resumen */}
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Resumen
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Total generadas
              </Typography>
              <Typography variant="h4" color="primary.main">
                {resultado.cuotasGeneradas}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Errores
              </Typography>
              <Typography variant="h4" color={tieneErrores ? 'error.main' : 'text.secondary'}>
                {resultado.errores?.length || 0}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Tiempo
              </Typography>
              <Typography variant="h4">
                {resultado.performance?.tiempoSegundos || 'N/A'}s
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Monto Total
              </Typography>
              <Typography variant="h6" color="success.main">
                {(() => {
                  // Calcular desde validación previa + personas generadas
                  const validacionPrevia = (resultado as any)._validacionPrevia;
                  const personasGeneradas = (resultado as any)._personasGeneradas;

                  if (validacionPrevia?.detallesSocios && personasGeneradas) {
                    const sociosGenerados = validacionPrevia.detallesSocios.filter(
                      (s: any) => personasGeneradas.includes(s.id)
                    );
                    const montoTotal = sociosGenerados.reduce((sum: number, s: any) => sum + s.montoTotal, 0);
                    return formatCurrency(montoTotal);
                  }

                  // Fallback: intentar desde resultado.cuotas si existen
                  if (resultado.cuotas && resultado.cuotas.length > 0) {
                    const montoTotal = resultado.cuotas.reduce((sum, c) => sum + (Number(c.montoTotal) || 0), 0);
                    return formatCurrency(montoTotal);
                  }

                  return 'N/A';
                })()}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabla de Cuotas Generadas */}
        {resultado.cuotas && resultado.cuotas.length > 0 && (
          <Paper elevation={1} sx={{ mb: 3 }}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Detalle de Cuotas Generadas
              </Typography>
            </Box>
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Persona</TableCell>
                    <TableCell>Recibo</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resultado.cuotas.map((cuota, index) => (
                    <TableRow key={cuota.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {cuota.persona?.apellido}, {cuota.persona?.nombre}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`#${cuota.recibo?.numeroRecibo || 'N/A'}`}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={500}>
                          {formatCurrency(cuota.montoTotal || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={cuota.estado || 'PENDIENTE'}
                          size="small"
                          color={cuota.estado === 'PAGADA' ? 'success' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Errores */}
        {tieneErrores && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>Errores Detectados</AlertTitle>
            <List dense>
              {resultado.errores.map((error, idx) => (
                <ListItem key={idx} disablePadding>
                  <ListItemText primary={error} />
                </ListItem>
              ))}
            </List>
          </Alert>
        )}

        {/* Recordatorio de descuentos */}
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
          <AlertTitle>Aplicación de Descuentos</AlertTitle>
          Los descuentos deben aplicarse manualmente desde la vista de detalle de cada cuota.
        </Alert>

        {/* Botones */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={onClose}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            startIcon={<LinkIcon />}
            onClick={() => {
              // TODO: Navegar a página de cuotas con filtro
              onClose();
            }}
          >
            Ver Cuotas
          </Button>
        </Box>
      </Box>
    );
  };

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================

  switch (pasoActual) {
    case 0:
      return renderPaso1();
    case 1:
      return renderPaso2();
    case 2:
      return renderPaso3();
    default:
      return null;
  }
};
