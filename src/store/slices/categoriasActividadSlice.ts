import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
  CategoriaActividad,
  CategoriasActividadState,
  CreateCategoriaActividadDto,
  UpdateCategoriaActividadDto,
  CategoriasActividadQueryParams,
} from '../../types/categoriaActividad.types';
import { categoriasActividadApi } from '../../services/categoriasActividadApi';

// ============================================
// ESTADO INICIAL
// ============================================

const initialState: CategoriasActividadState = {
  categorias: [],
  loading: false,
  error: null,
  selectedCategoria: null,
  showInactive: false,
};

// ============================================
// ASYNC THUNKS
// ============================================

/**
 * Obtener todas las categorías de actividad
 */
export const fetchCategoriasActividad = createAsyncThunk(
  'categoriasActividad/fetchCategoriasActividad',
  async (params: CategoriasActividadQueryParams | undefined, { rejectWithValue }) => {
    try {
      const categorias = await categoriasActividadApi.listar(params);
      return categorias;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Error al cargar categorías de actividad');
    }
  }
);

/**
 * Obtener una categoría de actividad por ID
 */
export const fetchCategoriaActividadById = createAsyncThunk(
  'categoriasActividad/fetchCategoriaActividadById',
  async (id: number, { rejectWithValue }) => {
    try {
      const categoria = await categoriasActividadApi.obtenerPorId(id);
      return categoria;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Error al cargar categoría de actividad');
    }
  }
);

/**
 * Crear una nueva categoría de actividad
 */
export const createCategoriaActividad = createAsyncThunk(
  'categoriasActividad/createCategoriaActividad',
  async (data: CreateCategoriaActividadDto, { rejectWithValue }) => {
    try {
      const nuevaCategoria = await categoriasActividadApi.crear(data);
      return nuevaCategoria;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Error al crear categoría de actividad');
    }
  }
);

/**
 * Actualizar una categoría de actividad existente
 */
export const updateCategoriaActividad = createAsyncThunk(
  'categoriasActividad/updateCategoriaActividad',
  async ({ id, data }: { id: number; data: UpdateCategoriaActividadDto }, { rejectWithValue }) => {
    try {
      const categoriaActualizada = await categoriasActividadApi.actualizar(id, data);
      return categoriaActualizada;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Error al actualizar categoría de actividad');
    }
  }
);

/**
 * Eliminar (desactivar) una categoría de actividad
 */
export const deleteCategoriaActividad = createAsyncThunk(
  'categoriasActividad/deleteCategoriaActividad',
  async (id: number, { rejectWithValue }) => {
    try {
      await categoriasActividadApi.eliminar(id);
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Error al eliminar categoría de actividad');
    }
  }
);

/**
 * Reordenar categorías de actividad
 */
export const reorderCategoriasActividad = createAsyncThunk(
  'categoriasActividad/reorderCategoriasActividad',
  async (categoriaIds: number[], { rejectWithValue }) => {
    try {
      await categoriasActividadApi.reordenar({ categoriaIds });
      return categoriaIds;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Error al reordenar categorías de actividad');
    }
  }
);

// ============================================
// SLICE
// ============================================

const categoriasActividadSlice = createSlice({
  name: 'categoriasActividad',
  initialState,
  reducers: {
    /**
     * Seleccionar una categoría de actividad
     */
    setSelectedCategoria: (state, action: PayloadAction<CategoriaActividad | null>) => {
      state.selectedCategoria = action.payload;
    },

    /**
     * Limpiar error
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Alternar visualización de categorías inactivas
     */
    toggleShowInactive: (state) => {
      state.showInactive = !state.showInactive;
    },

    /**
     * Establecer visualización de categorías inactivas
     */
    setShowInactive: (state, action: PayloadAction<boolean>) => {
      state.showInactive = action.payload;
    },

    /**
     * Actualizar orden local (para drag & drop UI)
     */
    updateLocalOrder: (state, action: PayloadAction<CategoriaActividad[]>) => {
      state.categorias = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // ============================================
      // Fetch categorías de actividad
      // ============================================
      .addCase(fetchCategoriasActividad.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategoriasActividad.fulfilled, (state, action) => {
        state.loading = false;
        state.categorias = action.payload;
      })
      .addCase(fetchCategoriasActividad.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // Fetch categoría de actividad por ID
      // ============================================
      .addCase(fetchCategoriaActividadById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategoriaActividadById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCategoria = action.payload;
        // También actualizar en la lista si existe
        const index = state.categorias.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.categorias[index] = action.payload;
        }
      })
      .addCase(fetchCategoriaActividadById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // Crear categoría de actividad
      // ============================================
      .addCase(createCategoriaActividad.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategoriaActividad.fulfilled, (state, action) => {
        state.loading = false;
        state.categorias.push(action.payload);
        // Reordenar por orden
        state.categorias.sort((a, b) => a.orden - b.orden);
      })
      .addCase(createCategoriaActividad.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // Actualizar categoría de actividad
      // ============================================
      .addCase(updateCategoriaActividad.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategoriaActividad.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.categorias.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.categorias[index] = action.payload;
        }
        if (state.selectedCategoria?.id === action.payload.id) {
          state.selectedCategoria = action.payload;
        }
        // Reordenar por orden
        state.categorias.sort((a, b) => a.orden - b.orden);
      })
      .addCase(updateCategoriaActividad.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // Eliminar categoría de actividad
      // ============================================
      .addCase(deleteCategoriaActividad.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategoriaActividad.fulfilled, (state, action) => {
        state.loading = false;
        // Marcar como inactivo en lugar de eliminar
        const index = state.categorias.findIndex(c => c.id === action.payload);
        if (index !== -1) {
          state.categorias[index].activo = false;
        }
        if (state.selectedCategoria?.id === action.payload) {
          state.selectedCategoria = null;
        }
      })
      .addCase(deleteCategoriaActividad.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // Reordenar categorías de actividad
      // ============================================
      .addCase(reorderCategoriasActividad.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reorderCategoriasActividad.fulfilled, (state, action) => {
        state.loading = false;
        // Actualizar orden según el array de IDs
        const categoriaIds = action.payload;
        state.categorias.forEach((categoria) => {
          const newOrder = categoriaIds.indexOf(categoria.id);
          if (newOrder !== -1) {
            categoria.orden = newOrder + 1;
          }
        });
        // Reordenar
        state.categorias.sort((a, b) => a.orden - b.orden);
      })
      .addCase(reorderCategoriasActividad.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// ============================================
// EXPORTS
// ============================================

export const {
  setSelectedCategoria,
  clearError,
  toggleShowInactive,
  setShowInactive,
  updateLocalOrder,
} = categoriasActividadSlice.actions;

export default categoriasActividadSlice.reducer;
