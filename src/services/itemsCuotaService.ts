import axios from 'axios';
import { TipoItemCuota, CategoriaItem } from '../types/cuota.types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api';

const itemsAPI = axios.create({
    baseURL: `${API_BASE_URL}`,
    headers: {
        'Content-Type': 'application/json',
    },
});

itemsAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
}

export const itemsCuotaService = {
    // Catálogos
    getTiposItems: async (): Promise<TipoItemCuota[]> => {
        const response = await itemsAPI.get<ApiResponse<TipoItemCuota[]>>('/catalogos/tipos-items-cuota');
        return response.data.data;
    },

    getCategoriasItems: async (): Promise<CategoriaItem[]> => {
        const response = await itemsAPI.get<ApiResponse<CategoriaItem[]>>('/catalogos/categorias-items');
        return response.data.data;
    },

    // Operaciones sobre items individuales
    updateItem: async (id: number, cambios: Partial<any>): Promise<any> => {
        const response = await itemsAPI.put<ApiResponse<any>>(`/${id}`, cambios);
        return response.data.data;
    },

    deleteItem: async (id: number): Promise<void> => {
        await itemsAPI.delete(`/${id}`);
    }
};

export default itemsCuotaService;
