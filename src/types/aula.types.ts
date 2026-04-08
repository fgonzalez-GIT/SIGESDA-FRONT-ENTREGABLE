/**
 * Types para el módulo de Aulas
 *
 * Aulas del conservatorio con capacidad, equipamiento y estados de disponibilidad.
 */

import type { Equipamiento } from './equipamiento.types';
import type { TipoAula as TipoAulaCatalogo, EstadoAula as EstadoAulaCatalogo } from '@/services/catalogosAulasApi';

// Re-export interfaces de catálogos
export type { TipoAula as TipoAulaCatalogo, EstadoAula as EstadoAulaCatalogo } from '@/services/catalogosAulasApi';

/**
 * @deprecated Legacy string types - Use TipoAulaCatalogo interface instead
 */
export type TipoAulaLegacy = 'salon' | 'ensayo' | 'auditorio' | 'exterior';

/**
 * @deprecated Legacy string types - Use EstadoAulaCatalogo interface instead
 */
export type EstadoAulaLegacy = 'disponible' | 'ocupado' | 'mantenimiento' | 'fuera_servicio';

/**
 * Equipamiento asignado a un aula con cantidad y observaciones
 * (Para requests POST/PUT al backend)
 */
export interface AulaEquipamiento {
  equipamientoId: number;
  cantidad: number;
  observaciones?: string;
}

/**
 * Equipamiento detallado de un aula tal como viene del backend
 * (Para responses GET con equipamientos expandidos)
 *
 * Estructura real del backend:
 * aula.aulas_equipamientos[] → objeto con equipamiento anidado
 */
export interface AulaEquipamientoDetalle {
  id: number;
  aulaId: number;
  equipamientoId: number;
  cantidad: number;
  observaciones?: string | null;
  equipamiento: Equipamiento; // ← Objeto anidado con datos completos
  createdAt?: string;
  updatedAt?: string;
}

export interface Aula {
  id: number;
  nombre: string;
  descripcion?: string;
  capacidad: number;
  ubicacion?: string;

  // ==================== TIPO Y ESTADO (IDs + Objetos Expandidos) ====================
  tipoAulaId?: number | null; // ID del tipo de aula (FK)
  estadoAulaId?: number | null; // ID del estado de aula (FK)

  tipoAula?: TipoAulaCatalogo | null; // Objeto expandido con relación
  estadoAula?: EstadoAulaCatalogo | null; // Objeto expandido con relación

  // DEPRECATED: Legacy string fields (backward compatibility)
  tipo?: TipoAulaLegacy;
  estado?: EstadoAulaLegacy;

  // ==================== EQUIPAMIENTOS ====================
  // ✅ CAMPO CORRECTO DEL BACKEND (recomendado)
  // Equipamientos expandidos tal como vienen del backend (con cantidad, observaciones, etc.)
  aulas_equipamientos?: AulaEquipamientoDetalle[];

  // TRANSICIÓN: IDs de equipamientos asignados (para requests POST/PUT)
  equipamientoIds?: number[];

  // DEPRECATED: Array de strings (legacy, para compatibilidad temporal)
  // Será removido en futuras versiones
  equipamiento?: string[];

  // DEPRECATED: Campo legacy - Usar aulas_equipamientos en su lugar
  // El backend retorna aulas_equipamientos, NO equipamientos
  equipamientos?: Equipamiento[];

  // ==================== METADATA ====================
  observaciones?: string;
  fechaCreacion: string;
  createdAt?: string;
  updatedAt?: string;
  activa?: boolean; // Para compatibilidad con backend
}

export interface CreateAulaDto {
  nombre: string; // REQUIRED
  descripcion?: string;
  capacidad: number; // REQUIRED
  ubicacion?: string;
  equipamientos?: AulaEquipamiento[]; // Array de equipamientos con cantidad y observaciones

  // Usar IDs numéricos (recomendado)
  tipoAulaId?: number; // ID del tipo de aula
  estadoAulaId?: number; // ID del estado de aula (default: disponible)

  // O usar códigos string (backend convierte automáticamente)
  tipo?: string; // Código del tipo (ej: 'ensayo', 'teoria')
  estado?: string; // Código del estado (ej: 'disponible', 'reservada')

  observaciones?: string;
}

export interface UpdateAulaDto {
  nombre?: string;
  descripcion?: string;
  capacidad?: number;
  ubicacion?: string;
  equipamientos?: AulaEquipamiento[]; // Array de equipamientos con cantidad y observaciones

  // Usar IDs numéricos (recomendado)
  tipoAulaId?: number; // ID del tipo de aula
  estadoAulaId?: number; // ID del estado de aula

  // O usar códigos string (backend convierte automáticamente)
  tipo?: string; // Código del tipo
  estado?: string; // Código del estado

  observaciones?: string;
}

export interface AulasQueryParams {
  tipo?: string;
  estado?: string;
  capacidadMin?: number;
  capacidadMax?: number;
  equipamiento?: string;
  activa?: boolean;
  page?: number;
  limit?: number;
}

// ==================== UI HELPERS ====================

export const TIPOS_AULA: { value: TipoAulaLegacy; label: string }[] = [
  { value: 'salon', label: 'Salón' },
  { value: 'ensayo', label: 'Sala de Ensayo' },
  { value: 'auditorio', label: 'Auditorio' },
  { value: 'exterior', label: 'Exterior' },
];

export const ESTADOS_AULA: { value: EstadoAulaLegacy; label: string; color: string }[] = [
  { value: 'disponible', label: 'Disponible', color: 'success' },
  { value: 'ocupado', label: 'Ocupado', color: 'warning' },
  { value: 'mantenimiento', label: 'En Mantenimiento', color: 'info' },
  { value: 'fuera_servicio', label: 'Fuera de Servicio', color: 'error' },
];

/**
 * @deprecated Lista hardcodeada de equipamientos (legacy)
 * Usar el módulo de Equipamientos (/admin/aulas/equipamientos) en su lugar
 * Será removido en futuras versiones
 */
export const EQUIPAMIENTO_DISPONIBLE = [
  'Piano',
  'Proyector',
  'Sistema de Audio',
  'Micrófono',
  'Pizarra',
  'Atriles',
  'Sillas',
  'Mesas',
  'Aire Acondicionado',
  'Calefacción',
];

/**
 * Obtiene el label de un tipo de aula
 */
export function getTipoAulaLabel(tipo: TipoAulaLegacy): string {
  return TIPOS_AULA.find((t) => t.value === tipo)?.label || tipo;
}

/**
 * Obtiene el label de un estado de aula
 */
export function getEstadoAulaLabel(estado: EstadoAulaLegacy): string {
  return ESTADOS_AULA.find((e) => e.value === estado)?.label || estado;
}

/**
 * Obtiene el color de chip para un estado de aula
 */
export function getEstadoAulaColor(
  estado: EstadoAulaLegacy
): 'success' | 'warning' | 'info' | 'error' | 'default' {
  const estadoObj = ESTADOS_AULA.find((e) => e.value === estado);
  return (estadoObj?.color as any) || 'default';
}
