import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import exencionesService from '../../services/exencionesService';
import {
    ExencionCuota,
    SolicitarExencionRequest,
    AprobarExencionRequest,
    RechazarExencionRequest,
    RevocarExencionRequest
} from '../../types/cuota.types';

interface ExencionesState {
    exencionActiva: { tieneExencion: boolean; porcentaje?: number; exencion?: ExencionCuota } | null;
    loading: boolean;
    error: string | null;
    operationLoading: boolean;
}

const initialState: ExencionesState = {
    exencionActiva: null,
    loading: false,
    error: null,
    operationLoading: false
};

// Thunks
export const checkExencionActiva = createAsyncThunk(
    'exenciones/checkActiva',
    async ({ personaId, fecha }: { personaId: number; fecha?: string }, { rejectWithValue }) => {
        try {
            return await exencionesService.checkExencionActiva(personaId, fecha);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Error al verificar exención');
        }
    }
);

export const solicitarExencion = createAsyncThunk(
    'exenciones/solicitar',
    async (solicitud: SolicitarExencionRequest, { rejectWithValue }) => {
        try {
            return await exencionesService.solicitarExencion(solicitud);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Error al solicitar exención');
        }
    }
);

export const aprobarExencion = createAsyncThunk(
    'exenciones/aprobar',
    async ({ id, datos }: { id: number; datos: AprobarExencionRequest }, { rejectWithValue }) => {
        try {
            await exencionesService.aprobarExencion(id, datos);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Error al aprobar exención');
        }
    }
);

export const rechazarExencion = createAsyncThunk(
    'exenciones/rechazar',
    async ({ id, datos }: { id: number; datos: RechazarExencionRequest }, { rejectWithValue }) => {
        try {
            await exencionesService.rechazarExencion(id, datos);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Error al rechazar exención');
        }
    }
);

export const revocarExencion = createAsyncThunk(
    'exenciones/revocar',
    async ({ id, datos }: { id: number; datos: RevocarExencionRequest }, { rejectWithValue }) => {
        try {
            await exencionesService.revocarExencion(id, datos);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Error al revocar exención');
        }
    }
);

const exencionesSlice = createSlice({
    name: 'exenciones',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Check Activa
            .addCase(checkExencionActiva.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(checkExencionActiva.fulfilled, (state, action) => {
                state.loading = false;
                state.exencionActiva = action.payload;
            })
            .addCase(checkExencionActiva.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Operations
            .addCase(solicitarExencion.pending, (state) => {
                state.operationLoading = true;
                state.error = null;
            })
            .addCase(solicitarExencion.fulfilled, (state, action) => {
                state.operationLoading = false;
                // Could update exencionActiva if approved immediately or add to list if we had one
            })
            .addCase(solicitarExencion.rejected, (state, action) => {
                state.operationLoading = false;
                state.error = action.payload as string;
            })

            // Generic loading for other ops
            .addCase(aprobarExencion.pending, (state) => { state.operationLoading = true; })
            .addCase(aprobarExencion.fulfilled, (state) => { state.operationLoading = false; })
            .addCase(aprobarExencion.rejected, (state, action) => {
                state.operationLoading = false;
                state.error = action.payload as string;
            })

            .addCase(rechazarExencion.pending, (state) => { state.operationLoading = true; })
            .addCase(rechazarExencion.fulfilled, (state) => { state.operationLoading = false; })
            .addCase(rechazarExencion.rejected, (state, action) => {
                state.operationLoading = false;
                state.error = action.payload as string;
            })

            .addCase(revocarExencion.pending, (state) => { state.operationLoading = true; })
            .addCase(revocarExencion.fulfilled, (state) => { state.operationLoading = false; })
            .addCase(revocarExencion.rejected, (state, action) => {
                state.operationLoading = false;
                state.error = action.payload as string;
            });
    }
});

export const { clearError } = exencionesSlice.actions;
export default exencionesSlice.reducer;
