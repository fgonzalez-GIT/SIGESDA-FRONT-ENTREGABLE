/**
 * Tests para exencionesService
 * Verifica la gestión completa de exenciones de cuotas
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axios before imports
const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
    }
};

vi.mock('axios', () => ({
    default: {
        create: vi.fn(() => mockAxiosInstance)
    }
}));

// Import after mock
import { exencionesService } from '../exencionesService';
import { ExencionCuota } from '../../types/cuota.types';

describe('exencionesService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock localStorage
        vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('fake-token');
    });

    // Mock data
    const mockExencion: ExencionCuota = {
        id: 1,
        personaId: 10,
        tipoExencion: 'PARCIAL',
        porcentajeExencion: '50',
        fechaInicio: '2026-01-01',
        fechaFin: '2026-12-31',
        motivo: 'Situación económica',
        estado: 'VIGENTE',
        solicitadoPor: 1,
        aprobadoPor: 2,
        fechaSolicitud: '2025-12-15',
        fechaAprobacion: '2025-12-20',
        observaciones: 'Aprobado por comisión directiva',
        activo: true
    };

    describe('createExencion', () => {
        it('should create new exemption request', async () => {
            const requestData = {
                personaId: 10,
                tipoExencion: 'PARCIAL' as const,
                porcentajeExencion: 50,
                fechaInicio: '2026-01-01',
                fechaFin: '2026-12-31',
                motivo: 'Situación económica',
                solicitadoPor: 1
            };

            mockAxiosInstance.post.mockResolvedValue({
                data: {
                    success: true,
                    data: { ...mockExencion, estado: 'PENDIENTE_APROBACION' }
                }
            });

            const result = await exencionesService.createExencion(requestData);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/', requestData);
            expect(result.personaId).toBe(10);
            expect(result.estado).toBe('PENDIENTE_APROBACION');
        });

        it('should handle creation errors', async () => {
            const requestData = {
                personaId: 10,
                tipoExencion: 'PARCIAL' as const,
                porcentajeExencion: 50,
                fechaInicio: '2026-01-01',
                fechaFin: '2026-12-31',
                motivo: 'Situación económica',
                solicitadoPor: 1
            };

            mockAxiosInstance.post.mockRejectedValue(
                new Error('Ya existe una exención vigente para este período')
            );

            await expect(exencionesService.createExencion(requestData)).rejects.toThrow(
                'Ya existe una exención vigente para este período'
            );
        });
    });

    describe('getExencionesPorPersona', () => {
        it('should fetch exemptions for person (only active by default)', async () => {
            const mockExenciones = [mockExencion];

            mockAxiosInstance.get.mockResolvedValue({
                data: { success: true, data: mockExenciones }
            });

            const result = await exencionesService.getExencionesPorPersona(10);

            expect(mockAxiosInstance.get).toHaveBeenCalledWith('/persona/10', {
                params: { incluirInactivas: false }
            });
            expect(result).toHaveLength(1);
            expect(result[0].personaId).toBe(10);
        });

        it('should fetch all exemptions including inactive when requested', async () => {
            const mockExenciones = [
                mockExencion,
                { ...mockExencion, id: 2, estado: 'VENCIDA', activo: false }
            ];

            mockAxiosInstance.get.mockResolvedValue({
                data: { success: true, data: mockExenciones }
            });

            const result = await exencionesService.getExencionesPorPersona(10, true);

            expect(mockAxiosInstance.get).toHaveBeenCalledWith('/persona/10', {
                params: { incluirInactivas: true }
            });
            expect(result).toHaveLength(2);
        });

        it('should return empty array when no exemptions found', async () => {
            mockAxiosInstance.get.mockResolvedValue({
                data: { success: true, data: [] }
            });

            const result = await exencionesService.getExencionesPorPersona(999);

            expect(result).toHaveLength(0);
        });
    });

    describe('getExencionById', () => {
        it('should fetch single exemption by ID', async () => {
            mockAxiosInstance.get.mockResolvedValue({
                data: { success: true, data: mockExencion }
            });

            const result = await exencionesService.getExencionById(1);

            expect(mockAxiosInstance.get).toHaveBeenCalledWith('/1');
            expect(result.id).toBe(1);
            expect(result.personaId).toBe(10);
        });

        it('should throw error when exemption not found', async () => {
            mockAxiosInstance.get.mockRejectedValue(new Error('Exención no encontrada'));

            await expect(exencionesService.getExencionById(999)).rejects.toThrow(
                'Exención no encontrada'
            );
        });
    });

    describe('getExencionesVigentes', () => {
        it('should fetch only active exemptions for person', async () => {
            const mockExencionesVigentes = [mockExencion];

            mockAxiosInstance.get.mockResolvedValue({
                data: { success: true, data: mockExencionesVigentes }
            });

            const result = await exencionesService.getExencionesVigentes(10);

            expect(mockAxiosInstance.get).toHaveBeenCalledWith('/persona/10/vigentes');
            expect(result).toHaveLength(1);
            expect(result[0].estado).toBe('VIGENTE');
        });

        it('should return empty array when no active exemptions', async () => {
            mockAxiosInstance.get.mockResolvedValue({
                data: { success: true, data: [] }
            });

            const result = await exencionesService.getExencionesVigentes(10);

            expect(result).toHaveLength(0);
        });
    });

    describe('getExencionesPendientes', () => {
        it('should fetch all pending exemptions', async () => {
            const mockPendientes = [
                { ...mockExencion, id: 1, estado: 'PENDIENTE_APROBACION' },
                { ...mockExencion, id: 2, estado: 'PENDIENTE_APROBACION', personaId: 20 }
            ];

            mockAxiosInstance.get.mockResolvedValue({
                data: { success: true, data: mockPendientes }
            });

            const result = await exencionesService.getExencionesPendientes();

            expect(mockAxiosInstance.get).toHaveBeenCalledWith('/pendientes');
            expect(result).toHaveLength(2);
            expect(result[0].estado).toBe('PENDIENTE_APROBACION');
        });

        it('should return empty array when no pending exemptions', async () => {
            mockAxiosInstance.get.mockResolvedValue({
                data: { success: true, data: [] }
            });

            const result = await exencionesService.getExencionesPendientes();

            expect(result).toHaveLength(0);
        });
    });

    describe('updateExencion', () => {
        it('should update pending exemption', async () => {
            const cambios = {
                porcentajeExencion: 75,
                motivo: 'Motivo actualizado'
            };

            const mockUpdated = { ...mockExencion, ...cambios };

            mockAxiosInstance.put.mockResolvedValue({
                data: { success: true, data: mockUpdated }
            });

            const result = await exencionesService.updateExencion(1, cambios);

            expect(mockAxiosInstance.put).toHaveBeenCalledWith('/1', cambios);
            expect(result.porcentajeExencion).toBe(cambios.porcentajeExencion);
            expect(result.motivo).toBe(cambios.motivo);
        });

        it('should throw error when updating approved exemption', async () => {
            mockAxiosInstance.put.mockRejectedValue(
                new Error('No se puede modificar una exención aprobada')
            );

            await expect(
                exencionesService.updateExencion(1, { motivo: 'Nuevo motivo' })
            ).rejects.toThrow('No se puede modificar una exención aprobada');
        });
    });

    describe('aprobarExencion', () => {
        it('should approve pending exemption', async () => {
            const aprobarData = {
                aprobadoPor: 2,
                observaciones: 'Aprobado por comisión'
            };

            const mockAprobada = {
                ...mockExencion,
                estado: 'VIGENTE',
                aprobadoPor: 2,
                fechaAprobacion: '2026-01-15',
                observaciones: 'Aprobado por comisión'
            };

            mockAxiosInstance.post.mockResolvedValue({
                data: { success: true, data: mockAprobada }
            });

            const result = await exencionesService.aprobarExencion(1, aprobarData);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/1/aprobar', aprobarData);
            expect(result.estado).toBe('VIGENTE');
            expect(result.aprobadoPor).toBe(2);
        });

        it('should throw error when exemption not pending', async () => {
            mockAxiosInstance.post.mockRejectedValue(
                new Error('Solo se pueden aprobar exenciones pendientes')
            );

            await expect(
                exencionesService.aprobarExencion(1, { aprobadoPor: 2 })
            ).rejects.toThrow('Solo se pueden aprobar exenciones pendientes');
        });
    });

    describe('rechazarExencion', () => {
        it('should reject pending exemption', async () => {
            const rechazarData = {
                rechazadoPor: 2,
                motivoRechazo: 'No cumple con requisitos'
            };

            const mockRechazada = {
                ...mockExencion,
                estado: 'RECHAZADA',
                fechaRechazo: '2026-01-15',
                motivoRechazo: 'No cumple con requisitos'
            };

            mockAxiosInstance.post.mockResolvedValue({
                data: { success: true, data: mockRechazada }
            });

            const result = await exencionesService.rechazarExencion(1, rechazarData);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/1/rechazar', rechazarData);
            expect(result.estado).toBe('RECHAZADA');
        });
    });

    describe('revocarExencion', () => {
        it('should revoke active exemption', async () => {
            const revocarData = {
                motivoRevocacion: 'Cambio en situación económica',
                usuario: 2
            };

            const mockRevocada = {
                ...mockExencion,
                estado: 'REVOCADA',
                fechaRevocacion: '2026-06-15',
                motivoRevocacion: 'Cambio en situación económica',
                activo: false
            };

            mockAxiosInstance.post.mockResolvedValue({
                data: { success: true, data: mockRevocada }
            });

            const result = await exencionesService.revocarExencion(1, revocarData);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/1/revocar', revocarData);
            expect(result.estado).toBe('REVOCADA');
            expect(result.activo).toBe(false);
        });

        it('should throw error when revoking non-active exemption', async () => {
            mockAxiosInstance.post.mockRejectedValue(
                new Error('Solo se pueden revocar exenciones vigentes')
            );

            await expect(
                exencionesService.revocarExencion(1, {
                    motivoRevocacion: 'Test',
                    usuario: 2
                })
            ).rejects.toThrow('Solo se pueden revocar exenciones vigentes');
        });
    });

    describe('deleteExencion', () => {
        it('should delete pending or rejected exemption', async () => {
            mockAxiosInstance.delete.mockResolvedValue({ data: { success: true } });

            await expect(exencionesService.deleteExencion(1)).resolves.toBeUndefined();

            expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/1');
        });

        it('should throw error when deleting active exemption', async () => {
            mockAxiosInstance.delete.mockRejectedValue(
                new Error('No se pueden eliminar exenciones vigentes o aprobadas')
            );

            await expect(exencionesService.deleteExencion(1)).rejects.toThrow(
                'No se pueden eliminar exenciones vigentes o aprobadas'
            );
        });
    });

    describe('getHistorialExenciones', () => {
        it('should fetch complete history for person', async () => {
            const mockHistorial = [
                mockExencion,
                { ...mockExencion, id: 2, estado: 'VENCIDA', activo: false },
                { ...mockExencion, id: 3, estado: 'REVOCADA', activo: false }
            ];

            mockAxiosInstance.get.mockResolvedValue({
                data: { success: true, data: mockHistorial }
            });

            const result = await exencionesService.getHistorialExenciones(10);

            expect(mockAxiosInstance.get).toHaveBeenCalledWith('/persona/10/historial');
            expect(result).toHaveLength(3);
        });

        it('should return empty array for person with no history', async () => {
            mockAxiosInstance.get.mockResolvedValue({
                data: { success: true, data: [] }
            });

            const result = await exencionesService.getHistorialExenciones(999);

            expect(result).toHaveLength(0);
        });
    });

    describe('validarSolicitud', () => {
        it('should validate valid exemption request', async () => {
            const mockValidacion = {
                valida: true,
                mensaje: 'Solicitud válida'
            };

            mockAxiosInstance.post.mockResolvedValue({
                data: { success: true, data: mockValidacion }
            });

            const result = await exencionesService.validarSolicitud(
                10,
                '2026-01-01',
                '2026-12-31'
            );

            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/validar-solicitud', {
                personaId: 10,
                fechaInicio: '2026-01-01',
                fechaFin: '2026-12-31'
            });
            expect(result.valida).toBe(true);
        });

        it('should return validation error for conflicting exemptions', async () => {
            const mockValidacion = {
                valida: false,
                mensaje: 'Existe solapamiento con exenciones vigentes',
                exencionesConflictivas: [mockExencion]
            };

            mockAxiosInstance.post.mockResolvedValue({
                data: { success: true, data: mockValidacion }
            });

            const result = await exencionesService.validarSolicitud(
                10,
                '2026-06-01',
                '2026-12-31'
            );

            expect(result.valida).toBe(false);
            expect(result.exencionesConflictivas).toHaveLength(1);
        });

        it('should throw error on validation failure', async () => {
            mockAxiosInstance.post.mockRejectedValue(new Error('Error de validación'));

            await expect(
                exencionesService.validarSolicitud(10, '2026-01-01', '2026-12-31')
            ).rejects.toThrow('Error de validación');
        });
    });
});
