import { api, ApiResponse } from './api';
import type {
  Aula,
  CreateAulaDto,
  UpdateAulaDto,
  AulasQueryParams,
} from '@/types/aula.types';

/**
 * Aulas API Service
 *
 * Endpoints para gestionar aulas del conservatorio.
 * Base URL: /api/aulas
 *
 * Características:
 * - IDs numéricos (no UUIDs)
 * - Equipamiento: Migración de string[] (legacy) a equipamientoIds[] (nuevo)
 * - Estados: disponible, ocupado, mantenimiento, fuera_servicio
 *
 * Migración de equipamientos:
 * - Backend V1: equipamiento como string separado por comas
 * - Backend V2: equipamientoIds[] + relación many-to-many
 * - Frontend maneja ambos formatos durante la transición
 */

const BASE_PATH = '/aulas';

/**
 * Helper: Normaliza respuesta del backend al formato del frontend
 *
 * Maneja múltiples formatos de equipamientos:
 * 1. ✅ CORRECTO: aulas_equipamientos[] (formato actual del backend)
 * 2. Legacy: equipamientos[] expandidos
 * 3. Transición: equipamientoIds[] sin expandir
 * 4. Legacy: equipamiento como string separado por comas
 */
const normalizeAula = (aula: any): Aula => {
  const normalized: Aula = { ...aula };

  // ✅ PRIORIDAD 1: aulas_equipamientos (formato correcto del backend)
  // Estructura: aula.aulas_equipamientos[] con equipamiento anidado
  if (Array.isArray(aula.aulas_equipamientos) && aula.aulas_equipamientos.length > 0) {
    normalized.aulas_equipamientos = aula.aulas_equipamientos;

    // También poblar equipamientos[] para compatibilidad con componentes legacy
    normalized.equipamientos = aula.aulas_equipamientos.map((ae: any) => ae.equipamiento);

    // Poblar equipamientoIds[] para compatibilidad
    normalized.equipamientoIds = aula.aulas_equipamientos.map((ae: any) => ae.equipamientoId);
  }
  // PRIORIDAD 2: Si viene equipamiento expandido (array de objetos), usarlo directamente
  else if (Array.isArray(aula.equipamientos) && aula.equipamientos.length > 0) {
    normalized.equipamientos = aula.equipamientos;
    normalized.equipamientoIds = aula.equipamientos.map((eq: any) => eq.id);
  }
  // PRIORIDAD 3: Si viene equipamientoIds[], usarlo
  else if (Array.isArray(aula.equipamientoIds)) {
    normalized.equipamientoIds = aula.equipamientoIds;
  }
  // LEGACY: Si viene equipamiento como string, parsearlo a array
  else if (typeof aula.equipamiento === 'string' && aula.equipamiento) {
    normalized.equipamiento = aula.equipamiento
      .split(',')
      .map((item: string) => item.trim())
      .filter(Boolean);
  }
  // Si viene equipamiento como array de strings (legacy)
  else if (Array.isArray(aula.equipamiento)) {
    normalized.equipamiento = aula.equipamiento;
  }

  return normalized;
};

/**
 * Helper: Serializa datos del frontend al formato esperado por el backend
 *
 * Prioridad:
 * 1. Si hay equipamientos[] (nuevo formato con cantidad y observaciones), enviarlo
 * 2. Si hay equipamientoIds[] (transición), enviarlo
 * 3. Si hay equipamiento[] (legacy), convertirlo a string para backend V1
 */
const serializeAula = (aula: CreateAulaDto | UpdateAulaDto): any => {
  const serialized: any = { ...aula };

  // NUEVO: Si se proporciona equipamientos[] con cantidad y observaciones
  if (Array.isArray(aula.equipamientos) && aula.equipamientos.length > 0) {
    serialized.equipamientos = aula.equipamientos;
    // Remover formatos anteriores si existen
    delete serialized.equipamientoIds;
    delete serialized.equipamiento;
  }
  // Si se proporciona equipamientos como array vacío, enviar array vacío
  else if (Array.isArray(aula.equipamientos) && aula.equipamientos.length === 0) {
    serialized.equipamientos = [];
    delete serialized.equipamientoIds;
    delete serialized.equipamiento;
  }
  // TRANSICIÓN: Si se proporciona equipamientoIds (formato sin cantidad)
  else if (Array.isArray((aula as any).equipamientoIds)) {
    serialized.equipamientoIds = (aula as any).equipamientoIds;
    // Remover equipamiento legacy si existe
    delete serialized.equipamiento;
  }
  // LEGACY: Si se proporciona equipamiento como array, convertir a string
  else if (Array.isArray((aula as any).equipamiento)) {
    serialized.equipamiento = (aula as any).equipamiento.join(', ');
    delete serialized.equipamientoIds;
  }

  return serialized;
};

const aulasApi = {
  /**
   * Listar Aulas
   * GET /api/aulas
   */
  getAll: async (params?: AulasQueryParams): Promise<Aula[]> => {
    const response = await api.get<ApiResponse<Aula[]>>(BASE_PATH, { params });
    const data = response.data.data || response.data;
    return Array.isArray(data) ? data.map(normalizeAula) : [];
  },

  /**
   * Obtener Aula por ID
   * GET /api/aulas/:id
   */
  getById: async (id: number): Promise<Aula> => {
    const response = await api.get<ApiResponse<Aula>>(`${BASE_PATH}/${id}`);
    return normalizeAula(response.data.data);
  },

  /**
   * Crear Aula
   * POST /api/aulas
   */
  create: async (data: CreateAulaDto): Promise<Aula> => {
    const aulaToSend = serializeAula(data);
    const response = await api.post<ApiResponse<Aula>>(BASE_PATH, aulaToSend);
    return normalizeAula(response.data.data);
  },

  /**
   * Actualizar Aula
   * PUT /api/aulas/:id
   */
  update: async (id: number, data: UpdateAulaDto): Promise<Aula> => {
    const aulaToSend = serializeAula(data);
    const response = await api.put<ApiResponse<Aula>>(`${BASE_PATH}/${id}`, aulaToSend);
    return normalizeAula(response.data.data);
  },

  /**
   * Eliminar Aula
   * DELETE /api/aulas/:id
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },

  /**
   * Obtener Aulas Activas
   * GET /api/aulas?activa=true
   */
  getActivas: async (): Promise<Aula[]> => {
    const response = await api.get<ApiResponse<Aula[]>>(BASE_PATH, {
      params: { activa: true },
    });
    const data = response.data.data || response.data;
    return Array.isArray(data) ? data.map(normalizeAula) : [];
  },

  /**
   * Reactivar Aula
   * PUT /api/aulas/:id con { activa: true }
   */
  reactivate: async (id: number): Promise<Aula> => {
    const response = await api.put<ApiResponse<Aula>>(`${BASE_PATH}/${id}`, { activa: true });
    return normalizeAula(response.data.data);
  },
};

export default aulasApi;
