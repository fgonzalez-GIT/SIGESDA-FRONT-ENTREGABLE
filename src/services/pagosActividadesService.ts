import axios from 'axios';
import {
  PagoActividad,
  GenerarPagosActividadesRequest,
  GenerarPagosActividadesResponse,
  GenerarPagosRetroactivosRequest,
  PagosActividadesFilters,
  PagosActividadesStats,
  PagosActividadesPaginatedResponse,
  ExportarPagosRequest,
} from '@/types/pagosActividades.types';
import { MAX_API_LIMIT } from '@/constants/api';
import { BulkDeletePagosResponse } from '@/types/bulkDelete.types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api';

const pagosActividadesAPI = axios.create({
  baseURL: `${API_BASE_URL}/pagos-actividades`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
pagosActividadesAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Transforma los datos del backend al formato esperado por el frontend
 */
const transformPagoFromBackend = (backendPago: any): PagoActividad => {
  // Extraer datos del recibo asociado
  const recibo = backendPago.recibo || {};
  const persona = backendPago.persona || recibo.receptor || {};

  // Transformar items de actividades
  const items = (backendPago.items || []).map((item: any) => {
    const cantidad = parseFloat(item.cantidad || '1');
    const precioUnitario = parseFloat(item.monto || item.precioUnitario || item.precio || '0');
    const subtotal = parseFloat(item.monto || item.subtotal || item.importe || '0') * cantidad;

    return {
      id: item.id,
      actividadId: item.actividadId || item.actividad?.id,
      actividadNombre: item.concepto || item.actividadNombre || item.actividad?.nombre || 'Actividad',
      cantidad,
      precioUnitario,
      subtotal,
      fechaDesde: item.fechaDesde,
      fechaHasta: item.fechaHasta,
    };
  });

  // Calcular monto pagado desde mediosPago
  const montoPagado = recibo.mediosPago?.reduce(
    (sum: number, medio: any) => sum + parseFloat(medio.importe || '0'),
    0
  ) || 0;

  // Normalizar estado
  const estadoNormalizado = (backendPago.estado || recibo.estado || 'PENDIENTE').toUpperCase();

  return {
    id: backendPago.id,
    reciboId: recibo.id || backendPago.reciboId,
    numero: recibo.numero || `PAGO-${backendPago.id}`,
    mes: backendPago.mes,
    anio: backendPago.anio,
    personaId: persona.id || backendPago.personaId,
    personaNombre: persona.nombre || '',
    personaApellido: persona.apellido || '',
    personaDni: persona.dni,
    personaEmail: persona.email,
    items,
    subtotal: parseFloat(backendPago.subtotal || recibo.importe || '0'),
    descuentos: parseFloat(backendPago.descuentos || '0'),
    recargos: parseFloat(backendPago.recargos || '0'),
    total: parseFloat(backendPago.total || recibo.importe || '0'),
    estado: estadoNormalizado as 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'CANCELADO',
    fechaEmision: recibo.fecha || recibo.fechaEmision || backendPago.createdAt,
    fechaVencimiento: recibo.fechaVencimiento || backendPago.fechaVencimiento,
    fechaPago: recibo.mediosPago?.[0]?.fecha,
    metodoPago: recibo.mediosPago?.[0]?.tipo?.toUpperCase(),
    montoPagado,
    observaciones: recibo.observaciones || backendPago.observaciones,
    precioEspecial: backendPago.precioEspecial || false,
    createdAt: backendPago.createdAt,
    updatedAt: backendPago.updatedAt,
  };
};

/**
 * Servicio para interactuar con la API de Pagos de Actividades
 */
export const pagosActividadesService = {
  /**
   * Generar pagos mensuales para NO_SOCIO
   */
  generarPagosMensuales: async (
    request: GenerarPagosActividadesRequest
  ): Promise<GenerarPagosActividadesResponse> => {
    const response = await pagosActividadesAPI.post('/generar', request);
    const data = response.data.data || response.data;

    return {
      generados: data.generados || data.pagos?.length || 0,
      total: data.total || 0,
      pagos: (data.pagos || []).map(transformPagoFromBackend),
      mensaje: data.mensaje || response.data.message || 'Pagos generados correctamente',
    };
  },

  /**
   * Generar pagos retroactivos (múltiples meses)
   */
  generarPagosRetroactivos: async (
    request: GenerarPagosRetroactivosRequest
  ): Promise<GenerarPagosActividadesResponse> => {
    const response = await pagosActividadesAPI.post('/generar-retroactivos', request);
    const data = response.data.data || response.data;

    return {
      generados: data.generados || data.pagos?.length || 0,
      total: data.total || 0,
      pagos: (data.pagos || []).map(transformPagoFromBackend),
      mensaje: data.mensaje || response.data.message || 'Pagos retroactivos generados correctamente',
    };
  },

  /**
   * Obtener pagos con filtros y paginación
   */
  getPagosActividades: async (
    filters: PagosActividadesFilters = {}
  ): Promise<PagosActividadesPaginatedResponse> => {
    // Transformar limit: 'all' a un número antes de enviar al backend
    const apiFilters = {
      ...filters,
      limit: filters.limit === 'all' ? MAX_API_LIMIT : filters.limit,
    };
    const response = await pagosActividadesAPI.get('/', { params: apiFilters });
    const data = response.data.data || response.data;

    // Si la respuesta es un array simple (sin meta), crear estructura paginada
    if (Array.isArray(data)) {
      return {
        data: data.map(transformPagoFromBackend),
        meta: {
          page: 1,
          limit: data.length,
          total: data.length,
          totalPages: 1,
        },
      };
    }

    // Si la respuesta tiene estructura paginada
    return {
      data: (data.data || data.pagos || []).map(transformPagoFromBackend),
      meta: data.meta || {
        page: filters.page || 1,
        limit: filters.limit === 'all' ? MAX_API_LIMIT : (filters.limit || 10),
        total: data.total || 0,
        totalPages: data.totalPages || 1,
      },
    };
  },

  /**
   * Obtener un pago por ID
   */
  getPagoById: async (id: number): Promise<PagoActividad> => {
    const response = await pagosActividadesAPI.get(`/${id}`);
    return transformPagoFromBackend(response.data.data || response.data);
  },

  /**
   * Eliminar un pago (solo si estado = PENDIENTE)
   */
  deletePago: async (id: number): Promise<void> => {
    await pagosActividadesAPI.delete(`/${id}`);
  },

  /**
   * Obtener estadísticas de pagos
   */
  getEstadisticas: async (filters?: {
    mes?: number;
    anio?: number;
  }): Promise<PagosActividadesStats> => {
    const response = await pagosActividadesAPI.get('/stats', { params: filters });
    const data = response.data.data || response.data;

    return {
      totalPendientes: data.totalPendientes || 0,
      totalPagados: data.totalPagados || 0,
      totalVencidos: data.totalVencidos || 0,
      totalCancelados: data.totalCancelados || 0,
      montoTotalGenerado: parseFloat(data.montoTotalGenerado || '0'),
      montoTotalCobrado: parseFloat(data.montoTotalCobrado || '0'),
      montoTotalPendiente: parseFloat(data.montoTotalPendiente || '0'),
      montoTotalVencido: parseFloat(data.montoTotalVencido || '0'),
      distribucionEstados: data.distribucionEstados || [],
      recaudacionPorActividad: data.recaudacionPorActividad || [],
      proyeccion: data.proyeccion,
    };
  },

  /**
   * Exportar pagos sin paginación
   */
  exportarPagos: async (request: ExportarPagosRequest = {}): Promise<Blob> => {
    const response = await pagosActividadesAPI.get('/export', {
      params: request,
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Descargar exportación de pagos
   */
  descargarExportacion: async (
    filters: PagosActividadesFilters = {},
    formato: 'excel' | 'csv' = 'excel',
    filename?: string
  ): Promise<void> => {
    const blob = await pagosActividadesService.exportarPagos({ ...filters, formato });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const extension = formato === 'excel' ? 'xlsx' : 'csv';
    const defaultFilename = `pagos-actividades-${filters.mes || 'todos'}-${filters.anio || new Date().getFullYear()}.${extension}`;

    link.download = filename || defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Eliminar múltiples pagos de actividades de forma atómica (todo o nada)
   * @param ids - Array de IDs de pagos (1-100 elementos)
   * @returns Número de pagos eliminados y los IDs de recibos asociados
   * @throws Error si algún pago está pagado o tiene pagos registrados
   * @see /SIGESDA-BACKEND/docs/API_BULK_DELETE.md
   */
  bulkDeletePagosActividades: async (ids: number[]): Promise<BulkDeletePagosResponse> => {
    const response = await pagosActividadesAPI.delete('/bulk', {
      data: { ids }
    });
    return response.data.data || { count: ids.length, reciboIds: [] };
  },
};

export default pagosActividadesService;
