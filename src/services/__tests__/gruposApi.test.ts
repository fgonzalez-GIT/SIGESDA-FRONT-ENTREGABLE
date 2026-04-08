import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Tests para gruposApi - Nuevas características v2026-02-26
 *
 * Cubre:
 * - getSuggestedMembers (endpoint nuevo de sugerencias)
 * - skipFamilyValidation en crearGrupo y agregarMiembro
 * - Manejo de warnings en respuestas
 */

// Mock global fetch
global.fetch = vi.fn();

// Import after mock
import gruposApi from '../gruposApi';
import type { SuggestedMembersResponse, GrupoResponseWithWarnings } from '../../types/grupoFamiliar.types';

describe('gruposApi - Nuevas características v2026-02-26', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSuggestedMembers', () => {
    it('should fetch suggested members with full details and parentesco', async () => {
      const mockResponse: SuggestedMembersResponse = {
        referenteId: 10,
        referente: { id: 10, nombre: 'Juan', apellido: 'Pérez' },
        totalSugerencias: 3,
        suggestedMembersIds: [15, 20, 25],
        suggestedPersons: [
          { id: 15, nombre: 'María', apellido: 'Pérez', dni: '22222222', parentesco: 'ESPOSA', relacionId: 1 },
          { id: 20, nombre: 'Pedro', apellido: 'Pérez', dni: '33333333', parentesco: 'HIJO', relacionId: 2 },
          { id: 25, nombre: 'Ana', apellido: 'Pérez', dni: '44444444', parentesco: 'HIJA', relacionId: 3 },
        ],
        familyTreeSummary: {
          totalRelacionesDirectas: 3,
          totalRelacionesInversas: 0,
          totalRelaciones: 3,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse }),
      });

      const result = await gruposApi.getSuggestedMembers(10, true, true);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/grupos/sugerir-miembros/10'),
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      expect(result).toEqual(mockResponse);
      expect(result.suggestedMembersIds).toHaveLength(3);
      expect(result.suggestedPersons).toBeDefined();
      expect(result.suggestedPersons?.[0].parentesco).toBe('ESPOSA');
    });

    it('should fetch suggested members without details (only IDs)', async () => {
      const mockResponse: SuggestedMembersResponse = {
        referenteId: 10,
        referente: { id: 10, nombre: 'Juan', apellido: 'Pérez' },
        totalSugerencias: 2,
        suggestedMembersIds: [15, 20],
        familyTreeSummary: {
          totalRelacionesDirectas: 2,
          totalRelacionesInversas: 0,
          totalRelaciones: 2,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse }),
      });

      const result = await gruposApi.getSuggestedMembers(10, false, false);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('includeDetails=false'),
        expect.anything()
      );

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('includeParentesco=false'),
        expect.anything()
      );

      expect(result.suggestedMembersIds).toHaveLength(2);
      expect(result.suggestedPersons).toBeUndefined();
    });

    it('should return empty response when no family relations exist', async () => {
      const mockEmptyResponse: SuggestedMembersResponse = {
        referenteId: 10,
        referente: { id: 10, nombre: 'Juan', apellido: 'Pérez' },
        totalSugerencias: 0,
        suggestedMembersIds: [],
        familyTreeSummary: {
          totalRelacionesDirectas: 0,
          totalRelacionesInversas: 0,
          totalRelaciones: 0,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockEmptyResponse }),
      });

      const result = await gruposApi.getSuggestedMembers(10);

      expect(result.totalSugerencias).toBe(0);
      expect(result.suggestedMembersIds).toHaveLength(0);
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Referente no encontrado' }),
      });

      await expect(gruposApi.getSuggestedMembers(999)).rejects.toThrow('Referente no encontrado');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(gruposApi.getSuggestedMembers(10)).rejects.toThrow('Network error');
    });
  });

  describe('crearGrupo - skipFamilyValidation and miembros', () => {
    it('should create grupo with initial members and skipFamilyValidation=false (default)', async () => {
      const mockGrupo = {
        id: 1,
        nombre: 'Familia Rodríguez',
        persona_referente_id: 10,
        miembros: [10, 15, 20], // Backend incluye referente automáticamente
        descuento_grupal: 10,
        activo: true,
        facturacion_conjunta: false,
        descuento_progresivo: false,
        limite_cuotas: 0,
        created_at: '2026-02-26T00:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { grupo: mockGrupo } }),
      });

      const request = {
        nombre: 'Familia Rodríguez',
        personaReferenteId: 10,
        miembros: [15, 20], // NO incluye referente manualmente
        descuentoGrupal: 10,
        skipFamilyValidation: false,
      };

      const result = await gruposApi.crearGrupo(request);

      // Verificar que se envió el request correcto
      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.miembros).toEqual([15, 20]);
      expect(requestBody.skipFamilyValidation).toBe(false);

      // Verificar que backend retornó referente como primer miembro
      expect(result.grupo.miembros).toContain(10);
      expect(result.grupo.miembros[0]).toBe(10); // Referente es primero
    });

    it('should create grupo with skipFamilyValidation=true and return warnings', async () => {
      const mockResponse: GrupoResponseWithWarnings = {
        grupo: {
          id: 1,
          nombre: 'Grupo Mixto',
          personaReferente: 10,
          miembros: [10, 99], // 99 no tiene relación familiar
          descuentoGrupal: 5,
          fechaCreacion: '2026-02-26T00:00:00Z',
          activo: true,
          configuracion: {
            facturacionConjunta: false,
            descuentoProgresivo: false,
            limiteCuotas: 0,
          },
        },
        warnings: [
          'ADVERTENCIA: La persona "Juan Pérez" (ID: 99) no tiene relación familiar declarada con el referente.',
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse }),
      });

      const request = {
        nombre: 'Grupo Mixto',
        personaReferenteId: 10,
        miembros: [99],
        skipFamilyValidation: true,
      };

      const result = await gruposApi.crearGrupo(request);

      expect(result.warnings).toBeDefined();
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings?.[0]).toContain('no tiene relación familiar');
    });

    it('should fail when skipFamilyValidation=false and no family relation exists', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'La persona "Juan Pérez" (ID: 99) no tiene relación familiar declarada con el referente.',
        }),
      });

      const request = {
        nombre: 'Grupo Inválido',
        personaReferenteId: 10,
        miembros: [99],
        skipFamilyValidation: false,
      };

      await expect(gruposApi.crearGrupo(request)).rejects.toThrow('no tiene relación familiar');
    });
  });

  describe('agregarMiembro - skipFamilyValidation', () => {
    it('should add member with skipFamilyValidation=true and return warnings', async () => {
      const mockResponse: GrupoResponseWithWarnings = {
        grupo: {
          id: 5,
          nombre: 'Familia Test',
          personaReferente: 10,
          miembros: [10, 15, 99],
          descuentoGrupal: 10,
          fechaCreacion: '2026-02-26T00:00:00Z',
          activo: true,
          configuracion: {
            facturacionConjunta: false,
            descuentoProgresivo: false,
            limiteCuotas: 0,
          },
        },
        warnings: [
          'ADVERTENCIA: La persona "María López" (ID: 99) no tiene relación familiar declarada con el referente.',
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse }),
      });

      const result = await gruposApi.agregarMiembro(5, {
        personaId: 99,
        skipFamilyValidation: true,
      });

      expect(result.warnings).toBeDefined();
      expect(result.warnings).toHaveLength(1);
      expect(result.grupo.miembros).toContain(99);
    });

    it('should fail when adding member without family relation and skipFamilyValidation=false', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'La persona "Carlos Díaz" (ID: 88) no tiene relación familiar declarada con el referente.',
        }),
      });

      await expect(
        gruposApi.agregarMiembro(5, {
          personaId: 88,
          skipFamilyValidation: false,
        })
      ).rejects.toThrow('no tiene relación familiar');
    });
  });
});
