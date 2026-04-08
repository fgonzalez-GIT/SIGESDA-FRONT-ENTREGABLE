/**
 * Servicio API para Actividades
 * Basado en la documentación oficial del backend
 * @see SIGESDA-BACKEND/docs/API_ACTIVIDADES_GUIA.md
 */

import { api } from './api';
import type {
  Actividad,
  ActividadesQueryParams,
  PaginatedResponse,
  CreateActividadDTO,
  UpdateActividadDTO,
  CreateHorarioDTO,
  UpdateHorarioDTO,
  AsignarDocenteDTO,
  InscribirParticipanteDTO,
  HorarioActividad,
  DocenteActividad,
  ParticipacionActividad,
  EstadisticasActividad,
  DocenteDisponible,
  TipoActividad,
  CategoriaActividad,
  EstadoActividad,
  DiaSemana,
  RolDocente,
  BuscarPorHorarioParams,
  ParticipantesQueryParams,
  ActividadConHorarios,
  VerificarDisponibilidadAulaDTO,
  DisponibilidadAulaResponse,
} from '../types/actividad.types';

// ============================================
// CATÁLOGOS
// ============================================

/**
 * Obtiene todos los tipos de actividades
 * GET /api/catalogos/tipos-actividades
 * Guía línea 48-68
 */
export const obtenerTiposActividades = async (): Promise<TipoActividad[]> => {
  const response = await api.get<{ success: boolean; data: TipoActividad[] }>(
    '/catalogos/tipos-actividades'
  );
  return response.data.data;
};

/**
 * Obtiene todas las categorías de actividades
 * GET /api/catalogos/categorias-actividades
 * Guía línea 70-75
 */
export const obtenerCategoriasActividades = async (): Promise<CategoriaActividad[]> => {
  const response = await api.get<{ success: boolean; data: CategoriaActividad[] }>(
    '/catalogos/categorias-actividades'
  );
  return response.data.data;
};

/**
 * Obtiene todos los estados de actividades
 * GET /api/catalogos/estados-actividades
 * Guía línea 77-82
 */
export const obtenerEstadosActividades = async (): Promise<EstadoActividad[]> => {
  const response = await api.get<{ success: boolean; data: EstadoActividad[] }>(
    '/catalogos/estados-actividades'
  );
  return response.data.data;
};

/**
 * Obtiene los días de la semana
 * GET /api/catalogos/dias-semana
 * Guía línea 84-104
 */
export const obtenerDiasSemana = async (): Promise<DiaSemana[]> => {
  const response = await api.get<{ success: boolean; data: DiaSemana[] }>(
    '/catalogos/dias-semana'
  );
  return response.data.data;
};

/**
 * Obtiene los roles de docentes
 * GET /api/catalogos/roles-docentes
 * Guía línea 106-126
 */
export const obtenerRolesDocentes = async (): Promise<RolDocente[]> => {
  const response = await api.get<{ success: boolean; data: RolDocente[] }>(
    '/catalogos/roles-docentes'
  );
  return response.data.data;
};

// ============================================
// CRUD DE ACTIVIDADES
// ============================================

/**
 * Crea una nueva actividad con horarios, docentes y reservas opcionales
 * POST /api/actividades
 * Guía línea 131-264
 */
export const crearActividad = async (data: CreateActividadDTO): Promise<Actividad> => {
  const response = await api.post<{ success: boolean; data: Actividad }>('/actividades', data);
  return response.data.data;
};

/**
 * Lista actividades con filtros y paginación
 * GET /api/actividades?page=1&limit=20&tipoActividadId=1&activa=true
 * Guía línea 267-324
 */
export const listarActividades = async (
  params?: ActividadesQueryParams
): Promise<PaginatedResponse<Actividad>> => {
  const response = await api.get<{ success: boolean; data: PaginatedResponse<Actividad> }>(
    '/actividades',
    { params }
  );
  return response.data.data;
};

/**
 * Obtiene el detalle completo de una actividad por ID
 * GET /api/actividades/:id
 * Guía línea 328-461
 */
export const obtenerActividadPorId = async (id: number): Promise<Actividad> => {
  const response = await api.get<{ success: boolean; data: Actividad }>(`/actividades/${id}`);
  return response.data.data;
};

/**
 * Actualiza una actividad existente
 * PUT /api/actividades/:id
 *
 * IMPORTANTE: Campos NO actualizables según guía línea 487-492:
 * - codigoActividad (inmutable)
 * - tipoActividadId (inmutable)
 * - categoriaId (inmutable)
 * - fechaDesde (inmutable)
 *
 * Guía línea 464-502
 */
export const actualizarActividad = async (
  id: number,
  data: UpdateActividadDTO
): Promise<Actividad> => {
  const response = await api.put<{ success: boolean; data: Actividad }>(
    `/actividades/${id}`,
    data
  );
  return response.data.data;
};

/**
 * Elimina una actividad (Soft Delete)
 * DELETE /api/actividades/:id
 *
 * IMPORTANTE: No se puede eliminar si tiene participantes activos
 * Guía línea 505-534
 */
export const eliminarActividad = async (id: number): Promise<void> => {
  await api.delete(`/actividades/${id}`);
};

// ============================================
// GESTIÓN DE HORARIOS
// ============================================

/**
 * Agrega un horario a una actividad
 * POST /api/actividades/:actividadId/horarios
 * Guía línea 539-574
 */
export const agregarHorario = async (
  actividadId: number,
  data: CreateHorarioDTO
): Promise<HorarioActividad> => {
  const response = await api.post<{ success: boolean; data: HorarioActividad }>(
    `/actividades/${actividadId}/horarios`,
    data
  );
  return response.data.data;
};

/**
 * Actualiza un horario existente
 * PUT /api/actividades/horarios/:horarioId
 * Guía línea 577-602
 */
export const actualizarHorario = async (
  horarioId: number,
  data: UpdateHorarioDTO
): Promise<HorarioActividad> => {
  const response = await api.put<{ success: boolean; data: HorarioActividad }>(
    `/actividades/horarios/${horarioId}`,
    data
  );
  return response.data.data;
};

/**
 * Elimina un horario
 * DELETE /api/actividades/horarios/:horarioId
 * Guía línea 605-618
 */
export const eliminarHorario = async (horarioId: number): Promise<void> => {
  await api.delete(`/actividades/horarios/${horarioId}`);
};

// ============================================
// GESTIÓN DE DOCENTES
// ============================================

/**
 * Obtiene docentes disponibles para asignar
 * GET /api/actividades/docentes/disponibles?especialidad=Piano
 * Guía línea 623-661
 */
export const obtenerDocentesDisponibles = async (
  especialidad?: string
): Promise<DocenteDisponible[]> => {
  const response = await api.get<{ success: boolean; data: DocenteDisponible[] }>(
    '/actividades/docentes/disponibles',
    { params: { especialidad } }
  );
  return response.data.data;
};

/**
 * Asigna un docente a una actividad
 * POST /api/actividades/:actividadId/docentes
 *
 * Validaciones:
 * - La persona debe tener tipo DOCENTE activo
 * - No puede haber asignaciones duplicadas
 *
 * Guía línea 664-718
 */
export const asignarDocente = async (
  actividadId: number,
  data: AsignarDocenteDTO
): Promise<DocenteActividad> => {
  const response = await api.post<{ success: boolean; data: DocenteActividad }>(
    `/actividades/${actividadId}/docentes`,
    data
  );
  return response.data.data;
};

/**
 * Desasigna un docente de una actividad (soft delete)
 * DELETE /api/actividades/docentes/:asignacionId
 *
 * Nota: Establece fechaDesasignacion y activo = false
 * Guía línea 721-737
 */
export const desasignarDocente = async (asignacionId: number): Promise<void> => {
  await api.delete(`/actividades/docentes/${asignacionId}`);
};

// ============================================
// GESTIÓN DE PARTICIPANTES
// ============================================

/**
 * Agrega un participante a una actividad
 * POST /api/actividades/:actividadId/participantes
 *
 * Validaciones:
 * - La actividad debe tener cupo disponible
 * - La persona no puede estar ya inscrita (activa)
 * - No se puede agregar si la actividad está inactiva
 *
 * Guía línea 742-793
 */
export const agregarParticipante = async (
  actividadId: number,
  data: InscribirParticipanteDTO
): Promise<ParticipacionActividad> => {
  const response = await api.post<{ success: boolean; data: ParticipacionActividad }>(
    `/actividades/${actividadId}/participantes`,
    data
  );
  return response.data.data;
};

/**
 * Lista participantes de una actividad con paginación
 * GET /api/actividades/:actividadId/participantes?page=1&limit=20&activa=true
 * Guía línea 796-836
 *
 * NOTA: El backend actual devuelve un array sin paginación, por lo que convertimos
 * la respuesta al formato esperado.
 *
 * IMPORTANTE: Normaliza la estructura anidada personas.tipos[].tipoPersona.codigo
 * a un campo plano personas.tipo para simplificar el acceso en componentes.
 */
export const listarParticipantes = async (
  actividadId: number,
  params?: ParticipantesQueryParams
): Promise<PaginatedResponse<ParticipacionActividad>> => {
  const response = await api.get<{
    success: boolean;
    data: ParticipacionActividad[] | PaginatedResponse<ParticipacionActividad>;
  }>(`/actividades/${actividadId}/participantes`, { params });

  // Función para normalizar los datos de personas
  const normalizarParticipante = (participante: ParticipacionActividad): ParticipacionActividad => {
    if (participante.personas && participante.personas.tipos && Array.isArray(participante.personas.tipos)) {
      // Buscar el primer tipo activo y extraer su código
      const tipoActivo = participante.personas.tipos.find((t: any) => t.activo);
      const tipoCodigo = tipoActivo?.tipoPersona?.codigo || 'NO_SOCIO';

      return {
        ...participante,
        personas: {
          ...participante.personas,
          tipo: tipoCodigo // Agregar campo normalizado
          // Mantener tipos[] para uso avanzado si es necesario
        }
      };
    }
    return participante;
  };

  // Si el backend devuelve un array (sin paginación), convertir al formato esperado
  if (Array.isArray(response.data.data)) {
    const dataArray = response.data.data.map(normalizarParticipante);
    return {
      data: dataArray,
      page: params?.page || 1,
      limit: params?.limit || 20,
      total: dataArray.length,
      pages: 1
    };
  }

  // Si ya viene con paginación, normalizar y devolver
  const paginatedData = response.data.data as PaginatedResponse<ParticipacionActividad>;
  return {
    ...paginatedData,
    data: paginatedData.data.map(normalizarParticipante)
  };
};

/**
 * Quita un participante (dar de baja)
 * DELETE /api/actividades/:actividadId/participantes/:participanteId
 *
 * Nota: Establece fechaFin = now() y activa = false
 * Guía línea 839-855
 */
export const quitarParticipante = async (
  actividadId: number,
  participanteId: number
): Promise<void> => {
  await api.delete(`/actividades/${actividadId}/participantes/${participanteId}`);
};

// ============================================
// CONSULTAS ESPECIALES
// ============================================

/**
 * Obtiene estadísticas de una actividad
 * GET /api/actividades/:id/estadisticas
 * Guía línea 860-881
 */
export const obtenerEstadisticas = async (id: number): Promise<EstadisticasActividad> => {
  const response = await api.get<{ success: boolean; data: EstadisticasActividad }>(
    `/actividades/${id}/estadisticas`
  );
  return response.data.data;
};

/**
 * Busca actividades por día y hora
 * GET /api/actividades/por-horario?diaSemanaId=1&horaInicio=18:00&horaFin=20:00
 * Guía línea 884-919
 */
export const buscarPorHorario = async (
  params: BuscarPorHorarioParams
): Promise<ActividadConHorarios[]> => {
  const response = await api.get<{ success: boolean; data: ActividadConHorarios[] }>(
    '/actividades/por-horario',
    { params }
  );
  return response.data.data;
};

/**
 * Verifica disponibilidad de aula
 * POST /api/actividades/verificar-disponibilidad-aula
 * Guía línea 922-960
 */
export const verificarDisponibilidadAula = async (
  data: VerificarDisponibilidadAulaDTO
): Promise<DisponibilidadAulaResponse> => {
  const response = await api.post<{ success: boolean; data: DisponibilidadAulaResponse }>(
    '/actividades/verificar-disponibilidad-aula',
    data
  );
  return response.data.data;
};

// ============================================
// EXPORTAR TODO COMO OBJETO
// ============================================

export const actividadesApi = {
  // Catálogos
  obtenerTiposActividades,
  obtenerCategoriasActividades,
  obtenerEstadosActividades,
  obtenerDiasSemana,
  obtenerRolesDocentes,

  // CRUD Actividades
  crearActividad,
  listarActividades,
  obtenerActividadPorId,
  actualizarActividad,
  eliminarActividad,

  // Horarios
  agregarHorario,
  actualizarHorario,
  eliminarHorario,

  // Docentes
  obtenerDocentesDisponibles,
  asignarDocente,
  desasignarDocente,

  // Participantes
  agregarParticipante,
  listarParticipantes,
  quitarParticipante,

  // Consultas especiales
  obtenerEstadisticas,
  buscarPorHorario,
  verificarDisponibilidadAula,
};

export default actividadesApi;
