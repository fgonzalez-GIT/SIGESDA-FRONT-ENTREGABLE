/**
 * Schemas de validación Zod para Actividades
 * Basados en las reglas de negocio de la guía de API
 * @see SIGESDA-BACKEND/docs/API_ACTIVIDADES_GUIA.md
 */

import { z } from 'zod';

// ============================================
// SCHEMAS AUXILIARES
// ============================================

/**
 * Schema para horario de actividad
 * Validaciones según guía línea 176-179
 */
export const horarioSchema = z.object({
  diaSemanaId: z.number()
    .int('Debe ser un número entero')
    .min(1, 'Día de semana debe estar entre 1 y 7')
    .max(7, 'Día de semana debe estar entre 1 y 7'),
  horaInicio: z.string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, 'Formato de hora inválido (HH:MM o HH:MM:SS)'),
  horaFin: z.string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, 'Formato de hora inválido (HH:MM o HH:MM:SS)'),
  activo: z.boolean().optional().default(true),
}).refine(
  (data) => {
    // horaFin debe ser > horaInicio
    const inicio = data.horaInicio.split(':').map(Number);
    const fin = data.horaFin.split(':').map(Number);

    const minutosInicio = inicio[0] * 60 + inicio[1];
    const minutosFin = fin[0] * 60 + fin[1];

    return minutosFin > minutosInicio;
  },
  {
    message: 'La hora de fin debe ser posterior a la hora de inicio',
    path: ['horaFin'],
  }
);

/**
 * Schema para asignar docente
 * Validaciones según guía línea 178, 682-683
 */
export const asignarDocenteSchema = z.object({
  docenteId: z.number()
    .int('Debe ser un número entero')
    .positive('El ID del docente debe ser positivo'),
  rolDocenteId: z.number()
    .int('Debe ser un número entero')
    .positive('El ID del rol debe ser positivo'),
  fechaAsignacion: z.string()
    .datetime('Formato de fecha inválido (ISO 8601)')
    .optional(),
  observaciones: z.string()
    .max(500, 'Las observaciones no pueden exceder 500 caracteres')
    .optional(),
});

// ============================================
// SCHEMA PARA CREAR ACTIVIDAD
// ============================================

/**
 * Schema para crear una nueva actividad
 * Validaciones según guía líneas 138-171, 174-179
 */
export const createActividadSchema = z.object({
  // Campos requeridos
  nombre: z.string()
    .min(1, 'El nombre es requerido')
    .max(200, 'El nombre no puede exceder 200 caracteres'),

  tipoActividadId: z.number()
    .int('Debe ser un número entero')
    .positive('El tipo de actividad es requerido'),

  categoriaId: z.number()
    .int('Debe ser un número entero')
    .positive('La categoría es requerida'),

  estadoId: z.number()
    .int('Debe ser un número entero')
    .positive('El estado es requerido'),

  fechaDesde: z.string()
    .datetime('Formato de fecha inválido (ISO 8601)'),

  // Campos opcionales
  descripcion: z.string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .optional(),

  fechaHasta: z.string()
    .datetime('Formato de fecha inválido (ISO 8601)')
    .optional()
    .nullable(),

  cupoMaximo: z.number()
    .int('Debe ser un número entero')
    .positive('El cupo máximo debe ser un número positivo')
    .optional()
    .nullable(),

  costo: z.number()
    .nonnegative('El costo no puede ser negativo')
    .optional()
    .default(0),

  observaciones: z.string()
    .max(1000, 'Las observaciones no pueden exceder 1000 caracteres')
    .optional(),

  // Anidados opcionales
  horarios: z.array(horarioSchema).optional(),
  docentes: z.array(asignarDocenteSchema).optional(),
}).refine(
  (data) => {
    // fechaHasta debe ser >= fechaDesde si se proporciona
    if (!data.fechaHasta) return true;
    return new Date(data.fechaHasta) >= new Date(data.fechaDesde);
  },
  {
    message: 'La fecha de fin debe ser posterior o igual a la fecha de inicio',
    path: ['fechaHasta'],
  }
);

/**
 * Tipo inferido del schema para usar en formularios
 */
export type CreateActividadFormData = z.infer<typeof createActividadSchema>;

// ============================================
// SCHEMA PARA ACTUALIZAR ACTIVIDAD
// ============================================

/**
 * Schema para actualizar una actividad
 * Validaciones según guía líneas 473-501
 *
 * IMPORTANTE: Campos NO actualizables (línea 487-492):
 * - codigoActividad
 * - tipoActividadId
 * - categoriaId
 * - fechaDesde
 */
export const updateActividadSchema = z.object({
  nombre: z.string()
    .min(1, 'El nombre no puede estar vacío')
    .max(200, 'El nombre no puede exceder 200 caracteres')
    .optional(),

  descripcion: z.string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .optional(),

  estadoId: z.number()
    .int('Debe ser un número entero')
    .positive('El estado debe ser válido')
    .optional(),

  fechaHasta: z.string()
    .datetime('Formato de fecha inválido (ISO 8601)')
    .optional(),

  capacidadMaxima: z.number()
    .int('Debe ser un número entero')
    .positive('La capacidad máxima debe ser un número positivo')
    .optional(),

  costo: z.number()
    .nonnegative('El costo no puede ser negativo')
    .optional(),

  activa: z.boolean().optional(),

  observaciones: z.string()
    .max(1000, 'Las observaciones no pueden exceder 1000 caracteres')
    .optional(),
}).partial(); // Todos los campos son opcionales

/**
 * Tipo inferido del schema
 */
export type UpdateActividadFormData = z.infer<typeof updateActividadSchema>;

// ============================================
// SCHEMA PARA HORARIOS
// ============================================

/**
 * Schema para actualizar horario
 * Validaciones según guía líneas 583-591
 */
export const updateHorarioSchema = z.object({
  diaSemanaId: z.number()
    .int('Debe ser un número entero')
    .min(1, 'Día de semana debe estar entre 1 y 7')
    .max(7, 'Día de semana debe estar entre 1 y 7')
    .optional(),

  horaInicio: z.string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, 'Formato de hora inválido')
    .optional(),

  horaFin: z.string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, 'Formato de hora inválido')
    .optional(),

  activo: z.boolean().optional(),
}).refine(
  (data) => {
    // Solo validar si ambos campos están presentes
    if (!data.horaInicio || !data.horaFin) return true;

    const inicio = data.horaInicio.split(':').map(Number);
    const fin = data.horaFin.split(':').map(Number);

    const minutosInicio = inicio[0] * 60 + inicio[1];
    const minutosFin = fin[0] * 60 + fin[1];

    return minutosFin > minutosInicio;
  },
  {
    message: 'La hora de fin debe ser posterior a la hora de inicio',
    path: ['horaFin'],
  }
);

/**
 * Tipo inferido del schema
 */
export type UpdateHorarioFormData = z.infer<typeof updateHorarioSchema>;

// ============================================
// SCHEMA PARA PARTICIPANTES
// ============================================

/**
 * Schema para inscribir participante
 * Validaciones según guía líneas 749-756
 */
export const inscribirParticipanteSchema = z.object({
  personaId: z.number()
    .int('Debe ser un número entero')
    .positive('El ID de la persona es requerido'),

  fechaInicio: z.string()
    .datetime('Formato de fecha inválido (ISO 8601)')
    .optional(),

  precioEspecial: z.number()
    .nonnegative('El precio especial no puede ser negativo')
    .optional()
    .nullable(),

  observaciones: z.string()
    .max(500, 'Las observaciones no pueden exceder 500 caracteres')
    .optional(),
});

/**
 * Tipo inferido del schema
 */
export type InscribirParticipanteFormData = z.infer<typeof inscribirParticipanteSchema>;

// ============================================
// SCHEMA PARA VERIFICAR DISPONIBILIDAD AULA
// ============================================

/**
 * Schema para verificar disponibilidad de aula
 * Validaciones según guía líneas 928-939
 */
export const verificarDisponibilidadAulaSchema = z.object({
  aulaId: z.string()
    .min(1, 'El ID del aula es requerido'),

  diaSemanaId: z.number()
    .int('Debe ser un número entero')
    .min(1, 'Día de semana debe estar entre 1 y 7')
    .max(7, 'Día de semana debe estar entre 1 y 7'),

  horaInicio: z.string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'),

  horaFin: z.string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'),

  fechaVigenciaDesde: z.string()
    .datetime('Formato de fecha inválido (ISO 8601)'),

  fechaVigenciaHasta: z.string()
    .datetime('Formato de fecha inválido (ISO 8601)')
    .optional(),

  horarioExcluidoId: z.number()
    .int('Debe ser un número entero')
    .positive()
    .optional(),
}).refine(
  (data) => {
    const inicio = data.horaInicio.split(':').map(Number);
    const fin = data.horaFin.split(':').map(Number);

    const minutosInicio = inicio[0] * 60 + inicio[1];
    const minutosFin = fin[0] * 60 + fin[1];

    return minutosFin > minutosInicio;
  },
  {
    message: 'La hora de fin debe ser posterior a la hora de inicio',
    path: ['horaFin'],
  }
).refine(
  (data) => {
    if (!data.fechaVigenciaHasta) return true;
    return new Date(data.fechaVigenciaHasta) >= new Date(data.fechaVigenciaDesde);
  },
  {
    message: 'La fecha de vigencia hasta debe ser posterior o igual a la fecha desde',
    path: ['fechaVigenciaHasta'],
  }
);

/**
 * Tipo inferido del schema
 */
export type VerificarDisponibilidadAulaFormData = z.infer<typeof verificarDisponibilidadAulaSchema>;

// ============================================
// EXPORTS
// ============================================

export default {
  createActividadSchema,
  updateActividadSchema,
  horarioSchema,
  updateHorarioSchema,
  asignarDocenteSchema,
  inscribirParticipanteSchema,
  verificarDisponibilidadAulaSchema,
};
