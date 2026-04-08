/**
 * API Service para Equipamientos
 *
 * Gestiona las operaciones CRUD de equipamientos disponibles para aulas.
 *
 * Endpoints esperados del backend:
 * - GET    /api/equipamientos                     - Listar equipamientos
 * - GET    /api/equipamientos/:id                 - Obtener equipamiento por ID
 * - GET    /api/equipamientos/:id/disponibilidad  - Obtener disponibilidad (NUEVO)
 * - POST   /api/equipamientos                     - Crear equipamiento
 * - PUT    /api/equipamientos/:id                 - Actualizar equipamiento
 * - DELETE /api/equipamientos/:id                 - Eliminar equipamiento (soft delete)
 * - PATCH  /api/equipamientos/:id/toggle          - Toggle activo/inactivo
 * - POST   /api/equipamientos/reorder             - Reordenar equipamientos
 * - GET    /api/catalogos/estados-equipamientos   - Obtener estados (NUEVO)
 */

import { api } from './api';
import type {
  Equipamiento,
  CreateEquipamientoDto,
  UpdateEquipamientoDto,
  EquipamientoQueryParams,
  EquipamientoApiResponse,
  EquipamientoListResponse,
  CategoriaEquipamiento,
  EstadoEquipamiento,
  EquipamientoDisponibilidadResponse,
} from '@/types/equipamiento.types';

const BASE_PATH = '/equipamientos';

/**
 * API Response wrapper genérico
 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const equipamientosApi = {
  /**
   * Listar todos los equipamientos
   * GET /api/equipamientos
   *
   * @param params - Parámetros de filtrado opcionales
   * @param params.limit - Límite de registros (default: 10, max: 100). Backend NO acepta -1. Usar 100 para obtener todos.
   * @param params.page - Número de página (default: 1)
   * @param params.includeInactive - Incluir equipamientos inactivos (default: false)
   * @param params.search - Búsqueda por texto en nombre/descripción
   * @param params.categoria - Filtrar por categoría de equipamiento
   * @returns Array de equipamientos
   */
  getAll: async (params?: EquipamientoQueryParams): Promise<Equipamiento[]> => {
    try {
      const response = await api.get<ApiResponse<Equipamiento[]>>(BASE_PATH, {
        params,
      });

      // Manejar diferentes formatos de respuesta
      if (response.data.data) {
        return response.data.data;
      }
      // Si el backend devuelve directamente el array
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('[equipamientosApi.getAll] Error:', error);
      throw error;
    }
  },

  /**
   * Obtener equipamiento por ID
   * GET /api/equipamientos/:id
   *
   * @param id - ID del equipamiento
   * @returns Equipamiento encontrado
   */
  getById: async (id: number): Promise<Equipamiento> => {
    try {
      const response = await api.get<ApiResponse<Equipamiento>>(
        `${BASE_PATH}/${id}`
      );
      return response.data.data || response.data;
    } catch (error) {
      console.error(`[equipamientosApi.getById] Error fetching ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crear nuevo equipamiento
   * POST /api/equipamientos
   *
   * @param data - Datos del equipamiento a crear
   * @returns Equipamiento creado
   */
  create: async (data: CreateEquipamientoDto): Promise<Equipamiento> => {
    try {
      const response = await api.post<ApiResponse<Equipamiento>>(
        BASE_PATH,
        data
      );
      return response.data.data || response.data;
    } catch (error) {
      console.error('[equipamientosApi.create] Error:', error);
      throw error;
    }
  },

  /**
   * Actualizar equipamiento existente
   * PUT /api/equipamientos/:id
   *
   * @param id - ID del equipamiento a actualizar
   * @param data - Datos a actualizar
   * @returns Equipamiento actualizado
   */
  update: async (
    id: number,
    data: UpdateEquipamientoDto
  ): Promise<Equipamiento> => {
    try {
      const response = await api.put<ApiResponse<Equipamiento>>(
        `${BASE_PATH}/${id}`,
        data
      );
      return response.data.data || response.data;
    } catch (error) {
      console.error(`[equipamientosApi.update] Error updating ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar equipamiento (soft delete)
   * DELETE /api/equipamientos/:id
   *
   * @param id - ID del equipamiento a eliminar
   */
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`${BASE_PATH}/${id}`);
    } catch (error) {
      console.error(`[equipamientosApi.delete] Error deleting ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Toggle estado activo/inactivo
   * PATCH /api/equipamientos/:id/toggle
   *
   * @param id - ID del equipamiento
   * @returns Equipamiento con estado actualizado
   */
  toggle: async (id: number): Promise<Equipamiento> => {
    try {
      const response = await api.patch<ApiResponse<Equipamiento>>(
        `${BASE_PATH}/${id}/toggle`
      );
      return response.data.data || response.data;
    } catch (error) {
      console.error(`[equipamientosApi.toggle] Error toggling ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Reordenar equipamientos
   * POST /api/equipamientos/reorder
   *
   * @param ids - Array de IDs en el nuevo orden
   */
  reorder: async (ids: number[]): Promise<void> => {
    try {
      await api.post(`${BASE_PATH}/reorder`, { ids });
    } catch (error) {
      console.error('[equipamientosApi.reorder] Error:', error);
      throw error;
    }
  },

  /**
   * Obtener solo equipamientos activos
   * Wrapper de getAll con filtro activo
   *
   * @returns Array de equipamientos activos
   */
  getActive: async (): Promise<Equipamiento[]> => {
    try {
      const all = await equipamientosApi.getAll();
      return all.filter((eq) => eq.activo);
    } catch (error) {
      console.error('[equipamientosApi.getActive] Error:', error);
      throw error;
    }
  },

  /**
   * Reactivar equipamiento
   * PUT /api/equipamientos/:id con { activo: true }
   *
   * @param id - ID del equipamiento a reactivar
   * @returns Equipamiento reactivado
   */
  reactivate: async (id: number): Promise<Equipamiento> => {
    try {
      const response = await api.put<ApiResponse<Equipamiento>>(
        `${BASE_PATH}/${id}`,
        { activo: true }
      );
      return response.data.data || response.data;
    } catch (error) {
      console.error(`[equipamientosApi.reactivate] Error reactivating ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtener categorías de equipamiento
   * GET /api/catalogos/categorias-equipamiento
   *
   * @returns Array de categorías activas
   */
  getCategorias: async (): Promise<CategoriaEquipamiento[]> => {
    try {
      const response = await api.get<ApiResponse<CategoriaEquipamiento[]>>(
        '/catalogos/categorias-equipamiento'
      );

      // Manejar diferentes formatos de respuesta
      if (response.data.data) {
        return response.data.data;
      }
      // Si el backend devuelve directamente el array
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('[equipamientosApi.getCategorias] Error:', error);
      // Retornar array vacío en caso de error
      return [];
    }
  },

  /**
   * Obtener estados de equipamiento
   * GET /api/catalogos/estados-equipamientos
   * NUEVO: Según guía backend
   *
   * Estados disponibles: NUEVO, USADO, EN_REPARACION, ROTO, DADO_DE_BAJA
   *
   * @returns Array de estados activos
   */
  getEstados: async (): Promise<EstadoEquipamiento[]> => {
    try {
      const response = await api.get<ApiResponse<EstadoEquipamiento[]>>(
        '/catalogos/estados-equipamientos'
      );

      // Manejar diferentes formatos de respuesta
      if (response.data.data) {
        return response.data.data;
      }
      // Si el backend devuelve directamente el array
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('[equipamientosApi.getEstados] Error:', error);
      // Retornar array vacío en caso de error (graceful degradation)
      return [];
    }
  },

  /**
   * Obtener información de disponibilidad de un equipamiento
   * GET /api/equipamientos/:id/disponibilidad
   * NUEVO: Según guía backend
   *
   * Retorna información sobre:
   * - cantidadTotal: Stock total en inventario
   * - cantidadAsignada: Suma de cantidades asignadas en aulas
   * - cantidadDisponible: Total - Asignadas (puede ser negativo si hay déficit)
   * - tieneDeficit: true si cantidadDisponible < 0
   *
   * @param id - ID del equipamiento
   * @returns Equipamiento con información de disponibilidad
   */
  getDisponibilidad: async (id: number): Promise<EquipamientoDisponibilidadResponse['data']> => {
    try {
      const response = await api.get<EquipamientoDisponibilidadResponse>(
        `${BASE_PATH}/${id}/disponibilidad`
      );
      return response.data.data;
    } catch (error) {
      console.error(`[equipamientosApi.getDisponibilidad] Error fetching disponibilidad for ID ${id}:`, error);
      throw error;
    }
  },
};

export default equipamientosApi;
