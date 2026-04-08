/**
 * Servicio API para Participaciones en Actividades
 * Usa los endpoints del módulo de Actividades V2
 */

import { api } from './api';
import type { ParticipacionActividad } from '../types/actividad.types';

// ============================================
// TIPOS
// ============================================

// Reusar el tipo de Actividades
export type Participacion = ParticipacionActividad;

// Interfaz extendida para listados
export interface ParticipacionExtendida extends ParticipacionActividad {
  persona?: {
    id: string;
    nombre: string;
    apellido: string;
    tipo: string;
    email?: string;
  };
  actividad?: {
    id: number;
    codigo_actividad: string;
    nombre: string;
    cupo_maximo?: number;
  };
}

export interface CreateParticipacionDTO {
  persona_id: number; // FK a Persona.id (Int)
  actividad_id: number;
  fecha_inicio: string;
  fecha_fin?: string;
  precio_especial?: number;
  observaciones?: string;
}

export interface InscripcionMultiplePersonasDTO {
  actividadId: number;
  personas: Array<{
    personaId: number;
    fechaInicio: string;
    precioEspecial?: number;
    observaciones?: string;
  }>;
  fechaInicioComun?: string;
  precioEspecialComun?: number;
  observacionesComunes?: string;
}

export interface InscripcionMultiplePersonasResponse {
  success: boolean;
  message: string;
  data: {
    participacionesCreadas: Array<{
      id: number;
      personaNombre: string;
      fecha_inicio: string;
    }>;
    totalCreadas: number;
    totalErrores: number;
    errores: Array<{
      personaId: number;
      error: string;
    }>;
    actividadNombre: string;
  };
}

export interface UpdateParticipacionDTO {
  fecha_inicio?: string;
  fecha_fin?: string;
  precio_especial?: number;
  observaciones?: string;
  activo?: boolean;
}

export interface ParticipacionQueryParams {
  page?: number;
  limit?: number;
  persona_id?: string;
  actividad_id?: number;
  activo?: boolean;
  fecha_desde?: string;
  fecha_hasta?: string;
  incluirRelaciones?: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ============================================
// CRUD BÁSICO (Usa endpoints de Actividades V2)
// ============================================

/**
 * Crea una nueva participación (inscribir persona a actividad)
 * NOTA: Por ahora usa inserción directa hasta que se implemente el endpoint completo
 */
export const crearParticipacion = async (
  data: CreateParticipacionDTO
): Promise<Participacion> => {
  // Usar endpoint directo de participacion con estructura correcta
  const response = await api.post<ApiResponse<Participacion>>(
    `/actividades/${data.actividad_id}/participantes`,
    {
      persona_id: data.persona_id,
      fecha_inicio: data.fecha_inicio,
      observaciones: data.observaciones || null,
      activo: true
    }
  );
  if (!response.data.success) {
    throw new Error(response.data.message || 'Error al crear participación');
  }
  return response.data.data;
};

/**
 * Inscribe múltiples personas a una actividad
 */
export const inscribirMultiplesPersonas = async (
  data: InscripcionMultiplePersonasDTO
): Promise<InscripcionMultiplePersonasResponse> => {
  const response = await api.post<InscripcionMultiplePersonasResponse>(
    `/participacion/inscripcion-multiple-personas`,
    data
  );

  if (!response.data.success && response.data.data.totalCreadas === 0) {
    throw new Error(response.data.message || 'Error al inscribir participantes');
  }

  return response.data;
};

/**
 * Lista todas las participaciones (de todas las actividades)
 * Necesitamos obtener participantes de cada actividad
 */
export const listarParticipaciones = async (
  params?: ParticipacionQueryParams
): Promise<{ data: ParticipacionExtendida[]; total: number }> => {
  // Si hay persona_id, buscar sus participaciones
  if (params?.persona_id) {
    // TODO: Implementar endpoint específico si es necesario
    // Por ahora retornamos array vacío
    return { data: [], total: 0 };
  }

  // Si hay actividad_id, obtener participantes de esa actividad
  if (params?.actividad_id) {
    const response = await api.get<ApiResponse<Participacion[]>>(
      `/actividades/${params.actividad_id}/participantes`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error al obtener participaciones');
    }
    return { data: response.data.data, total: response.data.data.length };
  }

  // Por defecto, retornar vacío (necesitaríamos listar todas las actividades)
  return { data: [], total: 0 };
};

/**
 * Obtiene una participación por ID
 * No hay endpoint directo, usar el de actividad
 */
export const obtenerParticipacionPorId = async (id: number): Promise<Participacion> => {
  throw new Error('Método no implementado - usar obtenerPorActividad');
};

/**
 * Actualiza una participación existente
 * Por ahora no está implementado en Actividades
 */
export const actualizarParticipacion = async (
  id: number,
  data: UpdateParticipacionDTO
): Promise<Participacion> => {
  throw new Error('Método no implementado en Actividades');
};

/**
 * Elimina una participación (dar de baja)
 * NOTA: Requiere tanto el actividadId como el participanteId
 */
export const eliminarParticipacion = async (
  participanteId: number,
  actividadId: number
): Promise<void> => {
  const response = await api.delete<ApiResponse<Participacion>>(
    `/actividades/${actividadId}/participantes/${participanteId}`
  );
  if (!response.data.success) {
    throw new Error(response.data.message || 'Error al eliminar participación');
  }
};

// ============================================
// CONSULTAS ESPECÍFICAS
// ============================================

/**
 * Obtiene las participaciones de una persona
 */
export const obtenerParticipacionesPorPersona = async (
  personaId: string
): Promise<Participacion[]> => {
  const response = await api.get<ApiResponse<Participacion[]>>(
    `/participacion/persona/${personaId}`
  );
  if (!response.data.success) {
    throw new Error(response.data.message || 'Error al obtener participaciones');
  }
  return response.data.data;
};

/**
 * Obtiene las participaciones de una actividad
 */
export const obtenerParticipacionesPorActividad = async (
  actividadId: number
): Promise<Participacion[]> => {
  const response = await api.get<ApiResponse<Participacion[]>>(
    `/actividades/${actividadId}/participantes`
  );
  if (!response.data.success) {
    throw new Error(response.data.message || 'Error al obtener participaciones');
  }
  return response.data.data;
};

/**
 * Obtiene participaciones activas
 * Por ahora retorna vacío, necesitaría implementación específica
 */
export const obtenerParticipacionesActivas = async (
  personaId?: string
): Promise<Participacion[]> => {
  // TODO: Implementar si es necesario
  return [];
};

// ============================================
// OPERACIONES ESPECIALES
// ============================================

/**
 * Desinscribe a un participante de una actividad
 */
export const desinscribirParticipacion = async (
  id: number,
  data: { fecha_fin: string; observaciones?: string }
): Promise<Participacion> => {
  const response = await api.post<ApiResponse<Participacion>>(
    `/participacion/${id}/desinscribir`,
    data
  );
  if (!response.data.success) {
    throw new Error(response.data.message || 'Error al desinscribir');
  }
  return response.data.data;
};

/**
 * Reactiva una participación inactiva
 */
export const reactivarParticipacion = async (id: number): Promise<Participacion> => {
  const response = await api.post<ApiResponse<Participacion>>(
    `/participacion/${id}/reactivar`
  );
  if (!response.data.success) {
    throw new Error(response.data.message || 'Error al reactivar participación');
  }
  return response.data.data;
};

/**
 * Inscripción masiva de personas a una actividad
 */
export const inscripcionMasiva = async (data: {
  actividad_id: number;
  personas_ids: string[];
  fecha_inicio: string;
  precio_especial?: number;
  observaciones?: string;
}): Promise<{
  participacionesCreadas: Participacion[];
  totalCreadas: number;
  totalErrores: number;
  errores: Array<{ persona_id: string; error: string }>;
}> => {
  const response = await api.post<
    ApiResponse<{
      participacionesCreadas: Participacion[];
      totalCreadas: number;
      totalErrores: number;
      errores: Array<{ persona_id: string; error: string }>;
    }>
  >('/participacion/inscripcion-masiva', data);
  if (!response.data.success && response.data.data.totalCreadas === 0) {
    throw new Error(response.data.message || 'Error en inscripción masiva');
  }
  return response.data.data;
};

/**
 * Verifica cupos disponibles para una o más actividades
 */
export const verificarCupos = async (data: {
  actividades_ids: number[];
}): Promise<
  Array<{
    actividad_id: number;
    cupo_maximo: number | null;
    participantes_activos: number;
    cupos_disponibles: number | null;
    tiene_cupo: boolean;
  }>
> => {
  const response = await api.post<
    ApiResponse<
      Array<{
        actividad_id: number;
        cupo_maximo: number | null;
        participantes_activos: number;
        cupos_disponibles: number | null;
        tiene_cupo: boolean;
      }>
    >
  >('/participacion/verificar-cupos', data);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Error al verificar cupos');
  }
  return response.data.data;
};

// ============================================
// EXPORTAR TODO
// ============================================

export const participacionApi = {
  // CRUD
  crear: crearParticipacion,
  listar: listarParticipaciones,
  obtenerPorId: obtenerParticipacionPorId,
  actualizar: actualizarParticipacion,
  eliminar: eliminarParticipacion,

  // Consultas específicas
  obtenerPorPersona: obtenerParticipacionesPorPersona,
  obtenerPorActividad: obtenerParticipacionesPorActividad,
  obtenerActivas: obtenerParticipacionesActivas,

  // Operaciones especiales
  desinscribir: desinscribirParticipacion,
  reactivar: reactivarParticipacion,
  inscripcionMasiva: inscripcionMasiva,
  verificarCupos: verificarCupos,
};

export default participacionApi;
