import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import aulasApi from '../../services/aulasApi';
import type { Aula, CreateAulaDto, UpdateAulaDto, AulasQueryParams } from '@/types/aula.types';

/**
 * Redux Slice para Aulas
 *
 * Gestiona solo las aulas del conservatorio.
 * Las reservas ahora están en reservasSlice separado.
 */

interface AulasState {
  aulas: Aula[];
  loading: boolean;
  error: string | null;
  selectedAula: Aula | null;
  filters: AulasQueryParams;
}

const initialState: AulasState = {
  aulas: [],
  loading: false,
  error: null,
  selectedAula: null,
  filters: {},
};

// ==================== ASYNC THUNKS ====================

/**
 * Listar Aulas
 */
export const fetchAulas = createAsyncThunk(
  'aulas/fetchAulas',
  async (params?: AulasQueryParams, { rejectWithValue }) => {
    try {
      return await aulasApi.getAll(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar aulas');
    }
  }
);

/**
 * Obtener Aula por ID
 */
export const fetchAulaById = createAsyncThunk(
  'aulas/fetchAulaById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await aulasApi.getById(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar aula');
    }
  }
);

/**
 * Crear Aula
 */
export const createAula = createAsyncThunk(
  'aulas/createAula',
  async (data: CreateAulaDto, { rejectWithValue }) => {
    try {
      return await aulasApi.create(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al crear aula');
    }
  }
);

/**
 * Actualizar Aula
 */
export const updateAula = createAsyncThunk(
  'aulas/updateAula',
  async ({ id, data }: { id: number; data: UpdateAulaDto }, { rejectWithValue }) => {
    try {
      return await aulasApi.update(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar aula');
    }
  }
);

/**
 * Eliminar Aula
 */
export const deleteAula = createAsyncThunk(
  'aulas/deleteAula',
  async (id: number, { rejectWithValue }) => {
    try {
      await aulasApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al eliminar aula');
    }
  }
);

/**
 * Obtener Aulas Activas
 */
export const fetchAulasActivas = createAsyncThunk(
  'aulas/fetchAulasActivas',
  async (_, { rejectWithValue }) => {
    try {
      return await aulasApi.getActivas();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar aulas activas');
    }
  }
);

/**
 * Reactivar Aula
 */
export const reactivateAula = createAsyncThunk(
  'aulas/reactivateAula',
  async (id: number, { rejectWithValue }) => {
    try {
      return await aulasApi.reactivate(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al reactivar aula');
    }
  }
);

// ==================== SLICE ====================

const aulasSlice = createSlice({
  name: 'aulas',
  initialState,
  reducers: {
    setSelectedAula: (state, action: PayloadAction<Aula | null>) => {
      state.selectedAula = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<AulasQueryParams>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearAulas: (state) => {
      state.aulas = [];
      state.selectedAula = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch aulas
      .addCase(fetchAulas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAulas.fulfilled, (state, action) => {
        state.loading = false;
        state.aulas = action.payload;
      })
      .addCase(fetchAulas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch aula by ID
      .addCase(fetchAulaById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAulaById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedAula = action.payload;
      })
      .addCase(fetchAulaById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create aula
      .addCase(createAula.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAula.fulfilled, (state, action) => {
        state.loading = false;
        state.aulas.push(action.payload);
      })
      .addCase(createAula.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update aula
      .addCase(updateAula.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAula.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.aulas.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.aulas[index] = action.payload;
        }
      })
      .addCase(updateAula.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete aula
      .addCase(deleteAula.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAula.fulfilled, (state, action) => {
        state.loading = false;
        state.aulas = state.aulas.filter((a) => a.id !== action.payload);
      })
      .addCase(deleteAula.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch aulas activas
      .addCase(fetchAulasActivas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAulasActivas.fulfilled, (state, action) => {
        state.loading = false;
        state.aulas = action.payload;
      })
      .addCase(fetchAulasActivas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Reactivate aula
      .addCase(reactivateAula.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reactivateAula.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.aulas.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.aulas[index] = action.payload;
        }
      })
      .addCase(reactivateAula.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedAula, clearError, setFilters, clearFilters, clearAulas } =
  aulasSlice.actions;

// Re-export Aula type for backward compatibility
export type { Aula };

export default aulasSlice.reducer;
