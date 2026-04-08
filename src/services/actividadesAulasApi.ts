/**
 * API Service para gestión de asignación de Aulas a Actividades
 * Basado en la documentación del backend: DOCUMENTACION_FRONTEND_AULAS_ACTIVIDADES.md
 */

import { api } from './api';
import type {
  ActividadAula,
  AsignarAulaDto,
  AsignarAulaResponse,
  CambiarAulaDto,
  CambiarAulaResponse,
  DesasignarAulaDto,
  ListarAulasResponse,
  SugerenciasAulasResponse,
  VerificarDisponibilidadDto,
  VerificarDisponibilidadResponse,
  OcupacionAulaResponse,
} from '@/types/actividad-aula.types';

/**
 * Servicio de API para gestión de aulas en actividades
 */
export const actividadesAulasApi = {
  /**
   * 1. Verificar disponibilidad de un aula ANTES de asignarla
   * IMPORTANTE: SIEMPRE usar este endpoint antes de intentar asignar
   *
   * @param actividadId - ID de la actividad
   * @param data - Datos de verificación (aulaId, excluirAsignacionId opcional)
   * @returns Resultado de disponibilidad con conflictos si los hay
   */
  verificarDisponibilidad: async (
    actividadId: number,
    data: VerificarDisponibilidadDto
  ): Promise<VerificarDisponibilidadResponse> => {
    const response = await api.post(
      `/actividades/${actividadId}/aulas/verificar-disponibilidad`,
      data
    );
    return response.data;
  },

  /**
   * 2. Obtener sugerencias de aulas ordenadas por idoneidad
   * Útil para mostrar aulas recomendadas al usuario
   *
   * @param actividadId - ID de la actividad
   * @param capacidadMinima - Filtrar por capacidad mínima (opcional)
   * @param tipoAulaId - Filtrar por tipo de aula (opcional)
   * @returns Lista de aulas sugeridas con score de 0-100
   */
  obtenerSugerencias: async (
    actividadId: number,
    capacidadMinima?: number,
    tipoAulaId?: number
  ): Promise<SugerenciasAulasResponse> => {
    const params = new URLSearchParams();
    if (capacidadMinima) params.append('capacidadMinima', capacidadMinima.toString());
    if (tipoAulaId) params.append('tipoAulaId', tipoAulaId.toString());

    const response = await api.get(
      `/actividades/${actividadId}/aulas/sugerencias?${params.toString()}`
    );
    return response.data;
  },

  /**
   * 3. Asignar un aula a una actividad
   * IMPORTANTE: Debe haber llamado a verificarDisponibilidad() primero
   *
   * @param actividadId - ID de la actividad
   * @param data - Datos de asignación (aulaId, prioridad opcional, observaciones opcionales)
   * @returns Asignación creada
   */
  asignarAula: async (
    actividadId: number,
    data: AsignarAulaDto
  ): Promise<AsignarAulaResponse> => {
    const response = await api.post(`/actividades/${actividadId}/aulas`, data);
    return response.data;
  },

  /**
   * 4. Listar todas las aulas asignadas a una actividad
   *
   * @param actividadId - ID de la actividad
   * @param soloActivas - Si true, solo devuelve asignaciones activas (default: true)
   * @returns Lista de aulas asignadas
   */
  listarAulasAsignadas: async (
    actividadId: number,
    soloActivas: boolean = true
  ): Promise<ListarAulasResponse> => {
    const response = await api.get(
      `/actividades/${actividadId}/aulas?soloActivas=${soloActivas}`
    );
    return response.data;
  },

  /**
   * 5. Cambiar el aula de una actividad
   * Desasigna el aula anterior y asigna la nueva en una sola operación
   *
   * @param actividadId - ID de la actividad
   * @param aulaIdActual - ID del aula actualmente asignada
   * @param data - Datos del cambio (nuevaAulaId, observaciones opcionales)
   * @returns Información de asignación anterior y nueva
   */
  cambiarAula: async (
    actividadId: number,
    aulaIdActual: number,
    data: CambiarAulaDto
  ): Promise<CambiarAulaResponse> => {
    const response = await api.put(
      `/actividades/${actividadId}/aulas/${aulaIdActual}/cambiar`,
      data
    );
    return response.data;
  },

  /**
   * 6. Desasignar un aula de una actividad (soft delete)
   * Marca la asignación como inactiva sin eliminarla físicamente
   *
   * @param asignacionId - ID de la asignación (actividad_aula.id)
   * @param data - Datos de desasignación (fechaDesasignacion opcional, observaciones opcionales)
   * @returns Asignación desactivada
   */
  desasignarAula: async (
    asignacionId: number,
    data?: DesasignarAulaDto
  ): Promise<AsignarAulaResponse> => {
    const response = await api.post(
      `/actividades-aulas/${asignacionId}/desasignar`,
      data || {}
    );
    return response.data;
  },

  /**
   * 7. Reactivar una asignación previamente desasignada
   * IMPORTANTE: El backend re-valida disponibilidad horaria actual
   *
   * @param asignacionId - ID de la asignación a reactivar
   * @returns Asignación reactivada
   */
  reactivarAsignacion: async (asignacionId: number): Promise<AsignarAulaResponse> => {
    const response = await api.post(`/actividades-aulas/${asignacionId}/reactivar`);
    return response.data;
  },

  /**
   * 8. Consultar ocupación de un aula
   * Muestra cuántas actividades, reservas y secciones usa el aula
   *
   * @param aulaId - ID del aula
   * @returns Información de ocupación
   */
  consultarOcupacion: async (aulaId: number): Promise<OcupacionAulaResponse> => {
    const response = await api.get(`/aulas/${aulaId}/ocupacion`);
    return response.data;
  },

  /**
   * 9. Listar todas las actividades que usan un aula específica
   *
   * @param aulaId - ID del aula
   * @param soloActivas - Si true, solo devuelve asignaciones activas (default: true)
   * @returns Lista de actividades que usan el aula
   */
  listarActividadesDeAula: async (
    aulaId: number,
    soloActivas: boolean = true
  ): Promise<ListarAulasResponse> => {
    const response = await api.get(
      `/aulas/${aulaId}/actividades?soloActivas=${soloActivas}`
    );
    return response.data;
  },
};

export default actividadesAulasApi;
