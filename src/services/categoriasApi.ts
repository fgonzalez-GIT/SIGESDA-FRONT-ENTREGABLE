import { api, ApiResponse } from './api';
import {
  CategoriaSocio,
  CreateCategoriaDto,
  UpdateCategoriaDto,
  CategoriasListResponse,
  CategoriaStatsResponse,
  CategoriasQueryParams,
} from '../types/categoria.types';

/**
 * API Service para gestión de Categorías de Socios
 * Base URL: /api/categorias-socios
 */
export const categoriasApi = {
  /**
   * Obtener todas las categorías con filtros opcionales
   * GET /api/categorias-socios
   */
  getAll: async (params?: CategoriasQueryParams): Promise<CategoriasListResponse> => {
    const response = await api.get('/categorias-socios', { params });
    return response.data;
  },

  /**
   * Obtener una categoría por ID
   * GET /api/categorias-socios/:id
   */
  getById: async (id: number): Promise<ApiResponse<CategoriaSocio>> => {
    const response = await api.get(`/categorias-socios/${id}`);
    return response.data;
  },

  /**
   * Obtener una categoría por código
   * GET /api/categorias-socios/codigo/:codigo
   */
  getByCodigo: async (codigo: string): Promise<ApiResponse<CategoriaSocio>> => {
    const response = await api.get(`/categorias-socios/codigo/${codigo}`);
    return response.data;
  },

  /**
   * Crear una nueva categoría
   * POST /api/categorias-socios
   */
  create: async (categoria: CreateCategoriaDto): Promise<ApiResponse<CategoriaSocio>> => {
    const response = await api.post('/categorias-socios', categoria);
    return response.data;
  },

  /**
   * Actualizar una categoría existente
   * PUT /api/categorias-socios/:id
   */
  update: async (id: number, categoria: UpdateCategoriaDto): Promise<ApiResponse<CategoriaSocio>> => {
    const response = await api.put(`/categorias-socios/${id}`, categoria);
    return response.data;
  },

  /**
   * Activar/Desactivar una categoría (toggle)
   * PATCH /api/categorias-socios/:id/toggle
   */
  toggle: async (id: number): Promise<ApiResponse<CategoriaSocio>> => {
    const response = await api.patch(`/categorias-socios/${id}/toggle`);
    return response.data;
  },

  /**
   * Reordenar categorías
   * POST /api/categorias-socios/reorder
   */
  reorder: async (categoriaIds: number[]): Promise<ApiResponse<null>> => {
    const response = await api.post('/categorias-socios/reorder', { categoriaIds });
    return response.data;
  },

  /**
   * Obtener estadísticas de una categoría
   * GET /api/categorias-socios/:id/stats
   */
  getStats: async (id: number): Promise<CategoriaStatsResponse> => {
    const response = await api.get(`/categorias-socios/${id}/stats`);
    return response.data;
  },

  /**
   * Eliminar una categoría
   * DELETE /api/categorias-socios/:id
   * Nota: No se puede eliminar si tiene socios o cuotas asociadas
   */
  delete: async (id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/categorias-socios/${id}`);
    return response.data;
  },
};

export default categoriasApi;
