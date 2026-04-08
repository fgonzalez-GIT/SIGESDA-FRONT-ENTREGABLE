/**
 * Servicio de Exenciones de Cuotas
 *
 * CRUD completo para gestión de exenciones de cuotas de socios.
 * Las exenciones permiten aplicar descuentos totales o parciales a socios
 * por razones específicas (becas, situación económica, etc.)
 *
 * Base URL: /api/exenciones-cuota
 */

import axios from 'axios';
import {
    ExencionCuota,
    SolicitarExencionRequest,
    AprobarExencionRequest,
    RechazarExencionRequest,
    RevocarExencionRequest,
} from '../types/cuota.types';

const API_BASE_URL =
    (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api';

const exencionesAPI = axios.create({
    baseURL: `${API_BASE_URL}/exenciones-cuota`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar token de autenticación
exencionesAPI.interceptors.request.use((config) => {
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
    message?: string;
}

/**
 * Servicio de Exenciones de Cuotas
 */
export const exencionesService = {
    /**
     * Crea una nueva solicitud de exención
     *
     * @param exencion - Datos de la solicitud de exención
     * @returns Exención creada con estado PENDIENTE_APROBACION
     */
    createExencion: async (
        exencion: SolicitarExencionRequest
    ): Promise<ExencionCuota> => {
        const response = await exencionesAPI.post<ApiResponse<ExencionCuota>>(
            '/',
            exencion
        );
        return response.data.data;
    },

    /**
     * Obtiene todas las exenciones de una persona
     *
     * @param personaId - ID de la persona
     * @param incluirInactivas - Si incluir exenciones vencidas/revocadas (default: false)
     * @returns Array de exenciones
     */
    getExencionesPorPersona: async (
        personaId: number,
        incluirInactivas: boolean = false
    ): Promise<ExencionCuota[]> => {
        const response = await exencionesAPI.get<ApiResponse<ExencionCuota[]>>(
            `/persona/${personaId}`,
            {
                params: { incluirInactivas },
            }
        );
        return response.data.data;
    },

    /**
     * Obtiene una exención por ID
     *
     * @param id - ID de la exención
     * @returns Exención encontrada
     */
    getExencionById: async (id: number): Promise<ExencionCuota> => {
        const response = await exencionesAPI.get<ApiResponse<ExencionCuota>>(
            `/${id}`
        );
        return response.data.data;
    },

    /**
     * Obtiene todas las exenciones vigentes de una persona
     * Filtra por estado VIGENTE y fechas actuales
     *
     * @param personaId - ID de la persona
     * @returns Array de exenciones vigentes
     */
    getExencionesVigentes: async (
        personaId: number
    ): Promise<ExencionCuota[]> => {
        const response = await exencionesAPI.get<ApiResponse<ExencionCuota[]>>(
            `/persona/${personaId}/vigentes`
        );
        return response.data.data;
    },

    /**
     * Obtiene todas las exenciones pendientes de aprobación
     * Útil para administradores
     *
     * @returns Array de exenciones pendientes
     */
    getExencionesPendientes: async (): Promise<ExencionCuota[]> => {
        const response = await exencionesAPI.get<ApiResponse<ExencionCuota[]>>(
            '/pendientes'
        );
        return response.data.data;
    },

    /**
     * Actualiza una exención existente
     * Solo se pueden actualizar exenciones en estado PENDIENTE_APROBACION
     *
     * @param id - ID de la exención
     * @param cambios - Cambios a aplicar
     * @returns Exención actualizada
     */
    updateExencion: async (
        id: number,
        cambios: Partial<SolicitarExencionRequest>
    ): Promise<ExencionCuota> => {
        const response = await exencionesAPI.put<ApiResponse<ExencionCuota>>(
            `/${id}`,
            cambios
        );
        return response.data.data;
    },

    /**
     * Aprueba una exención pendiente
     * Cambia el estado a APROBADA y luego a VIGENTE si las fechas son válidas
     *
     * @param id - ID de la exención
     * @param data - Datos de aprobación (aprobadoPor, observaciones)
     * @returns Exención aprobada
     */
    aprobarExencion: async (
        id: number,
        data: AprobarExencionRequest
    ): Promise<ExencionCuota> => {
        const response = await exencionesAPI.post<ApiResponse<ExencionCuota>>(
            `/${id}/aprobar`,
            data
        );
        return response.data.data;
    },

    /**
     * Rechaza una exención pendiente
     * Cambia el estado a RECHAZADA
     *
     * @param id - ID de la exención
     * @param data - Datos de rechazo (rechazadoPor, motivoRechazo)
     * @returns Exención rechazada
     */
    rechazarExencion: async (
        id: number,
        data: RechazarExencionRequest
    ): Promise<ExencionCuota> => {
        const response = await exencionesAPI.post<ApiResponse<ExencionCuota>>(
            `/${id}/rechazar`,
            data
        );
        return response.data.data;
    },

    /**
     * Revoca una exención vigente
     * Cambia el estado a REVOCADA
     *
     * @param id - ID de la exención
     * @param data - Datos de revocación (motivoRevocacion, usuario)
     * @returns Exención revocada
     */
    revocarExencion: async (
        id: number,
        data: RevocarExencionRequest
    ): Promise<ExencionCuota> => {
        const response = await exencionesAPI.post<ApiResponse<ExencionCuota>>(
            `/${id}/revocar`,
            data
        );
        return response.data.data;
    },

    /**
     * Elimina una exención (soft delete)
     * Solo se pueden eliminar exenciones en estado PENDIENTE_APROBACION o RECHAZADA
     *
     * @param id - ID de la exención
     */
    deleteExencion: async (id: number): Promise<void> => {
        await exencionesAPI.delete(`/${id}`);
    },

    /**
     * Obtiene el historial de exenciones de una persona
     * Incluye todas las exenciones (vigentes, vencidas, revocadas, rechazadas)
     *
     * @param personaId - ID de la persona
     * @returns Array de exenciones ordenadas por fecha
     */
    getHistorialExenciones: async (
        personaId: number
    ): Promise<ExencionCuota[]> => {
        const response = await exencionesAPI.get<ApiResponse<ExencionCuota[]>>(
            `/persona/${personaId}/historial`
        );
        return response.data.data;
    },

    /**
     * Valida si una persona puede solicitar una nueva exención
     * Verifica que no tenga exenciones vigentes que se solapen
     *
     * @param personaId - ID de la persona
     * @param fechaInicio - Fecha de inicio de la nueva exención
     * @param fechaFin - Fecha de fin de la nueva exención
     * @returns Objeto con validación y detalles
     */
    validarSolicitud: async (
        personaId: number,
        fechaInicio: string,
        fechaFin: string
    ): Promise<{
        valida: boolean;
        mensaje?: string;
        exencionesConflictivas?: ExencionCuota[];
    }> => {
        const response = await exencionesAPI.post<
            ApiResponse<{
                valida: boolean;
                mensaje?: string;
                exencionesConflictivas?: ExencionCuota[];
            }>
        >('/validar-solicitud', {
            personaId,
            fechaInicio,
            fechaFin,
        });
        return response.data.data;
    },
};

export default exencionesService;
