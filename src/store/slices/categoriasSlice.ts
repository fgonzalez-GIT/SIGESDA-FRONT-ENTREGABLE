import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import categoriasApi from '../../services/categoriasApi';
import {
  CategoriaSocio,
  CreateCategoriaDto,
  UpdateCategoriaDto,
  CategoriasState,
} from '../../types/categoria.types';

// Estado inicial
const initialState: CategoriasState = {
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
 * Obtener todas las categorías
 */
export const fetchCategorias = createAsyncThunk(
  'categorias/fetchCategorias',
  async ({ includeInactive }: { includeInactive?: boolean } = {}, { rejectWithValue }) => {
    try {
      const response = await categoriasApi.getAll({ includeInactive });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Error al cargar categorías'
      );
    }
  }
);

/**
 * Obtener una categoría por ID
 */
export const fetchCategoriaById = createAsyncThunk(
  'categorias/fetchCategoriaById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await categoriasApi.getById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Error al cargar categoría'
      );
    }
  }
);

/**
 * Obtener una categoría por código
 */
export const fetchCategoriaByCodigo = createAsyncThunk(
  'categorias/fetchCategoriaByCodigo',
  async (codigo: string, { rejectWithValue }) => {
    try {
      const response = await categoriasApi.getByCodigo(codigo);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Error al cargar categoría'
      );
    }
  }
);

/**
 * Crear una nueva categoría
 */
export const createCategoria = createAsyncThunk(
  'categorias/createCategoria',
  async (categoria: CreateCategoriaDto, { rejectWithValue }) => {
    try {
      const response = await categoriasApi.create(categoria);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Error al crear categoría'
      );
    }
  }
);

/**
 * Actualizar una categoría existente
 */
export const updateCategoria = createAsyncThunk(
  'categorias/updateCategoria',
  async ({ id, data }: { id: number; data: UpdateCategoriaDto }, { rejectWithValue }) => {
    try {
      const response = await categoriasApi.update(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Error al actualizar categoría'
      );
    }
  }
);

/**
 * Activar/Desactivar una categoría
 */
export const toggleCategoria = createAsyncThunk(
  'categorias/toggleCategoria',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await categoriasApi.toggle(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Error al cambiar estado de categoría'
      );
    }
  }
);

/**
 * Reordenar categorías
 */
export const reorderCategorias = createAsyncThunk(
  'categorias/reorderCategorias',
  async (categoriaIds: number[], { rejectWithValue }) => {
    try {
      await categoriasApi.reorder(categoriaIds);
      return categoriaIds;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Error al reordenar categorías'
      );
    }
  }
);

/**
 * Eliminar una categoría
 */
export const deleteCategoria = createAsyncThunk(
  'categorias/deleteCategoria',
  async (id: number, { rejectWithValue }) => {
    try {
      await categoriasApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Error al eliminar categoría'
      );
    }
  }
);

// ============================================
// SLICE
// ============================================

const categoriasSlice = createSlice({
  name: 'categorias',
  initialState,
  reducers: {
    /**
     * Seleccionar una categoría
     */
    setSelectedCategoria: (state, action: PayloadAction<CategoriaSocio | null>) => {
      state.selectedCategoria = action.payload;
    },

    /**
     * Alternar mostrar categorías inactivas
     */
    toggleShowInactive: (state) => {
      state.showInactive = !state.showInactive;
    },

    /**
     * Limpiar errores
     */
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ============================================
      // Fetch Categorías
      // ============================================
      .addCase(fetchCategorias.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategorias.fulfilled, (state, action) => {
        state.loading = false;
        state.categorias = action.payload;
      })
      .addCase(fetchCategorias.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // Fetch Categoría por ID
      // ============================================
      .addCase(fetchCategoriaById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategoriaById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCategoria = action.payload;

        // Actualizar en la lista si existe
        const index = state.categorias.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.categorias[index] = action.payload;
        }
      })
      .addCase(fetchCategoriaById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // Fetch Categoría por Código
      // ============================================
      .addCase(fetchCategoriaByCodigo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategoriaByCodigo.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCategoria = action.payload;
      })
      .addCase(fetchCategoriaByCodigo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // Crear Categoría
      // ============================================
      .addCase(createCategoria.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategoria.fulfilled, (state, action) => {
        state.loading = false;
        state.categorias.push(action.payload);
        // Ordenar por campo 'orden'
        state.categorias.sort((a, b) => a.orden - b.orden);
      })
      .addCase(createCategoria.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // Actualizar Categoría
      // ============================================
      .addCase(updateCategoria.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategoria.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.categorias.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.categorias[index] = action.payload;
        }
        // Actualizar selected si es la misma
        if (state.selectedCategoria?.id === action.payload.id) {
          state.selectedCategoria = action.payload;
        }
        // Reordenar
        state.categorias.sort((a, b) => a.orden - b.orden);
      })
      .addCase(updateCategoria.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // Toggle Categoría
      // ============================================
      .addCase(toggleCategoria.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleCategoria.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.categorias.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.categorias[index] = action.payload;
        }
        // Actualizar selected si es la misma
        if (state.selectedCategoria?.id === action.payload.id) {
          state.selectedCategoria = action.payload;
        }
      })
      .addCase(toggleCategoria.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // Reordenar Categorías
      // ============================================
      .addCase(reorderCategorias.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reorderCategorias.fulfilled, (state, action) => {
        state.loading = false;
        // Reordenar el array según el nuevo orden
        const newOrder = action.payload;
        state.categorias.sort((a, b) => {
          const indexA = newOrder.indexOf(a.id);
          const indexB = newOrder.indexOf(b.id);
          return indexA - indexB;
        });
      })
      .addCase(reorderCategorias.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // Eliminar Categoría
      // ============================================
      .addCase(deleteCategoria.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategoria.fulfilled, (state, action) => {
        state.loading = false;
        state.categorias = state.categorias.filter(c => c.id !== action.payload);
        // Limpiar selected si es la misma
        if (state.selectedCategoria?.id === action.payload) {
          state.selectedCategoria = null;
        }
      })
      .addCase(deleteCategoria.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// ============================================
// EXPORTS
// ============================================

export const { setSelectedCategoria, toggleShowInactive, clearError } = categoriasSlice.actions;
export default categoriasSlice.reducer;
