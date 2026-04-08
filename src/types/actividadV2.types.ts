/**
 * Tipos específicos para ActividadDetallePageV2
 * Extiende los tipos base de actividad.types.ts
 */

import type { Actividad, DocenteActividad, ParticipacionActividad, HorarioActividad, EstadoActividad } from './actividad.types';

// ============================================
// TIPOS DE INFORMACIÓN RESUMIDA (CARDS)
// ============================================

export interface ActividadClasificacion {
  tipo: {
    id: number;
    nombre: string;
    codigo: string;
  };
  categoria: {
    id: number;
    nombre: string;
    codigo: string;
  };
}

export interface ActividadFechas {
  desde: string;
  hasta: string | null;
}

export interface ActividadCupos {
  actual: number;
  maximo: number | null;
  disponibles: number | null;
  porcentaje: number;
}

export interface ActividadCosto {
  monto: number;
  esGratuita: boolean;
  moneda: string;
}

// ============================================
// TIPOS DE ROL DE PERSONA
// ============================================

export type TipoPersona = 'DOCENTE' | 'SOCIO' | 'NO_SOCIO' | 'ESTUDIANTE';

export interface RolBadgeConfig {
  label: string;
  color: 'error' | 'primary' | 'default' | 'success' | 'info' | 'warning';
  variant: 'filled' | 'outlined';
  icon?: string;
}

export const ROL_BADGE_CONFIG: Record<TipoPersona, RolBadgeConfig> = {
  DOCENTE: {
    label: 'Docente',
    color: 'error',
    variant: 'filled',
    icon: 'School'
  },
  SOCIO: {
    label: 'Socio',
    color: 'primary',
    variant: 'filled',
    icon: 'CardMembership'
  },
  NO_SOCIO: {
    label: 'No Socio',
    color: 'default',
    variant: 'outlined',
    icon: 'Person'
  },
  ESTUDIANTE: {
    label: 'Estudiante',
    color: 'success',
    variant: 'filled',
    icon: 'MenuBook'
  }
};

// ============================================
// PROYECCIÓN DE CUPO
// ============================================

export type NivelOcupacion = 'bajo' | 'medio' | 'alto' | 'critico';

export interface ProyeccionCupo {
  cupoActual: number;
  cupoProyectado: number;
  cupoMaximo: number;
  porcentajeActual: number;
  porcentajeProyectado: number;
  cuposRestantes: number;
  excedeCapacidad: boolean;
  nivelOcupacion: NivelOcupacion;
}

// ============================================
// PESTAÑAS
// ============================================

export type TabValue = 'horarios' | 'docentes' | 'participantes' | 'aulas';

export interface TabConfig {
  value: TabValue;
  label: string;
  icon: string;
  contador?: number;
}

// ============================================
// MODAL DE INSCRIPCIÓN
// ============================================

export type TipoInscripcion = 'masiva' | 'individual';

export interface PersonaSeleccionable {
  id: number;
  nombre: string;
  apellido: string;
  dni?: string;
  tipo: TipoPersona;
  numeroSocio?: string;
  email?: string;
  yaInscrito: boolean;
  seleccionado: boolean;
}

export interface ResultadoInscripcionMasiva {
  totalCreadas: number;
  totalErrores: number;
  participacionesCreadas: Array<{
    id: number;
    personaNombre: string;
    fecha_inicio: string;
  }>;
  errores: Array<{
    personaId: number;
    error: string;
  }>;
  actividadNombre: string;
}

// ============================================
// PROPS DE COMPONENTES V2
// ============================================

export interface ActividadInfoCardsProps {
  clasificacion: ActividadClasificacion;
  fechas: ActividadFechas;
  cupos: ActividadCupos;
  costo: ActividadCosto;
}

export interface ActividadHeaderProps {
  actividadId: number;
  nombre: string;
  codigo: string;
  estado: EstadoActividad;
  onVolver: () => void;
  actividad?: Actividad; // Actividad completa para funcionalidades adicionales (ej: generar PDFs)
}

export interface ProyeccionCupoProps {
  cupoActual: number;
  cupoMaximo: number;
  personasSeleccionadas: number;
  mostrarTextoProyeccion?: boolean;
  mostrarBarraProgreso?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export interface InscripcionMasivaModalProps {
  open: boolean;
  onClose: () => void;
  actividadId: number;
  actividadNombre: string;
  cupoMaximo: number | null;
  cupoActual: number;
  participantesExistentes: number[];
  onSuccess: () => void;
}

export interface InscripcionIndividualModalProps {
  open: boolean;
  onClose: () => void;
  actividadId: number;
  actividadNombre: string;
  costoActividad: number;
  cupoMaximo: number | null;
  cupoActual: number;
  fechaInicioActividad?: string;
  participantesExistentes: number[];
  onSuccess: () => void;
}

// ============================================
// HELPER TYPES
// ============================================

export interface ActividadExtendidaV2 extends Actividad {
  // Propiedades calculadas adicionales
  cuposDisponibles: number | null;
  porcentajeOcupacion: number;
  esGratuita: boolean;

  // Contadores
  totalHorarios: number;
  totalDocentes: number;
  totalParticipantes: number;
}
