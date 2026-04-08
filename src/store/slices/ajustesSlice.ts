import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import ajustesCuotaService from '../../services/ajustesCuotaService';
import { AjusteCuotaSocio, CrearAjusteRequest } from '../../types/cuota.types';

interface AjustesState {
    ajustes: AjusteCuotaSocio[];
    loading: boolean;
    error: string | null;
    operationLoading: boolean;
}

const initialState: AjustesState = {
    ajustes: [],
    loading: false,
    error: null,
    operationLoading: false
};

// Thunks
export const fetchAjustesPorPersona = createAsyncThunk(
    'ajustes/fetchPorPersona',
    async ({ personaId, soloActivos = true }: { personaId: number; soloActivos?: boolean }, { rejectWithValue }) => {
        try {
            return await ajustesCuotaService.getAjustesPorPersona(personaId, soloActivos);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Error al cargar ajustes');
        }
    }
);

export const createAjuste = createAsyncThunk(
    'ajustes/create',
    async (ajuste: CrearAjusteRequest, { rejectWithValue }) => {
        try {
            return await ajustesCuotaService.createAjuste(ajuste);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Error al crear ajuste');
        }
    }
);

export const updateAjuste = createAsyncThunk(
    'ajustes/update',
    async ({ id, cambios }: { id: number; cambios: Partial<AjusteCuotaSocio> }, { rejectWithValue }) => {
        try {
            return await ajustesCuotaService.updateAjuste(id, cambios);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Error al actualizar ajuste');
        }
    }
);

export const deleteAjuste = createAsyncThunk(
    'ajustes/delete',
    async (id: number, { rejectWithValue }) => {
        try {
            await ajustesCuotaService.deleteAjuste(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Error al eliminar ajuste');
        }
    }
);

const ajustesSlice = createSlice({
    name: 'ajustes',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchAjustesPorPersona.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAjustesPorPersona.fulfilled, (state, action) => {
                state.loading = false;
                state.ajustes = action.payload;
            })
            .addCase(fetchAjustesPorPersona.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Create
            .addCase(createAjuste.pending, (state) => {
                state.operationLoading = true;
                state.error = null;
            })
            .addCase(createAjuste.fulfilled, (state, action) => {
                state.operationLoading = false;
                state.ajustes.push(action.payload);
            })
            .addCase(createAjuste.rejected, (state, action) => {
                state.operationLoading = false;
                state.error = action.payload as string;
            })

            // Update
            .addCase(updateAjuste.fulfilled, (state, action) => {
                const index = state.ajustes.findIndex(a => a.id === action.payload.id);
                if (index !== -1) {
                    state.ajustes[index] = action.payload;
                }
            })

            // Delete
            .addCase(deleteAjuste.fulfilled, (state, action) => {
                state.ajustes = state.ajustes.filter(a => a.id !== action.payload);
            });
    }
});

export const { clearError } = ajustesSlice.actions;
export default ajustesSlice.reducer;
