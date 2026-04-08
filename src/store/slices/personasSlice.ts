import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import personasApi from '../../services/personasApi';
import type {
  Persona,
  PersonasQueryParams,
  CatalogosPersonas,
  CreatePersonaDTO,
  UpdatePersonaDTO,
} from '../../types/persona.types';

/**
 * Estado del slice de Personas V2
 */
interface PersonasState {
  // Lista de personas
  personas: Persona[];
  loading: boolean;
  error: string | null;

  // Paginación
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };

  // Filtros actuales
  filters: PersonasQueryParams;

  // Persona seleccionada (para detalle/edición)
  selectedPersona: Persona | null;
  selectedPersonaLoading: boolean;

  // Catálogos
  catalogos: CatalogosPersonas | null;
  catalogosLoading: boolean;
  catalogosError: string | null;
}

const initialState: PersonasState = {
  personas: [],
  loading: false,
  error: null,

  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },

  filters: {
    page: 1,
    limit: 20,
    includeTipos: true,
    includeContactos: false,
    includeRelaciones: true,
  },

  selectedPersona: null,
  selectedPersonaLoading: false,

  catalogos: null,
  catalogosLoading: false,
  catalogosError: null,
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

/**
 * Cargar catálogos de Personas V2
 */
export const fetchCatalogosPersonas = createAsyncThunk(
  'personas/fetchCatalogos',
  async (_, { rejectWithValue }) => {
    try {
      const response = await personasApi.getCatalogos();
      return response.data;
    } catch (error: any) {
      // Si el endpoint no existe, retornar catálogos vacíos
      console.warn('⚠️ Endpoint de catálogos no disponible, usando valores por defecto');
      return {
        tiposPersona: [],
        categoriasSocio: [],
        especialidadesDocentes: [],
        tiposContacto: [],
      };
    }
  }
);

/**
 * Cargar lista de personas con filtros
 */
export const fetchPersonas = createAsyncThunk(
  'personas/fetchPersonas',
  async (params: PersonasQueryParams | undefined, { rejectWithValue }) => {
    try {
      const response = await personasApi.getAll(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Error al cargar personas'
      );
    }
  }
);

/**
 * Cargar una persona por ID
 */
export const fetchPersonaById = createAsyncThunk(
  'personas/fetchPersonaById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await personasApi.getById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Error al cargar persona'
      );
    }
  }
);

/**
 * Crear nueva persona
 */
export const createPersona = createAsyncThunk(
  'personas/createPersona',
  async (data: CreatePersonaDTO, { rejectWithValue }) => {
    try {
      const response = await personasApi.create(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Error al crear persona'
      );
    }
  }
);

/**
 * Actualizar persona existente
 */
export const updatePersona = createAsyncThunk(
  'personas/updatePersona',
  async ({ id, data }: { id: number; data: UpdatePersonaDTO }, { rejectWithValue }) => {
    try {
      const response = await personasApi.update(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Error al actualizar persona'
      );
    }
  }
);

/**
 * Eliminar persona
 */
export const deletePersona = createAsyncThunk(
  'personas/deletePersona',
  async (id: number, { rejectWithValue }) => {
    try {
      await personasApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Error al eliminar persona'
      );
    }
  }
);

// ============================================================================
// SLICE
// ============================================================================

const personasSlice = createSlice({
  name: 'personas',
  initialState,
  reducers: {
    // Actualizar filtros
    setFilters: (state, action: PayloadAction<PersonasQueryParams>) => {
      state.filters = action.payload;
    },

    // Resetear filtros
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },

    // Seleccionar persona
    setSelectedPersona: (state, action: PayloadAction<Persona | null>) => {
      state.selectedPersona = action.payload;
    },

    // Limpiar errores
    clearError: (state) => {
      state.error = null;
    },

    // Limpiar estado
    clearState: (state) => {
      state.personas = [];
      state.selectedPersona = null;
      state.error = null;
    },

    /**
     * NUEVO: Actualizar tipos asignados de la persona seleccionada
     * Se usa cuando se obtienen los tipos asignados a una persona
     */
    setTiposAsignados: (state, action: PayloadAction<any[]>) => {
      if (state.selectedPersona) {
        state.selectedPersona.tipos = action.payload;
      }
    },

    /**
     * NUEVO: Agregar un tipo a la persona seleccionada
     * Se usa tras asignar exitosamente un tipo
     */
    agregarTipo: (state, action: PayloadAction<any>) => {
      if (state.selectedPersona && state.selectedPersona.tipos) {
        state.selectedPersona.tipos.push(action.payload);
      }
    },

    /**
     * NUEVO: Remover un tipo de la persona seleccionada
     * Se usa tras desasignar exitosamente un tipo
     */
    removerTipo: (state, action: PayloadAction<number>) => {
      if (state.selectedPersona && state.selectedPersona.tipos) {
        state.selectedPersona.tipos = state.selectedPersona.tipos.filter(
          (t: any) => t.id !== action.payload
        );
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Catálogos
    builder.addCase(fetchCatalogosPersonas.pending, (state) => {
      state.catalogosLoading = true;
      state.catalogosError = null;
    });
    builder.addCase(fetchCatalogosPersonas.fulfilled, (state, action) => {
      state.catalogosLoading = false;
      state.catalogos = action.payload;
    });
    builder.addCase(fetchCatalogosPersonas.rejected, (state, action) => {
      state.catalogosLoading = false;
      state.catalogosError = action.payload as string;
    });

    // Fetch Personas
    builder.addCase(fetchPersonas.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPersonas.fulfilled, (state, action) => {
      state.loading = false;
      state.personas = action.payload.data;
      if (action.payload.meta) {
        // Mapear 'meta' del backend a estructura de paginación del estado
        state.pagination = {
          page: action.payload.meta.page,
          limit: action.payload.meta.limit,
          total: action.payload.meta.total,
          pages: action.payload.meta.totalPages, // Backend usa 'totalPages', estado usa 'pages'
        };
      }
    });
    builder.addCase(fetchPersonas.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Persona By ID
    builder.addCase(fetchPersonaById.pending, (state) => {
      state.selectedPersonaLoading = true;
      state.error = null;
    });
    builder.addCase(fetchPersonaById.fulfilled, (state, action) => {
      state.selectedPersonaLoading = false;
      state.selectedPersona = action.payload;
    });
    builder.addCase(fetchPersonaById.rejected, (state, action) => {
      state.selectedPersonaLoading = false;
      state.error = action.payload as string;
    });

    // Create Persona
    builder.addCase(createPersona.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createPersona.fulfilled, (state, action) => {
      state.loading = false;
      state.personas.unshift(action.payload);
      state.pagination.total += 1;
    });
    builder.addCase(createPersona.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update Persona
    builder.addCase(updatePersona.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updatePersona.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.personas.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.personas[index] = action.payload;
      }
      if (state.selectedPersona?.id === action.payload.id) {
        state.selectedPersona = action.payload;
      }
    });
    builder.addCase(updatePersona.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete Persona
    builder.addCase(deletePersona.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deletePersona.fulfilled, (state, action) => {
      state.loading = false;
      state.personas = state.personas.filter((p) => p.id !== action.payload);
      state.pagination.total = Math.max(0, state.pagination.total - 1);
      if (state.selectedPersona?.id === action.payload) {
        state.selectedPersona = null;
      }
    });
    builder.addCase(deletePersona.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export const {
  setFilters,
  resetFilters,
  setSelectedPersona,
  clearError,
  clearState,
  setTiposAsignados,
  agregarTipo,
  removerTipo,
} = personasSlice.actions;

export default personasSlice.reducer;
