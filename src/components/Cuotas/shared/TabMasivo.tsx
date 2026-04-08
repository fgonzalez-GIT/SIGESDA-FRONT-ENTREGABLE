import React, { useState, useEffect } from 'react';
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
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Autocomplete,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { ResumenValidacionCuotas } from './ResumenValidacionCuotas';
import { TablaDetalleSociosCuotas } from './TablaDetalleSociosCuotas';
import { ConfiguracionCompartida, GenerarCuotasBatchResponse } from '../GeneracionCuotasModal';
import { ValidacionGeneracionResponse } from '@/types/cuota.types';
import { CategoriaSocio } from '@/types/persona.types';
import cuotasService from '@/services/cuotasService';
import { useCatalogosPersonas } from '@/hooks/usePersonas';
import { LOCALE, CURRENCY_FORMAT } from '@/constants/formats';

/**
 * Props del TabMasivo
 */
interface TabMasivoProps {
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
 * Tab "Masivo" - Generación masiva de cuotas
 *
 * Flujo de 3 pasos:
 * 1. Configuración: Mes, año, categorías (opcional) y observaciones
 * 2. Validación y Preview: Mostrar resumen antes de generar
 * 3. Resultado: Mostrar cuotas generadas
 */
export const TabMasivo: React.FC<TabMasivoProps> = ({
  pasoActual,
  configuracion,
  onConfiguracionChange,
  onNextStep,
  onBackStep,
  onGeneracionExitosa,
  onClose,
}) => {
  // ============================================================================
  // HOOKS
  // ============================================================================
  const { catalogos } = useCatalogosPersonas();
  const categoriasSocio = catalogos?.categoriasSocio || [];

  // ============================================================================
  // STATE
  // ============================================================================
  const [categoriasFiltro, setCategoriasFiltro] = useState<CategoriaSocio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validacion, setValidacion] = useState<ValidacionGeneracionResponse | null>(null);
  const [resultado, setResultado] = useState<GenerarCuotasBatchResponse | null>(null);
  const [personasSeleccionadas, setPersonasSeleccionadas] = useState<number[]>([]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Cargar validación al entrar en paso 2
   */
  useEffect(() => {
    if (pasoActual === 1 && !validacion) {
      cargarValidacion();
    }
  }, [pasoActual]);

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
   * Cargar validación de generación
   */
  const cargarValidacion = async () => {
    setLoading(true);
    setError(null);

    try {
      const categoriaIds = categoriasFiltro.map((c) => c.id);
      const resultado = await cuotasService.validarGeneracion(
        configuracion.mes,
        configuracion.anio,
        categoriaIds.length > 0 ? categoriaIds : undefined
      );

      setValidacion(resultado);

      // Inicializar selección con TODOS los socios por defecto
      if (resultado.detallesSocios && resultado.detallesSocios.length > 0) {
        setPersonasSeleccionadas(resultado.detallesSocios.map(s => s.id));
      }

      // Si hay filtro de categorías, se generará solo para esos IDs
      if (!resultado.puedeGenerar) {
        setError('No se puede generar. Revisa las advertencias.');
      }
    } catch (err: any) {
      console.error('Error validando generación:', err);
      setError(err.response?.data?.message || 'Error al validar generación');
      setValidacion(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generar cuotas masivas (solo personas seleccionadas)
   */
  const handleGenerarCuotas = async () => {
    if (!validacion) {
      setError('Debe validar primero');
      return;
    }

    // Validar que haya al menos una persona seleccionada
    if (personasSeleccionadas.length === 0) {
      setError('Debe seleccionar al menos una persona para generar cuotas');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Usar las personas seleccionadas para la generación
      const request = {
        mes: configuracion.mes,
        anio: configuracion.anio,
        personaIds: personasSeleccionadas, // Solo generar para personas seleccionadas
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
        Configuración de Generación Masiva
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configura el período y opcionalmente filtra por categorías de socios
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
          <Autocomplete
            multiple
            options={categoriasSocio}
            getOptionLabel={(option) => option.nombre}
            value={categoriasFiltro}
            onChange={(_, newValue) => setCategoriasFiltro(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Categorías (Opcional)"
                placeholder={categoriasFiltro.length === 0 ? "Vacío = todas las categorías" : ""}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  key={option.id}
                  label={option.nombre}
                  {...getTagProps({ index })}
                />
              ))
            }
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Deja vacío para generar cuotas a TODOS los socios activos
          </Typography>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Observaciones (Opcional)"
            value={configuracion.observaciones}
            onChange={(e) => onConfiguracionChange({ observaciones: e.target.value })}
            placeholder="Ej: Generación mensual automática"
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
   * PASO 2: Validación y Preview
   */
  const renderPaso2 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Validación de Generación Masiva
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Revisa el resumen antes de generar las cuotas
      </Typography>

      {loading ? (
        <Box>
          <Skeleton variant="text" width="60%" height={40} />
          <Skeleton variant="rectangular" height={120} sx={{ mt: 2 }} />
          <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
        </Box>
      ) : validacion ? (
        <>
          <ResumenValidacionCuotas
            validacion={validacion}
            mes={configuracion.mes}
            anio={configuracion.anio}
          />

          <Divider sx={{ my: 3 }} />

          {/* Tabla de Detalles por Persona con Selección */}
          {validacion.detallesSocios && validacion.detallesSocios.length > 0 && (
            <>
              <TablaDetalleSociosCuotas
                validacion={validacion}
                titulo={`Detalle de ${validacion.sociosPendientes} Cuota${validacion.sociosPendientes !== 1 ? 's' : ''} Disponible${validacion.sociosPendientes !== 1 ? 's' : ''}`}
                subtitulo="Selecciona las personas para las cuales deseas generar cuotas"
                maxHeight={500}
                conPaginacion={validacion.detallesSocios.length > 10}
                conSeleccion={true}
                personasSeleccionadas={personasSeleccionadas}
                onSeleccionChange={setPersonasSeleccionadas}
              />
              <Divider sx={{ my: 3 }} />
            </>
          )}

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
            {personasSeleccionadas.length > 0 && (() => {
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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBackStep} disabled={loading}>
          Atrás
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={handleGenerarCuotas}
          disabled={!validacion || !validacion.puedeGenerar || loading || personasSeleccionadas.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Generando...' : `Generar ${personasSeleccionadas.length} Cuota${personasSeleccionadas.length !== 1 ? 's' : ''}`}
        </Button>
      </Box>
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
            Se generaron {resultado.cuotasGeneradas} cuota(s) correctamente en{' '}
            {resultado.performance?.tiempoSegundos || 'N/A'} segundos
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
            Resumen de Generación Masiva
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

        {/* Errores */}
        {tieneErrores && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>Errores Detectados</AlertTitle>
            <List dense>
              {resultado.errores.slice(0, 10).map((error, idx) => (
                <ListItem key={idx} disablePadding>
                  <ListItemText primary={error} />
                </ListItem>
              ))}
              {resultado.errores.length > 10 && (
                <ListItem disablePadding>
                  <ListItemText
                    primary={`... y ${resultado.errores.length - 10} errores más`}
                  />
                </ListItem>
              )}
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
