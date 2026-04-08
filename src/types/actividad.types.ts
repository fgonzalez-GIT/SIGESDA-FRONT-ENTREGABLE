/**
 * Tipos TypeScript para API de Actividades
 * Basados en la documentación oficial del backend
 * @see SIGESDA-BACKEND/docs/API_ACTIVIDADES_GUIA.md
 *
 * IMPORTANTE: Los campos usan camelCase según respuesta real de la API
 */

// ============================================
// CATÁLOGOS
// ============================================

export interface TipoActividad {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  orden: number;
}

export interface CategoriaActividad {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  orden: number;
}

export interface EstadoActividad {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  orden: number;
}

export interface DiaSemana {
  id: number;
  codigo: string;
  nombre: string;
  nombreCorto: string;
  orden: number;
  activo: boolean;
}

export interface RolDocente {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
  activo: boolean;
}

// ============================================
// ESTRUCTURAS ANIDADAS EN ACTIVIDADES
// ============================================

/**
 * Horario de una actividad
 * Según guía: líneas 218-231
 */
export interface HorarioActividad {
  id: number;
  diaSemanaId: number;
  horaInicio: string; // "HH:MM:SS"
  horaFin: string; // "HH:MM:SS"
  activo: boolean;
  diaSemana?: DiaSemana; // ← FIX: Cambiado de diasSemana a diaSemana (singular) para coincidir con backend
}

/**
 * Tipo de persona asignado (simplificado para relaciones)
 */
export interface TipoPersonaAsignado {
  id: number;
  personaId: number;
  tipoPersonaId: number;
  activo: boolean;
  fechaAsignacion: string;
  fechaDesasignacion?: string | null;
  categoriaId?: number | null;
  numeroSocio?: number | null;
  fechaIngreso?: string | null;
  fechaBaja?: string | null;
  motivoBaja?: string | null;
  especialidadId?: number | null;
  honorariosPorHora?: string | null;
  cuit?: string | null;
  observaciones?: string | null;
  createdAt?: string;
  updatedAt?: string;
  razonSocialId?: number | null;
  tipoPersona?: {
    id: number;
    codigo: string;
    nombre: string;
    descripcion?: string | null;
    activo: boolean;
    orden: number;
    requiresCategoria?: boolean;
    requiresEspecialidad?: boolean;
    requiresCuit?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
  categoria?: {
    id: number;
    codigo: string;
    nombre: string;
    descripcion?: string | null;
    montoCuota: string;
    descuento: string;
    activa: boolean;
    orden: number;
    createdAt?: string;
    updatedAt?: string;
  };
}

/**
 * Persona simplificada (incluida en relaciones)
 * Según guía: líneas 240-245, 419-421
 *
 * IMPORTANTE: El backend retorna personas.tipos[] (array de objetos anidados)
 * Se normaliza a personas.tipo (string) en el servicio API para simplificar acceso
 */
export interface PersonaSimple {
  id: number;
  nombre: string;
  apellido: string;
  email?: string | null;
  telefono?: string | null;
  especialidad?: string | null; // Solo para docentes
  tipo?: string; // Campo normalizado: código del primer tipo activo (ej: "SOCIO", "DOCENTE")
  tipos?: TipoPersonaAsignado[]; // Array completo de tipos asignados (estructura original del backend)
}

/**
 * Docente asignado a una actividad
 * Según guía: líneas 232-252
 */
export interface DocenteActividad {
  id: number;
  docenteId: number;
  rolDocenteId: number;
  fechaAsignacion: string; // ISO 8601
  fechaDesasignacion?: string | null; // ISO 8601
  activo: boolean;
  observaciones?: string | null;
  personas?: PersonaSimple;
  rolesDocentes?: RolDocente;
}

/**
 * Participante inscrito en una actividad
 * Según guía: líneas 431-444
 */
export interface ParticipacionActividad {
  id: number;
  personaId: number;
  fechaInicio: string; // ISO 8601
  fechaFin?: string | null; // ISO 8601
  precioEspecial?: number | null;
  activa: boolean;
  observaciones?: string | null;
  personas?: PersonaSimple;
}

// ============================================
// ACTIVIDAD PRINCIPAL
// ============================================

/**
 * Actividad completa
 * Según guía: líneas 185-254 (respuesta CREATE)
 * y líneas 342-452 (respuesta GET detalle)
 */
export interface Actividad {
  id: number;
  codigoActividad: string;
  nombre: string;
  tipoActividadId: number;
  categoriaId: number;
  estadoId: number;
  descripcion?: string | null;
  fechaDesde: string; // ISO 8601
  fechaHasta?: string | null; // ISO 8601
  capacidadMaxima?: number | null; // Nota: API usa "capacidadMaxima"
  costo: number;
  activa: boolean; // Campo para soft delete
  observaciones?: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601

  // Relaciones opcionales (incluidas según endpoint)
  tiposActividades?: TipoActividad;
  categoriasActividades?: CategoriaActividad;
  estadosActividades?: EstadoActividad;
  horarios_actividades?: HorarioActividad[]; // Nota: nombre con guion bajo
  docentes_actividades?: DocenteActividad[];
  participacion_actividades?: ParticipacionActividad[];

  // Conteos opcionales (línea 311-315)
  _count?: {
    horarios_actividades?: number;
    docentes_actividades?: number;
    participacion_actividades?: number;
  };
}

// ============================================
// DTOs - CREATE/UPDATE
// ============================================

/**
 * DTO para crear actividad
 * Según guía: líneas 138-171
 */
export interface CreateActividadDTO {
  codigoActividad?: string;         // OPCIONAL, backend lo genera automáticamente
  nombre: string;                   // REQUERIDO
  tipoActividadId: number;          // REQUERIDO
  categoriaId: number;              // REQUERIDO
  estadoId: number;                 // REQUERIDO
  descripcion?: string;             // OPCIONAL
  fechaDesde: string;               // REQUERIDO, ISO 8601
  fechaHasta?: string;              // OPCIONAL, ISO 8601
  cupoMaximo?: number;              // OPCIONAL (se convierte a capacidadMaxima)
  costo?: number;                   // OPCIONAL (default: 0)
  observaciones?: string;           // OPCIONAL

  // Anidados opcionales
  horarios?: CreateHorarioDTO[];
  docentes?: AsignarDocenteDTO[];
}

/**
 * DTO para actualizar actividad
 * Según guía: líneas 473-501
 *
 * CAMPOS NO ACTUALIZABLES:
 * - codigoActividad (inmutable)
 * - tipoActividadId (inmutable)
 * - categoriaId (inmutable)
 * - fechaDesde (inmutable)
 */
export interface UpdateActividadDTO {
  nombre?: string;
  descripcion?: string;
  estadoId?: number;
  fechaHasta?: string;
  capacidadMaxima?: number;
  costo?: number;
  activa?: boolean; // Para activar/desactivar
  observaciones?: string;
}

/**
 * DTO para crear horario
 * Según guía: líneas 546-553
 */
export interface CreateHorarioDTO {
  diaSemanaId: number;      // REQUERIDO (1-7)
  horaInicio: string;       // REQUERIDO "HH:MM" o "HH:MM:SS"
  horaFin: string;          // REQUERIDO "HH:MM" o "HH:MM:SS"
  activo?: boolean;         // OPCIONAL (default: true)
}

/**
 * DTO para actualizar horario
 * Según guía: líneas 583-591
 */
export interface UpdateHorarioDTO {
  diaSemanaId?: number;
  horaInicio?: string;
  horaFin?: string;
  activo?: boolean;
}

/**
 * DTO para asignar docente
 * Según guía: líneas 671-677
 */
export interface AsignarDocenteDTO {
  docenteId: number;                    // REQUERIDO (persona con tipo DOCENTE)
  rolDocenteId: number;                 // REQUERIDO
  fechaAsignacion?: string;             // OPCIONAL (default: now)
  observaciones?: string;               // OPCIONAL
}

/**
 * DTO para inscribir participante
 * Según guía: líneas 749-756
 */
export interface InscribirParticipanteDTO {
  personaId: number;                    // REQUERIDO
  fechaInicio?: string;                 // OPCIONAL (default: now)
  precioEspecial?: number;              // OPCIONAL
  observaciones?: string;               // OPCIONAL
}

// ============================================
// QUERY PARAMS Y FILTROS
// ============================================

/**
 * Parámetros de consulta para listar actividades
 * Según guía: líneas 270-283
 */
export interface ActividadesQueryParams {
  // Paginación
  page?: number;        // default: 1
  limit?: number;       // default: 20, max: 100

  // Filtros
  tipoActividadId?: number;
  categoriaId?: number;
  estadoId?: number;
  activa?: boolean;
  search?: string;      // Buscar en código o nombre
  fechaDesde?: string;  // Filtrar >= fecha
  fechaHasta?: string;  // Filtrar <= fecha
}

/**
 * Parámetros para buscar por horario
 * Según guía: líneas 886-895
 */
export interface BuscarPorHorarioParams {
  diaSemanaId: number;      // REQUERIDO (1-7)
  horaInicio?: string;      // OPCIONAL "HH:MM"
  horaFin?: string;         // OPCIONAL "HH:MM"
  soloActivas?: boolean;    // OPCIONAL (default: true)
}

/**
 * Parámetros para listar participantes
 * Según guía: líneas 799-806
 */
export interface ParticipantesQueryParams {
  page?: number;
  limit?: number;
  activa?: boolean;
}

// ============================================
// RESPONSES
// ============================================

/**
 * Respuesta paginada genérica
 * Según guía: líneas 286-323
 * NOTA: La API real devuelve "pages" no "totalPages"
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number; // Backend usa "pages" (verificado en respuesta real)
}

/**
 * Estadísticas de una actividad
 * Según guía: líneas 866-880
 */
export interface EstadisticasActividad {
  totalParticipantes: number;      // Participantes activos
  totalHorarios: number;           // Horarios activos
  totalDocentes: number;           // Docentes activos
  cupoMaximo: number;
  cupoDisponible: number;          // cupoMaximo - totalParticipantes
  porcentajeOcupacion: number;     // (totalParticipantes/cupoMaximo) * 100
  estaLlena: boolean;              // totalParticipantes >= cupoMaximo
}

/**
 * Actividad con horarios filtrados
 * Según guía: líneas 900-918
 */
export interface ActividadConHorarios {
  id: number;
  codigoActividad: string;
  nombre: string;
  horarios_actividades: Array<{
    diaSemanaId: number;
    horaInicio: string;
    horaFin: string;
    diasSemana: {
      nombre: string;
    };
  }>;
}

// ============================================
// DOCENTES DISPONIBLES
// ============================================

/**
 * Docente disponible para asignar
 * Según guía: líneas 634-660
 */
export interface DocenteDisponible {
  id: number;
  nombre: string;
  apellido: string;
  email?: string | null;
  telefono?: string | null;
  persona_tipo: Array<{
    tipoPersonaId: number;
    activo: boolean;
    especialidad?: string | null;
    honorariosPorHora?: number | null;
    disponibilidad?: string | null;
    tiposPersona: {
      id: number;
      codigo: string;
      nombre: string;
    };
  }>;
}

// ============================================
// DISPONIBILIDAD DE AULAS
// ============================================

/**
 * DTO para verificar disponibilidad de aula
 * Según guía: líneas 928-939
 */
export interface VerificarDisponibilidadAulaDTO {
  aulaId: string;                          // CUID del aula
  diaSemanaId: number;                     // 1-7
  horaInicio: string;                      // "HH:MM"
  horaFin: string;                         // "HH:MM"
  fechaVigenciaDesde: string;              // ISO 8601
  fechaVigenciaHasta?: string;             // OPCIONAL, ISO 8601
  horarioExcluidoId?: number;              // OPCIONAL (para edición)
}

/**
 * Respuesta de verificación de disponibilidad
 * Según guía: líneas 941-959
 */
export interface DisponibilidadAulaResponse {
  disponible: boolean;
  conflictos: Array<{
    actividadId: number;
    nombreActividad: string;
    horarioId: number;
    diaSemana: string;
    horaInicio: string;
    horaFin: string;
  }>;
}

// ============================================
// UTILIDADES Y HELPERS
// ============================================

/**
 * Formatea una hora a "HH:MM"
 * Maneja tanto formato ISO 8601 ("1970-01-01T10:00:00.000Z") como formato simple ("HH:MM:SS")
 *
 * @param time - Hora en formato ISO 8601 o "HH:MM:SS"
 * @returns Hora en formato "HH:MM"
 *
 * @example
 * formatTime("1970-01-01T10:00:00.000Z") // => "10:00"
 * formatTime("10:00:00") // => "10:00"
 * formatTime("10:00") // => "10:00"
 */
export const formatTime = (time: string | null | undefined): string => {
  if (!time) return '';

  // Detectar si es ISO timestamp (contiene 'T' indicando fecha+hora)
  if (time.includes('T')) {
    // Es ISO 8601: "1970-01-01T10:00:00.000Z"
    // La hora está en posiciones 11-16
    return time.substring(11, 16);
  }

  // Es formato simple: "10:00:00" o "10:00"
  return time.slice(0, 5);
};

/**
 * Extrae HH:MM de un ISO timestamp de hora
 * Ej: "1970-01-01T10:00:00.000Z" -> "10:00"
 */
export const formatTimeFromISO = (isoString: string | null | undefined): string => {
  if (!isoString) return '';
  // La hora está en posiciones 11-16 del ISO timestamp
  return isoString.substring(11, 16);
};

/**
 * Convierte fecha ISO 8601 a "YYYY-MM-DD"
 */
export const formatDate = (date: string | null | undefined): string => {
  if (!date) return '';
  return date.split('T')[0];
};

/**
 * Verifica si una actividad está vigente
 */
export const isActividadVigente = (actividad: Actividad): boolean => {
  const now = new Date();
  const desde = new Date(actividad.fechaDesde);
  const hasta = actividad.fechaHasta ? new Date(actividad.fechaHasta) : null;

  return desde <= now && (!hasta || hasta >= now);
};

/**
 * Calcula el cupo disponible
 */
export const getCupoDisponible = (actividad: Actividad): number | null => {
  if (!actividad.capacidadMaxima) return null;
  const participantes = actividad._count?.participacion_actividades || 0;
  return Math.max(0, actividad.capacidadMaxima - participantes);
};

/**
 * Verifica si tiene cupo disponible
 */
export const hasCupoDisponible = (actividad: Actividad): boolean => {
  const cupoDisponible = getCupoDisponible(actividad);
  return cupoDisponible === null || cupoDisponible > 0;
};
