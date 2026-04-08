import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
  TipoActividad,
  TiposActividadState,
  CreateTipoActividadDto,
  UpdateTipoActividadDto,
  TiposActividadQueryParams,
} from '../../types/tipoActividad.types';
import { tiposActividadApi } from '../../services/tiposActividadApi';

// ============================================
// ESTADO INICIAL
// ============================================

const initialState: TiposActividadState = {
  tipos: [],
  loading: false,
  error: null,
  selectedTipo: null,
  showInactive: false,
};

// ============================================
// ASYNC THUNKS
// ============================================

/**
 * Obtener todos los tipos de actividad
 */
export const fetchTiposActividad = createAsyncThunk(
  'tiposActividad/fetchTiposActividad',
  async (params: TiposActividadQueryParams | undefined, { rejectWithValue }) => {
    try {
      const tipos = await tiposActividadApi.listar(params);
      return tipos;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Error al cargar tipos de actividad');
    }
  }
);

/**
 * Obtener un tipo de actividad por ID
 */
export const fetchTipoActividadById = createAsyncThunk(
  'tiposActividad/fetchTipoActividadById',
  async (id: number, { rejectWithValue }) => {
    try {
      const tipo = await tiposActividadApi.obtenerPorId(id);
      return tipo;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Error al cargar tipo de actividad');
    }
  }
);

/**
 * Crear un nuevo tipo de actividad
 */
export const createTipoActividad = createAsyncThunk(
  'tiposActividad/createTipoActividad',
  async (data: CreateTipoActividadDto, { rejectWithValue }) => {
    try {
      const nuevoTipo = await tiposActividadApi.crear(data);
      return nuevoTipo;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Error al crear tipo de actividad');
    }
  }
);

/**
 * Actualizar un tipo de actividad existente
 */
export const updateTipoActividad = createAsyncThunk(
  'tiposActividad/updateTipoActividad',
  async ({ id, data }: { id: number; data: UpdateTipoActividadDto }, { rejectWithValue }) => {
    try {
      const tipoActualizado = await tiposActividadApi.actualizar(id, data);
      return tipoActualizado;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Error al actualizar tipo de actividad');
    }
  }
);

/**
 * Eliminar (desactivar) un tipo de actividad
 */
export const deleteTipoActividad = createAsyncThunk(
  'tiposActividad/deleteTipoActividad',
  async (id: number, { rejectWithValue }) => {
    try {
      await tiposActividadApi.eliminar(id);
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Error al eliminar tipo de actividad');
    }
  }
);

/**
 * Reordenar tipos de actividad
 */
export const reorderTiposActividad = createAsyncThunk(
  'tiposActividad/reorderTiposActividad',
  async (tipoIds: number[], { rejectWithValue }) => {
    try {
      await tiposActividadApi.reordenar({ tipoIds });
      return tipoIds;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Error al reordenar tipos de actividad');
    }
  }
);

// ============================================
// SLICE
// ============================================

const tiposActividadSlice = createSlice({
  name: 'tiposActividad',
  initialState,
  reducers: {
    /**
     * Seleccionar un tipo de actividad
     */
    setSelectedTipo: (state, action: PayloadAction<TipoActividad | null>) => {
      state.selectedTipo = action.payload;
    },

    /**
     * Limpiar error
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Alternar visualización de tipos inactivos
     */
    toggleShowInactive: (state) => {
      state.showInactive = !state.showInactive;
    },

    /**
     * Establecer visualización de tipos inactivos
     */
    setShowInactive: (state, action: PayloadAction<boolean>) => {
      state.showInactive = action.payload;
    },

    /**
     * Actualizar orden local (para drag & drop UI)
     */
    updateLocalOrder: (state, action: PayloadAction<TipoActividad[]>) => {
      state.tipos = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // ============================================
      // Fetch tipos de actividad
      // ============================================
      .addCase(fetchTiposActividad.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTiposActividad.fulfilled, (state, action) => {
        state.loading = false;
        state.tipos = action.payload;
      })
      .addCase(fetchTiposActividad.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // Fetch tipo de actividad por ID
      // ============================================
      .addCase(fetchTipoActividadById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTipoActividadById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTipo = action.payload;
        // También actualizar en la lista si existe
        const index = state.tipos.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.tipos[index] = action.payload;
        }
      })
      .addCase(fetchTipoActividadById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // Crear tipo de actividad
      // ============================================
      .addCase(createTipoActividad.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTipoActividad.fulfilled, (state, action) => {
        state.loading = false;
        state.tipos.push(action.payload);
        // Reordenar por orden
        state.tipos.sort((a, b) => a.orden - b.orden);
      })
      .addCase(createTipoActividad.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // Actualizar tipo de actividad
      // ============================================
      .addCase(updateTipoActividad.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTipoActividad.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tipos.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.tipos[index] = action.payload;
        }
        if (state.selectedTipo?.id === action.payload.id) {
          state.selectedTipo = action.payload;
        }
        // Reordenar por orden
        state.tipos.sort((a, b) => a.orden - b.orden);
      })
      .addCase(updateTipoActividad.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // Eliminar tipo de actividad
      // ============================================
      .addCase(deleteTipoActividad.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTipoActividad.fulfilled, (state, action) => {
        state.loading = false;
        // Marcar como inactivo en lugar de eliminar
        const index = state.tipos.findIndex(t => t.id === action.payload);
        if (index !== -1) {
          state.tipos[index].activo = false;
        }
        if (state.selectedTipo?.id === action.payload) {
          state.selectedTipo = null;
        }
      })
      .addCase(deleteTipoActividad.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // Reordenar tipos de actividad
      // ============================================
      .addCase(reorderTiposActividad.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reorderTiposActividad.fulfilled, (state, action) => {
        state.loading = false;
        // Actualizar orden según el array de IDs
        const tipoIds = action.payload;
        state.tipos.forEach((tipo) => {
          const newOrder = tipoIds.indexOf(tipo.id);
          if (newOrder !== -1) {
            tipo.orden = newOrder + 1;
          }
        });
        // Reordenar
        state.tipos.sort((a, b) => a.orden - b.orden);
      })
      .addCase(reorderTiposActividad.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// ============================================
// EXPORTS
// ============================================

export const {
  setSelectedTipo,
  clearError,
  toggleShowInactive,
  setShowInactive,
  updateLocalOrder,
} = tiposActividadSlice.actions;

export default tiposActividadSlice.reducer;
