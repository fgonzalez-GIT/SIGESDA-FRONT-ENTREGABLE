import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import equipamientosApi from '@/services/equipamientosApi';
import type {
  Equipamiento,
  CreateEquipamientoDto,
  UpdateEquipamientoDto,
  EquipamientoQueryParams,
} from '@/types/equipamiento.types';

// ==================== ESTADO ====================

interface EquipamientosState {
  items: Equipamiento[];
  loading: boolean;
  error: string | null;
  selectedItem: Equipamiento | null;
  showInactive: boolean;
}

// Estado inicial
const initialState: EquipamientosState = {
  items: [],
  loading: false,
  error: null,
  selectedItem: null,
  showInactive: false,
};

// ==================== ASYNC THUNKS ====================

/**
 * Obtener todos los equipamientos
 */
export const fetchEquipamientos = createAsyncThunk(
  'equipamientos/fetchEquipamientos',
  async (params: EquipamientoQueryParams | undefined = undefined, { rejectWithValue }) => {
    try {
      const data = await equipamientosApi.getAll(params);
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Error al cargar equipamientos'
      );
    }
  }
);

/**
 * Obtener equipamiento por ID
 */
export const fetchEquipamientoById = createAsyncThunk(
  'equipamientos/fetchEquipamientoById',
  async (id: number, { rejectWithValue }) => {
    try {
      const data = await equipamientosApi.getById(id);
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Error al cargar equipamiento'
      );
    }
  }
);

/**
 * Crear nuevo equipamiento
 */
export const createEquipamiento = createAsyncThunk(
  'equipamientos/createEquipamiento',
  async (data: CreateEquipamientoDto, { rejectWithValue }) => {
    try {
      const result = await equipamientosApi.create(data);
      return result;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Error al crear equipamiento'
      );
    }
  }
);

/**
 * Actualizar equipamiento
 */
export const updateEquipamiento = createAsyncThunk(
  'equipamientos/updateEquipamiento',
  async ({ id, data }: { id: number; data: UpdateEquipamientoDto }, { rejectWithValue }) => {
    try {
      const result = await equipamientosApi.update(id, data);
      return result;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Error al actualizar equipamiento'
      );
    }
  }
);

/**
 * Eliminar equipamiento
 */
export const deleteEquipamiento = createAsyncThunk(
  'equipamientos/deleteEquipamiento',
  async (id: number, { rejectWithValue }) => {
    try {
      await equipamientosApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Error al eliminar equipamiento'
      );
    }
  }
);

/**
 * Toggle activo/inactivo
 */
export const toggleEquipamiento = createAsyncThunk(
  'equipamientos/toggleEquipamiento',
  async (id: number, { rejectWithValue }) => {
    try {
      const result = await equipamientosApi.toggle(id);
      return result;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Error al cambiar estado'
      );
    }
  }
);

/**
 * Reordenar equipamientos
 */
export const reorderEquipamientos = createAsyncThunk(
  'equipamientos/reorderEquipamientos',
  async (ids: number[], { rejectWithValue }) => {
    try {
      await equipamientosApi.reorder(ids);
      return ids;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Error al reordenar equipamientos'
      );
    }
  }
);

/**
 * Reactivar equipamiento
 */
export const reactivateEquipamiento = createAsyncThunk(
  'equipamientos/reactivateEquipamiento',
  async (id: number, { rejectWithValue }) => {
    try {
      const result = await equipamientosApi.reactivate(id);
      return result;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Error al reactivar equipamiento'
      );
    }
  }
);

// ==================== SLICE ====================

const equipamientosSlice = createSlice({
  name: 'equipamientos',
  initialState,
  reducers: {
    /**
     * Seleccionar equipamiento
     */
    setSelectedEquipamiento: (state, action: PayloadAction<Equipamiento | null>) => {
      state.selectedItem = action.payload;
    },

    /**
     * Alternar mostrar inactivos
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

    /**
     * Limpiar estado completo
     */
    resetEquipamientos: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // ==================== Fetch All ====================
      .addCase(fetchEquipamientos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEquipamientos.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchEquipamientos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ==================== Fetch By ID ====================
      .addCase(fetchEquipamientoById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEquipamientoById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload;

        // Actualizar en lista si existe
        const index = state.items.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(fetchEquipamientoById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ==================== Create ====================
      .addCase(createEquipamiento.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEquipamiento.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
        // Ordenar por campo 'orden'
        state.items.sort((a, b) => a.orden - b.orden);
      })
      .addCase(createEquipamiento.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ==================== Update ====================
      .addCase(updateEquipamiento.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEquipamiento.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        // Actualizar selected si es el mismo
        if (state.selectedItem?.id === action.payload.id) {
          state.selectedItem = action.payload;
        }
        // Reordenar
        state.items.sort((a, b) => a.orden - b.orden);
      })
      .addCase(updateEquipamiento.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ==================== Delete ====================
      .addCase(deleteEquipamiento.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEquipamiento.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((e) => e.id !== action.payload);
        // Limpiar selected si es el mismo
        if (state.selectedItem?.id === action.payload) {
          state.selectedItem = null;
        }
      })
      .addCase(deleteEquipamiento.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ==================== Toggle ====================
      .addCase(toggleEquipamiento.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleEquipamiento.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        // Actualizar selected si es el mismo
        if (state.selectedItem?.id === action.payload.id) {
          state.selectedItem = action.payload;
        }
      })
      .addCase(toggleEquipamiento.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ==================== Reorder ====================
      .addCase(reorderEquipamientos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reorderEquipamientos.fulfilled, (state, action) => {
        state.loading = false;
        // Reordenar según nuevo orden
        const newOrder = action.payload;
        state.items.sort((a, b) => {
          const indexA = newOrder.indexOf(a.id);
          const indexB = newOrder.indexOf(b.id);
          return indexA - indexB;
        });
      })
      .addCase(reorderEquipamientos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ==================== Reactivate ====================
      .addCase(reactivateEquipamiento.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reactivateEquipamiento.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        // Actualizar selected si es el mismo
        if (state.selectedItem?.id === action.payload.id) {
          state.selectedItem = action.payload;
        }
      })
      .addCase(reactivateEquipamiento.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// ==================== EXPORTS ====================

export const {
  setSelectedEquipamiento,
  toggleShowInactive,
  clearError,
  resetEquipamientos,
} = equipamientosSlice.actions;

export default equipamientosSlice.reducer;

// ==================== SELECTORS ====================

/**
 * Seleccionar todos los equipamientos
 */
export const selectAllEquipamientos = (state: { equipamientos: EquipamientosState }) =>
  state.equipamientos.items;

/**
 * Seleccionar equipamientos activos
 */
export const selectActiveEquipamientos = (state: { equipamientos: EquipamientosState }) =>
  state.equipamientos.items.filter((e) => e.activo);

/**
 * Seleccionar equipamiento seleccionado
 */
export const selectSelectedEquipamiento = (state: { equipamientos: EquipamientosState }) =>
  state.equipamientos.selectedItem;

/**
 * Seleccionar loading state
 */
export const selectEquipamientosLoading = (state: { equipamientos: EquipamientosState }) =>
  state.equipamientos.loading;

/**
 * Seleccionar error
 */
export const selectEquipamientosError = (state: { equipamientos: EquipamientosState }) =>
  state.equipamientos.error;
