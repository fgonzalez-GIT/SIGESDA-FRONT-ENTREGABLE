/**
 * Índice Central de Schemas Zod
 * FASE 3: Schemas Zod y Validaciones
 *
 * Este archivo centraliza todas las exportaciones de schemas
 * para facilitar su importación en componentes.
 *
 * Uso:
 * ```typescript
 * import { createCuotaSchema, createAjusteSchema } from '@/schemas';
 * ```
 */

// ============================================================================
// SCHEMAS DE CUOTAS
// ============================================================================

export * from './cuota.schema';

// ============================================================================
// SCHEMAS DE AJUSTES MANUALES
// ============================================================================

export * from './ajuste.schema';

// ============================================================================
// SCHEMAS DE EXENCIONES TEMPORALES
// ============================================================================

export * from './exencion.schema';

// ============================================================================
// SCHEMAS DE ÍTEMS DE CUOTA (CUOTAS V2)
// ============================================================================

export * from './item-cuota.schema';

// ============================================================================
// SCHEMAS EXISTENTES (OTROS MÓDULOS)
// ============================================================================

export * from './actividad.schema';
export * from './aula.schema';
export * from './auth.schema';
export * from './categoria.schema';
export * from './categoriaActividad.schema';
export * from './equipamiento.schema';
export * from './persona.schema';
export * from './reserva.schema';
export * from './tipoActividad.schema';
