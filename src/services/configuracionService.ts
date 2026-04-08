/**
 * Servicio para interactuar con el endpoint de configuración del sistema
 *
 * Este servicio maneja la comunicación con la API REST de configuración,
 * específicamente para la gestión de días de vencimiento.
 *
 * Endpoints consumidos:
 * - GET /api/configuracion/valor/:clave/NUMBER - Obtener valor tipado
 * - PUT /api/configuracion/valor/:clave/NUMBER - Actualizar valor tipado
 */

import axios from 'axios';
import type {
  Configuracion,
  ApiResponse,
  ClaveVencimiento,
  DiaVencimientoConfig,
  CLAVES_VENCIMIENTO,
} from '@/types/configuracion.types';

// Base URL desde variables de entorno
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Cliente Axios preconfigurado para el endpoint de configuración
 */
const configuracionAPI = axios.create({
  baseURL: `${API_BASE_URL}/configuracion`,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor para agregar token de autenticación
 * (Actualmente mock, preparado para JWT futuro)
 */
configuracionAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Interceptor para logging en desarrollo
 */
configuracionAPI.interceptors.response.use(
  (response) => {
    if ((import.meta as any).env?.DEV) {
      console.log('✅ Configuración API Response:', response.config.url, response.data);
    }
    return response;
  },
  (error) => {
    console.error('❌ Configuración API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Servicio de configuración con métodos para días de vencimiento
 */
export const configuracionService = {
  /**
   * Obtener un día de vencimiento específico como número
   *
   * @param clave - Clave de configuración (ej: 'DIA_VENCIMIENTO_CUOTA')
   * @returns Número del día (1-28)
   * @throws Error si no se encuentra o hay error de red
   *
   * @example
   * const dia = await configuracionService.getDiaVencimiento('DIA_VENCIMIENTO_CUOTA');
   * console.log(dia); // 15
   */
  getDiaVencimiento: async (clave: ClaveVencimiento): Promise<number> => {
    const response = await configuracionAPI.get<ApiResponse<{clave: string; valor: number; tipo: string}>>(
      `/valor/${clave}/NUMBER`
    );

    if (!response.data.success || response.data.data === undefined) {
      throw new Error(response.data.message || 'Error al obtener configuración');
    }

    // Conversión robusta: funciona si el backend retorna number o string
    return Number(response.data.data.valor);
  },

  /**
   * Actualizar un día de vencimiento específico
   *
   * @param clave - Clave de configuración
   * @param valor - Nuevo valor del día (1-28)
   * @returns Configuración actualizada completa
   * @throws Error si hay error de validación (ej: fuera de rango 1-28)
   *
   * @example
   * await configuracionService.setDiaVencimiento('DIA_VENCIMIENTO_CUOTA', 20);
   */
  setDiaVencimiento: async (
    clave: ClaveVencimiento,
    valor: number
  ): Promise<Configuracion> => {
    const response = await configuracionAPI.put<ApiResponse<Configuracion>>(
      `/valor/${clave}/NUMBER`,
      { valor }
    );

    if (!response.data.success || !response.data.data) {
      const errorMsg = response.data.message || 'Error al actualizar configuración';

      // Formatear errores de validación si existen
      if (response.data.errors && response.data.errors.length > 0) {
        const validationErrors = response.data.errors
          .map((e) => `${e.path}: ${e.message}`)
          .join(', ');
        throw new Error(`${errorMsg} - ${validationErrors}`);
      }

      throw new Error(errorMsg);
    }

    return response.data.data;
  },

  /**
   * Obtener ambos días de vencimiento en una sola llamada (optimizado)
   *
   * Utiliza Promise.all para hacer las peticiones en paralelo
   *
   * @returns Objeto con ambos días de vencimiento
   * @throws Error si alguna de las configuraciones no existe
   *
   * @example
   * const { diaVencimientoCuota, diaVencimientoPagoActividad } =
   *   await configuracionService.getDiasVencimiento();
   */
  getDiasVencimiento: async (): Promise<DiaVencimientoConfig> => {
    const [diaVencimientoCuota, diaVencimientoPagoActividad] = await Promise.all([
      configuracionService.getDiaVencimiento('DIA_VENCIMIENTO_CUOTA'),
      configuracionService.getDiaVencimiento('DIA_VENCIMIENTO_PAGO_ACTIVIDAD'),
    ]);

    return { diaVencimientoCuota, diaVencimientoPagoActividad };
  },

  /**
   * Actualizar ambos días de vencimiento en una sola operación (batch)
   *
   * IMPORTANTE: Si una actualización falla, no se hace rollback automático.
   * El backend no provee transacciones para este caso.
   *
   * @param config - Objeto con ambos días a actualizar
   * @returns Array con ambas configuraciones actualizadas
   * @throws Error si alguna actualización falla
   *
   * @example
   * await configuracionService.setDiasVencimiento({
   *   diaVencimientoCuota: 15,
   *   diaVencimientoPagoActividad: 20
   * });
   */
  setDiasVencimiento: async (
    config: DiaVencimientoConfig
  ): Promise<[Configuracion, Configuracion]> => {
    return await Promise.all([
      configuracionService.setDiaVencimiento(
        'DIA_VENCIMIENTO_CUOTA',
        config.diaVencimientoCuota
      ),
      configuracionService.setDiaVencimiento(
        'DIA_VENCIMIENTO_PAGO_ACTIVIDAD',
        config.diaVencimientoPagoActividad
      ),
    ]);
  },
};
