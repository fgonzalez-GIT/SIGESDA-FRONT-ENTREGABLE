import { api, ApiResponse } from './api';
import {
  Persona,
  CreatePersonaDTO,
  UpdatePersonaDTO,
  PersonasQueryParams,
  PersonasPaginatedResponse,
  CatalogosPersonas,
  CatalogosResponse,
  TipoPersona,
  EspecialidadDocente,
  CategoriaSocio,
  RazonSocial,
  TipoContacto,
  PersonaTipo,
  CreatePersonaTipoDTO,
  UpdatePersonaTipoDTO,
  Contacto,
  CreateContactoDTO,
  UpdateContactoDTO,
  ValidationResponse,
  EstadisticasTipos,
  CreateTipoPersonaDTO,
  UpdateTipoPersonaDTO,
  CreateEspecialidadDocenteDTO,
  UpdateEspecialidadDocenteDTO,
  CreateTipoContactoDTO,
  UpdateTipoContactoDTO,
  ReorderCatalogoDTO,
} from '../types/persona.types';

/**
 * API Service para Módulo Personas V2
 * Base URL: /api/personas (v2)
 *
 * Sistema de múltiples tipos por persona con gestión dinámica de catálogos
 */
export const personasApi = {
  // ============================================================================
  // CATÁLOGOS
  // ============================================================================

  /**
   * Obtener todos los catálogos de una vez
   *
   * NOTA: El endpoint batch /api/catalogos/personas/todos no existe en el backend.
   * Se cargan los catálogos disponibles usando las rutas reales del backend:
   * - GET /api/catalogos/tipos-persona ✅
   * - GET /api/catalogos/especialidades-docentes ✅
   * - GET /api/categorias-socios ✅
   * - GET /api/catalogos/razones-sociales ✅
   * - GET /api/catalogos/tipos-contacto ✅ (NUEVO - backend etapa 7.5)
   */
  getCatalogos: async (): Promise<CatalogosResponse> => {
    console.info('📦 Cargando catálogos de personas desde endpoints individuales...');

    // Cargar todos los catálogos disponibles
    const [tiposRes, especialidadesRes, categoriasRes, razonesRes, tiposContactoRes] = await Promise.allSettled([
      api.get('/catalogos/tipos-persona'),           // ✅ Existe
      api.get('/catalogos/especialidades-docentes'), // ✅ Existe
      api.get('/categorias-socios'),                 // ✅ Existe (ruta diferente)
      api.get('/catalogos/razones-sociales'),        // ✅ Existe
      api.get('/catalogos/tipos-contacto'),          // ✅ Existe (backend etapa 7.5)
    ]);

    // Construir respuesta con datos disponibles
    const catalogos: CatalogosPersonas = {
      tiposPersona: tiposRes.status === 'fulfilled' ? tiposRes.value.data.data : [],
      especialidadesDocentes: especialidadesRes.status === 'fulfilled' ? especialidadesRes.value.data.data : [],
      categoriasSocio: categoriasRes.status === 'fulfilled' ? categoriasRes.value.data.data : [],
      razonesSociales: razonesRes.status === 'fulfilled' ? razonesRes.value.data.data : [],
      tiposContacto: tiposContactoRes.status === 'fulfilled' ? tiposContactoRes.value.data.data : [],
    };

    const warnings = [];
    if (tiposRes.status === 'rejected') warnings.push('tipos-persona');
    if (especialidadesRes.status === 'rejected') warnings.push('especialidades-docentes');
    if (categoriasRes.status === 'rejected') warnings.push('categorias-socios');
    if (razonesRes.status === 'rejected') warnings.push('razones-sociales');
    if (tiposContactoRes.status === 'rejected') warnings.push('tipos-contacto');

    if (warnings.length > 0) {
      console.warn(`⚠️ No se pudieron cargar algunos catálogos: ${warnings.join(', ')}`);
    }

    return {
      success: true,
      data: catalogos,
      message: warnings.length > 0
        ? `Catálogos cargados parcialmente (${warnings.length} fallaron)`
        : 'Catálogos cargados correctamente',
    };
  },

  /**
   * Obtener catálogo de tipos de persona
   * GET /api/catalogos/tipos-persona
   */
  getTiposPersona: async (): Promise<ApiResponse<TipoPersona[]>> => {
    const response = await api.get('/catalogos/tipos-persona');
    return response.data;
  },

  /**
   * Obtener catálogo de especialidades docentes
   * GET /api/catalogos/especialidades-docentes
   */
  getEspecialidadesDocentes: async (): Promise<ApiResponse<EspecialidadDocente[]>> => {
    const response = await api.get('/catalogos/especialidades-docentes');
    return response.data;
  },

  /**
   * Obtener catálogo de tipos de contacto
   * GET /api/catalogos/tipos-contacto
   *
   * Disponible desde backend etapa 7.5
   */
  getTiposContacto: async (params?: {
    soloActivos?: boolean;
    ordenarPor?: 'orden' | 'nombre' | 'codigo';
  }): Promise<ApiResponse<TipoContacto[]>> => {
    const response = await api.get('/catalogos/tipos-contacto', { params });
    return response.data;
  },

  /**
   * Obtener tipo de contacto por ID
   * GET /api/catalogos/tipos-contacto/:id
   */
  getTipoContactoById: async (id: number): Promise<ApiResponse<TipoContacto>> => {
    const response = await api.get(`/catalogos/tipos-contacto/${id}`);
    return response.data;
  },

  /**
   * Obtener catálogo de categorías de socio
   * GET /api/categorias-socios
   */
  getCategoriasSocios: async (): Promise<ApiResponse<CategoriaSocio[]>> => {
    const response = await api.get('/categorias-socios');
    return response.data;
  },

  // ============================================================================
  // PERSONAS - CRUD
  // ============================================================================

  /**
   * Obtener todas las personas con filtros y paginación
   * GET /api/personas
   */
  getAll: async (params?: PersonasQueryParams): Promise<PersonasPaginatedResponse> => {
    const response = await api.get('/personas', { params });
    return response.data;
  },

  /**
   * Obtener una persona por ID
   * GET /api/personas/:id
   */
  getById: async (id: number, includeRelaciones: boolean = true): Promise<ApiResponse<Persona>> => {
    const response = await api.get(`/personas/${id}`, {
      params: { includeRelaciones },
    });
    return response.data;
  },

  /**
   * Crear una nueva persona con tipos y contactos
   * POST /api/personas
   */
  create: async (persona: CreatePersonaDTO): Promise<ApiResponse<Persona>> => {
    const response = await api.post('/personas', persona);
    return response.data;
  },

  /**
   * Actualizar una persona existente
   * PUT /api/personas/:id
   */
  update: async (id: number, persona: UpdatePersonaDTO): Promise<ApiResponse<Persona>> => {
    const response = await api.put(`/personas/${id}`, persona);
    return response.data;
  },

  /**
   * Eliminar una persona (soft delete)
   * DELETE /api/personas/:id
   */
  delete: async (id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/personas/${id}`);
    return response.data;
  },

  /**
   * Cambiar estado de una persona (ACTIVO/INACTIVO/SUSPENDIDO)
   * PATCH /api/personas/:id/estado
   */
  cambiarEstado: async (
    id: number,
    estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO'
  ): Promise<ApiResponse<Persona>> => {
    const response = await api.patch(`/personas/${id}/estado`, { estado });
    return response.data;
  },

  // ============================================================================
  // BÚSQUEDA Y FILTROS ESPECIALIZADOS
  // ============================================================================

  /**
   * Búsqueda de personas por texto
   * GET /api/personas/search?q=texto
   */
  search: async (
    query: string,
    params?: Omit<PersonasQueryParams, 'search'>
  ): Promise<PersonasPaginatedResponse> => {
    const response = await api.get('/personas/search', {
      params: { q: query, ...params }
    });
    return response.data;
  },

  /**
   * Obtener solo socios activos
   * GET /api/personas/socios
   */
  getSocios: async (params?: PersonasQueryParams): Promise<PersonasPaginatedResponse> => {
    const response = await api.get('/personas/socios', { params });
    return response.data;
  },

  /**
   * Obtener solo docentes activos
   * GET /api/personas/docentes
   */
  getDocentes: async (params?: PersonasQueryParams): Promise<PersonasPaginatedResponse> => {
    const response = await api.get('/personas/docentes', { params });
    return response.data;
  },

  /**
   * Obtener solo proveedores activos
   * GET /api/personas/proveedores
   */
  getProveedores: async (params?: PersonasQueryParams): Promise<PersonasPaginatedResponse> => {
    const response = await api.get('/personas/proveedores', { params });
    return response.data;
  },

  // ============================================================================
  // GESTIÓN DE TIPOS
  // ============================================================================

  /**
   * Obtener tipos asignados a una persona
   * GET /api/personas/:id/tipos
   */
  getTipos: async (personaId: number): Promise<ApiResponse<PersonaTipo[]>> => {
    const response = await api.get(`/personas/${personaId}/tipos`);
    return response.data;
  },

  /**
   * Asignar un nuevo tipo a una persona
   * POST /api/personas/:id/tipos
   */
  asignarTipo: async (
    personaId: number,
    tipo: CreatePersonaTipoDTO
  ): Promise<ApiResponse<PersonaTipo>> => {
    const response = await api.post(`/personas/${personaId}/tipos`, tipo);
    return response.data;
  },

  /**
   * Actualizar un tipo asignado
   * PUT /api/personas/:personaId/tipos/:tipoId
   */
  actualizarTipo: async (
    personaId: number,
    tipoId: number,
    data: UpdatePersonaTipoDTO
  ): Promise<ApiResponse<PersonaTipo>> => {
    const response = await api.put(`/personas/${personaId}/tipos/${tipoId}`, data);
    return response.data;
  },

  /**
   * Desasignar un tipo de una persona
   * DELETE /api/personas/:personaId/tipos/:tipoId
   */
  desasignarTipo: async (personaId: number, tipoId: number): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/personas/${personaId}/tipos/${tipoId}`);
    return response.data;
  },

  /**
   * Activar/Desactivar un tipo asignado (toggle)
   * PATCH /api/personas/tipos/:tipoId/toggle
   *
   * NOTA: Este endpoint NO existe en el backend actual.
   * Como workaround, usa actualizarTipo con activo: true/false.
   */
  toggleTipo: async (tipoId: number): Promise<ApiResponse<PersonaTipo>> => {
    console.warn('⚠️ Endpoint /personas/tipos/:id/toggle no disponible. Use actualizarTipo() en su lugar.');
    throw new Error('Endpoint no implementado. Use actualizarTipo() con { activo: true/false }');
  },

  // ============================================================================
  // GESTIÓN DE CONTACTOS
  // ============================================================================

  /**
   * Obtener contactos de una persona
   * GET /api/personas/:id/contactos
   */
  getContactos: async (personaId: number): Promise<ApiResponse<Contacto[]>> => {
    const response = await api.get(`/personas/${personaId}/contactos`);
    return response.data;
  },

  /**
   * Agregar un contacto a una persona
   * POST /api/personas/:id/contactos
   */
  addContacto: async (
    personaId: number,
    contacto: CreateContactoDTO
  ): Promise<ApiResponse<Contacto>> => {
    const response = await api.post(`/personas/${personaId}/contactos`, contacto);
    return response.data;
  },

  /**
   * Actualizar un contacto
   * PUT /api/personas/contactos/:id
   */
  updateContacto: async (
    contactoId: number,
    contacto: UpdateContactoDTO
  ): Promise<ApiResponse<Contacto>> => {
    const response = await api.put(`/personas/contactos/${contactoId}`, contacto);
    return response.data;
  },

  /**
   * Eliminar un contacto
   * DELETE /api/personas/contactos/:id
   */
  deleteContacto: async (contactoId: number): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/personas/contactos/${contactoId}`);
    return response.data;
  },

  /**
   * Establecer contacto como principal
   * PATCH /api/personas/contactos/:id/principal
   *
   * NOTA: Este endpoint NO existe en el backend actual.
   * Como workaround, usa updateContacto con principal: true.
   */
  setPrincipal: async (contactoId: number): Promise<ApiResponse<Contacto>> => {
    console.warn('⚠️ Endpoint /personas/contactos/:id/principal no disponible. Use updateContacto() en su lugar.');
    throw new Error('Endpoint no implementado. Use updateContacto() con { principal: true }');
  },

  // ============================================================================
  // VALIDACIONES
  // ============================================================================

  /**
   * Validar si un DNI ya existe
   * GET /api/personas/dni/:dni/check
   *
   * NOTA: Usa la ruta real del backend (/personas/dni/:dni/check)
   * no la documentada (/personas/validar/dni/:dni)
   */
  validarDni: async (dni: string, excludeId?: number): Promise<ValidationResponse> => {
    const response = await api.get(`/personas/dni/${dni}/check`, {
      params: { excludeId },
    });
    return response.data;
  },

  /**
   * Validar si un email ya existe
   * GET /api/personas/validar/email/:email
   *
   * NOTA: Este endpoint NO existe en el backend.
   * Retorna siempre válido (true) - la validación debe hacerse en el backend cuando se implemente.
   */
  validarEmail: async (email: string, excludeId?: number): Promise<ValidationResponse> => {
    console.warn('⚠️ Endpoint /personas/validar/email no disponible en backend');
    return {
      success: true,
      data: {
        isValid: true, // Siempre válido hasta que se implemente
        exists: false,
      },
      message: 'Validación de email no implementada en backend',
    };
  },

  // ============================================================================
  // ESTADÍSTICAS
  // ============================================================================

  /**
   * Obtener estadísticas de tipos de persona
   * GET /api/personas/estadisticas/tipos
   *
   * NOTA: Este endpoint existe pero tiene un bug en el backend (error 500).
   * Retorna array vacío hasta que se corrija.
   */
  getEstadisticasTipos: async (): Promise<ApiResponse<EstadisticasTipos[]>> => {
    try {
      const response = await api.get('/personas/estadisticas/tipos');
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 500) {
        console.warn('⚠️ Endpoint /personas/estadisticas/tipos tiene error interno (500)');
        return {
          success: true,
          data: [],
          message: 'Estadísticas no disponibles (error en backend)',
        };
      }
      throw error;
    }
  },

  // ============================================================================
  // ADMIN - GESTIÓN DE CATÁLOGOS
  // ============================================================================
  //
  // ⚠️ IMPORTANTE: Los endpoints de administración de catálogos NO están disponibles
  // en el backend actual. Las rutas existen en el código del backend pero NO están
  // montadas en el router principal.
  //
  // Estos métodos generarán errores 404 hasta que se active el módulo admin en backend.
  // Ver: SIGESDA-BACKEND/src/routes/catalogo-admin.routes.ts (no montado en index.ts)
  //
  // Endpoints afectados:
  // - POST/PUT/DELETE /api/admin/catalogos/tipos-persona
  // - POST/PUT/DELETE /api/admin/catalogos/especialidades-docentes
  // - POST/PUT/DELETE /api/admin/catalogos/tipos-contacto
  // ============================================================================

  /**
   * Crear un nuevo tipo de persona (admin)
   * POST /api/admin/catalogos/tipos-persona
   */
  admin: {
    /**
     * Crear un nuevo tipo de persona
     * POST /api/admin/catalogos/tipos-persona
     */
    createTipoPersona: async (
      tipo: CreateTipoPersonaDTO
    ): Promise<ApiResponse<TipoPersona>> => {
      const response = await api.post('/admin/catalogos/tipos-persona', tipo);
      return response.data;
    },

    /**
     * Actualizar un tipo de persona
     * PUT /api/admin/catalogos/tipos-persona/:id
     */
    updateTipoPersona: async (
      id: number,
      tipo: UpdateTipoPersonaDTO
    ): Promise<ApiResponse<TipoPersona>> => {
      const response = await api.put(`/admin/catalogos/tipos-persona/${id}`, tipo);
      return response.data;
    },

    /**
     * Eliminar un tipo de persona
     * DELETE /api/admin/catalogos/tipos-persona/:id
     */
    deleteTipoPersona: async (id: number): Promise<ApiResponse<null>> => {
      const response = await api.delete(`/admin/catalogos/tipos-persona/${id}`);
      return response.data;
    },

    /**
     * Reordenar tipos de persona
     * POST /api/admin/catalogos/tipos-persona/reordenar
     */
    reorderTiposPersona: async (data: ReorderCatalogoDTO): Promise<ApiResponse<null>> => {
      const response = await api.post('/admin/catalogos/tipos-persona/reordenar', data);
      return response.data;
    },

    /**
     * Crear una nueva especialidad docente
     * POST /api/admin/catalogos/especialidades-docentes
     */
    createEspecialidad: async (
      especialidad: CreateEspecialidadDocenteDTO
    ): Promise<ApiResponse<EspecialidadDocente>> => {
      const response = await api.post(
        '/admin/catalogos/especialidades-docentes',
        especialidad
      );
      return response.data;
    },

    /**
     * Actualizar una especialidad docente
     * PUT /api/admin/catalogos/especialidades-docentes/:id
     */
    updateEspecialidad: async (
      id: number,
      especialidad: UpdateEspecialidadDocenteDTO
    ): Promise<ApiResponse<EspecialidadDocente>> => {
      const response = await api.put(
        `/admin/catalogos/especialidades-docentes/${id}`,
        especialidad
      );
      return response.data;
    },

    /**
     * Eliminar una especialidad docente
     * DELETE /api/admin/catalogos/especialidades-docentes/:id
     */
    deleteEspecialidad: async (id: number): Promise<ApiResponse<null>> => {
      const response = await api.delete(`/admin/catalogos/especialidades-docentes/${id}`);
      return response.data;
    },

    /**
     * Reordenar especialidades docentes
     * POST /api/admin/catalogos/especialidades-docentes/reordenar
     */
    reorderEspecialidades: async (data: ReorderCatalogoDTO): Promise<ApiResponse<null>> => {
      const response = await api.post(
        '/admin/catalogos/especialidades-docentes/reordenar',
        data
      );
      return response.data;
    },

    /**
     * Crear un nuevo tipo de contacto
     * POST /api/admin/catalogos/tipos-contacto
     */
    createTipoContacto: async (
      tipo: CreateTipoContactoDTO
    ): Promise<ApiResponse<TipoContacto>> => {
      const response = await api.post('/admin/catalogos/tipos-contacto', tipo);
      return response.data;
    },

    /**
     * Actualizar un tipo de contacto
     * PUT /api/admin/catalogos/tipos-contacto/:id
     */
    updateTipoContacto: async (
      id: number,
      tipo: UpdateTipoContactoDTO
    ): Promise<ApiResponse<TipoContacto>> => {
      const response = await api.put(`/admin/catalogos/tipos-contacto/${id}`, tipo);
      return response.data;
    },

    /**
     * Eliminar un tipo de contacto
     * DELETE /api/admin/catalogos/tipos-contacto/:id
     */
    deleteTipoContacto: async (id: number): Promise<ApiResponse<null>> => {
      const response = await api.delete(`/admin/catalogos/tipos-contacto/${id}`);
      return response.data;
    },

    /**
     * Reordenar tipos de contacto
     * POST /api/admin/catalogos/tipos-contacto/reordenar
     */
    reorderTiposContacto: async (data: ReorderCatalogoDTO): Promise<ApiResponse<null>> => {
      const response = await api.post('/admin/catalogos/tipos-contacto/reordenar', data);
      return response.data;
    },

    /**
     * Desactivar tipo de contacto
     * POST /api/catalogos/tipos-contacto/:id/desactivar
     */
    desactivarTipoContacto: async (id: number): Promise<ApiResponse<TipoContacto>> => {
      const response = await api.post(`/catalogos/tipos-contacto/${id}/desactivar`);
      return response.data;
    },

    /**
     * Activar tipo de contacto
     * POST /api/catalogos/tipos-contacto/:id/activar
     */
    activarTipoContacto: async (id: number): Promise<ApiResponse<TipoContacto>> => {
      const response = await api.post(`/catalogos/tipos-contacto/${id}/activar`);
      return response.data;
    },
  },

  // ============================================================================
  // ESTADÍSTICAS DE TIPOS DE CONTACTO
  // ============================================================================

  /**
   * Obtener estadísticas de uso de tipos de contacto
   * GET /api/catalogos/tipos-contacto/estadisticas/uso
   */
  getEstadisticasTiposContacto: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/catalogos/tipos-contacto/estadisticas/uso');
    return response.data;
  },
};

export default personasApi;
