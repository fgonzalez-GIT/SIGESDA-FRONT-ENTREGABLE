/**
 * API Service para Categorías de Actividad
 * Maneja todas las llamadas HTTP al backend para gestión de categorías de actividad
 */

import type {
  CategoriaActividad,
  CreateCategoriaActividadDto,
  UpdateCategoriaActividadDto,
  CategoriasActividadQueryParams,
  CategoriaActividadApiResponse,
  CategoriasActividadListResponse,
  ReorderCategoriasActividadDto,
} from '../types/categoriaActividad.types';

const API_URL = import.meta.env.VITE_API_URL;

// ============================================
// IMPORTANTE: BACKEND - ENDPOINTS REQUERIDOS
// ============================================
/**
 * Los siguientes endpoints deben ser implementados en el backend:
 *
 * Ruta base: /api/actividades/categorias-actividad
 *
 * 1. GET    /api/actividades/categorias-actividad
 *    Query params:
 *    - includeInactive: boolean (default: false)
 *    - search: string (opcional, busca en código y nombre)
 *    Response: { success: true, data: CategoriaActividad[], total: number }
 *
 * 2. GET    /api/actividades/categorias-actividad/:id
 *    Response: { success: true, data: CategoriaActividad (con _count.actividades) }
 *
 * 3. POST   /api/actividades/categorias-actividad
 *    Body: { codigo: string, nombre: string, descripcion?: string, orden?: number }
 *    Validaciones:
 *    - codigo debe ser único
 *    - codigo: mayúsculas, números, guiones, guiones bajos
 *    - orden se autoasigna si no se proporciona (max + 1)
 *    Response: { success: true, data: CategoriaActividad, message: "Categoría creada exitosamente" }
 *
 * 4. PUT    /api/actividades/categorias-actividad/:id
 *    Body: { codigo?, nombre?, descripcion?, activo?, orden? }
 *    Validaciones:
 *    - codigo único (si cambia)
 *    - no permitir desactivar si hay actividades activas usando esta categoría
 *    Response: { success: true, data: CategoriaActividad, message: "Categoría actualizada exitosamente" }
 *
 * 5. DELETE /api/actividades/categorias-actividad/:id
 *    Soft delete: activo = false
 *    Validaciones:
 *    - no permitir si hay actividades activas usando esta categoría
 *    Response: { success: true, message: "Categoría desactivada exitosamente" }
 *
 * 6. PATCH  /api/actividades/categorias-actividad/reorder
 *    Body: { categoriaIds: number[] } // Array ordenado de IDs
 *    Actualiza campo `orden` según índice en el array
 *    Response: { success: true, message: "Orden actualizado exitosamente" }
 *
 * NOTA: Todos los IDs son SERIAL autoincremental (INTEGER)
 */

// ============================================
// API CLIENT
// ============================================

export const categoriasActividadApi = {
  /**
   * Listar todas las categorías de actividad
   */
  listar: async (params?: CategoriasActividadQueryParams): Promise<CategoriaActividad[]> => {
    try {
      const queryParams = new URLSearchParams();

      if (params?.includeInactive !== undefined) {
        queryParams.append('includeInactive', String(params.includeInactive));
      }

      if (params?.search) {
        queryParams.append('search', params.search);
      }

      const url = `${API_URL}/actividades/categorias-actividad${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Error al cargar categorías de actividad');
      }

      const result: CategoriasActividadListResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error en categoriasActividadApi.listar:', error);
      throw error instanceof Error ? error : new Error('Error desconocido al cargar categorías de actividad');
    }
  },

  /**
   * Obtener una categoría de actividad por ID
   */
  obtenerPorId: async (id: number): Promise<CategoriaActividad> => {
    try {
      const response = await fetch(`${API_URL}/actividades/categorias-actividad/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Error al cargar categoría de actividad');
      }

      const result: CategoriaActividadApiResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error en categoriasActividadApi.obtenerPorId:', error);
      throw error instanceof Error ? error : new Error('Error desconocido al cargar categoría de actividad');
    }
  },

  /**
   * Crear una nueva categoría de actividad
   */
  crear: async (data: CreateCategoriaActividadDto): Promise<CategoriaActividad> => {
    try {
      const response = await fetch(`${API_URL}/actividades/categorias-actividad`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Error al crear categoría de actividad');
      }

      const result: CategoriaActividadApiResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error en categoriasActividadApi.crear:', error);
      throw error instanceof Error ? error : new Error('Error desconocido al crear categoría de actividad');
    }
  },

  /**
   * Actualizar una categoría de actividad existente
   */
  actualizar: async (id: number, data: UpdateCategoriaActividadDto): Promise<CategoriaActividad> => {
    try {
      const response = await fetch(`${API_URL}/actividades/categorias-actividad/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Error al actualizar categoría de actividad');
      }

      const result: CategoriaActividadApiResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error en categoriasActividadApi.actualizar:', error);
      throw error instanceof Error ? error : new Error('Error desconocido al actualizar categoría de actividad');
    }
  },

  /**
   * Eliminar (desactivar) una categoría de actividad
   * Soft delete: cambia activo a false
   */
  eliminar: async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/actividades/categorias-actividad/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Error al eliminar categoría de actividad');
      }
    } catch (error) {
      console.error('Error en categoriasActividadApi.eliminar:', error);
      throw error instanceof Error ? error : new Error('Error desconocido al eliminar categoría de actividad');
    }
  },

  /**
   * Reordenar categorías de actividad
   */
  reordenar: async (data: ReorderCategoriasActividadDto): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/actividades/categorias-actividad/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Error al reordenar categorías de actividad');
      }
    } catch (error) {
      console.error('Error en categoriasActividadApi.reordenar:', error);
      throw error instanceof Error ? error : new Error('Error desconocido al reordenar categorías de actividad');
    }
  },
};

export default categoriasActividadApi;
