/**
 * Tipos para el sistema de asignación de Aulas a Actividades
 * Basado en la documentación del backend: DOCUMENTACION_FRONTEND_AULAS_ACTIVIDADES.md
 */

import type { Aula } from './aula.types';

/**
 * Asignación de aula a actividad
 * Representa la relación entre una actividad y un aula asignada
 */
export interface ActividadAula {
  id: number;
  actividadId: number;
  aulaId: number;
  fechaAsignacion: string;
  fechaDesasignacion: string | null;
  activa: boolean;
  prioridad: number; // 1 = mayor prioridad
  observaciones?: string;
  actividades?: {
    id: number;
    nombre: string;
    codigoActividad: string;
    capacidadMaxima: number | null;
    activa: boolean;
  };
  aulas: {
    id: number;
    nombre: string;
    capacidad: number;
    ubicacion: string;
    activa: boolean;
    tipoAula?: {
      id: number;
      nombre: string;
      codigo: string;
    };
  };
}

/**
 * Conflicto horario detectado al intentar asignar un aula
 */
export interface ConflictoHorario {
  tipo: 'ACTIVIDAD' | 'RESERVA' | 'SECCION';
  id: number;
  nombre: string;
  diaSemana: string;
  diaSemanaId: number;
  horaInicio: string;
  horaFin: string;
  aulaId: number;
  aulaNombre: string;
}

/**
 * Resultado de verificación de disponibilidad de un aula
 */
export interface DisponibilidadAula {
  disponible: boolean;
  capacidadSuficiente: boolean;
  participantesActuales: number;
  capacidadAula: number;
  conflictos?: ConflictoHorario[];
  observaciones?: string[];
}

/**
 * Sugerencia de aula ordenada por score de idoneidad
 */
export interface SugerenciaAula {
  aula: {
    id: number;
    nombre: string;
    capacidad: number;
    ubicacion: string;
    tipoAula?: {
      id: number;
      nombre: string;
      codigo: string;
    };
  };
  disponible: boolean;
  capacidadSuficiente: boolean;
  tieneEquipamientoRequerido: boolean;
  score: number; // 0-100, donde 100 es la más recomendada
  conflictos: ConflictoHorario[];
}

/**
 * Información de ocupación de un aula
 */
export interface OcupacionAula {
  aula: {
    id: number;
    nombre: string;
    capacidad: number;
    ubicacion: string;
  };
  ocupacion: {
    actividadesActivas: number;
    totalActividades: number;
    reservasPuntuales: number;
    seccionesActivas: number;
    totalAsignaciones: number;
  };
}

/**
 * DTO para asignar un aula a una actividad
 */
export interface AsignarAulaDto {
  aulaId: number;
  prioridad?: number; // Default: 1
  observaciones?: string;
}

/**
 * DTO para verificar disponibilidad de un aula
 */
export interface VerificarDisponibilidadDto {
  aulaId: number;
  excluirAsignacionId?: number; // Usado al editar una asignación existente
}

/**
 * DTO para cambiar el aula de una actividad
 */
export interface CambiarAulaDto {
  nuevaAulaId: number;
  observaciones?: string;
}

/**
 * DTO para desasignar un aula
 */
export interface DesasignarAulaDto {
  fechaDesasignacion?: string; // ISO 8601, default: HOY
  observaciones?: string;
}

/**
 * Respuesta al asignar un aula
 */
export interface AsignarAulaResponse {
  success: boolean;
  message: string;
  data: ActividadAula;
}

/**
 * Respuesta al cambiar aula
 */
export interface CambiarAulaResponse {
  success: boolean;
  message: string;
  data: {
    asignacionAnterior: ActividadAula;
    nuevaAsignacion: ActividadAula;
  };
}

/**
 * Respuesta al listar aulas asignadas
 */
export interface ListarAulasResponse {
  success: boolean;
  data: ActividadAula[];
  total: number;
}

/**
 * Respuesta al obtener sugerencias
 */
export interface SugerenciasAulasResponse {
  success: boolean;
  data: SugerenciaAula[];
  total: number;
}

/**
 * Respuesta al verificar disponibilidad
 */
export interface VerificarDisponibilidadResponse {
  success: boolean;
  data: DisponibilidadAula;
}

/**
 * Respuesta al consultar ocupación
 */
export interface OcupacionAulaResponse {
  success: boolean;
  data: OcupacionAula;
}
