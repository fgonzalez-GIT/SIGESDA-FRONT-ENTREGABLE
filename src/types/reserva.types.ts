/**
 * Types para el módulo de Reservas de Aulas
 *
 * Basado en la guía API_GUIDE_RESERVAS.md del backend.
 * Todos los IDs son números (no UUIDs).
 * Fechas en formato ISO 8601 completo con timezone.
 */

import { Aula } from './aula.types';

// ==================== ESTADOS DE RESERVAS ====================

export type EstadoReservaCodigo =
  | 'PENDIENTE' // Estado inicial (ID: 1)
  | 'CONFIRMADA' // Aprobada (ID: 2)
  | 'RECHAZADA' // Estado final (ID: 3)
  | 'CANCELADA' // Estado final (ID: 4)
  | 'COMPLETADA'; // Estado final (ID: 5)

export interface EstadoReserva {
  id: number;
  codigo: EstadoReservaCodigo | string;
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

// ==================== RESERVAS ====================

export interface Reserva {
  id: number;
  aulaId: number;
  actividadId: number | null;
  docenteId: number; // REQUIRED: persona tipo DOCENTE activa
  estadoReservaId: number;
  fechaInicio: string; // ISO 8601: "2025-11-26T10:00:00.000Z"
  fechaFin: string; // ISO 8601: "2025-11-26T12:00:00.000Z"
  observaciones: string | null;
  activa: boolean; // false cuando cancelada/rechazada
  motivoCancelacion: string | null;
  canceladoPorId: number | null;
  aprobadoPorId: number | null;
  createdAt?: string;
  updatedAt?: string;

  // Relaciones (cuando se incluyen)
  aula?: Aula;
  actividades?: {
    id: number;
    nombre: string;
    descripcion?: string;
    activa?: boolean;
  };
  personas?: Persona; // docente
  estadoReserva?: EstadoReserva;
  aprobadoPor?: PersonaBasic;
  canceladoPor?: PersonaBasic;
}

export interface Persona {
  id: number;
  nombre: string;
  apellido: string;
  dni?: string;
  especialidad?: string;
  fechaBaja?: string | null;
  email?: string;
  telefono?: string;
}

export interface PersonaBasic {
  id: number;
  nombre: string;
  apellido: string;
}

// ==================== DTOs ====================

export interface CreateReservaDto {
  aulaId: number; // REQUIRED
  docenteId: number; // REQUIRED: debe ser DOCENTE activo
  actividadId?: number; // OPTIONAL: si omite, queda sin actividad (backend NO acepta null)
  estadoReservaId?: number; // OPTIONAL: si omite, usa PENDIENTE
  fechaInicio: string; // REQUIRED: ISO 8601
  fechaFin: string; // REQUIRED: ISO 8601
  observaciones?: string; // OPTIONAL: max 500 caracteres
}

export interface UpdateReservaDto {
  aulaId?: number;
  docenteId?: number;
  actividadId?: number; // OPTIONAL: backend NO acepta null
  estadoReservaId?: number;
  fechaInicio?: string;
  fechaFin?: string;
  observaciones?: string;
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

export interface DisponibilidadResponse {
  available: boolean;
  conflicts: Reserva[];
}

// ==================== CONSULTAS ====================

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

// ==================== WORKFLOW HELPERS ====================

/**
 * Mapa de transiciones permitidas por estado
 */
export const TRANSICIONES_PERMITIDAS: Record<EstadoReservaCodigo, EstadoReservaCodigo[]> = {
  PENDIENTE: ['CONFIRMADA', 'RECHAZADA', 'CANCELADA'],
  CONFIRMADA: ['COMPLETADA', 'CANCELADA'],
  RECHAZADA: [], // Estado final
  CANCELADA: [], // Estado final
  COMPLETADA: [], // Estado final
};

/**
 * Estados finales (no permiten más transiciones)
 */
export const ESTADOS_FINALES: EstadoReservaCodigo[] = ['RECHAZADA', 'CANCELADA', 'COMPLETADA'];

/**
 * Verifica si una transición de estado es válida
 */
export function canTransitionState(from: EstadoReservaCodigo, to: EstadoReservaCodigo): boolean {
  return TRANSICIONES_PERMITIDAS[from]?.includes(to) || false;
}

/**
 * Obtiene las acciones disponibles según el estado actual
 */
export function getAvailableActions(estado: EstadoReservaCodigo): string[] {
  const actions: string[] = [];

  if (estado === 'PENDIENTE') {
    actions.push('aprobar', 'rechazar', 'cancelar', 'editar');
  } else if (estado === 'CONFIRMADA') {
    actions.push('completar', 'cancelar', 'editar');
  }

  return actions;
}

/**
 * Verifica si un estado es final
 */
export function isEstadoFinal(estado: EstadoReservaCodigo): boolean {
  return ESTADOS_FINALES.includes(estado);
}
