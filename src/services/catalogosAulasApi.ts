/**
 * API Service para Catálogos de Aulas
 *
 * Gestiona la carga de catálogos relacionados con Aulas:
 * - TiposAula (TEORIA, PRACTICA, ENSAYO, ESTUDIO, AUDITORIO)
 * - EstadosAula (DISPONIBLE, RESERVADA, CERRADA, EN_MANTENIMIENTO)
 *
 * Endpoints del backend:
 * - GET /api/catalogos/tipos-aulas       - Listar tipos de aula
 * - GET /api/catalogos/estados-aulas     - Listar estados de aula
 */

import { api } from './api';

/**
 * Interfaz para TipoAula (catálogo)
 */
export interface TipoAula {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  orden: number;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    aulas: number;
  };
}

/**
 * Interfaz para EstadoAula (catálogo)
 */
export interface EstadoAula {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  orden: number;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    aulas: number;
  };
}

/**
 * API Response wrapper genérico
 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
  };
  message?: string;
}

export const catalogosAulasApi = {
  /**
   * Obtener todos los tipos de aula
   * GET /api/catalogos/tipos-aulas
   *
   * @returns Array de tipos de aula activos
   */
  getTiposAula: async (): Promise<TipoAula[]> => {
    try {
      const response = await api.get<ApiResponse<TipoAula[]>>(
        '/catalogos/tipos-aulas'
      );

      // Manejar diferentes formatos de respuesta
      if (response.data.data) {
        return response.data.data;
      }
      // Si el backend devuelve directamente el array
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('[catalogosAulasApi.getTiposAula] Error:', error);
      // Retornar array vacío en caso de error
      return [];
    }
  },

  /**
   * Obtener todos los estados de aula
   * GET /api/catalogos/estados-aulas
   *
   * @returns Array de estados de aula activos
   */
  getEstadosAula: async (): Promise<EstadoAula[]> => {
    try {
      const response = await api.get<ApiResponse<EstadoAula[]>>(
        '/catalogos/estados-aulas'
      );

      // Manejar diferentes formatos de respuesta
      if (response.data.data) {
        return response.data.data;
      }
      // Si el backend devuelve directamente el array
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('[catalogosAulasApi.getEstadosAula] Error:', error);
      // Retornar array vacío en caso de error
      return [];
    }
  },

  /**
   * Cargar todos los catálogos de aulas en paralelo
   * Útil para cargar al inicio de la aplicación
   *
   * @returns Objeto con tipos y estados
   */
  getAllCatalogos: async (): Promise<{
    tipos: TipoAula[];
    estados: EstadoAula[];
  }> => {
    try {
      const [tipos, estados] = await Promise.all([
        catalogosAulasApi.getTiposAula(),
        catalogosAulasApi.getEstadosAula(),
      ]);

      return { tipos, estados };
    } catch (error) {
      console.error('[catalogosAulasApi.getAllCatalogos] Error:', error);
      return { tipos: [], estados: [] };
    }
  },
};

export default catalogosAulasApi;
