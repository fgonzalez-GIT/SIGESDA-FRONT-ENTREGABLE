import { z } from 'zod';

/**
 * Schemas Zod para validación de Equipamientos
 *
 * Compatible con Zod v4.
 */

// ==================== SCHEMAS DE EQUIPAMIENTO ====================

/**
 * Schema para crear un equipamiento
 * Nota: El código es autogenerado por el backend
 */
export const createEquipamientoSchema = z.object({
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

  observaciones: z
    .string()
    .max(1000, 'Observaciones no puede exceder 1000 caracteres')
    .optional()
    .nullable()
    .transform((val) => (val === '' || val === null ? undefined : val)),

  categoriaEquipamientoId: z
    .number({
      required_error: 'Debe seleccionar una categoría',
      invalid_type_error: 'Categoría inválida',
    })
    .int('Categoría debe ser un ID válido')
    .positive('Debe seleccionar una categoría'),

  // NUEVO: Estado del equipamiento (opcional, nullable)
  estadoEquipamientoId: z
    .number({
      invalid_type_error: 'Estado inválido',
    })
    .int('Estado debe ser un ID válido')
    .positive('Debe seleccionar un estado')
    .optional(),

  // NUEVO: Cantidad/stock total (default: 1 en backend si no se envía)
  cantidad: z
    .number({
      invalid_type_error: 'Cantidad debe ser un número',
    })
    .int('Cantidad debe ser un número entero')
    .min(1, 'Cantidad debe ser al menos 1')
    .optional()
    .default(1),
});

/**
 * Schema para actualizar un equipamiento
 * Nota: El código no se puede modificar una vez creado
 */
export const updateEquipamientoSchema = z.object({
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

  observaciones: z
    .string()
    .max(1000, 'Observaciones no puede exceder 1000 caracteres')
    .optional()
    .nullable()
    .transform((val) => (val === '' || val === null ? undefined : val)),

  categoriaEquipamientoId: z
    .number({
      invalid_type_error: 'Categoría inválida',
    })
    .int('Categoría debe ser un ID válido')
    .positive('Debe seleccionar una categoría')
    .optional(),

  // NUEVO: Actualizar estado del equipamiento
  estadoEquipamientoId: z
    .number({
      invalid_type_error: 'Estado inválido',
    })
    .int('Estado debe ser un ID válido')
    .positive('Debe seleccionar un estado')
    .optional(),

  // NUEVO: Actualizar cantidad/stock total
  cantidad: z
    .number({
      invalid_type_error: 'Cantidad debe ser un número',
    })
    .int('Cantidad debe ser un número entero')
    .min(1, 'Cantidad debe ser al menos 1')
    .optional(),

  activo: z.boolean().optional(),
});

// ==================== SCHEMA DE QUERY PARAMS ====================

/**
 * Schema para parámetros de búsqueda
 */
export const equipamientoQuerySchema = z.object({
  includeInactive: z.boolean().optional(),
  search: z.string().optional(),
  categoriaId: z.number().optional(),
  estadoEquipamientoId: z.number().optional(), // NUEVO: Filtrar por estado
  conStock: z.boolean().optional(), // NUEVO: Solo equipamiento con cantidad > 0
});

// ==================== TIPOS INFERIDOS ====================

export type CreateEquipamientoFormData = z.infer<typeof createEquipamientoSchema>;
export type UpdateEquipamientoFormData = z.infer<typeof updateEquipamientoSchema>;
export type EquipamientoQueryFormData = z.infer<typeof equipamientoQuerySchema>;
