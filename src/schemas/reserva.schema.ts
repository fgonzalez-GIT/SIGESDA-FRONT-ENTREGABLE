import { z } from 'zod';

/**
 * Schemas Zod para validación de Reservas de Aulas
 *
 * Basado en la guía API_GUIDE_RESERVAS.md del backend.
 * Compatible con Zod v4.
 */

// ==================== HELPERS DE VALIDACIÓN ====================

/**
 * Valida que una fecha sea ISO 8601 válida
 */
const isoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, 'Fecha debe estar en formato ISO 8601');

/**
 * Valida duración entre 30 minutos y 12 horas
 */
const validateDuration = (fechaInicio: string, fechaFin: string): boolean => {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  const durationMs = fin.getTime() - inicio.getTime();
  const durationMinutes = durationMs / (1000 * 60);

  // Duración mínima: 30 minutos, máxima: 12 horas (720 minutos)
  return durationMinutes >= 30 && durationMinutes <= 720;
};

/**
 * Valida que fechaInicio no esté en el pasado (permite hasta 1h atrás)
 */
const validateNotInPast = (fechaInicio: string): boolean => {
  const inicio = new Date(fechaInicio);
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  return inicio >= oneHourAgo;
};

// ==================== SCHEMAS DE RESERVAS ====================

/**
 * Schema para el formulario de reserva (antes de convertir a ISO 8601)
 * Usa campos separados: fechaDate, horaInicio, horaFin
 */
export const reservaFormSchema = z.object({
  aulaId: z.number().int().positive('Aula requerida'),
  docenteId: z.number().int().positive('Docente requerido'),
  actividadId: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable()
    .or(z.literal(0))
    .transform((val) => (val === 0 || val === null ? undefined : val)),
  fechaDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)'),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida (HH:mm)'),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida (HH:mm)'),
  observaciones: z
    .string()
    .max(500, 'Observaciones no pueden exceder 500 caracteres')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? undefined : val)),
});

/**
 * Schema base para reservas (sin refinements para permitir extend)
 */
const baseReservaSchema = z.object({
  aulaId: z.number().int().positive('Aula requerida'),
  docenteId: z.number().int().positive('Docente requerido'),
  actividadId: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable()
    .or(z.literal(0))
    .transform((val) => (val === 0 || val === null ? undefined : val)),
  estadoReservaId: z
    .number()
    .int()
    .positive()
    .optional()
    .or(z.literal(0))
    .transform((val) => (val === 0 ? undefined : val)),
  fechaInicio: isoDateString,
  fechaFin: isoDateString,
  observaciones: z
    .string()
    .max(500, 'Observaciones no pueden exceder 500 caracteres')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? undefined : val)),
});

/**
 * Schema para crear una reserva (con validaciones)
 */
export const createReservaSchema = baseReservaSchema
  .refine((data) => new Date(data.fechaInicio) < new Date(data.fechaFin), {
    message: 'La fecha de inicio debe ser anterior a la fecha de fin',
    path: ['fechaFin'],
  })
  .refine((data) => validateDuration(data.fechaInicio, data.fechaFin), {
    message: 'La duración debe estar entre 30 minutos y 12 horas',
    path: ['fechaFin'],
  })
  .refine((data) => validateNotInPast(data.fechaInicio), {
    message: 'No se pueden crear reservas en el pasado',
    path: ['fechaInicio'],
  });

/**
 * Schema para actualizar una reserva
 */
export const updateReservaSchema = z
  .object({
    aulaId: z.number().int().positive().optional(),
    docenteId: z.number().int().positive().optional(),
    actividadId: z
      .number()
      .int()
      .positive()
      .optional()
      .nullable()
      .or(z.literal(0))
      .transform((val) => (val === 0 ? null : val)),
    estadoReservaId: z.number().int().positive().optional(),
    fechaInicio: isoDateString.optional(),
    fechaFin: isoDateString.optional(),
    observaciones: z
      .string()
      .max(500)
      .optional()
      .nullable()
      .transform((val) => (val === '' ? undefined : val)),
  })
  .refine(
    (data) => {
      // Si se proporcionan ambas fechas, validar que inicio < fin
      if (data.fechaInicio && data.fechaFin) {
        return new Date(data.fechaInicio) < new Date(data.fechaFin);
      }
      return true;
    },
    {
      message: 'La fecha de inicio debe ser anterior a la fecha de fin',
      path: ['fechaFin'],
    }
  )
  .refine(
    (data) => {
      // Si se proporcionan ambas fechas, validar duración
      if (data.fechaInicio && data.fechaFin) {
        return validateDuration(data.fechaInicio, data.fechaFin);
      }
      return true;
    },
    {
      message: 'La duración debe estar entre 30 minutos y 12 horas',
      path: ['fechaFin'],
    }
  );

// ==================== SCHEMAS DE WORKFLOW ====================

/**
 * Schema para aprobar una reserva
 */
export const aprobarReservaSchema = z.object({
  aprobadoPorId: z.number().int().positive('Persona aprobadora requerida'),
  observaciones: z
    .string()
    .max(500, 'Observaciones no pueden exceder 500 caracteres')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? undefined : val)),
});

/**
 * Schema para rechazar una reserva
 */
export const rechazarReservaSchema = z.object({
  rechazadoPorId: z.number().int().positive('Persona rechazadora requerida'),
  motivo: z
    .string()
    .min(10, 'El motivo debe tener al menos 10 caracteres')
    .max(500, 'El motivo no puede exceder 500 caracteres')
    .trim(),
});

/**
 * Schema para cancelar una reserva
 */
export const cancelarReservaSchema = z.object({
  canceladoPorId: z.number().int().positive('Persona canceladora requerida'),
  motivoCancelacion: z
    .string()
    .min(10, 'El motivo debe tener al menos 10 caracteres')
    .max(500, 'El motivo no puede exceder 500 caracteres')
    .trim(),
});

// ==================== SCHEMAS DE CONFLICTOS ====================

/**
 * Schema para detectar conflictos
 */
export const detectarConflictosSchema = z
  .object({
    aulaId: z.number().int().positive('Aula requerida'),
    fechaInicio: isoDateString,
    fechaFin: isoDateString,
    excludeReservaId: z.number().int().positive().optional(),
  })
  .refine((data) => new Date(data.fechaInicio) < new Date(data.fechaFin), {
    message: 'La fecha de inicio debe ser anterior a la fecha de fin',
    path: ['fechaFin'],
  });

// ==================== SCHEMAS DE OPERACIONES MASIVAS ====================

/**
 * Schema para recurrencia
 */
export const recurrenciaSchema = z
  .object({
    tipo: z.enum(['DIARIO', 'SEMANAL', 'MENSUAL'], {
      errorMap: () => ({ message: 'Tipo de recurrencia inválido' }),
    }),
    intervalo: z
      .number()
      .int()
      .min(1, 'Intervalo mínimo es 1')
      .max(12, 'Intervalo máximo es 12'),
    diasSemana: z
      .array(z.number().int().min(0).max(6))
      .optional()
      .refine(
        (dias) => {
          if (dias && dias.length > 0) {
            // Verificar que no haya duplicados
            return new Set(dias).size === dias.length;
          }
          return true;
        },
        {
          message: 'No puede haber días duplicados',
        }
      ),
    fechaHasta: isoDateString,
    maxOcurrencias: z.number().int().min(1).max(100).optional(),
  })
  .refine(
    (data) => {
      // Si tipo es SEMANAL y se proporcionan diasSemana, validar que tenga al menos 1
      if (data.tipo === 'SEMANAL' && data.diasSemana) {
        return data.diasSemana.length > 0;
      }
      return true;
    },
    {
      message: 'Debe seleccionar al menos un día de la semana',
      path: ['diasSemana'],
    }
  );

/**
 * Schema para crear reservas recurrentes
 * Usa el schema base sin refinements, luego aplica las validaciones
 */
export const createReservasRecurrentesSchema = baseReservaSchema
  .extend({
    recurrencia: recurrenciaSchema,
  })
  .refine((data) => new Date(data.fechaInicio) < new Date(data.fechaFin), {
    message: 'La fecha de inicio debe ser anterior a la fecha de fin',
    path: ['fechaFin'],
  })
  .refine((data) => validateDuration(data.fechaInicio, data.fechaFin), {
    message: 'La duración debe estar entre 30 minutos y 12 horas',
    path: ['fechaFin'],
  })
  .refine((data) => validateNotInPast(data.fechaInicio), {
    message: 'No se pueden crear reservas en el pasado',
    path: ['fechaInicio'],
  });

// ==================== SCHEMAS DE ESTADOS ====================

/**
 * Schema para crear estado de reserva
 */
export const createEstadoReservaSchema = z.object({
  codigo: z
    .string()
    .min(1, 'Código requerido')
    .max(50)
    .regex(/^[A-Z_]+$/, 'Código debe estar en MAYÚSCULAS y usar guiones bajos')
    .trim(),
  nombre: z.string().min(1, 'Nombre requerido').max(100).trim(),
  descripcion: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform((val) => (val === '' ? undefined : val)),
  activo: z.boolean().default(true),
  orden: z.number().int().min(0, 'Orden no puede ser negativo').default(0),
});

/**
 * Schema para actualizar estado de reserva
 */
export const updateEstadoReservaSchema = z.object({
  codigo: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Z_]+$/, 'Código debe estar en MAYÚSCULAS y usar guiones bajos')
    .trim()
    .optional(),
  nombre: z.string().min(1).max(100).trim().optional(),
  descripcion: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform((val) => (val === '' ? undefined : val)),
  activo: z.boolean().optional(),
  orden: z.number().int().min(0).optional(),
});

// ==================== TYPES INFERIDOS ====================

export type CreateReservaFormData = z.infer<typeof createReservaSchema>;
export type UpdateReservaFormData = z.infer<typeof updateReservaSchema>;
export type AprobarReservaFormData = z.infer<typeof aprobarReservaSchema>;
export type RechazarReservaFormData = z.infer<typeof rechazarReservaSchema>;
export type CancelarReservaFormData = z.infer<typeof cancelarReservaSchema>;
export type DetectarConflictosFormData = z.infer<typeof detectarConflictosSchema>;
export type RecurrenciaFormData = z.infer<typeof recurrenciaSchema>;
export type CreateReservasRecurrentesFormData = z.infer<typeof createReservasRecurrentesSchema>;
export type CreateEstadoReservaFormData = z.infer<typeof createEstadoReservaSchema>;
export type UpdateEstadoReservaFormData = z.infer<typeof updateEstadoReservaSchema>;
