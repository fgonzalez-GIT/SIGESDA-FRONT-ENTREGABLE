import { api, ApiResponse, PaginatedResponse } from './api';

/**
 * Estados de Reservas API Service
 *
 * Endpoints para gestionar el catálogo de estados de reservas.
 * Base URL: /api/catalogos/estados-reservas
 *
 * Estados del sistema:
 * - 1: PENDIENTE (inicial por defecto)
 * - 2: CONFIRMADA
 * - 3: RECHAZADA (final)
 * - 4: CANCELADA (final)
 * - 5: COMPLETADA (final)
 */

export interface EstadoReserva {
  id: number;
  codigo: 'PENDIENTE' | 'CONFIRMADA' | 'RECHAZADA' | 'CANCELADA' | 'COMPLETADA' | string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  orden: number;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    reservas: number;
  };
}

export interface CreateEstadoReservaDto {
  codigo: string; // MAYÚSCULAS con _, max 50
  nombre: string; // max 100
  descripcion?: string; // max 500
  activo?: boolean; // default true
  orden?: number; // >= 0, default 0
}

export interface UpdateEstadoReservaDto {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
  orden?: number;
}

export interface EstadosReservaQueryParams {
  activo?: boolean;
  search?: string; // busca en código y nombre, max 100 chars
  page?: number; // default 1
  limit?: number; // max 100, default 50
  includeInactive?: boolean; // default false
  orderBy?: 'codigo' | 'nombre' | 'orden' | 'created_at'; // default 'orden'
  orderDir?: 'asc' | 'desc'; // default 'asc'
}

export interface EstadisticasUso {
  id: number;
  codigo: string;
  nombre: string;
  totalReservas: number;
  orden: number;
}

const BASE_PATH = '/catalogos/estados-reservas';

const estadosReservasApi = {
  /**
   * 2.1 Crear Estado de Reserva
   * POST /api/catalogos/estados-reservas
   */
  create: async (data: CreateEstadoReservaDto): Promise<EstadoReserva> => {
    const response = await api.post<ApiResponse<EstadoReserva>>(BASE_PATH, data);
    return response.data.data;
  },

  /**
   * 2.2 Listar Estados de Reserva
   * GET /api/catalogos/estados-reservas
   *
   * Con paginación y filtros opcionales
   */
  getAll: async (params?: EstadosReservaQueryParams): Promise<EstadoReserva[]> => {
    const response = await api.get<ApiResponse<EstadoReserva[]>>(BASE_PATH, { params });
    return response.data.data;
  },

  /**
   * 2.3 Obtener Estado por ID
   * GET /api/catalogos/estados-reservas/:id
   */
  getById: async (id: number): Promise<EstadoReserva> => {
    const response = await api.get<ApiResponse<EstadoReserva>>(`${BASE_PATH}/${id}`);
    return response.data.data;
  },

  /**
   * 2.4 Obtener Estado por Código
   * GET /api/catalogos/estados-reservas/codigo/:codigo
   *
   * Ejemplo: /api/catalogos/estados-reservas/codigo/CONFIRMADA
   */
  getByCode: async (codigo: string): Promise<EstadoReserva> => {
    const response = await api.get<ApiResponse<EstadoReserva>>(`${BASE_PATH}/codigo/${codigo}`);
    return response.data.data;
  },

  /**
   * 2.5 Actualizar Estado de Reserva
   * PUT /api/catalogos/estados-reservas/:id
   *
   * Todos los campos son opcionales
   */
  update: async (id: number, data: UpdateEstadoReservaDto): Promise<EstadoReserva> => {
    const response = await api.put<ApiResponse<EstadoReserva>>(`${BASE_PATH}/${id}`, data);
    return response.data.data;
  },

  /**
   * 2.6 Desactivar Estado (Soft Delete)
   * DELETE /api/catalogos/estados-reservas/:id
   *
   * Realiza soft delete (marca activo = false), NO elimina físicamente
   */
  delete: async (id: number): Promise<EstadoReserva> => {
    const response = await api.delete<ApiResponse<EstadoReserva>>(`${BASE_PATH}/${id}`);
    return response.data.data;
  },

  /**
   * 2.7 Reordenar Estados
   * PATCH /api/catalogos/estados-reservas/reorder
   *
   * Actualiza el campo 'orden' de múltiples estados
   * Los IDs deben existir en la base de datos
   */
  reorder: async (ids: number[]): Promise<{ count: number }> => {
    const response = await api.patch<ApiResponse<{ count: number }>>(`${BASE_PATH}/reorder`, { ids });
    return response.data.data;
  },

  /**
   * 2.8 Obtener Estadísticas de Uso
   * GET /api/catalogos/estados-reservas/estadisticas/uso
   *
   * Retorna cantidad de reservas por estado, ordenado por 'orden'
   */
  getEstadisticasUso: async (): Promise<EstadisticasUso[]> => {
    const response = await api.get<ApiResponse<EstadisticasUso[]>>(`${BASE_PATH}/estadisticas/uso`);
    return response.data.data;
  },
};

export default estadosReservasApi;
