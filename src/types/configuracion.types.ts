/**
 * Tipos de configuración del sistema
 *
 * Este módulo define las interfaces y tipos para el sistema de configuración,
 * específicamente para la gestión de días de vencimiento de cuotas y pagos.
 */

/**
 * Tipos de dato soportados por el sistema de configuración
 */
export enum TipoConfiguracion {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
  INTEGER = 'INTEGER',
}

/**
 * Modelo completo de configuración (response del backend)
 */
export interface Configuracion {
  id: number;
  clave: string;
  valor: string; // Siempre string en BD, convertir según tipo
  descripcion?: string;
  tipo: TipoConfiguracion;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO para actualizar configuración
 */
export interface ConfiguracionUpdate {
  valor: string;
  descripcion?: string;
  tipo?: TipoConfiguracion;
}

/**
 * DTO para valor tipado (usado en endpoint /valor/:clave/:tipo)
 */
export interface ConfiguracionValorTipado<T = any> {
  valor: T;
}

/**
 * Response estándar de la API (reutilizado del sistema)
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{
    path: string;
    message: string;
  }>;
}

/**
 * Claves de configuración específicas para días de vencimiento
 */
export const CLAVES_VENCIMIENTO = {
  CUOTA: 'DIA_VENCIMIENTO_CUOTA',
  PAGO_ACTIVIDAD: 'DIA_VENCIMIENTO_PAGO_ACTIVIDAD',
} as const;

/**
 * Tipo derivado de las claves (type-safe)
 */
export type ClaveVencimiento = typeof CLAVES_VENCIMIENTO[keyof typeof CLAVES_VENCIMIENTO];

/**
 * Interface para la configuración de días de vencimiento
 */
export interface DiaVencimientoConfig {
  diaVencimientoCuota: number;
  diaVencimientoPagoActividad: number;
}

/**
 * Constantes para validación de días
 */
export const DIA_MIN = 1;
export const DIA_MAX = 28; // Limitado a 28 para evitar problemas con febrero
