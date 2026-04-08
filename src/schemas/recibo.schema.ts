import { z } from 'zod';

/**
 * Schema para tipo de medio de pago
 */
export const tipoMedioPagoEnum = z.enum([
  'EFECTIVO',
  'TRANSFERENCIA',
  'TARJETA_DEBITO',
  'TARJETA_CREDITO',
  'CHEQUE',
]);

/**
 * Schema base para un medio de pago
 */
const medioPagoBaseSchema = z.object({
  tipo: tipoMedioPagoEnum,
  importe: z
    .coerce
    .number()
    .min(0.01, 'El importe debe ser mayor a 0')
    .max(999999999, 'El importe es demasiado alto'),
  fecha: z
    .string()
    .min(1, 'La fecha es requerida')
    .refine((date) => {
      // Validar que sea una fecha válida
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Fecha inválida'),
  banco: z.string().optional(),
  numero: z.string().optional(),
});

/**
 * Schema de medio de pago con validaciones condicionales
 * - TRANSFERENCIA, TARJETA_DEBITO, TARJETA_CREDITO: banco/billetera y número requeridos
 * - CHEQUE: número requerido, banco opcional (validado si se proporciona)
 * - EFECTIVO: ambos opcionales
 */
export const medioPagoSchema = medioPagoBaseSchema.superRefine((data, ctx) => {
  // Tipos que requieren banco/billetera Y número (ambos obligatorios)
  const tiposConBancoYNumero: Array<z.infer<typeof tipoMedioPagoEnum>> = [
    'TARJETA_DEBITO',
    'TARJETA_CREDITO',
    'TRANSFERENCIA',
  ];

  // Tipos que requieren número + banco opcional
  const tiposNumeroObligatorioBancoOpcional: Array<z.infer<typeof tipoMedioPagoEnum>> = [
    'CHEQUE',
  ];

  // Validar banco Y número para TRANSFERENCIA y TARJETAS
  if (tiposConBancoYNumero.includes(data.tipo)) {
    // Banco/billetera REQUERIDO
    if (!data.banco || data.banco.trim().length === 0) {
      const label = data.tipo === 'TRANSFERENCIA' ? 'banco o billetera' : 'banco';
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `El ${label} es requerido para ${data.tipo.replace('_', ' ')}`,
        path: ['banco'],
      });
    } else if (data.banco.trim().length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El banco/billetera debe tener al menos 3 caracteres',
        path: ['banco'],
      });
    }

    // Número REQUERIDO
    if (!data.numero || data.numero.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `El número es requerido para ${data.tipo.replace('_', ' ')}`,
        path: ['numero'],
      });
    } else if (data.numero.trim().length < 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El número debe tener al menos 4 caracteres',
        path: ['numero'],
      });
    }
  }

  // Validar CHEQUE: número obligatorio, banco opcional (pero si existe, validar)
  if (tiposNumeroObligatorioBancoOpcional.includes(data.tipo)) {
    // Número REQUERIDO
    if (!data.numero || data.numero.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El número de cheque es requerido',
        path: ['numero'],
      });
    } else if (data.numero.trim().length < 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El número de cheque debe tener al menos 4 caracteres',
        path: ['numero'],
      });
    }

    // Banco OPCIONAL, pero si se proporciona, validar formato
    if (data.banco && data.banco.trim().length > 0 && data.banco.trim().length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El banco debe tener al menos 3 caracteres',
        path: ['banco'],
      });
    }
  }
});

/**
 * Schema para el array de medios de pago
 */
export const mediosPagoArraySchema = z
  .array(medioPagoSchema)
  .min(1, 'Debe agregar al menos un medio de pago')
  .max(5, 'No puede agregar más de 5 medios de pago');

/**
 * Schema completo para procesar pago de recibo
 */
export const procesarPagoSchema = z.object({
  mediosPago: mediosPagoArraySchema,
});

/**
 * Schema para validar que la suma de importes no exceda el saldo pendiente
 * Usar como validación adicional en el componente
 */
export const validarSumaMediosPago = (
  mediosPago: Array<{ importe: number }>,
  saldoPendiente: number
): { valido: boolean; mensaje?: string } => {
  const suma = mediosPago.reduce((total, medio) => total + medio.importe, 0);

  if (suma <= 0) {
    return { valido: false, mensaje: 'El total a pagar debe ser mayor a 0' };
  }

  if (suma > saldoPendiente) {
    return {
      valido: false,
      mensaje: `El total a pagar ($${suma.toFixed(2)}) excede el saldo pendiente ($${saldoPendiente.toFixed(2)})`,
    };
  }

  return { valido: true };
};

/**
 * Tipo inferido para un medio de pago
 */
export type MedioPagoFormData = z.infer<typeof medioPagoSchema>;

/**
 * Tipo inferido para el request de procesar pago
 */
export type ProcesarPagoFormData = z.infer<typeof procesarPagoSchema>;
