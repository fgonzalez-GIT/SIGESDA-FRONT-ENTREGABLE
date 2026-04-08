/**
 * Custom hooks para gestión de aulas en actividades
 * Siguiendo el patrón de useActividades.ts
 */

import { useState, useEffect, useCallback } from 'react';
import { actividadesAulasApi } from '@/services/actividadesAulasApi';
import type {
  ActividadAula,
  AsignarAulaDto,
  CambiarAulaDto,
  DesasignarAulaDto,
  DisponibilidadAula,
  SugerenciaAula,
  VerificarDisponibilidadDto,
} from '@/types/actividad-aula.types';

/**
 * Hook para obtener lista de aulas asignadas a una actividad
 * Similar a useDocentesActividad
 *
 * @param actividadId - ID de la actividad
 * @param soloActivas - Si true, solo devuelve asignaciones activas
 * @returns Aulas, loading, error y función refetch
 */
export function useAulasActividad(actividadId: number, soloActivas: boolean = true) {
  const [aulas, setAulas] = useState<ActividadAula[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAulas = useCallback(async () => {
    if (!actividadId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await actividadesAulasApi.listarAulasAsignadas(
        actividadId,
        soloActivas
      );
      setAulas(response.data || []);
    } catch (err: any) {
      console.error('Error al cargar aulas:', err);
      setError(err.response?.data?.error || 'Error al cargar aulas');
      setAulas([]);
    } finally {
      setLoading(false);
    }
  }, [actividadId, soloActivas]);

  useEffect(() => {
    fetchAulas();
  }, [fetchAulas]);

  return {
    aulas,
    loading,
    error,
    refetch: fetchAulas,
  };
}

/**
 * Hook para operaciones de escritura (asignar, cambiar, desasignar)
 * Similar a useActividadMutations
 *
 * @param actividadId - ID de la actividad
 * @param onSuccess - Callback ejecutado tras operación exitosa
 * @returns Funciones de mutación, loading y error
 */
export function useAulasMutations(actividadId: number, onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const asignar = async (data: AsignarAulaDto): Promise<ActividadAula | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await actividadesAulasApi.asignarAula(actividadId, data);
      if (onSuccess) onSuccess();
      return response.data;
    } catch (err: any) {
      console.error('Error al asignar aula:', err);
      const errorMsg = err.response?.data?.error || 'Error al asignar aula';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const cambiar = async (
    aulaIdActual: number,
    data: CambiarAulaDto
  ): Promise<{ asignacionAnterior: ActividadAula; nuevaAsignacion: ActividadAula } | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await actividadesAulasApi.cambiarAula(
        actividadId,
        aulaIdActual,
        data
      );
      if (onSuccess) onSuccess();
      return response.data;
    } catch (err: any) {
      console.error('Error al cambiar aula:', err);
      const errorMsg = err.response?.data?.error || 'Error al cambiar aula';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const desasignar = async (
    asignacionId: number,
    data?: DesasignarAulaDto
  ): Promise<ActividadAula | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await actividadesAulasApi.desasignarAula(asignacionId, data);
      if (onSuccess) onSuccess();
      return response.data;
    } catch (err: any) {
      console.error('Error al desasignar aula:', err);
      const errorMsg = err.response?.data?.error || 'Error al desasignar aula';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const reactivar = async (asignacionId: number): Promise<ActividadAula | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await actividadesAulasApi.reactivarAsignacion(asignacionId);
      if (onSuccess) onSuccess();
      return response.data;
    } catch (err: any) {
      console.error('Error al reactivar asignación:', err);
      const errorMsg = err.response?.data?.error || 'Error al reactivar asignación';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return {
    asignar,
    cambiar,
    desasignar,
    reactivar,
    loading,
    error,
  };
}

/**
 * Hook para obtener sugerencias de aulas disponibles
 * Útil para mostrar lista de aulas recomendadas
 *
 * @param actividadId - ID de la actividad
 * @param capacidadMinima - Filtro de capacidad mínima opcional
 * @param tipoAulaId - Filtro de tipo de aula opcional
 * @returns Sugerencias, loading, error y función refetch
 */
export function useSugerenciasAulas(
  actividadId: number,
  capacidadMinima?: number,
  tipoAulaId?: number
) {
  const [sugerencias, setSugerencias] = useState<SugerenciaAula[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSugerencias = useCallback(async () => {
    if (!actividadId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await actividadesAulasApi.obtenerSugerencias(
        actividadId,
        capacidadMinima,
        tipoAulaId
      );
      setSugerencias(response.data || []);
    } catch (err: any) {
      console.error('Error al cargar sugerencias:', err);
      setError(err.response?.data?.error || 'Error al cargar sugerencias');
      setSugerencias([]);
    } finally {
      setLoading(false);
    }
  }, [actividadId, capacidadMinima, tipoAulaId]);

  useEffect(() => {
    fetchSugerencias();
  }, [fetchSugerencias]);

  return {
    sugerencias,
    loading,
    error,
    refetch: fetchSugerencias,
  };
}

/**
 * Hook para verificar disponibilidad de un aula en tiempo real
 * NO ejecuta automáticamente, requiere llamar a verificar() manualmente
 *
 * @param actividadId - ID de la actividad
 * @returns Función verificar, disponibilidad, loading y error
 */
export function useDisponibilidadAula(actividadId: number) {
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadAula | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verificar = async (data: VerificarDisponibilidadDto): Promise<DisponibilidadAula | null> => {
    if (!actividadId) return null;

    setLoading(true);
    setError(null);
    setDisponibilidad(null);

    try {
      const response = await actividadesAulasApi.verificarDisponibilidad(
        actividadId,
        data
      );
      setDisponibilidad(response.data);
      return response.data;
    } catch (err: any) {
      console.error('Error al verificar disponibilidad:', err);
      const errorMsg = err.response?.data?.error || 'Error al verificar disponibilidad';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = useCallback(() => {
    setDisponibilidad(null);
    setError(null);
  }, []);

  return {
    verificar,
    reset,
    disponibilidad,
    loading,
    error,
  };
}
