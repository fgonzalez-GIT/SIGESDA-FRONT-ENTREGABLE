import { z } from 'zod';

/**
 * Schema de validación para Tipo de Actividad
 * Utiliza Zod para validación en formularios
 */
export const tipoActividadSchema = z.object({
  codigo: z
    .string()
    .min(2, 'El código debe tener al menos 2 caracteres')
    .max(20, 'El código no puede exceder 20 caracteres')
    .regex(
      /^[A-Z0-9_-]+$/,
      'El código solo puede contener letras mayúsculas, números, guiones (-) y guiones bajos (_)'
    )
    .trim(),

  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),

  descripcion: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .nullable(),

  orden: z
    .number()
    .int('El orden debe ser un número entero')
    .min(0, 'El orden no puede ser negativo')
    .optional(),
});

/**
 * Schema para edición (incluye campo activo)
 */
export const tipoActividadEditSchema = tipoActividadSchema.extend({
  activo: z.boolean(),
});

/**
 * Tipo inferido del schema (para TypeScript)
 */
export type TipoActividadSchemaType = z.infer<typeof tipoActividadSchema>;
export type TipoActividadEditSchemaType = z.infer<typeof tipoActividadEditSchema>;
