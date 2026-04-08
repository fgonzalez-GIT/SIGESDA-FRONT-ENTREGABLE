/**
 * Schemas de validación con Zod para configuración del sistema
 *
 * Define las reglas de validación para los días de vencimiento,
 * asegurando que los valores estén en el rango permitido (1-28).
 */

import { z } from 'zod';
import { DIA_MIN, DIA_MAX } from '@/types/configuracion.types';

/**
 * Mensajes de error personalizados en español
 */
const errorMessages = {
  required: 'Este campo es requerido',
  invalidType: 'Debe ser un número válido',
  notInteger: 'El valor debe ser un número entero',
  tooSmall: `El día debe ser mayor o igual a ${DIA_MIN}`,
  tooBig: `El día debe ser menor o igual a ${DIA_MAX}`,
};

/**
 * Schema para validar un día de vencimiento individual
 *
 * Validaciones:
 * - Debe ser un número
 * - Debe ser entero
 * - Rango: 1-28 (evita problemas con febrero)
 */
export const diaVencimientoIndividualSchema = z
  .number({
    required_error: errorMessages.required,
    invalid_type_error: errorMessages.invalidType,
  })
  .int(errorMessages.notInteger)
  .min(DIA_MIN, errorMessages.tooSmall)
  .max(DIA_MAX, errorMessages.tooBig);

/**
 * Schema para el formulario completo de días de vencimiento
 *
 * Contiene ambos campos requeridos:
 * - diaVencimientoCuota: Día de vencimiento para cuotas de socios
 * - diaVencimientoPagoActividad: Día de vencimiento para pagos de no socios
 */
export const diaVencimientoSchema = z.object({
  diaVencimientoCuota: diaVencimientoIndividualSchema,
  diaVencimientoPagoActividad: diaVencimientoIndividualSchema,
});

/**
 * Tipo inferido del schema (auto-generado por Zod)
 *
 * Usar este tipo para form data en react-hook-form
 */
export type DiaVencimientoFormData = z.infer<typeof diaVencimientoSchema>;

/**
 * Schema con refinamiento para warnings (opcional, uso futuro)
 *
 * Permite valores 1-31 pero muestra warnings para días > 28
 */
export const diaVencimientoConWarningsSchema = z
  .number()
  .int()
  .min(1, 'Mínimo: día 1')
  .max(31, 'Máximo: día 31')
  .superRefine((val, ctx) => {
    if (val > DIA_MAX) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `⚠️ Advertencia: El día ${val} no existe en todos los meses. Se recomienda usar días entre ${DIA_MIN}-${DIA_MAX}.`,
        fatal: false, // Warning, no error bloqueante
      });
    }
  });
