import axios from 'axios';
import { AjusteCuotaSocio, CrearAjusteRequest } from '../types/cuota.types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api';

const ajustesAPI = axios.create({
    baseURL: `${API_BASE_URL}/ajustes-cuota`,
    headers: {
        'Content-Type': 'application/json',
    },
});

ajustesAPI.interceptors.request.use((config) => {
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

export const ajustesCuotaService = {
    createAjuste: async (ajuste: CrearAjusteRequest): Promise<AjusteCuotaSocio> => {
        const response = await ajustesAPI.post<ApiResponse<AjusteCuotaSocio>>('/', ajuste);
        return response.data.data;
    },

    getAjustesPorPersona: async (personaId: number, soloActivos: boolean = true): Promise<AjusteCuotaSocio[]> => {
        const response = await ajustesAPI.get<ApiResponse<AjusteCuotaSocio[]>>(`/persona/${personaId}`, {
            params: { soloActivos }
        });
        return response.data.data;
    },

    updateAjuste: async (id: number, cambios: Partial<AjusteCuotaSocio>): Promise<AjusteCuotaSocio> => {
        const response = await ajustesAPI.put<ApiResponse<AjusteCuotaSocio>>(`/${id}`, cambios);
        return response.data.data;
    },

    deleteAjuste: async (id: number): Promise<void> => {
        await ajustesAPI.delete(`/${id}`);
    }
};

export default ajustesCuotaService;
