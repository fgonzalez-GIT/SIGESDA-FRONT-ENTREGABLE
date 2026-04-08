/**
 * Feature Flags Configuration
 *
 * Sistema de feature flags para controlar la disponibilidad de funcionalidades
 * del sistema de Cuotas V2 en el frontend.
 *
 * FASE 1.4: Feature Flags
 * Creado: 2026-01-06
 */

export interface FeatureFlags {
  /** Sistema completo de Cuotas V2 con ítems y motor de reglas */
  CUOTAS_V2: boolean;

  /** Motor de reglas de descuentos automáticos */
  MOTOR_DESCUENTOS: boolean;

  /** Gestión de ajustes manuales a cuotas */
  AJUSTES_MANUALES: boolean;

  /** Sistema de exenciones temporales con workflow de aprobación */
  EXENCIONES: boolean;

  /** Reportes avanzados y estadísticas de cuotas */
  REPORTES_AVANZADOS: boolean;

  /** Generación masiva de cuotas (legacy V1) */
  GENERACION_MASIVA_V1: boolean;

  /** Recálculo y regeneración de cuotas */
  RECALCULO_CUOTAS: boolean;

  /** Historial de cambios en cuotas */
  HISTORIAL_CUOTAS: boolean;
}

/**
 * Configuración de features activos/inactivos
 *
 * Cambiar estos valores permite activar/desactivar funcionalidades
 * sin necesidad de modificar el código de los componentes.
 */
export const FEATURES: FeatureFlags = {
  // ====================================================================
  // FEATURES PRINCIPALES (Probados en FASE 1)
  // ====================================================================

  /**
   * CUOTAS_V2: Sistema completo de Cuotas V2
   *
   * Cuando está ACTIVO:
   * - Usa endpoint POST /api/cuotas/generar-v2
   * - Muestra desglose de ítems en DetalleCuotaModal
   * - Permite gestión de ítems individuales
   *
   * Cuando está INACTIVO:
   * - Usa endpoint legacy POST /api/cuotas/generar
   * - Muestra solo montos totales sin desglose
   */
  CUOTAS_V2: true,  // ✅ Probado en FASE 1.2

  /**
   * MOTOR_DESCUENTOS: Motor de reglas de descuentos automáticos
   *
   * Cuando está ACTIVO:
   * - Aplica reglas de descuento automáticamente en generación
   * - Muestra descuentos aplicados en el desglose
   * - Permite configurar reglas de descuento
   *
   * Requiere: CUOTAS_V2 = true
   */
  MOTOR_DESCUENTOS: true,  // ✅ Probado en FASE 1.2

  /**
   * AJUSTES_MANUALES: Gestión de ajustes manuales
   *
   * Cuando está ACTIVO:
   * - Muestra botón "Gestionar Ajustes" en cuotas
   * - Permite crear/editar/desactivar ajustes
   * - Muestra ajustes aplicados en desglose
   *
   * Requiere: CUOTAS_V2 = true
   * Probado en: FASE 1.3
   */
  AJUSTES_MANUALES: true,  // ✅ Probado en FASE 1.3

  /**
   * EXENCIONES: Sistema de exenciones temporales
   *
   * Cuando está ACTIVO:
   * - Muestra botón "Solicitar Exención"
   * - Workflow de aprobación/rechazo/revocación
   * - Lista de exenciones vigentes y pendientes
   *
   * Requiere: CUOTAS_V2 = true
   * Probado en: FASE 1.3
   */
  EXENCIONES: true,  // ✅ Probado en FASE 1.3

  // ====================================================================
  // FEATURES AVANZADOS (Pendientes de probar)
  // ====================================================================

  /**
   * REPORTES_AVANZADOS: Reportes y estadísticas avanzadas
   *
   * Cuando está ACTIVO:
   * - Muestra dashboard de estadísticas
   * - Exportación avanzada (PDF, Excel)
   * - Gráficos de cobranza y facturación
   */
  REPORTES_AVANZADOS: true,  // ✅ Restaurado

  /**
   * GENERACION_MASIVA_V1: Generación masiva legacy (V1)
   *
   * Cuando está ACTIVO:
   * - Muestra opción de usar generación V1
   * - Útil para migración gradual
   *
   * Recomendación: Desactivar cuando V2 esté estable
   */
  GENERACION_MASIVA_V1: false,  // ❌ Legacy desactivado (por defecto)

  /**
   * RECALCULO_CUOTAS: Recálculo y regeneración
   *
   * Cuando está ACTIVO:
   * - Muestra botón "Recalcular Cuota"
   * - Permite regenerar ítems de cuota
   * - Preview de cambios antes de aplicar
   *
   * Requiere: CUOTAS_V2 = true
   * Probado en: FASE 1.2
   */
  RECALCULO_CUOTAS: true,  // ✅ Probado en FASE 1.2

  /**
   * HISTORIAL_CUOTAS: Historial de cambios
   *
   * Cuando está ACTIVO:
   * - Muestra pestaña "Historial" en DetalleCuotaModal
   * - Registro de todos los cambios en cuotas
   * - Auditoría completa
   */
  HISTORIAL_CUOTAS: true,  // ✅ Restaurado
};

/**
 * Helper function para verificar si una feature está activa
 *
 * Uso:
 * ```tsx
 * import { isFeatureEnabled } from '@/config/features';
 *
 * if (isFeatureEnabled('CUOTAS_V2')) {
 *   // Usar endpoint V2
 * }
 * ```
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return FEATURES[feature] === true;
}

/**
 * Helper function para verificar múltiples features a la vez
 * Retorna true solo si TODAS las features están activas
 *
 * Uso:
 * ```tsx
 * import { areAllFeaturesEnabled } from '@/config/features';
 *
 * if (areAllFeaturesEnabled(['CUOTAS_V2', 'AJUSTES_MANUALES'])) {
 *   // Mostrar UI de ajustes
 * }
 * ```
 */
export function areAllFeaturesEnabled(features: (keyof FeatureFlags)[]): boolean {
  return features.every(feature => FEATURES[feature] === true);
}

/**
 * Helper function para verificar si al menos una feature está activa
 *
 * Uso:
 * ```tsx
 * import { isAnyFeatureEnabled } from '@/config/features';
 *
 * if (isAnyFeatureEnabled(['AJUSTES_MANUALES', 'EXENCIONES'])) {
 *   // Mostrar sección de gestión avanzada
 * }
 * ```
 */
export function isAnyFeatureEnabled(features: (keyof FeatureFlags)[]): boolean {
  return features.some(feature => FEATURES[feature] === true);
}

/**
 * Hook personalizado para React (opcional)
 *
 * Uso:
 * ```tsx
 * import { useFeature } from '@/config/features';
 *
 * const MiComponente = () => {
 *   const isCuotasV2Enabled = useFeature('CUOTAS_V2');
 *
 *   return (
 *     <div>
 *       {isCuotasV2Enabled && <BotonGenerarV2 />}
 *     </div>
 *   );
 * };
 * ```
 */
export function useFeature(feature: keyof FeatureFlags): boolean {
  return isFeatureEnabled(feature);
}

/**
 * Componente de orden superior para renderizado condicional
 *
 * Uso:
 * ```tsx
 * import { withFeature } from '@/config/features';
 *
 * const ComponenteAvanzado = () => <div>Feature V2</div>;
 *
 * export default withFeature('CUOTAS_V2')(ComponenteAvanzado);
 * ```
 */
export function withFeature<P extends object>(
  feature: keyof FeatureFlags
) {
  return (Component: React.ComponentType<P>) => {
    return (props: P) => {
      if (!isFeatureEnabled(feature)) {
        return null;
      }
      return <Component {...props} />;
    };
  };
}

/**
 * Componente de renderizado condicional basado en feature flag
 *
 * Uso:
 * ```tsx
 * import { FeatureFlag } from '@/config/features';
 *
 * <FeatureFlag feature="CUOTAS_V2">
 *   <BotonGenerarV2 />
 * </FeatureFlag>
 *
 * // Con fallback:
 * <FeatureFlag feature="CUOTAS_V2" fallback={<BotonGenerarV1 />}>
 *   <BotonGenerarV2 />
 * </FeatureFlag>
 * ```
 */
export function FeatureFlag({
  feature,
  children,
  fallback = null
}: {
  feature: keyof FeatureFlags;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}): React.ReactElement | null {
  if (isFeatureEnabled(feature)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}

// Export por defecto para importación simplificada
export default FEATURES;
