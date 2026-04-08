import { api, ApiResponse } from './api';
import { CategoriaItem, TipoItemCuota } from '@/types/cuota.types';

/**
 * DTOs para operaciones de administración
 */
export interface CreateCategoriaItemDTO {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  icono?: string | null;
  color?: string | null;
  activo?: boolean;
  orden?: number;
}

export interface UpdateCategoriaItemDTO {
  codigo?: string;
  nombre?: string;
  descripcion?: string | null;
  icono?: string | null;
  color?: string | null;
  activo?: boolean;
  orden?: number;
}

export interface CreateTipoItemDTO {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  categoriaItemId: number;
  esCalculado?: boolean;
  formula?: Record<string, any> | null;
  activo?: boolean;
  orden?: number;
  configurable?: boolean;
}

export interface UpdateTipoItemDTO {
  codigo?: string;
  nombre?: string;
  descripcion?: string | null;
  categoriaItemId?: number;
  esCalculado?: boolean;
  formula?: Record<string, any> | null;
  activo?: boolean;
  orden?: number;
  configurable?: boolean;
}

export interface ReordenarDTO {
  ids: number[];
}

export interface EstadisticasCategoriaDTO {
  categoriaId: number;
  categoria: string;
  totalTipos: number;
  tiposActivos: number;
  totalUsosEnCuotas: number;
}

export interface EstadisticasTipoDTO {
  tipoId: number;
  tipo: string;
  categoria: string;
  totalUsosEnCuotas: number;
  totalUsosEnItems: number;
  esCalculado: boolean;
  activo: boolean;
}

export interface ValidacionCodigoDTO {
  disponible: boolean;
  mensaje?: string;
}

/**
 * API de administración de catálogos de ítems de cuotas
 * tipos-items-cuota → /api/catalogos/tipos-items-cuota  (sin /admin, no está montado en catalogo-admin.routes.ts)
 * categorias-items  → /api/admin/catalogos/categorias-items
 */
export const catalogosItemsAdminApi = {
  // ==================== CATEGORÍAS DE ÍTEMS ====================

  /**
   * Crear una nueva categoría de ítem
   * POST /api/admin/catalogos/categorias-items
   */
  createCategoriaItem: async (
    data: CreateCategoriaItemDTO
  ): Promise<ApiResponse<CategoriaItem>> => {
    const response = await api.post<ApiResponse<CategoriaItem>>(
      '/admin/catalogos/categorias-items',
      data
    );
    return response.data;
  },

  /**
   * Actualizar una categoría de ítem existente
   * PUT /api/admin/catalogos/categorias-items/:id
   */
  updateCategoriaItem: async (
    id: number,
    data: UpdateCategoriaItemDTO
  ): Promise<ApiResponse<CategoriaItem>> => {
    const response = await api.put<ApiResponse<CategoriaItem>>(
      `/admin/catalogos/categorias-items/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Eliminar una categoría de ítem
   * DELETE /api/admin/catalogos/categorias-items/:id
   */
  deleteCategoriaItem: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(
      `/admin/catalogos/categorias-items/${id}`
    );
    return response.data;
  },

  /**
   * Reordenar categorías de ítems (drag & drop)
   * PATCH /api/admin/catalogos/categorias-items/reordenar
   */
  reordenarCategoriasItems: async (
    ids: number[]
  ): Promise<ApiResponse<void>> => {
    const response = await api.patch<ApiResponse<void>>(
      '/admin/catalogos/categorias-items/reordenar',
      { ids }
    );
    return response.data;
  },

  /**
   * Obtener estadísticas de uso de categorías
   * GET /api/admin/catalogos/categorias-items/estadisticas
   */
  getEstadisticasCategorias: async (): Promise<
    ApiResponse<EstadisticasCategoriaDTO[]>
  > => {
    const response = await api.get<ApiResponse<EstadisticasCategoriaDTO[]>>(
      '/admin/catalogos/categorias-items/estadisticas'
    );
    return response.data;
  },

  /**
   * Validar si un código de categoría está disponible
   * GET /api/admin/catalogos/categorias-items/validar-codigo/:codigo
   */
  validarCodigoCategoriaItem: async (
    codigo: string,
    idExcluir?: number
  ): Promise<ApiResponse<ValidacionCodigoDTO>> => {
    const params = idExcluir ? { idExcluir } : {};
    const response = await api.get<ApiResponse<ValidacionCodigoDTO>>(
      `/admin/catalogos/categorias-items/validar-codigo/${codigo}`,
      { params }
    );
    return response.data;
  },

  // ==================== TIPOS DE ÍTEMS ====================

  /**
   * Crear un nuevo tipo de ítem
   * POST /api/admin/catalogos/tipos-items-cuota
   */
  createTipoItem: async (
    data: CreateTipoItemDTO
  ): Promise<ApiResponse<TipoItemCuota>> => {
    const response = await api.post<ApiResponse<TipoItemCuota>>(
      '/catalogos/tipos-items-cuota',
      data
    );
    return response.data;
  },

  /**
   * Actualizar un tipo de ítem existente
   * PUT /api/catalogos/tipos-items-cuota/:id
   */
  updateTipoItem: async (
    id: number,
    data: UpdateTipoItemDTO
  ): Promise<ApiResponse<TipoItemCuota>> => {
    const response = await api.put<ApiResponse<TipoItemCuota>>(
      `/catalogos/tipos-items-cuota/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Eliminar un tipo de ítem
   * DELETE /api/catalogos/tipos-items-cuota/:id
   */
  deleteTipoItem: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(
      `/catalogos/tipos-items-cuota/${id}`
    );
    return response.data;
  },

  /**
   * Reordenar tipos de ítems (drag & drop)
   * PATCH /api/catalogos/tipos-items-cuota/reordenar
   */
  reordenarTiposItems: async (ids: number[]): Promise<ApiResponse<void>> => {
    const response = await api.patch<ApiResponse<void>>(
      '/catalogos/tipos-items-cuota/reordenar',
      { ids }
    );
    return response.data;
  },

  /**
   * Obtener estadísticas de uso de tipos de ítems
   * GET /api/catalogos/tipos-items-cuota/estadisticas
   */
  getEstadisticasTipos: async (): Promise<
    ApiResponse<EstadisticasTipoDTO[]>
  > => {
    const response = await api.get<ApiResponse<EstadisticasTipoDTO[]>>(
      '/catalogos/tipos-items-cuota/estadisticas'
    );
    return response.data;
  },

  /**
   * Validar si un código de tipo está disponible
   * GET /api/catalogos/tipos-items-cuota/validar-codigo/:codigo
   */
  validarCodigoTipoItem: async (
    codigo: string,
    idExcluir?: number
  ): Promise<ApiResponse<ValidacionCodigoDTO>> => {
    const params = idExcluir ? { idExcluir } : {};
    const response = await api.get<ApiResponse<ValidacionCodigoDTO>>(
      `/catalogos/tipos-items-cuota/validar-codigo/${codigo}`,
      { params }
    );
    return response.data;
  },

  /**
   * Clonar un tipo de ítem existente
   * POST /api/catalogos/tipos-items-cuota/:id/clonar
   */
  clonarTipoItem: async (
    id: number,
    nuevoCodigo: string,
    nuevoNombre: string
  ): Promise<ApiResponse<TipoItemCuota>> => {
    const response = await api.post<ApiResponse<TipoItemCuota>>(
      `/catalogos/tipos-items-cuota/${id}/clonar`,
      { codigo: nuevoCodigo, nombre: nuevoNombre }
    );
    return response.data;
  },

  /**
   * Obtener relaciones de un tipo de ítem antes de eliminar
   * GET /api/catalogos/tipos-items-cuota/:id/relaciones
   */
  getRelacionesTipoItem: async (
    id: number
  ): Promise<
    ApiResponse<{
      totalItems: number;
      totalCuotasAfectadas: number;
      puedeEliminar: boolean;
    }>
  > => {
    const response = await api.get(
      `/catalogos/tipos-items-cuota/${id}/relaciones`
    );
    return response.data;
  },

  /**
   * Obtener relaciones de una categoría antes de eliminar
   * GET /api/admin/catalogos/categorias-items/:id/relaciones
   */
  getRelacionesCategoriaItem: async (
    id: number
  ): Promise<
    ApiResponse<{
      totalTipos: number;
      totalTiposActivos: number;
      puedeEliminar: boolean;
    }>
  > => {
    const response = await api.get(
      `/admin/catalogos/categorias-items/${id}/relaciones`
    );
    return response.data;
  },
};

export default catalogosItemsAdminApi;
