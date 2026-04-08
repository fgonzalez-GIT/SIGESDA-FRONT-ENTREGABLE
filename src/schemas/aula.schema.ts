import { z } from 'zod';

/**
 * Schemas Zod para validación de Aulas
 *
 * Compatible con Zod v4.
 */

// ==================== SCHEMA DE EQUIPAMIENTO ASIGNADO ====================

/**
 * Schema para equipamiento asignado a un aula
 * Incluye: equipamientoId, cantidad y observaciones opcionales
 */
export const aulaEquipamientoSchema = z.object({
  equipamientoId: z
    .number({
      required_error: 'Debe seleccionar un equipamiento',
      invalid_type_error: 'Equipamiento inválido',
    })
    .int('Equipamiento debe ser un ID válido')
    .positive('Debe seleccionar un equipamiento válido'),

  cantidad: z
    .number({
      required_error: 'La cantidad es requerida',
      invalid_type_error: 'Cantidad debe ser un número',
    })
    .int('Cantidad debe ser un número entero')
    .min(1, 'Cantidad debe ser al menos 1'),

  observaciones: z
    .string()
    .max(500, 'Observaciones no puede exceder 500 caracteres')
    .optional()
    .nullable()
    .transform((val) => (val === '' || val === null ? undefined : val)),
});

// ==================== SCHEMAS DE AULA ====================

/**
 * Schema para crear un aula
 */
export const createAulaSchema = z.object({
  nombre: z
    .string()
    .min(3, 'Nombre debe tener al menos 3 caracteres')
    .max(100, 'Nombre no puede exceder 100 caracteres')
    .trim(),

  descripcion: z
    .string()
    .max(500, 'Descripción no puede exceder 500 caracteres')
    .optional()
    .nullable()
    .transform((val) => (val === '' || val === null ? undefined : val)),

  capacidad: z
    .number({
      required_error: 'La capacidad es requerida',
      invalid_type_error: 'Capacidad debe ser un número',
    })
    .int('Capacidad debe ser un número entero')
    .min(1, 'Capacidad debe ser al menos 1')
    .max(500, 'Capacidad no puede exceder 500 personas'),

  ubicacion: z
    .string()
    .max(200, 'Ubicación no puede exceder 200 caracteres')
    .optional()
    .nullable()
    .transform((val) => (val === '' || val === null ? undefined : val)),

  equipamientos: z
    .array(aulaEquipamientoSchema)
    .optional()
    .default([]),

  tipo: z
    .string({
      required_error: 'El tipo de aula es requerido',
    })
    .min(1, 'Debe seleccionar un tipo de aula'),

  estado: z
    .string()
    .optional()
    .default('disponible'),

  observaciones: z
    .string()
    .max(1000, 'Observaciones no puede exceder 1000 caracteres')
    .optional()
    .nullable()
    .transform((val) => (val === '' || val === null ? undefined : val)),
});

/**
 * Schema para actualizar un aula
 */
export const updateAulaSchema = z.object({
  nombre: z
    .string()
    .min(3, 'Nombre debe tener al menos 3 caracteres')
    .max(100, 'Nombre no puede exceder 100 caracteres')
    .trim()
    .optional(),

  descripcion: z
    .string()
    .max(500, 'Descripción no puede exceder 500 caracteres')
    .optional()
    .nullable()
    .transform((val) => (val === '' || val === null ? undefined : val)),

  capacidad: z
    .number({
      invalid_type_error: 'Capacidad debe ser un número',
    })
    .int('Capacidad debe ser un número entero')
    .min(1, 'Capacidad debe ser al menos 1')
    .max(500, 'Capacidad no puede exceder 500 personas')
    .optional(),

  ubicacion: z
    .string()
    .max(200, 'Ubicación no puede exceder 200 caracteres')
    .optional()
    .nullable()
    .transform((val) => (val === '' || val === null ? undefined : val)),

  equipamientos: z
    .array(aulaEquipamientoSchema)
    .optional(),

  tipo: z
    .string()
    .min(1, 'Debe seleccionar un tipo de aula')
    .optional(),

  estado: z
    .string()
    .optional(),

  observaciones: z
    .string()
    .max(1000, 'Observaciones no puede exceder 1000 caracteres')
    .optional()
    .nullable()
    .transform((val) => (val === '' || val === null ? undefined : val)),

  activa: z.boolean().optional(),
});

// ==================== TIPOS INFERIDOS ====================

export type AulaEquipamientoFormData = z.infer<typeof aulaEquipamientoSchema>;
export type CreateAulaFormData = z.infer<typeof createAulaSchema>;
export type UpdateAulaFormData = z.infer<typeof updateAulaSchema>;
