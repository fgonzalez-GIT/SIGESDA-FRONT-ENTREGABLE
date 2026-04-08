import { z } from 'zod';

/**
 * Schema de validación para el formulario de login
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Debe ser un email válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

/**
 * Tipo inferido del schema de login
 */
export type LoginFormData = z.infer<typeof loginSchema>;
