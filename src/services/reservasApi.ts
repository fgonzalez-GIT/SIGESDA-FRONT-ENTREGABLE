import { api, ApiResponse, PaginatedResponse } from './api';
import { EstadoReserva } from './estadosReservasApi';

/**
 * Reservas de Aulas API Service
 *
 * Endpoints para gestionar reservas de aulas del conservatorio.
 * Base URL: /api/reservas
 *
 * Características:
 * - IDs numéricos (no UUIDs)
 * - Fechas en ISO 8601 completo con timezone (ej: "2025-11-26T10:00:00.000Z")
 * - Requiere docenteId (persona tipo DOCENTE activa)
 * - Validaciones automáticas de conflictos, duración, entidades
 * - Workflow de estados con transiciones permitidas
 * - Detección de conflictos con reservas puntuales y recurrentes
 */

// ==================== TYPES ====================

export interface Reserva {
  id: number;
  aulaId: number;
  actividadId: number | null;
  docenteId: number; // REQUIRED: persona tipo DOCENTE activa
  estadoReservaId: number;
  fechaInicio: string; // ISO 8601: "2025-11-26T10:00:00.000Z"
  fechaFin: string; // ISO 8601
  observaciones: string | null;
  activa: boolean; // false cuando cancelada/rechazada
  motivoCancelacion: string | null;
  canceladoPorId: number | null;
  aprobadoPorId: number | null;
  createdAt?: string;
  updatedAt?: string;

  // Relaciones (cuando se incluyen)
  aulas?: {
    id: number;
    nombre: string;
    capacidad?: number;
    ubicacion?: string;
    equipamiento?: string;
    activa?: boolean;
  };
  actividades?: {
    id: number;
    nombre: string;
    descripcion?: string;
    activa?: boolean;
  };
  personas?: {
    // docente
    id: number;
    nombre: string;
    apellido: string;
    dni?: string;
    especialidad?: string;
    fechaBaja?: string | null;
    email?: string;
    telefono?: string;
  };
  estadoReserva?: EstadoReserva;
  aprobadoPor?: {
    id: number;
    nombre: string;
    apellido: string;
  };
  canceladoPor?: {
    id: number;
    nombre: string;
    apellido: string;
  };
}

export interface CreateReservaDto {
  aulaId: number; // REQUIRED
  docenteId: number; // REQUIRED: debe ser DOCENTE activo
  actividadId?: number | null; // OPTIONAL
  estadoReservaId?: number; // OPTIONAL: si omite, usa PENDIENTE automáticamente
  fechaInicio: string; // REQUIRED: ISO 8601
  fechaFin: string; // REQUIRED: ISO 8601
  observaciones?: string; // OPTIONAL: max 500 caracteres
}

export interface UpdateReservaDto {
  aulaId?: number;
  docenteId?: number;
  actividadId?: number | null;
  estadoReservaId?: number;
  fechaInicio?: string; // ISO 8601
  fechaFin?: string; // ISO 8601
  observaciones?: string;
}

export interface ReservasQueryParams {
  aulaId?: number;
  actividadId?: number;
  docenteId?: number;
  estadoReservaId?: number;
  fechaDesde?: string; // ISO 8601
  fechaHasta?: string; // ISO 8601
  soloActivas?: boolean; // default true
  incluirPasadas?: boolean; // default false
  page?: number; // default 1
  limit?: number; // max 100, default 10
}

// ==================== WORKFLOW ====================

export interface AprobarReservaDto {
  aprobadoPorId: number; // REQUIRED
  observaciones?: string; // OPTIONAL: max 500
}

export interface RechazarReservaDto {
  rechazadoPorId: number; // REQUIRED
  motivo: string; // REQUIRED: 10-500 caracteres
}

export interface CancelarReservaDto {
  canceladoPorId: number; // REQUIRED
  motivoCancelacion: string; // REQUIRED: 10-500 caracteres
}

// ==================== CONFLICTOS ====================

export interface DetectarConflictosDto {
  aulaId: number; // REQUIRED
  fechaInicio: string; // REQUIRED: ISO 8601
  fechaFin: string; // REQUIRED: ISO 8601
  excludeReservaId?: number; // OPTIONAL: para updates
}

export interface ConflictosResponse {
  hasConflicts: boolean;
  conflicts: Reserva[];
  conflictCount: number;
}

export interface ConflictoRecurrente {
  tipo: 'RECURRENTE';
  seccionId: number;
  aulaId: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  seccion: {
    id: number;
    nombre: string;
    actividades: {
      id: number;
      nombre: string;
    };
  };
  aula: {
    id: number;
    nombre: string;
  };
}

export interface ConflictosAllResponse {
  hasConflicts: boolean;
  puntuales: Reserva[];
  recurrentes: ConflictoRecurrente[];
  totalConflicts: number;
}

export interface DisponibilidadQueryParams {
  aulaId: number; // REQUIRED
  fechaInicio: string; // REQUIRED: ISO 8601
  fechaFin: string; // REQUIRED: ISO 8601
}

export interface DisponibilidadResponse {
  available: boolean;
  conflicts: Reserva[];
}

// ==================== CONSULTAS ESPECIALES ====================

export interface BusquedaAvanzadaParams {
  search: string; // REQUIRED: min 1 char
  searchBy?: 'aula' | 'docente' | 'actividad' | 'observaciones' | 'all'; // default 'all'
  fechaDesde?: string; // ISO 8601
  fechaHasta?: string; // ISO 8601
  incluirPasadas?: boolean; // default false
}

export interface EstadisticasReservasParams {
  fechaDesde: string; // REQUIRED: ISO 8601
  fechaHasta: string; // REQUIRED: ISO 8601
  agruparPor?: 'aula' | 'docente' | 'actividad' | 'dia' | 'mes'; // default 'aula'
}

export interface EstadisticasReservasResponse {
  aulaId?: number;
  docenteId?: number;
  actividadId?: number;
  _count: {
    id: number;
  };
}

export interface DashboardResponse {
  upcoming: Reserva[]; // Próximas 5 reservas
  current: Reserva[]; // Reservas en curso ahora
  weeklyStats: {
    totalReservas: number;
    porEstado: {
      [key: string]: number;
    };
  };
}

// ==================== OPERACIONES MASIVAS ====================

export interface CreateReservasMasivasDto {
  reservas: CreateReservaDto[];
}

export interface ReservasMasivasResponse {
  created: number;
  errors: string[];
}

export interface DeleteReservasMasivasDto {
  ids: number[];
}

export interface RecurrenciaDto {
  tipo: 'DIARIO' | 'SEMANAL' | 'MENSUAL'; // REQUIRED
  intervalo: number; // REQUIRED: 1-12 (cada N días/semanas/meses)
  diasSemana?: number[]; // OPTIONAL: 0-6 (0=Domingo, 6=Sábado) solo para SEMANAL
  fechaHasta: string; // REQUIRED: ISO 8601
  maxOcurrencias?: number; // OPTIONAL: max 100
}

export interface CreateReservasRecurrentesDto extends CreateReservaDto {
  recurrencia: RecurrenciaDto;
}

const BASE_PATH = '/reservas';

const reservasApi = {
  // ==================== CRUD BÁSICO ====================

  /**
   * 3.1 Crear Reserva
   * POST /api/reservas
   *
   * Validaciones automáticas:
   * - Fechas: inicio < fin, no en pasado, duración 30min-12h
   * - Entidades: aula activa, docente DOCENTE activo, actividad activa (si existe)
   * - Conflictos: sin solapamiento de horarios en aula ni docente
   * - Estado: PENDIENTE si no se especifica
   */
  create: async (data: CreateReservaDto): Promise<Reserva> => {
    const response = await api.post<ApiResponse<Reserva>>(BASE_PATH, data);
    return response.data.data;
  },

  /**
   * 3.2 Listar Reservas con Filtros
   * GET /api/reservas
   *
   * Con paginación y múltiples filtros
   */
  getAll: async (params?: ReservasQueryParams): Promise<PaginatedResponse<Reserva>> => {
    const response = await api.get<PaginatedResponse<Reserva>>(BASE_PATH, { params });
    return response.data;
  },

  /**
   * 3.3 Obtener Reserva por ID
   * GET /api/reservas/:id
   *
   * Incluye todas las relaciones completas
   */
  getById: async (id: number): Promise<Reserva> => {
    const response = await api.get<ApiResponse<Reserva>>(`${BASE_PATH}/${id}`);
    return response.data.data;
  },

  /**
   * 3.4 Actualizar Reserva
   * PUT /api/reservas/:id
   *
   * Todos los campos opcionales. Valida conflictos excluyendo la propia reserva.
   */
  update: async (id: number, data: UpdateReservaDto): Promise<Reserva> => {
    const response = await api.put<ApiResponse<Reserva>>(`${BASE_PATH}/${id}`, data);
    return response.data.data;
  },

  /**
   * 3.5 Eliminar Reserva
   * DELETE /api/reservas/:id
   *
   * NO permite eliminar reservas finalizadas (auditoría)
   */
  delete: async (id: number): Promise<Reserva> => {
    const response = await api.delete<ApiResponse<Reserva>>(`${BASE_PATH}/${id}`);
    return response.data.data;
  },

  // ==================== CONSULTAS POR ENTIDAD ====================

  /**
   * 3.6 Reservas por Aula
   * GET /api/reservas/aula/:aulaId
   */
  getByAula: async (aulaId: number, incluirPasadas = false): Promise<Reserva[]> => {
    const response = await api.get<ApiResponse<Reserva[]>>(`${BASE_PATH}/aula/${aulaId}`, {
      params: { incluirPasadas },
    });
    return response.data.data;
  },

  /**
   * 3.7 Reservas por Docente
   * GET /api/reservas/docente/:docenteId
   */
  getByDocente: async (docenteId: number, incluirPasadas = false): Promise<Reserva[]> => {
    const response = await api.get<ApiResponse<Reserva[]>>(`${BASE_PATH}/docente/${docenteId}`, {
      params: { incluirPasadas },
    });
    return response.data.data;
  },

  /**
   * 3.8 Reservas por Actividad
   * GET /api/reservas/actividad/:actividadId
   */
  getByActividad: async (actividadId: number, incluirPasadas = false): Promise<Reserva[]> => {
    const response = await api.get<ApiResponse<Reserva[]>>(
      `${BASE_PATH}/actividad/${actividadId}`,
      {
        params: { incluirPasadas },
      }
    );
    return response.data.data;
  },

  // ==================== WORKFLOW DE ESTADOS ====================

  /**
   * 4.1 Aprobar Reserva
   * POST /api/reservas/:id/aprobar
   *
   * Transición: PENDIENTE → CONFIRMADA
   */
  aprobar: async (id: number, data: AprobarReservaDto): Promise<Reserva> => {
    const response = await api.post<ApiResponse<Reserva>>(`${BASE_PATH}/${id}/aprobar`, data);
    return response.data.data;
  },

  /**
   * 4.2 Rechazar Reserva
   * POST /api/reservas/:id/rechazar
   *
   * Transición: PENDIENTE → RECHAZADA (estado final)
   * Requiere motivo (10-500 caracteres)
   */
  rechazar: async (id: number, data: RechazarReservaDto): Promise<Reserva> => {
    const response = await api.post<ApiResponse<Reserva>>(`${BASE_PATH}/${id}/rechazar`, data);
    return response.data.data;
  },

  /**
   * 4.3 Cancelar Reserva
   * POST /api/reservas/:id/cancelar
   *
   * Transición: PENDIENTE | CONFIRMADA → CANCELADA (estado final)
   * Requiere motivo (10-500 caracteres)
   */
  cancelar: async (id: number, data: CancelarReservaDto): Promise<Reserva> => {
    const response = await api.post<ApiResponse<Reserva>>(`${BASE_PATH}/${id}/cancelar`, data);
    return response.data.data;
  },

  /**
   * 4.4 Completar Reserva
   * POST /api/reservas/:id/completar
   *
   * Transición: CONFIRMADA → COMPLETADA (estado final)
   * Solo si fechaFin < now (ya finalizó)
   */
  completar: async (id: number): Promise<Reserva> => {
    const response = await api.post<ApiResponse<Reserva>>(`${BASE_PATH}/${id}/completar`, {});
    return response.data.data;
  },

  // ==================== DETECCIÓN DE CONFLICTOS ====================

  /**
   * 5.1 Detectar Conflictos (Reservas Puntuales)
   * POST /api/reservas/conflicts/detect
   *
   * Detecta solapamiento solo con reservas puntuales (tabla reserva_aulas)
   */
  detectarConflictos: async (data: DetectarConflictosDto): Promise<ConflictosResponse> => {
    const response = await api.post<ApiResponse<ConflictosResponse>>(
      `${BASE_PATH}/conflicts/detect`,
      data
    );
    return response.data.data;
  },

  /**
   * 5.2 Detectar TODOS los Conflictos (Puntuales + Recurrentes)
   * POST /api/reservas/conflicts/detect-all
   *
   * Detecta conflictos con:
   * - Reservas puntuales (tabla reserva_aulas)
   * - Reservas recurrentes de secciones (tabla reservas_aulas_secciones)
   */
  detectarConflictosAll: async (data: DetectarConflictosDto): Promise<ConflictosAllResponse> => {
    const response = await api.post<ApiResponse<ConflictosAllResponse>>(
      `${BASE_PATH}/conflicts/detect-all`,
      data
    );
    return response.data.data;
  },

  /**
   * 5.3 Verificar Disponibilidad
   * GET /api/reservas/availability/check
   *
   * Verifica si un aula está disponible en un horario
   */
  checkDisponibilidad: async (
    params: DisponibilidadQueryParams
  ): Promise<DisponibilidadResponse> => {
    const response = await api.get<ApiResponse<DisponibilidadResponse>>(
      `${BASE_PATH}/availability/check`,
      { params }
    );
    return response.data.data;
  },

  // ==================== CONSULTAS ESPECIALES ====================

  /**
   * 6.1 Próximas Reservas
   * GET /api/reservas/upcoming/proximas
   *
   * Retorna próximas N reservas ordenadas por fechaInicio ASC
   */
  getProximas: async (limit = 10): Promise<Reserva[]> => {
    const response = await api.get<ApiResponse<Reserva[]>>(`${BASE_PATH}/upcoming/proximas`, {
      params: { limit },
    });
    return response.data.data;
  },

  /**
   * 6.2 Reservas Actuales (En Curso)
   * GET /api/reservas/current/actuales
   *
   * Filtra reservas donde now >= fechaInicio AND now <= fechaFin
   */
  getActuales: async (): Promise<Reserva[]> => {
    const response = await api.get<ApiResponse<Reserva[]>>(`${BASE_PATH}/current/actuales`);
    return response.data.data;
  },

  /**
   * 6.3 Búsqueda Avanzada
   * GET /api/reservas/search/avanzada
   *
   * Busca en múltiples campos según searchBy
   */
  searchAvanzada: async (params: BusquedaAvanzadaParams): Promise<Reserva[]> => {
    const response = await api.get<ApiResponse<Reserva[]>>(`${BASE_PATH}/search/avanzada`, {
      params,
    });
    return response.data.data;
  },

  /**
   * 6.4 Estadísticas
   * GET /api/reservas/stats/reservas
   *
   * Genera estadísticas de uso agrupadas por criterio
   */
  getEstadisticas: async (
    params: EstadisticasReservasParams
  ): Promise<EstadisticasReservasResponse[]> => {
    const response = await api.get<ApiResponse<EstadisticasReservasResponse[]>>(
      `${BASE_PATH}/stats/reservas`,
      { params }
    );
    return response.data.data;
  },

  /**
   * 6.5 Dashboard (Vista Combinada)
   * GET /api/reservas/dashboard/resumen
   *
   * Combina: próximas, actuales, y estadísticas semanales
   */
  getDashboard: async (): Promise<DashboardResponse> => {
    const response = await api.get<ApiResponse<DashboardResponse>>(
      `${BASE_PATH}/dashboard/resumen`
    );
    return response.data.data;
  },

  // ==================== OPERACIONES MASIVAS ====================

  /**
   * 7.1 Crear Reservas Masivas
   * POST /api/reservas/bulk/create
   *
   * Valida cada reserva individualmente. Si alguna falla, las demás se crean igual.
   * Response 201 (éxito total) o 207 (éxito parcial con errores)
   */
  createMasivas: async (data: CreateReservasMasivasDto): Promise<ReservasMasivasResponse> => {
    const response = await api.post<ApiResponse<ReservasMasivasResponse>>(
      `${BASE_PATH}/bulk/create`,
      data
    );
    return response.data.data;
  },

  /**
   * 7.2 Eliminar Reservas Masivas
   * DELETE /api/reservas/bulk/delete
   *
   * NO elimina reservas finalizadas. Si alguna es inválida, falla toda la operación (transacción).
   */
  deleteMasivas: async (data: DeleteReservasMasivasDto): Promise<{ count: number }> => {
    const response = await api.delete<ApiResponse<{ count: number }>>(
      `${BASE_PATH}/bulk/delete`,
      { data }
    );
    return response.data.data;
  },

  /**
   * 7.3 Crear Reservas Recurrentes
   * POST /api/reservas/recurring/create
   *
   * Genera múltiples reservas según patrón de recurrencia.
   * Valida conflictos en cada ocurrencia generada.
   * Response 201 (éxito total) o 207 (con conflictos omitidos)
   */
  createRecurrentes: async (
    data: CreateReservasRecurrentesDto
  ): Promise<ReservasMasivasResponse> => {
    const response = await api.post<ApiResponse<ReservasMasivasResponse>>(
      `${BASE_PATH}/recurring/create`,
      data
    );
    return response.data.data;
  },
};

export default reservasApi;
