import axios from 'axios';
import {
  Cuota,
  ItemCuota,
  DashboardData,
  CategoriaSocio,
  CrearCuotaRequest,
  GenerarCuotasRequest,
  RegenerarCuotasRequest,
  GeneracionCuotasResponse,
  ValidacionGeneracionResponse,
  RecalcularCuotaRequest,
  RecalculoResponse
} from '../types/cuota.types';
import { CuotasFilters } from '../store/slices/cuotasSlice';
import { PaginatedResponse } from './api';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api';

const cuotasAPI = axios.create({
  baseURL: `${API_BASE_URL}/cuotas`,
  headers: {
    'Content-Type': 'application/json',
  },
});

cuotasAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * DEPRECATED: V2 ya no requiere transformación legacy
 * El backend devuelve la estructura correcta con receptor.tipos[] e items[]
 *
 * Conservado temporalmente por si algún componente todavía lo necesita,
 * pero se recomienda migrar a usar la estructura V2 directamente.
 */
const transformCuotaToLegacy = (cuota: Cuota): Cuota => {
  // V2: El backend ya envía la estructura correcta, retornar sin modificar
  return cuota;
};

// Response Types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface DesgloseItemsResponse {
  desglose: Record<string, { items: ItemCuota[]; subtotal: number }>;
  totales: {
    base: number;
    actividades: number;
    descuentos: number;
    recargos: number;
    total: number;
  };
}

export const cuotasService = {
  /**
   * Obtiene cuotas con filtros y paginación
   * V2: El backend incluye recibo, items y categoria populated automáticamente
   *
   * @param filters - Filtros de búsqueda (mes, año, categoría, persona, etc.)
   * @returns Respuesta paginada con cuotas V2
   */
  getCuotas: async (filters: CuotasFilters = {}): Promise<PaginatedResponse<Cuota>> => {
    const response = await cuotasAPI.get<PaginatedResponse<Cuota>>('/', { params: filters });

    // V2: El backend ya envía la estructura correcta (receptor.tipos[], items[])
    return response.data;
  },

  /**
   * Obtiene una cuota por ID con todas sus relaciones
   * V2: Incluye recibo con receptor.tipos[], items[], y categoria
   */
  getCuotaById: async (id: number): Promise<Cuota> => {
    const response = await cuotasAPI.get<ApiResponse<Cuota>>(`/${id}`);
    return response.data.data;
  },

  /**
   * Crea una nueva cuota manual (poco común, usualmente se generan)
   */
  createCuota: async (cuota: CrearCuotaRequest): Promise<Cuota> => {
    const response = await cuotasAPI.post<ApiResponse<Cuota>>('/', cuota);
    return response.data.data;
  },

  /**
   * Actualiza una cuota existente
   */
  updateCuota: async (id: number, cuota: Partial<Cuota>): Promise<Cuota> => {
    const response = await cuotasAPI.put<ApiResponse<Cuota>>(`/${id}`, cuota);
    return response.data.data;
  },

  // Eliminar una cuota
  deleteCuota: async (id: number): Promise<void> => {
    await cuotasAPI.delete(`/${id}`);
  },

  // --- Generación Masiva (V2) ---
  generarCuotasV2: async (request: GenerarCuotasRequest): Promise<GeneracionCuotasResponse> => {
    const response = await cuotasAPI.post<ApiResponse<GeneracionCuotasResponse>>('/generar-v2', request);
    return response.data.data;
  },

  // Validar Generación
  validarGeneracion: async (mes: number, anio: number, categoriaIds?: number[]): Promise<ValidacionGeneracionResponse> => {
    const response = await cuotasAPI.get<ApiResponse<ValidacionGeneracionResponse>>(`/validar/${mes}/${anio}/generacion`, {
      params: { categoriaIds: categoriaIds?.join(',') }
    });
    return response.data.data;
  },

  // Períodos disponibles
  getPeriodosDisponibles: async (): Promise<any> => {
    const response = await cuotasAPI.get<ApiResponse<any>>('/periodos/disponibles');
    return response.data.data;
  },

  // --- Items de Cuota ---
  getItemsCuota: async (cuotaId: number): Promise<ItemCuota[]> => {
    const response = await cuotasAPI.get<ApiResponse<{ items: ItemCuota[] }>>(`/${cuotaId}/items`);
    return response.data.data.items;
  },

  getDesgloseItems: async (cuotaId: number): Promise<DesgloseItemsResponse> => {
    const response = await cuotasAPI.get<ApiResponse<any>>(`/${cuotaId}/items/desglose`);
    const rawData = response.data.data;

    // Debug logging
    if (import.meta.env.DEV) {
      console.log('[getDesgloseItems] Raw backend response:', rawData);
    }

    // Validar estructura mínima
    if (!rawData || !Array.isArray(rawData.items)) {
      console.error('[getDesgloseItems] Invalid backend response structure:', rawData);
      throw new Error('Estructura de respuesta de desglose inválida');
    }

    // Transformar: Agrupar items por categoría efectiva
    const desglose: Record<string, { items: ItemCuota[]; subtotal: number }> = {};

    rawData.items.forEach((item: any) => {
      // Determinar categoría efectiva:
      // Si formula.descuenta === true → siempre DESCUENTO, independiente del código de categoría.
      // Si formula.descuenta === false → usar categoría real (nunca reclasificar como DESCUENTO).
      // Sin formula.descuenta explícito → usar categoría real (legacy: el código DESCUENTO ya agrupa correcto).
      const categoriaOriginal = item.categoria || item.tipoItem?.categoriaItem?.codigo || 'OTRO';
      const formulaDescuenta = item.tipoItem?.formula?.descuenta;
      const esDescuenta =
        formulaDescuenta === true ||
        (formulaDescuenta === undefined && categoriaOriginal === 'DESCUENTO');
      const categoria = esDescuenta ? 'DESCUENTO' : categoriaOriginal;

      // Inicializar bucket si no existe
      if (!desglose[categoria]) {
        desglose[categoria] = { items: [], subtotal: 0 };
      }

      // Agregar item; subtotal: descuentos siempre restan (Math.abs con signo negativo)
      const montoItem = parseFloat(item.monto) * parseFloat(item.cantidad);
      desglose[categoria].items.push(item);
      desglose[categoria].subtotal += esDescuenta ? -Math.abs(montoItem) : montoItem;
    });

    // Calcular total desde ítems (respeta formula.descuenta, no depende del resumen del backend)
    const totalDesdeItems = rawData.items.reduce((sum: number, item: any) => {
      const valor = parseFloat(item.monto) * parseFloat(item.cantidad);
      const formulaDescuenta = item.tipoItem?.formula?.descuenta;
      const categoriaOriginal = item.categoria || item.tipoItem?.categoriaItem?.codigo || 'OTRO';
      const esDescuenta =
        formulaDescuenta === true ||
        (formulaDescuenta === undefined && categoriaOriginal === 'DESCUENTO');
      return esDescuenta ? sum - Math.abs(valor) : sum + valor;
    }, 0);

    // Mapear 'resumen' del backend a 'totales' del frontend
    // Se usa el total calculado desde ítems como fuente de verdad (formula.descuenta-aware)
    const totales = {
      base: rawData.resumen?.base || 0,
      actividades: rawData.resumen?.actividades || 0,
      descuentos: rawData.resumen?.descuentos || 0,
      recargos: rawData.resumen?.recargos || 0,
      ajustes: rawData.resumen?.ajustes || 0,
      total: totalDesdeItems !== 0 ? totalDesdeItems : (rawData.resumen?.total || 0)
    };

    const transformed = { desglose, totales };

    // Debug logging
    if (import.meta.env.DEV) {
      console.log('[getDesgloseItems] Transformed data:', transformed);
      console.log('[getDesgloseItems] Categorías encontradas:', Object.keys(desglose));
    }

    return transformed;
  },

  // --- Recálculo ---
  recalcularCuota: async (cuotaId: number, options: RecalcularCuotaRequest): Promise<RecalculoResponse> => {
    const response = await cuotasAPI.post<ApiResponse<RecalculoResponse>>(`/${cuotaId}/recalcular`, options);
    return response.data.data;
  },

  previewRecalculo: async (request: any) => {
    const response = await cuotasAPI.post<ApiResponse<any>>('/preview-recalculo', request);
    return response.data.data;
  },

  regenerarCuotas: async (request: RegenerarCuotasRequest) => {
    const response = await cuotasAPI.post<ApiResponse<GeneracionCuotasResponse>>('/regenerar', request);
    return response.data.data;
  },

  compararCuota: async (cuotaId: number) => {
    const response = await cuotasAPI.get<ApiResponse<any>>(`/${cuotaId}/comparar`);
    return response.data.data;
  },

  // --- Reportes ---
  getDashboard: async (mes: number, anio: number): Promise<DashboardData> => {
    const response = await cuotasAPI.get<ApiResponse<DashboardData>>(`/reportes/dashboard`, {
      params: { mes, anio }
    });
    return response.data.data;
  },

  // --- OLD METHODS (Adapt or Remove if deprecated) ---
  pagarCuota: async (request: any): Promise<Cuota> => {
    // NOTE: Payment logic might have moved to Recibos or remain here as proxy
    // Assuming endpoint /api/cuotas/:id/pagar exists or similar
    const response = await cuotasAPI.post<ApiResponse<Cuota>>(`/${request.cuotaId}/pagar`, request);
    return response.data.data;
  },

  // Buscar cuotas por persona
  getCuotasPorPersona: async (personaId: number, limit: number = 20): Promise<Cuota[]> => {
    const response = await cuotasAPI.get<ApiResponse<{ data: Cuota[] } | Cuota[]>>(`/socio/${personaId}`, {
      params: { limit }
    });
    // Handle potential pagination wrapper or direct array
    const data = response.data.data;
    return Array.isArray(data) ? data : (data as any)?.data || [];
  },

  getCuotasPorRecibo: async (reciboId: number): Promise<Cuota> => {
    const response = await cuotasAPI.get<ApiResponse<Cuota>>(`/recibo/${reciboId}`);
    return response.data.data;
  },

  addItemManual: async (cuotaId: number, item: any): Promise<any> => {
    const response = await cuotasAPI.post<ApiResponse<any>>(`/${cuotaId}/items`, item);
    return response.data.data;
  },

  // --- Exportación de Cuotas V2 ---

  /**
   * Exporta todas las cuotas que coincidan con los filtros sin paginación
   * V2: Usa el endpoint dedicado /api/cuotas/export
   *
   * @param filters - Filtros a aplicar (sin page/limit)
   * @returns Todas las cuotas V2 con receptor.tipos[] e items[]
   */
  exportCuotas: async (filters: Omit<CuotasFilters, 'page' | 'limit'> = {}): Promise<{ data: Cuota[]; total: number; exportedAt: string }> => {
    const response = await cuotasAPI.get<{ success: boolean; data: Cuota[]; meta: { total: number; exportedAt: string } }>('/export', {
      params: filters
    });

    return {
      data: response.data.data || [],
      total: response.data.meta?.total || 0,
      exportedAt: response.data.meta?.exportedAt || new Date().toISOString()
    };
  },

  /**
   * Obtiene todas las cuotas (sin límite) con los filtros aplicados
   * V2: Usa el parámetro limit=all en el endpoint principal
   *
   * @param filters - Filtros a aplicar (limit se fuerza a 'all')
   * @returns Todas las cuotas V2 sin paginación
   */
  getAllCuotas: async (filters: Omit<CuotasFilters, 'page' | 'limit'> = {}): Promise<PaginatedResponse<Cuota>> => {
    const response = await cuotasAPI.get<PaginatedResponse<Cuota>>('/', {
      params: { ...filters, limit: 'all', page: 1 }
    });

    return response.data;
  },

  // --- Generación Batch (Endpoint moderno - 30x más rápido) ---

  /**
   * Genera cuotas usando el endpoint batch moderno
   * Soporta:
   * - Generación individual: personaIds: [42]
   * - Generación múltiple selectiva: personaIds: [15, 42, 108]
   * - Generación masiva: sin personaIds (genera para todos los socios activos)
   *
   * IMPORTANTE: Este endpoint NO aplica descuentos automáticos.
   * Para descuentos, usar el flujo: generar → aplicar ajuste → recalcular
   *
   * @param request - Parámetros de generación
   * @returns Resultado con cuotas generadas y performance
   */
  generarCuotasBatch: async (request: {
    mes: number;
    anio: number;
    personaIds?: number[];  // Opcional: IDs específicos de personas
    observaciones?: string;
  }): Promise<{
    cuotasGeneradas: number;
    cuotas: Cuota[];
    errores: string[];
    performance: { tiempoSegundos: string };
  }> => {
    const response = await cuotasAPI.post<ApiResponse<any>>('/batch/generar', request);
    return response.data.data;
  },

  /**
   * Aplicar ajuste/descuento a una persona
   * Tipos de ajuste disponibles:
   * - DESCUENTO_FIJO: Descuento de monto fijo ($500)
   * - DESCUENTO_PORCENTAJE: Descuento porcentual (20%)
   * - RECARGO_FIJO: Recargo de monto fijo ($100)
   * - RECARGO_PORCENTAJE: Recargo porcentual (10%)
   *
   * @param request - Datos del ajuste a aplicar
   * @returns Ajuste creado
   */
  aplicarAjusteCuota: async (request: {
    personaId: number;
    tipoAjuste: 'DESCUENTO_FIJO' | 'DESCUENTO_PORCENTAJE' | 'RECARGO_FIJO' | 'RECARGO_PORCENTAJE';
    valor: number;
    concepto: string;
    fechaInicio: string;  // ISO date: "2026-03-01"
    fechaFin?: string;    // Opcional: ISO date
    aplicaA: 'TOTAL_CUOTA' | 'BASE' | 'ACTIVIDADES' | 'ITEMS_ESPECIFICOS';
    itemsAfectados?: number[];  // Requerido si aplicaA === 'ITEMS_ESPECIFICOS'
  }): Promise<any> => {
    // Crear axios instance para ajustes (diferente baseURL)
    const ajustesAPI = axios.create({
      baseURL: `${API_BASE_URL}/ajustes-cuota`,
      headers: { 'Content-Type': 'application/json' }
    });

    // Agregar token de auth
    const token = localStorage.getItem('authToken');
    if (token) {
      ajustesAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    const response = await ajustesAPI.post('/', request);
    return response.data.data;
  }
};

export default cuotasService;