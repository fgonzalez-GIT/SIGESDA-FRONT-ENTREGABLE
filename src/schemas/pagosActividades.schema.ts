import { z } from 'zod';

/**
 * Schema para generación de pagos mensuales
 */
export const generarPagosActividadesSchema = z.object({
  mes: z
    .number()
    .int('El mes debe ser un número entero')
    .min(1, 'El mes debe estar entre 1 y 12')
    .max(12, 'El mes debe estar entre 1 y 12'),

  anio: z
    .number()
    .int('El año debe ser un número entero')
    .min(2020, 'El año debe ser mayor o igual a 2020')
    .max(2030, 'El año debe ser menor o igual a 2030'),

  observaciones: z
    .string()
    .max(500, 'Las observaciones no pueden exceder 500 caracteres')
    .optional(),
});

export type GenerarPagosActividadesFormData = z.infer<typeof generarPagosActividadesSchema>;

/**
 * Schema para generación de pagos retroactivos
 */
export const generarPagosRetroactivosSchema = z
  .object({
    desde: z.object({
      mes: z.number().int().min(1).max(12),
      anio: z.number().int().min(2020).max(2030),
    }),
    hasta: z.object({
      mes: z.number().int().min(1).max(12),
      anio: z.number().int().min(2020).max(2030),
    }),
  })
  .refine(
    (data) => {
      const fechaInicio = data.desde.anio * 12 + data.desde.mes;
      const fechaFin = data.hasta.anio * 12 + data.hasta.mes;
      return fechaInicio <= fechaFin;
    },
    {
      message: 'La fecha "desde" debe ser anterior o igual a la fecha "hasta"',
      path: ['hasta'],
    }
  );

export type GenerarPagosRetroactivosFormData = z.infer<typeof generarPagosRetroactivosSchema>;

/**
 * Schema para filtros de consulta
 */
export const filtrosPagosActividadesSchema = z.object({
  mes: z.number().int().min(1).max(12).optional(),
  anio: z.number().int().min(2020).max(2030).optional(),
  personaId: z.number().int().positive().optional(),
  actividadId: z.number().int().positive().optional(),
  estado: z.enum(['PENDIENTE', 'PAGADO', 'VENCIDO', 'CANCELADO']).optional(),
  page: z.number().int().positive().default(1).optional(),
  limit: z.union([z.number().int().positive(), z.literal('all')]).default(10).optional(),
});

export type FiltrosPagosActividadesFormData = z.infer<typeof filtrosPagosActividadesSchema>;

/**
 * Schema para eliminar un pago
 */
export const deletePagoActividadSchema = z.object({
  id: z.number().int().positive({ message: 'El ID del pago debe ser un número positivo' }),
  confirmar: z.boolean().refine((val) => val === true, {
    message: 'Debe confirmar la eliminación',
  }),
});

export type DeletePagoActividadFormData = z.infer<typeof deletePagoActividadSchema>;

/**
 * Schema para exportación
 */
export const exportarPagosSchema = z.object({
  mes: z.number().int().min(1).max(12).optional(),
  anio: z.number().int().min(2020).max(2030).optional(),
  personaId: z.number().int().positive().optional(),
  actividadId: z.number().int().positive().optional(),
  estado: z.enum(['PENDIENTE', 'PAGADO', 'VENCIDO', 'CANCELADO']).optional(),
  formato: z.enum(['excel', 'csv']).default('excel'),
});

export type ExportarPagosFormData = z.infer<typeof exportarPagosSchema>;
