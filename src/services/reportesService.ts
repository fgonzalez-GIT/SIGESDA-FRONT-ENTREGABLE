import axios from 'axios';
import { DashboardData } from '../types/cuota.types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api';

const reportesAPI = axios.create({
    baseURL: `${API_BASE_URL}/reportes/cuotas`,
    headers: {
        'Content-Type': 'application/json',
    },
});

reportesAPI.interceptors.request.use((config) => {
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

export const reportesService = {
    getDashboard: async (mes: number, anio: number): Promise<DashboardData> => {
        const response = await reportesAPI.get<ApiResponse<DashboardData>>('/dashboard', {
            params: { mes, anio }
        });
        return response.data.data;
    },

    getReportePorCategoria: async (params: { mes: number; anio: number; categoriaId?: number; incluirDetalle?: boolean }) => {
        const response = await reportesAPI.get<ApiResponse<any>>('/categoria', { params });
        return response.data.data;
    },

    getReporteDescuentos: async (params: { mes: number; anio: number; tipoDescuento?: 'todos' | 'ajustes' | 'exenciones' | 'reglas' }) => {
        const response = await reportesAPI.get<ApiResponse<any>>('/descuentos', { params });
        return response.data.data;
    },

    getReporteExenciones: async (params: { estado?: string; motivoExencion?: string; incluirHistorico?: boolean }) => {
        const response = await reportesAPI.get<ApiResponse<any>>('/exenciones', { params });
        return response.data.data;
    },

    getComparativoPeriodos: async (params: { mesInicio: number; anioInicio: number; mesFin: number; anioFin: number }) => {
        const response = await reportesAPI.get<ApiResponse<any>>('/comparativo', { params });
        return response.data.data;
    },

    getRecaudacion: async (mes: number, anio: number) => {
        const response = await reportesAPI.get<ApiResponse<any>>('/recaudacion', { params: { mes, anio } });
        return response.data.data;
    },

    exportarReporte: async (request: {
        tipoReporte: string;
        formato: 'PDF' | 'EXCEL' | 'CSV';
        parametros: any;
    }) => {
        const response = await reportesAPI.post('/exportar', request, {
            responseType: 'blob' // Important for file handling
        });
        return response.data;
    }
};

export default reportesService;
