import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
  GrupoFamiliar,
  CrearGrupoFamiliarRequest,
  GrupoFamiliarConfiguracion,
  SuggestedMember,
  SuggestedMembersResponse,
  AddMiembroRequest,
  GrupoResponseWithWarnings,
} from '../../types/grupoFamiliar.types';

// Re-exportar tipos para compatibilidad con código existente
export type { GrupoFamiliar, CrearGrupoFamiliarRequest };

export interface RelacionFamiliar {
  id: number;
  personaId: number;
  familiarId: number;
  tipoRelacion: 'padre' | 'madre' | 'hijo' | 'hija' | 'conyuge' | 'esposo' | 'esposa' | 'hermano' | 'hermana' | 'abuelo' | 'abuela' | 'nieto' | 'nieta' | 'tio' | 'tia' | 'sobrino' | 'sobrina' | 'primo' | 'prima' | 'otro';
  descripcion?: string;
  fechaCreacion: string;
  activo: boolean;
  responsableFinanciero: boolean; // Si es responsable de los pagos del familiar
  autorizadoRetiro: boolean; // Si está autorizado a retirar al familiar
  contactoEmergencia: boolean; // Si es contacto de emergencia
  porcentajeDescuento?: number; // Descuento aplicable por relación familiar
}

export interface PersonaConFamiliares {
  id: number;
  nombre: string;
  apellido: string;
  tipo: 'socio' | 'docente' | 'estudiante';
  familiares: Array<{
    familiar: {
      id: number;
      nombre: string;
      apellido: string;
      tipo: 'socio' | 'docente' | 'estudiante';
    };
    relacion: RelacionFamiliar;
  }>;
  grupoFamiliar?: GrupoFamiliar;
}

export interface CrearRelacionRequest {
  personaId: number;
  familiarId: number;
  tipoRelacion: RelacionFamiliar['tipoRelacion'];
  descripcion?: string;
  responsableFinanciero?: boolean;
  autorizadoRetiro?: boolean;
  contactoEmergencia?: boolean;
  porcentajeDescuento?: number;
}

export interface FamiliaresFilters {
  personaId?: number;
  tipoRelacion?: RelacionFamiliar['tipoRelacion'];
  responsableFinanciero?: boolean;
  contactoEmergencia?: boolean;
  grupoId?: number;
  activo?: boolean;
}

interface FamiliaresState {
  relaciones: RelacionFamiliar[];
  grupos: GrupoFamiliar[];
  personasConFamiliares: PersonaConFamiliares[];
  filteredRelaciones: RelacionFamiliar[];
  filters: FamiliaresFilters;
  loading: boolean;
  error: string | null;
  currentPersona: PersonaConFamiliares | null;
  estadisticas: {
    totalRelaciones: number;
    totalGrupos: number;
    personasConFamiliares: number;
    relacionesPorTipo: { [key: string]: number };
    descuentoPromedio: number;
  };

  // NUEVO (v2026-02-26): Estado para sugerencias de miembros
  suggestedMembers: Array<{
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
    parentesco: string;
    relacionId: number;
  }>;
  loadingSuggestions: boolean;

  // NUEVO (v2026-02-26): Warnings de operaciones con skipFamilyValidation
  grupoWarnings: string[];
}

const initialState: FamiliaresState = {
  relaciones: [],
  grupos: [],
  personasConFamiliares: [],
  filteredRelaciones: [],
  filters: {},
  loading: false,
  error: null,
  currentPersona: null,
  estadisticas: {
    totalRelaciones: 0,
    totalGrupos: 0,
    personasConFamiliares: 0,
    relacionesPorTipo: {},
    descuentoPromedio: 0,
  },

  // NUEVO (v2026-02-26)
  suggestedMembers: [],
  loadingSuggestions: false,
  grupoWarnings: [],
};

// Mock data store (para simular persistencia entre llamadas)
let mockRelacionesStore: RelacionFamiliar[] = [
  {
    id: 1,
    personaId: 1,
    familiarId: 2,
    tipoRelacion: 'esposa',
    descripcion: 'Cónyuge',
    fechaCreacion: '2025-01-15',
    activo: true,
    responsableFinanciero: false,
    autorizadoRetiro: true,
    contactoEmergencia: true,
    porcentajeDescuento: 10,
  },
  {
    id: 2,
    personaId: 1,
    familiarId: 3,
    tipoRelacion: 'hijo',
    descripcion: 'Hijo menor',
    fechaCreacion: '2025-01-15',
    activo: true,
    responsableFinanciero: true,
    autorizadoRetiro: true,
    contactoEmergencia: false,
    porcentajeDescuento: 15,
  },
  {
    id: 3,
    personaId: 2,
    familiarId: 1,
    tipoRelacion: 'esposo',
    descripcion: 'Cónyuge',
    fechaCreacion: '2025-01-15',
    activo: true,
    responsableFinanciero: true,
    autorizadoRetiro: true,
    contactoEmergencia: true,
  },
  {
    id: 4,
    personaId: 2,
    familiarId: 3,
    tipoRelacion: 'hijo',
    descripcion: 'Hijo',
    fechaCreacion: '2025-01-15',
    activo: true,
    responsableFinanciero: false,
    autorizadoRetiro: true,
    contactoEmergencia: false,
    porcentajeDescuento: 15,
  },
];

import familiaresApiReal from '../../services/familiaresApi';
import gruposApi from '../../services/gruposApi';

// Mock API functions
const familiaresAPI = {
  getRelaciones: async (filters: FamiliaresFilters = {}): Promise<RelacionFamiliar[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    return mockRelacionesStore.filter(relacion => {
      if (filters.personaId && relacion.personaId !== filters.personaId) return false;
      if (filters.tipoRelacion && relacion.tipoRelacion !== filters.tipoRelacion) return false;
      if (filters.responsableFinanciero !== undefined && relacion.responsableFinanciero !== filters.responsableFinanciero) return false;
      if (filters.contactoEmergencia !== undefined && relacion.contactoEmergencia !== filters.contactoEmergencia) return false;
      if (filters.activo !== undefined && relacion.activo !== filters.activo) return false;
      return true;
    });
  },

  getGrupos: async (): Promise<GrupoFamiliar[]> => {
    const result = await gruposApi.getGrupos();
    return result.data;
  },

  getPersonasConFamiliares: async (filters?: {
    soloActivos?: boolean;
    socioId?: number;
    parentesco?: string;
  }): Promise<PersonaConFamiliares[]> => {
    try {
      // Obtener todas las personas del sistema
      const personasResponse = await fetch(`${import.meta.env.VITE_API_URL}/personas`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!personasResponse.ok) {
        throw new Error('Error al cargar personas');
      }

      const personasResult = await personasResponse.json();
      const personas = personasResult.data || personasResult;

      // Obtener todas las relaciones familiares (sin limit para obtener todas)
      const relacionesResponse = await familiaresApiReal.getAllRelaciones(filters);
      const todasLasRelaciones = relacionesResponse.data;

      // Construir PersonasConFamiliares dinámicamente
      const personasConFamiliares: PersonaConFamiliares[] = personas.map((persona: any) => {
        // Buscar todas las relaciones donde esta persona es el titular
        const relaciones = todasLasRelaciones.filter((r: any) => r.personaId === persona.id);

        // Mapear relaciones a familiares con toda la info
        const familiares = relaciones.map((relacion: any) => ({
          familiar: relacion.familiar || {
            id: relacion.familiarId,
            nombre: 'Desconocido',
            apellido: '',
            tipo: 'socio' as const
          },
          relacion
        }));

        return {
          id: persona.id,
          nombre: persona.nombre,
          apellido: persona.apellido,
          tipo: persona.tipo?.toLowerCase() || 'socio',
          familiares,
          grupoFamiliar: undefined // Por ahora sin grupos familiares
        };
      });

      return personasConFamiliares;
    } catch (error) {
      console.error('Error en getPersonasConFamiliares:', error);
      return [];
    }
  },

  crearRelacion: async (request: CrearRelacionRequest): Promise<RelacionFamiliar> => {
    // Usar API real del backend
    return await familiaresApiReal.crearRelacion(request);
  },

  crearGrupoFamiliar: async (request: CrearGrupoFamiliarRequest): Promise<GrupoResponseWithWarnings> => {
    // Mapear request del slice al formato esperado por la API
    // IMPORTANTE: Solo incluir campos primitivos para evitar referencias circulares
    const apiRequest: CrearGrupoFamiliarRequest = {
      nombre: String(request.nombre || ''),
      descripcion: request.descripcion ? String(request.descripcion) : undefined,
      personaReferenteId: Number(request.personaReferenteId),
      descuentoGrupal: request.descuentoGrupal !== undefined ? Number(request.descuentoGrupal) : 0,
      activo: request.activo !== undefined ? Boolean(request.activo) : true,
      facturacionConjunta: request.facturacionConjunta !== undefined ? Boolean(request.facturacionConjunta) : false,
      descuentoProgresivo: request.descuentoProgresivo !== undefined ? Boolean(request.descuentoProgresivo) : false,
      limiteCuotas: request.limiteCuotas !== undefined ? Number(request.limiteCuotas) : 0,
      miembros: Array.isArray(request.miembros) ? request.miembros.map(id => Number(id)) : [],
      skipFamilyValidation: request.skipFamilyValidation !== undefined ? Boolean(request.skipFamilyValidation) : false,
    };

    const result = await gruposApi.crearGrupo(apiRequest);

    // Retornar el objeto completo con warnings
    return result;
  },

  eliminarRelacion: async (id: number): Promise<void> => {
    // Usar API real del backend
    return await familiaresApiReal.eliminarRelacion(id);
  },

  actualizarRelacion: async (id: number, relacion: Partial<RelacionFamiliar>): Promise<RelacionFamiliar> => {
    // Usar API real del backend
    return await familiaresApiReal.actualizarRelacion(id, relacion);
  },

  getRelacionesDePersona: async (personaId: number): Promise<any[]> => {
    // Usar API real del backend
    return await familiaresApiReal.getRelacionesDePersona(personaId);
  },

  // FASE 2: Nuevas funciones para la tabla completa
  getAllRelaciones: async (filters?: {
    page?: number;
    limit?: number;
    soloActivos?: boolean;
    socioId?: number;
    parentesco?: string;
  }): Promise<{ data: any[]; total: number; pages: number }> => {
    return await familiaresApiReal.getAllRelaciones(filters);
  },

  getEstadisticasParentesco: async (): Promise<Array<{ parentesco: string; count: number }>> => {
    return await familiaresApiReal.getEstadisticasParentesco();
  },
};

// Helper para envolver respuesta mock en estructura API
const wrapMockResponse = <T>(data: T) => ({ success: true, data });

// Async thunks
export const fetchRelaciones = createAsyncThunk(
  'familiares/fetchRelaciones',
  async (filters: FamiliaresFilters = {}) => {
    const result = await familiaresAPI.getRelaciones(filters);
    // Cuando se conecte a la API real, usar: result.data || result
    return result;
  }
);

export const fetchGrupos = createAsyncThunk(
  'familiares/fetchGrupos',
  async () => {
    const result = await familiaresAPI.getGrupos();
    // Cuando se conecte a la API real, usar: result.data || result
    return result;
  }
);

export const fetchPersonasConFamiliares = createAsyncThunk(
  'familiares/fetchPersonasConFamiliares',
  async (filters?: { soloActivos?: boolean; socioId?: number; parentesco?: string }) => {
    const result = await familiaresAPI.getPersonasConFamiliares(filters);
    // Cuando se conecte a la API real, usar: result.data || result
    return result;
  }
);

export const crearRelacion = createAsyncThunk(
  'familiares/crearRelacion',
  async (request: CrearRelacionRequest) => {
    const result = await familiaresAPI.crearRelacion(request);
    // Cuando se conecte a la API real, usar: result.data || result
    return result;
  }
);

export const crearGrupoFamiliar = createAsyncThunk(
  'familiares/crearGrupoFamiliar',
  async (request: CrearGrupoFamiliarRequest) => {
    const result = await familiaresAPI.crearGrupoFamiliar(request);
    // Cuando se conecte a la API real, usar: result.data || result
    return result;
  }
);

export const eliminarRelacion = createAsyncThunk(
  'familiares/eliminarRelacion',
  async (id: number) => {
    await familiaresAPI.eliminarRelacion(id);
    return id;
  }
);

export const actualizarRelacion = createAsyncThunk(
  'familiares/actualizarRelacion',
  async ({ id, relacion }: { id: number; relacion: Partial<RelacionFamiliar> }) => {
    const result = await familiaresAPI.actualizarRelacion(id, relacion);
    // Cuando se conecte a la API real, usar: result.data || result
    return result;
  }
);

export const fetchRelacionesDePersona = createAsyncThunk(
  'familiares/fetchRelacionesDePersona',
  async (personaId: number) => {
    const result = await familiaresAPI.getRelacionesDePersona(personaId);
    // Cuando se conecte a la API real, usar: result.data || result
    return result;
  }
);

// FASE 2: Nuevos thunks para tabla completa
export const fetchAllRelaciones = createAsyncThunk(
  'familiares/fetchAllRelaciones',
  async (filters?: {
    page?: number;
    limit?: number;
    soloActivos?: boolean;
    socioId?: number;
    parentesco?: string;
  }) => {
    const result = await familiaresAPI.getAllRelaciones(filters);
    return result;
  }
);

export const fetchEstadisticasParentesco = createAsyncThunk(
  'familiares/fetchEstadisticasParentesco',
  async () => {
    const result = await familiaresAPI.getEstadisticasParentesco();
    return result;
  }
);

// ============================================================================
// NUEVOS ASYNC THUNKS PARA GRUPOS FAMILIARES
// ============================================================================

export const fetchGrupoById = createAsyncThunk(
  'familiares/fetchGrupoById',
  async (id: number) => {
    const result = await gruposApi.getGrupoById(id);
    return result;
  }
);

export const actualizarGrupo = createAsyncThunk(
  'familiares/actualizarGrupo',
  async ({ id, data }: { id: number; data: Partial<CrearGrupoFamiliarRequest> }) => {
    // Mapear datos del slice al formato de la API
    const apiRequest: any = {};
    if (data.nombre) apiRequest.nombre = data.nombre;
    if (data.descripcion !== undefined) apiRequest.descripcion = data.descripcion;
    if (data.personaReferenteId) apiRequest.personaReferenteId = data.personaReferenteId;
    if (data.descuentoGrupal !== undefined) apiRequest.descuentoGrupal = data.descuentoGrupal;
    if (data.activo !== undefined) apiRequest.activo = data.activo;
    if (data.facturacionConjunta !== undefined) apiRequest.facturacionConjunta = data.facturacionConjunta;
    if (data.descuentoProgresivo !== undefined) apiRequest.descuentoProgresivo = data.descuentoProgresivo;
    if (data.limiteCuotas !== undefined) apiRequest.limiteCuotas = data.limiteCuotas;
    if (data.skipFamilyValidation !== undefined) apiRequest.skipFamilyValidation = data.skipFamilyValidation;

    const result = await gruposApi.actualizarGrupo(id, apiRequest);
    return result;
  }
);

export const eliminarGrupo = createAsyncThunk(
  'familiares/eliminarGrupo',
  async (id: number) => {
    await gruposApi.eliminarGrupo(id);
    return id;
  }
);

export const agregarMiembroGrupo = createAsyncThunk(
  'familiares/agregarMiembroGrupo',
  async ({
    grupoId,
    personaId,
    skipFamilyValidation = false
  }: {
    grupoId: number;
    personaId: number;
    skipFamilyValidation?: boolean;
  }) => {
    const request: AddMiembroRequest = {
      personaId,
      skipFamilyValidation,
    };
    const result = await gruposApi.agregarMiembro(grupoId, request);
    return result; // Retorna { grupo, warnings? }
  }
);

export const removerMiembroGrupo = createAsyncThunk(
  'familiares/removerMiembroGrupo',
  async ({ grupoId, miembroId }: { grupoId: number; miembroId: number }) => {
    const result = await gruposApi.removerMiembro(grupoId, miembroId);
    return result;
  }
);

export const actualizarMiembrosGrupo = createAsyncThunk(
  'familiares/actualizarMiembrosGrupo',
  async ({ grupoId, miembrosIds }: { grupoId: number; miembrosIds: number[] }) => {
    const result = await gruposApi.actualizarMiembros(grupoId, miembrosIds);
    return result;
  }
);

export const fetchEstadisticasGrupos = createAsyncThunk(
  'familiares/fetchEstadisticasGrupos',
  async () => {
    const result = await gruposApi.getEstadisticasGrupos();
    return result;
  }
);

// NUEVO (v2026-02-26): Obtener sugerencias de miembros basadas en relaciones familiares
export const fetchSuggestedMembers = createAsyncThunk(
  'familiares/fetchSuggestedMembers',
  async (
    { referenteId, includeDetails = true, includeParentesco = true }:
    { referenteId: number; includeDetails?: boolean; includeParentesco?: boolean }
  ) => {
    const result = await gruposApi.getSuggestedMembers(referenteId, includeDetails, includeParentesco);
    return result;
  }
);

const familiaresSlice = createSlice({
  name: 'familiares',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<FamiliaresFilters>) => {
      state.filters = action.payload;
      state.filteredRelaciones = state.relaciones.filter(relacion => {
        const filters = action.payload;
        if (filters.personaId && relacion.personaId !== filters.personaId) return false;
        if (filters.tipoRelacion && relacion.tipoRelacion !== filters.tipoRelacion) return false;
        if (filters.responsableFinanciero !== undefined && relacion.responsableFinanciero !== filters.responsableFinanciero) return false;
        if (filters.contactoEmergencia !== undefined && relacion.contactoEmergencia !== filters.contactoEmergencia) return false;
        if (filters.activo !== undefined && relacion.activo !== filters.activo) return false;
        return true;
      });
    },
    clearFilters: (state) => {
      state.filters = {};
      state.filteredRelaciones = state.relaciones;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentPersona: (state, action: PayloadAction<PersonaConFamiliares | null>) => {
      state.currentPersona = action.payload;
    },
    // NUEVO (v2026-02-26): Limpiar warnings de grupos
    clearGrupoWarnings: (state) => {
      state.grupoWarnings = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch relaciones
      .addCase(fetchRelaciones.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRelaciones.fulfilled, (state, action) => {
        state.loading = false;
        state.relaciones = action.payload;
        state.filteredRelaciones = action.payload;

        // Calcular estadísticas
        state.estadisticas = {
          totalRelaciones: action.payload.length,
          totalGrupos: state.grupos.length,
          personasConFamiliares: [...new Set(action.payload.map(r => r.personaId))].length,
          relacionesPorTipo: action.payload.reduce((acc, r) => {
            acc[r.tipoRelacion] = (acc[r.tipoRelacion] || 0) + 1;
            return acc;
          }, {} as { [key: string]: number }),
          descuentoPromedio: action.payload
            .filter(r => r.porcentajeDescuento)
            .reduce((sum, r) => sum + (r.porcentajeDescuento || 0), 0) /
            action.payload.filter(r => r.porcentajeDescuento).length || 0,
        };
      })
      .addCase(fetchRelaciones.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al cargar relaciones familiares';
      })

      // Fetch grupos
      .addCase(fetchGrupos.fulfilled, (state, action) => {
        state.grupos = action.payload;
        state.estadisticas.totalGrupos = action.payload.length;
      })

      // Fetch personas con familiares
      .addCase(fetchPersonasConFamiliares.fulfilled, (state, action) => {
        state.personasConFamiliares = action.payload;
      })

      // Crear relación
      .addCase(crearRelacion.fulfilled, (state, action) => {
        state.relaciones.push(action.payload);
        state.filteredRelaciones.push(action.payload);
      })
      .addCase(crearRelacion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al crear la relación';
      })

      // Crear grupo familiar
      .addCase(crearGrupoFamiliar.fulfilled, (state, action) => {
        // Extraer grupo y warnings del payload
        const { grupo, warnings } = action.payload;
        state.grupos.push(grupo);

        // Almacenar warnings si existen
        if (warnings && warnings.length > 0) {
          state.grupoWarnings = warnings;
        }
      })

      // Eliminar relación
      .addCase(eliminarRelacion.fulfilled, (state, action) => {
        state.relaciones = state.relaciones.filter(r => r.id !== action.payload);
        state.filteredRelaciones = state.filteredRelaciones.filter(r => r.id !== action.payload);
      })

      // Actualizar relación
      .addCase(actualizarRelacion.fulfilled, (state, action) => {
        const index = state.relaciones.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.relaciones[index] = action.payload;
          const filteredIndex = state.filteredRelaciones.findIndex(r => r.id === action.payload.id);
          if (filteredIndex !== -1) {
            state.filteredRelaciones[filteredIndex] = action.payload;
          }
        }
      })

      // FASE 2: Fetch all relaciones con paginación
      .addCase(fetchAllRelaciones.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllRelaciones.fulfilled, (state, action) => {
        state.loading = false;
        state.relaciones = action.payload.data;
        state.filteredRelaciones = action.payload.data;

        // Actualizar estadísticas
        state.estadisticas = {
          ...state.estadisticas,
          totalRelaciones: action.payload.total,
        };
      })
      .addCase(fetchAllRelaciones.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al cargar relaciones';
      })

      // Fetch estadísticas de parentesco
      .addCase(fetchEstadisticasParentesco.fulfilled, (state, action) => {
        const relacionesPorTipo: { [key: string]: number } = {};
        action.payload.forEach(stat => {
          relacionesPorTipo[stat.parentesco] = stat.count;
        });
        state.estadisticas.relacionesPorTipo = relacionesPorTipo;
      })

      // ============================================================================
      // EXTRA REDUCERS PARA GRUPOS FAMILIARES
      // ============================================================================

      // Fetch grupo by ID
      .addCase(fetchGrupoById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGrupoById.fulfilled, (state, action) => {
        state.loading = false;
        // Actualizar o agregar el grupo en el array
        const index = state.grupos.findIndex(g => g.id === action.payload.id);
        if (index !== -1) {
          state.grupos[index] = action.payload;
        } else {
          state.grupos.push(action.payload);
        }
      })
      .addCase(fetchGrupoById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al cargar el grupo';
      })

      // Actualizar grupo
      .addCase(actualizarGrupo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(actualizarGrupo.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.grupos.findIndex(g => g.id === action.payload.id);
        if (index !== -1) {
          state.grupos[index] = action.payload;
        }
      })
      .addCase(actualizarGrupo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al actualizar el grupo';
      })

      // Eliminar grupo
      .addCase(eliminarGrupo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(eliminarGrupo.fulfilled, (state, action) => {
        state.loading = false;
        state.grupos = state.grupos.filter(g => g.id !== action.payload);
        state.estadisticas.totalGrupos = state.grupos.length;
      })
      .addCase(eliminarGrupo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al eliminar el grupo';
      })

      // Agregar miembro a grupo
      .addCase(agregarMiembroGrupo.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.grupoWarnings = []; // Limpiar warnings anteriores
      })
      .addCase(agregarMiembroGrupo.fulfilled, (state, action) => {
        state.loading = false;

        // El payload es GrupoResponseWithWarnings: { grupo, warnings? }
        const response = action.payload as GrupoResponseWithWarnings;
        const grupo = response.grupo;
        const warnings = response.warnings || [];

        const index = state.grupos.findIndex(g => g.id === grupo.id);
        if (index !== -1) {
          state.grupos[index] = grupo;
        }

        // Guardar warnings en el estado
        if (warnings.length > 0) {
          state.grupoWarnings = warnings;
        }
      })
      .addCase(agregarMiembroGrupo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al agregar miembro';
        state.grupoWarnings = [];
      })

      // Remover miembro de grupo
      .addCase(removerMiembroGrupo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removerMiembroGrupo.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.grupos.findIndex(g => g.id === action.payload.id);
        if (index !== -1) {
          state.grupos[index] = action.payload;
        }
      })
      .addCase(removerMiembroGrupo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al remover miembro';
      })

      // Actualizar lista de miembros
      .addCase(actualizarMiembrosGrupo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(actualizarMiembrosGrupo.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.grupos.findIndex(g => g.id === action.payload.id);
        if (index !== -1) {
          state.grupos[index] = action.payload;
        }
      })
      .addCase(actualizarMiembrosGrupo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al actualizar miembros';
      })

      // Fetch estadísticas de grupos
      .addCase(fetchEstadisticasGrupos.fulfilled, (state, action) => {
        state.estadisticas.totalGrupos = action.payload.totalGrupos;
      })

      // NUEVO (v2026-02-26): Fetch sugerencias de miembros
      .addCase(fetchSuggestedMembers.pending, (state) => {
        state.loadingSuggestions = true;
        state.error = null;
        state.suggestedMembers = [];
      })
      .addCase(fetchSuggestedMembers.fulfilled, (state, action) => {
        state.loadingSuggestions = false;
        // Guardar las personas sugeridas (si includeDetails=true)
        state.suggestedMembers = action.payload.suggestedPersons || [];
      })
      .addCase(fetchSuggestedMembers.rejected, (state, action) => {
        state.loadingSuggestions = false;
        state.error = action.error.message || 'Error al cargar sugerencias de miembros';
        state.suggestedMembers = [];
      });
  },
});

export const { setFilters, clearFilters, clearError, setCurrentPersona, clearGrupoWarnings } = familiaresSlice.actions;
export default familiaresSlice.reducer;