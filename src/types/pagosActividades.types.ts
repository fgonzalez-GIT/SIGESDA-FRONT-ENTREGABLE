/**
 * Tipos para el módulo de Pagos de Actividades
 * Sistema de pagos para personas NO_SOCIO
 */

/**
 * Item individual de actividad dentro de un pago
 */
export interface ItemActividadPago {
  id: number;
  actividadId: number;
  actividadNombre: string;
  cantidad: number; // Número de clases/sesiones
  precioUnitario: number;
  subtotal: number;
  fechaDesde?: string;
  fechaHasta?: string;
}

/**
 * Pago de Actividad (recibo generado para NO_SOCIO)
 */
export interface PagoActividad {
  id: number;
  reciboId: number;
  numero: string; // Número del recibo
  mes: number; // 1-12
  anio: number; // 2020-2030
  personaId: number;
  personaNombre: string;
  personaApellido: string;
  personaDni?: string;
  personaEmail?: string;
  items: ItemActividadPago[];
  subtotal: number;
  descuentos: number;
  recargos: number;
  total: number;
  estado: 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'CANCELADO';
  fechaEmision: string;
  fechaVencimiento: string;
  fechaPago?: string;
  metodoPago?: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO' | 'CHEQUE' | 'OTRO';
  montoPagado: number;
  observaciones?: string;
  precioEspecial: boolean; // Indica si tiene precio diferente al estándar
  createdAt: string;
  updatedAt: string;
}

/**
 * Request para generar pagos mensuales
 */
export interface GenerarPagosActividadesRequest {
  mes: number; // 1-12
  anio: number; // 2020-2030
  observaciones?: string;
}

/**
 * Respuesta de generación de pagos
 */
export interface GenerarPagosActividadesResponse {
  generados: number; // Cantidad de pagos creados
  total: number; // Total personas NO_SOCIO con actividades
  pagos: PagoActividad[];
  mensaje: string;
}

/**
 * Request para generación retroactiva
 */
export interface GenerarPagosRetroactivosRequest {
  desde: {
    mes: number;
    anio: number;
  };
  hasta: {
    mes: number;
    anio: number;
  };
}

/**
 * Filtros para consultar pagos de actividades
 */
export interface PagosActividadesFilters {
  mes?: number;
  anio?: number;
  personaId?: number;
  actividadId?: number;
  estado?: 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'CANCELADO';
  page?: number;
  limit?: number | 'all';
}

/**
 * Estadísticas de pagos de actividades
 */
export interface PagosActividadesStats {
  // Totales por estado
  totalPendientes: number;
  totalPagados: number;
  totalVencidos: number;
  totalCancelados: number;

  // Montos
  montoTotalGenerado: number;
  montoTotalCobrado: number;
  montoTotalPendiente: number;
  montoTotalVencido: number;

  // Distribución por estado (para gráfico de torta)
  distribucionEstados: {
    estado: string;
    cantidad: number;
    monto: number;
  }[];

  // Recaudación por actividad (para gráfico de barras)
  recaudacionPorActividad: {
    actividadId: number;
    actividadNombre: string;
    cantidad: number;
    monto: number;
  }[];

  // Proyección mensual
  proyeccion?: {
    mesActual: number;
    anioActual: number;
    totalEsperado: number;
    totalCobrado: number;
    porcentajeCobranza: number;
  };
}

/**
 * Respuesta paginada de pagos de actividades
 */
export interface PagosActividadesPaginatedResponse {
  data: PagoActividad[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Formato para exportación
 */
export type ExportFormat = 'excel' | 'csv';

/**
 * Request para exportar pagos
 */
export interface ExportarPagosRequest extends PagosActividadesFilters {
  formato?: ExportFormat;
}
