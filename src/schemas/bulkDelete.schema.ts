import { z } from 'zod';

/**
 * Schema para validar request de bulk delete
 *
 * Reglas según /SIGESDA-BACKEND/docs/API_BULK_DELETE.md:
 * - Mínimo 1 ID, máximo 100
 * - Solo números enteros positivos
 * - Sin duplicados
 */
export const bulkDeleteRequestSchema = z.object({
  ids: z
    .array(
      z.number().int().positive({
        message: 'Los IDs deben ser números enteros positivos'
      })
    )
    .min(1, { message: 'Debes seleccionar al menos un registro' })
    .max(100, { message: 'No puedes eliminar más de 100 registros a la vez' })
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'No puede haber IDs duplicados'
    })
});

export type BulkDeleteRequestData = z.infer<typeof bulkDeleteRequestSchema>;

/**
 * Schema para validar selección frontend antes de enviar
 * Incluye confirmación explícita del usuario
 */
export const bulkDeleteSelectionSchema = z.object({
  selectedIds: z
    .array(z.number())
    .min(1, { message: 'Debes seleccionar al menos un registro' }),
  confirmDelete: z
    .boolean()
    .refine((val) => val === true, {
      message: 'Debes confirmar la eliminación'
    })
});

export type BulkDeleteSelectionData = z.infer<typeof bulkDeleteSelectionSchema>;

/**
 * Schema para validar array de IDs simple (helper)
 * Usado para validación rápida sin objeto wrapper
 */
export const idsArraySchema = z
  .array(z.number().int().positive())
  .min(1)
  .max(100)
  .refine((ids) => new Set(ids).size === ids.length, {
    message: 'No puede haber IDs duplicados'
  });

export type IdsArray = z.infer<typeof idsArraySchema>;

/**
 * Validar IDs antes de enviar al backend
 * @param ids - Array de IDs a validar
 * @returns true si es válido, lanza error si no
 */
export const validateBulkDeleteIds = (ids: number[]): boolean => {
  bulkDeleteRequestSchema.parse({ ids });
  return true;
};

/**
 * Validar IDs de forma segura sin lanzar error
 * @param ids - Array de IDs a validar
 * @returns objeto con success y error
 */
export const safeBulkDeleteValidation = (ids: number[]): {
  success: boolean;
  error?: string;
} => {
  const result = bulkDeleteRequestSchema.safeParse({ ids });

  if (result.success) {
    return { success: true };
  }

  // Extraer primer error (Zod v4 uses 'issues' instead of 'errors')
  const firstIssue = result.error.issues?.[0];
  return {
    success: false,
    error: firstIssue?.message || result.error.message
  };
};
