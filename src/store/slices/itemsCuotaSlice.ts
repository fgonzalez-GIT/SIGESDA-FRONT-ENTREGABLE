import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import itemsCuotaService from '../../services/itemsCuotaService';
import { TipoItemCuota, CategoriaItem } from '../../types/cuota.types';

interface ItemsCuotaState {
    tiposItems: TipoItemCuota[];
    categoriasItems: CategoriaItem[];
    loading: boolean;
    error: string | null;
}

const initialState: ItemsCuotaState = {
    tiposItems: [],
    categoriasItems: [],
    loading: false,
    error: null
};

export const fetchCatalogosItems = createAsyncThunk(
    'itemsCuota/fetchCatalogos',
    async (_, { rejectWithValue }) => {
        try {
            const [tipos, categorias] = await Promise.all([
                itemsCuotaService.getTiposItems(),
                itemsCuotaService.getCategoriasItems()
            ]);
            return { tipos, categorias };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Error al cargar catálogos de items');
        }
    }
);

const itemsCuotaSlice = createSlice({
    name: 'itemsCuota',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCatalogosItems.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCatalogosItems.fulfilled, (state, action) => {
                state.loading = false;
                state.tiposItems = action.payload.tipos;
                state.categoriasItems = action.payload.categorias;
            })
            .addCase(fetchCatalogosItems.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

export const { clearError } = itemsCuotaSlice.actions;
export default itemsCuotaSlice.reducer;
