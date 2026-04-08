/**
 * API Service para Tipos de Actividad
 * Maneja todas las llamadas HTTP al backend para gestión de tipos de actividad
 */

import type {
  TipoActividad,
  CreateTipoActividadDto,
  UpdateTipoActividadDto,
  TiposActividadQueryParams,
  TipoActividadApiResponse,
  TiposActividadListResponse,
  ReorderTiposActividadDto,
} from '../types/tipoActividad.types';

const API_URL = import.meta.env.VITE_API_URL;

// ============================================
// IMPORTANTE: BACKEND - ENDPOINTS REQUERIDOS
// ============================================
/**
 * Los siguientes endpoints deben ser implementados en el backend:
 *
 * Ruta base: /api/actividades/tipos-actividad
 *
 * 1. GET    /api/actividades/tipos-actividad
 *    Query params:
 *    - includeInactive: boolean (default: false)
 *    - search: string (opcional, busca en código y nombre)
 *    Response: { success: true, data: TipoActividad[], total: number }
 *
 * 2. GET    /api/actividades/tipos-actividad/:id
 *    Response: { success: true, data: TipoActividad (con _count.actividades) }
 *
 * 3. POST   /api/actividades/tipos-actividad
 *    Body: { codigo: string, nombre: string, descripcion?: string, orden?: number }
 *    Validaciones:
 *    - codigo debe ser único
 *    - codigo: mayúsculas, números, guiones, guiones bajos
 *    - orden se autoasigna si no se proporciona (max + 1)
 *    Response: { success: true, data: TipoActividad, message: "Tipo creado exitosamente" }
 *
 * 4. PUT    /api/actividades/tipos-actividad/:id
 *    Body: { codigo?, nombre?, descripcion?, activo?, orden? }
 *    Validaciones:
 *    - codigo único (si cambia)
 *    - no permitir desactivar si hay actividades activas usando este tipo
 *    Response: { success: true, data: TipoActividad, message: "Tipo actualizado exitosamente" }
 *
 * 5. DELETE /api/actividades/tipos-actividad/:id
 *    Soft delete: activo = false
 *    Validaciones:
 *    - no permitir si hay actividades activas usando este tipo
 *    Response: { success: true, message: "Tipo desactivado exitosamente" }
 *
 * 6. PATCH  /api/actividades/tipos-actividad/reorder
 *    Body: { tipoIds: number[] } // Array ordenado de IDs
 *    Actualiza campo `orden` según índice en el array
 *    Response: { success: true, message: "Orden actualizado exitosamente" }
 *
 * NOTA: Todos los IDs son SERIAL autoincremental (INTEGER)
 */

// ============================================
// API CLIENT
// ============================================

export const tiposActividadApi = {
  /**
   * Listar todos los tipos de actividad
   */
  listar: async (params?: TiposActividadQueryParams): Promise<TipoActividad[]> => {
    try {
      const queryParams = new URLSearchParams();

      if (params?.includeInactive !== undefined) {
        queryParams.append('includeInactive', String(params.includeInactive));
      }

      if (params?.search) {
        queryParams.append('search', params.search);
      }

      const url = `${API_URL}/actividades/tipos-actividad${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Error al cargar tipos de actividad');
      }

      const result: TiposActividadListResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error en tiposActividadApi.listar:', error);
      throw error instanceof Error ? error : new Error('Error desconocido al cargar tipos de actividad');
    }
  },

  /**
   * Obtener un tipo de actividad por ID
   */
  obtenerPorId: async (id: number): Promise<TipoActividad> => {
    try {
      const response = await fetch(`${API_URL}/actividades/tipos-actividad/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Error al cargar tipo de actividad');
      }

      const result: TipoActividadApiResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error en tiposActividadApi.obtenerPorId:', error);
      throw error instanceof Error ? error : new Error('Error desconocido al cargar tipo de actividad');
    }
  },

  /**
   * Crear un nuevo tipo de actividad
   */
  crear: async (data: CreateTipoActividadDto): Promise<TipoActividad> => {
    try {
      const response = await fetch(`${API_URL}/actividades/tipos-actividad`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Error al crear tipo de actividad');
      }

      const result: TipoActividadApiResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error en tiposActividadApi.crear:', error);
      throw error instanceof Error ? error : new Error('Error desconocido al crear tipo de actividad');
    }
  },

  /**
   * Actualizar un tipo de actividad existente
   */
  actualizar: async (id: number, data: UpdateTipoActividadDto): Promise<TipoActividad> => {
    try {
      const response = await fetch(`${API_URL}/actividades/tipos-actividad/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Error al actualizar tipo de actividad');
      }

      const result: TipoActividadApiResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error en tiposActividadApi.actualizar:', error);
      throw error instanceof Error ? error : new Error('Error desconocido al actualizar tipo de actividad');
    }
  },

  /**
   * Eliminar (desactivar) un tipo de actividad
   * Soft delete: cambia activo a false
   */
  eliminar: async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/actividades/tipos-actividad/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Error al eliminar tipo de actividad');
      }
    } catch (error) {
      console.error('Error en tiposActividadApi.eliminar:', error);
      throw error instanceof Error ? error : new Error('Error desconocido al eliminar tipo de actividad');
    }
  },

  /**
   * Reordenar tipos de actividad
   */
  reordenar: async (data: ReorderTiposActividadDto): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/actividades/tipos-actividad/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Error al reordenar tipos de actividad');
      }
    } catch (error) {
      console.error('Error en tiposActividadApi.reordenar:', error);
      throw error instanceof Error ? error : new Error('Error desconocido al reordenar tipos de actividad');
    }
  },
};

export default tiposActividadApi;
