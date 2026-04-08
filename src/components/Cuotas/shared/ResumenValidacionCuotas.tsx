import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Alert,
  AlertTitle,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { ValidacionGeneracionResponse } from '@/types/cuota.types';
import { LOCALE, CURRENCY_FORMAT } from '@/constants/formats';

/**
 * Props del componente ResumenValidacionCuotas
 */
interface ResumenValidacionCuotasProps {
  /** Datos de validación de generación */
  validacion: ValidacionGeneracionResponse;
  /** Mes para el cual se van a generar las cuotas (1-12) */
  mes: number;
  /** Año para el cual se van a generar las cuotas */
  anio: number;
}

/**
 * Nombres de meses en español
 */
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Componente de resumen y validación para generación de cuotas
 *
 * Muestra:
 * - Chips de distribución por categoría
 * - Alertas de duplicados existentes
 * - Tabla resumen de totales (Base + Actividades + Total)
 * - Lista de advertencias/warnings
 *
 * @example
 * ```tsx
 * <ResumenValidacionCuotas
 *   validacion={validacionData}
 *   mes={3}
 *   anio={2026}
 * />
 * ```
 */
export const ResumenValidacionCuotas: React.FC<ResumenValidacionCuotasProps> = ({
  validacion,
  mes,
  anio,
}) => {
  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  /**
   * Distribución por categoría
   */
  const distribucionCategorias = useMemo(() => {
    const conteo = new Map<string, { nombre: string; count: number; color: string }>();

    validacion.detallesSocios.forEach((socio) => {
      const categoria = socio.categoria;
      const key = categoria.id.toString();

      if (conteo.has(key)) {
        conteo.get(key)!.count += 1;
      } else {
        conteo.set(key, {
          nombre: categoria.nombre,
          count: 1,
          color: getCategoriaColor(categoria.codigo),
        });
      }
    });

    return Array.from(conteo.values()).sort((a, b) => b.count - a.count);
  }, [validacion.detallesSocios]);

  /**
   * Totales proyectados
   */
  const totalesProyectados = useMemo(() => {
    return validacion.totales || {
      montoBase: validacion.detallesSocios.reduce((sum, s) => sum + s.montoBase, 0),
      montoActividades: validacion.detallesSocios.reduce((sum, s) => sum + s.montoActividades, 0),
      montoTotal: validacion.detallesSocios.reduce((sum, s) => sum + s.montoTotal, 0),
    };
  }, [validacion]);

  /**
   * Nombre del período
   */
  const periodo = useMemo(() => {
    return `${MESES[mes - 1]} ${anio}`;
  }, [mes, anio]);

  /**
   * Tiene advertencias
   */
  const tieneAdvertencias = useMemo(() => {
    return (
      validacion.cuotasExistentes > 0 ||
      (validacion.sociosSinCategoria && validacion.sociosSinCategoria > 0) ||
      (validacion.sociosInactivos && validacion.sociosInactivos > 0) ||
      (validacion.warnings && validacion.warnings.length > 0)
    );
  }, [validacion]);

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Obtener color para chip de categoría
   */
  function getCategoriaColor(codigo: string): string {
    const colores: Record<string, string> = {
      ACTIVO: '#1976d2',
      ESTUDIANTE: '#2e7d32',
      JUBILADO: '#ed6c02',
      VITALICIO: '#9c27b0',
      BENEFACTOR: '#d32f2f',
    };
    return colores[codigo] || '#757575';
  }

  /**
   * Formatear moneda
   */
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat(LOCALE, CURRENCY_FORMAT).format(amount);
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Box>
      {/* Distribución por Categoría */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CategoryIcon color="primary" />
          <Typography variant="h6">
            Distribución por Categoría
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {distribucionCategorias.map((cat) => (
            <Chip
              key={cat.nombre}
              label={`${cat.nombre}: ${cat.count}`}
              sx={{
                bgcolor: cat.color,
                color: 'white',
                fontWeight: 500,
              }}
            />
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" color="text.secondary">
          <strong>Total de socios elegibles:</strong> {validacion.sociosPendientes}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Período:</strong> {periodo}
        </Typography>
      </Paper>

      {/* Advertencias */}
      {tieneAdvertencias && (
        <Alert
          severity="warning"
          icon={<WarningIcon />}
          sx={{ mb: 2 }}
        >
          <AlertTitle>Advertencias</AlertTitle>
          <List dense>
            {validacion.cuotasExistentes > 0 && (
              <ListItem disablePadding>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <InfoIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={`Ya existen ${validacion.cuotasExistentes} cuota(s) para ${periodo}`}
                  secondary="Estas cuotas no se duplicarán"
                />
              </ListItem>
            )}

            {validacion.sociosSinCategoria && validacion.sociosSinCategoria > 0 && (
              <ListItem disablePadding>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <WarningIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={`${validacion.sociosSinCategoria} socio(s) sin categoría asignada`}
                  secondary="No se generarán cuotas para estos socios"
                />
              </ListItem>
            )}

            {validacion.sociosInactivos && validacion.sociosInactivos > 0 && (
              <ListItem disablePadding>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <InfoIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={`${validacion.sociosInactivos} socio(s) inactivo(s)`}
                  secondary="Estos socios serán excluidos de la generación"
                />
              </ListItem>
            )}

            {validacion.warnings?.map((warning, idx) => (
              <ListItem key={idx} disablePadding>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <InfoIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={warning} />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}

      {/* Estado OK */}
      {!tieneAdvertencias && validacion.puedeGenerar && (
        <Alert
          severity="success"
          icon={<CheckCircleIcon />}
          sx={{ mb: 2 }}
        >
          <AlertTitle>Listo para Generar</AlertTitle>
          No se encontraron advertencias. Todas las validaciones pasaron exitosamente.
        </Alert>
      )}

      {/* Totales Proyectados */}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Totales Proyectados
        </Typography>

        <TableContainer>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>
                  <Typography variant="body2">
                    Monto Base
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(totalesProyectados.montoBase)}
                  </Typography>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>
                  <Typography variant="body2">
                    Monto Actividades
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(totalesProyectados.montoActividades)}
                  </Typography>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell colSpan={2}>
                  <Divider sx={{ my: 1 }} />
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>
                  <Typography variant="body1" fontWeight={600}>
                    TOTAL
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color="primary.main"
                  >
                    {formatCurrency(totalesProyectados.montoTotal)}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="caption" color="info.dark">
            <InfoIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            Los montos mostrados son proyecciones basadas en las categorías y actividades actuales.
            Los descuentos manuales deben aplicarse posteriormente.
          </Typography>
        </Box>
      </Paper>

      {/* No puede generar */}
      {!validacion.puedeGenerar && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <AlertTitle>No se puede generar</AlertTitle>
          No se cumplen las condiciones necesarias para generar cuotas.
          Revisa las advertencias anteriores.
        </Alert>
      )}
    </Box>
  );
};
