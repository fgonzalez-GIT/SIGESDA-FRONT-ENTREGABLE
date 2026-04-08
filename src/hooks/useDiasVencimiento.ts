/**
 * Hook personalizado para gestionar días de vencimiento
 *
 * Proporciona una interfaz reactiva para cargar y actualizar la configuración
 * de días de vencimiento desde/hacia el backend.
 *
 * Características:
 * - Carga automática en mount
 * - Gestión de estados: loading, error, data
 * - Método para guardar cambios
 * - Método para refrescar datos
 * - Actualización optimista del estado local
 */

import { useState, useEffect } from 'react';
import { configuracionService } from '@/services/configuracionService';
import type { DiaVencimientoConfig } from '@/types/configuracion.types';

/**
 * Tipo de retorno del hook
 */
interface UseDiasVencimientoReturn {
  /** Configuración actual (null durante carga inicial) */
  config: DiaVencimientoConfig | null;
  /** Indica si está cargando datos del backend */
  loading: boolean;
  /** Mensaje de error si hubo fallo (null si todo OK) */
  error: string | null;
  /** Indica si está guardando cambios */
  saving: boolean;
  /** Guarda los cambios en el backend */
  guardarCambios: (config: DiaVencimientoConfig) => Promise<void>;
  /** Recarga los datos desde el backend */
  refetch: () => Promise<void>;
}

/**
 * Hook para gestionar días de vencimiento de forma reactiva
 *
 * @returns Estado y métodos para interactuar con días de vencimiento
 *
 * @example
 * ```tsx
 * function MiComponente() {
 *   const { config, loading, error, guardarCambios } = useDiasVencimiento();
 *
 *   if (loading) return <div>Cargando...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *
 *   return (
 *     <div>
 *       <p>Día cuota: {config.diaVencimientoCuota}</p>
 *       <button onClick={() => guardarCambios({ ...config, diaVencimientoCuota: 20 })}>
 *         Cambiar a día 20
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useDiasVencimiento(): UseDiasVencimientoReturn {
  const [config, setConfig] = useState<DiaVencimientoConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Cargar configuración desde el backend
   */
  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await configuracionService.getDiasVencimiento();
      setConfig(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar configuración';
      setError(errorMessage);
      console.error('Error en useDiasVencimiento.cargarDatos:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Guardar cambios en el backend
   *
   * Realiza actualización optimista: actualiza el estado local inmediatamente
   * y luego envía al backend. Si falla, revierte el estado.
   *
   * @param newConfig - Nueva configuración a guardar
   * @throws Error si la actualización falla (propagado al componente)
   */
  const guardarCambios = async (newConfig: DiaVencimientoConfig) => {
    const previousConfig = config; // Backup para revertir en caso de error

    try {
      setSaving(true);
      setError(null);

      // Actualización optimista
      setConfig(newConfig);

      // Enviar al backend
      await configuracionService.setDiasVencimiento(newConfig);

      // Éxito: el estado local ya está actualizado
    } catch (err) {
      // Revertir al estado anterior en caso de error
      setConfig(previousConfig);

      const errorMessage =
        err instanceof Error ? err.message : 'Error al guardar configuración';
      setError(errorMessage);

      console.error('Error en useDiasVencimiento.guardarCambios:', err);

      // Re-lanzar error para que el componente pueda manejarlo
      throw err;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Refrescar datos desde el backend
   *
   * Útil para sincronizar después de cambios o errores
   */
  const refetch = async () => {
    await cargarDatos();
  };

  /**
   * Cargar datos en el mount del componente
   */
  useEffect(() => {
    cargarDatos();
  }, []);

  return {
    config,
    loading,
    error,
    saving,
    guardarCambios,
    refetch,
  };
}
