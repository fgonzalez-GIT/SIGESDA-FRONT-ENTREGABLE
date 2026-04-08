/**
 * Validations para Reservas de Aulas
 *
 * Validaciones de negocio y helpers para el workflow de estados.
 */

import {
  EstadoReservaCodigo,
  TRANSICIONES_PERMITIDAS,
  ESTADOS_FINALES,
  Reserva,
  CreateReservaDto,
} from '@/types/reserva.types';
import { validateDuration, isInPast, doRangesOverlap } from './dateHelpers';

// ==================== VALIDACIONES DE WORKFLOW ====================

/**
 * Verifica si una transición de estado es válida
 */
export function canTransitionState(from: EstadoReservaCodigo, to: EstadoReservaCodigo): boolean {
  return TRANSICIONES_PERMITIDAS[from]?.includes(to) || false;
}

/**
 * Verifica si un estado es final (no permite más transiciones)
 */
export function isEstadoFinal(estado: EstadoReservaCodigo): boolean {
  return ESTADOS_FINALES.includes(estado);
}

/**
 * Obtiene las acciones disponibles según el estado actual
 */
export function getAvailableActions(
  estado: EstadoReservaCodigo,
  reserva?: Reserva
): {
  action: string;
  label: string;
  color: 'primary' | 'success' | 'error' | 'warning' | 'info';
  icon: string;
}[] {
  const actions: any[] = [];

  if (estado === 'PENDIENTE') {
    actions.push(
      { action: 'aprobar', label: 'Aprobar', color: 'success', icon: 'CheckCircle' },
      { action: 'rechazar', label: 'Rechazar', color: 'error', icon: 'Cancel' },
      { action: 'cancelar', label: 'Cancelar', color: 'warning', icon: 'Block' },
      { action: 'editar', label: 'Editar', color: 'primary', icon: 'Edit' }
    );
  } else if (estado === 'CONFIRMADA') {
    // Solo permitir completar si ya finalizó
    if (reserva && new Date(reserva.fechaFin) < new Date()) {
      actions.push({
        action: 'completar',
        label: 'Completar',
        color: 'success',
        icon: 'CheckCircle',
      });
    }
    actions.push(
      { action: 'cancelar', label: 'Cancelar', color: 'warning', icon: 'Block' },
      { action: 'editar', label: 'Editar', color: 'primary', icon: 'Edit' }
    );
  }

  return actions;
}

/**
 * Obtiene el label del próximo estado según la acción
 */
export function getNextEstadoLabel(action: string): string {
  const map: Record<string, string> = {
    aprobar: 'Confirmada',
    rechazar: 'Rechazada',
    cancelar: 'Cancelada',
    completar: 'Completada',
  };
  return map[action] || '';
}

// ==================== VALIDACIONES DE DATOS ====================

/**
 * Valida los datos de creación de una reserva
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateReservaCreation(data: CreateReservaDto): ValidationResult {
  const errors: string[] = [];

  // Validar campos requeridos
  if (!data.aulaId || data.aulaId <= 0) {
    errors.push('Debe seleccionar un aula');
  }

  if (!data.docenteId || data.docenteId <= 0) {
    errors.push('Debe seleccionar un docente');
  }

  if (!data.fechaInicio) {
    errors.push('Debe especificar fecha y hora de inicio');
  }

  if (!data.fechaFin) {
    errors.push('Debe especificar fecha y hora de fin');
  }

  // Si tenemos fechas, validar
  if (data.fechaInicio && data.fechaFin) {
    const inicio = new Date(data.fechaInicio);
    const fin = new Date(data.fechaFin);

    // Validar que inicio < fin
    if (inicio >= fin) {
      errors.push('La fecha de inicio debe ser anterior a la fecha de fin');
    }

    // Validar duración (30 min - 12 horas)
    if (!validateDuration(data.fechaInicio, data.fechaFin)) {
      errors.push('La duración debe estar entre 30 minutos y 12 horas');
    }

    // Validar que no sea en el pasado
    if (isInPast(data.fechaInicio, 1)) {
      // 1 hora de flexibilidad
      errors.push('No se pueden crear reservas en el pasado');
    }
  }

  // Validar observaciones (max 500 caracteres)
  if (data.observaciones && data.observaciones.length > 500) {
    errors.push('Las observaciones no pueden exceder 500 caracteres');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida si una reserva puede ser eliminada
 */
export function canDeleteReserva(reserva: Reserva): ValidationResult {
  const errors: string[] = [];

  // No se pueden eliminar reservas finalizadas (auditoría)
  if (new Date(reserva.fechaFin) < new Date()) {
    errors.push('No se puede eliminar una reserva que ya finalizó');
  }

  // No se pueden eliminar reservas en estados finales (opcional, según reglas)
  if (isEstadoFinal(reserva.estadoReserva?.codigo as EstadoReservaCodigo)) {
    errors.push('No se pueden eliminar reservas en estado final');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida si una reserva puede ser editada
 */
export function canEditReserva(reserva: Reserva): ValidationResult {
  const errors: string[] = [];

  // No se pueden editar reservas en estados finales
  if (isEstadoFinal(reserva.estadoReserva?.codigo as EstadoReservaCodigo)) {
    errors.push('No se pueden editar reservas en estado final');
  }

  // No se pueden editar reservas finalizadas
  if (new Date(reserva.fechaFin) < new Date()) {
    errors.push('No se puede editar una reserva que ya finalizó');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ==================== VALIDACIONES DE CONFLICTOS ====================

/**
 * Verifica conflictos entre reservas (lógica del frontend)
 */
export function hasConflictWithReservas(
  newReserva: {
    aulaId: number;
    fechaInicio: string;
    fechaFin: string;
  },
  existingReservas: Reserva[],
  excludeReservaId?: number
): {
  hasConflict: boolean;
  conflicts: Reserva[];
} {
  const conflicts = existingReservas.filter((reserva) => {
    // Excluir la propia reserva (en caso de edición)
    if (excludeReservaId && reserva.id === excludeReservaId) {
      return false;
    }

    // Solo verificar la misma aula
    if (reserva.aulaId !== newReserva.aulaId) {
      return false;
    }

    // No considerar reservas inactivas (canceladas/rechazadas)
    if (!reserva.activa) {
      return false;
    }

    // Verificar solapamiento de horarios
    return doRangesOverlap(
      newReserva.fechaInicio,
      newReserva.fechaFin,
      reserva.fechaInicio,
      reserva.fechaFin
    );
  });

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

// ==================== HELPERS DE ESTADO ====================

/**
 * Obtiene el color del chip según el estado
 */
export function getEstadoReservaColor(
  codigo: EstadoReservaCodigo | string
): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' {
  const map: Record<string, any> = {
    PENDIENTE: 'warning',
    CONFIRMADA: 'success',
    RECHAZADA: 'error',
    CANCELADA: 'default',
    COMPLETADA: 'info',
  };
  return map[codigo] || 'default';
}

/**
 * Obtiene el icono según el estado
 */
export function getEstadoReservaIcon(codigo: EstadoReservaCodigo | string): string {
  const map: Record<string, string> = {
    PENDIENTE: 'Schedule',
    CONFIRMADA: 'CheckCircle',
    RECHAZADA: 'Cancel',
    CANCELADA: 'Block',
    COMPLETADA: 'TaskAlt',
  };
  return map[codigo] || 'Circle';
}

/**
 * Verifica si una reserva requiere motivo de cancelación
 */
export function requiresMotivo(action: 'rechazar' | 'cancelar'): boolean {
  return true; // Ambas acciones requieren motivo (10-500 caracteres)
}

/**
 * Valida el motivo de cancelación/rechazo
 */
export function validateMotivo(motivo: string): ValidationResult {
  const errors: string[] = [];

  if (!motivo || motivo.trim().length === 0) {
    errors.push('Debe proporcionar un motivo');
  } else if (motivo.trim().length < 10) {
    errors.push('El motivo debe tener al menos 10 caracteres');
  } else if (motivo.length > 500) {
    errors.push('El motivo no puede exceder 500 caracteres');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ==================== HELPERS DE RECURRENCIA ====================

/**
 * Valida los datos de recurrencia
 */
export function validateRecurrencia(recurrencia: {
  tipo: 'DIARIO' | 'SEMANAL' | 'MENSUAL';
  intervalo: number;
  diasSemana?: number[];
  fechaHasta: string;
  maxOcurrencias?: number;
}): ValidationResult {
  const errors: string[] = [];

  // Validar intervalo
  if (recurrencia.intervalo < 1 || recurrencia.intervalo > 12) {
    errors.push('El intervalo debe estar entre 1 y 12');
  }

  // Validar diasSemana para tipo SEMANAL
  if (recurrencia.tipo === 'SEMANAL') {
    if (!recurrencia.diasSemana || recurrencia.diasSemana.length === 0) {
      errors.push('Debe seleccionar al menos un día de la semana');
    } else {
      // Verificar valores válidos (0-6)
      const invalidDays = recurrencia.diasSemana.filter((d) => d < 0 || d > 6);
      if (invalidDays.length > 0) {
        errors.push('Los días de la semana deben estar entre 0 (Domingo) y 6 (Sábado)');
      }
    }
  }

  // Validar maxOcurrencias
  if (recurrencia.maxOcurrencias && recurrencia.maxOcurrencias > 100) {
    errors.push('El máximo de ocurrencias es 100');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Obtiene el nombre del día de la semana
 */
export function getDayName(dayIndex: number): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[dayIndex] || '';
}
