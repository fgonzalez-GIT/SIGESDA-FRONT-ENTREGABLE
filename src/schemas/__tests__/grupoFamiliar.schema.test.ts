import { describe, test, expect } from 'vitest';
import {
  createGrupoFamiliarSchema,
  updateGrupoFamiliarSchema,
  grupoFamiliarFormSchema,
  agregarMiembroSchema,
  actualizarMiembrosSchema,
} from '../grupoFamiliar.schema';

/**
 * Tests para schemas de Grupo Familiar - Nuevas características v2026-02-26
 *
 * Cubre validaciones de:
 * - Campo miembros[] (array de IDs, max 50)
 * - Campo skipFamilyValidation (boolean, opcional, default false)
 * - Validaciones cross-field existentes
 */

describe('Grupo Familiar Schemas - Nuevas características v2026-02-26', () => {
  describe('createGrupoFamiliarSchema', () => {
    describe('campo miembros[]', () => {
      test('debe validar grupo sin miembros (array vacío)', () => {
        const data = {
          nombre: 'Familia Test',
          personaReferenteId: 10,
          descuentoGrupal: 0,
          miembros: [],
        };

        const result = createGrupoFamiliarSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.miembros).toEqual([]);
        }
      });

      test('debe validar grupo con miembros válidos', () => {
        const data = {
          nombre: 'Familia Rodríguez',
          personaReferenteId: 10,
          descuentoGrupal: 10,
          miembros: [15, 20, 25],
        };

        const result = createGrupoFamiliarSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.miembros).toEqual([15, 20, 25]);
        }
      });

      test('debe aceptar hasta 50 miembros', () => {
        const miembros = Array.from({ length: 50 }, (_, i) => i + 1);
        const data = {
          nombre: 'Grupo Grande',
          personaReferenteId: 100,
          miembros,
        };

        const result = createGrupoFamiliarSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.miembros).toHaveLength(50);
        }
      });

      test('debe rechazar más de 50 miembros', () => {
        const miembros = Array.from({ length: 51 }, (_, i) => i + 1);
        const data = {
          nombre: 'Grupo Muy Grande',
          personaReferenteId: 100,
          miembros,
        };

        const result = createGrupoFamiliarSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('50 miembros');
        }
      });

      test('debe rechazar IDs de miembros negativos', () => {
        const data = {
          nombre: 'Familia Test',
          personaReferenteId: 10,
          miembros: [15, -5, 20],
        };

        const result = createGrupoFamiliarSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      test('debe rechazar IDs de miembros cero', () => {
        const data = {
          nombre: 'Familia Test',
          personaReferenteId: 10,
          miembros: [15, 0, 20],
        };

        const result = createGrupoFamiliarSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      test('debe usar array vacío como default si no se proporciona miembros', () => {
        const data = {
          nombre: 'Familia Sin Miembros',
          personaReferenteId: 10,
        };

        const result = createGrupoFamiliarSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.miembros).toEqual([]);
        }
      });
    });

    describe('campo skipFamilyValidation', () => {
      test('debe aceptar skipFamilyValidation=true', () => {
        const data = {
          nombre: 'Familia Test',
          personaReferenteId: 10,
          skipFamilyValidation: true,
        };

        const result = createGrupoFamiliarSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.skipFamilyValidation).toBe(true);
        }
      });

      test('debe aceptar skipFamilyValidation=false', () => {
        const data = {
          nombre: 'Familia Test',
          personaReferenteId: 10,
          skipFamilyValidation: false,
        };

        const result = createGrupoFamiliarSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.skipFamilyValidation).toBe(false);
        }
      });

      test('debe usar false como default si no se proporciona skipFamilyValidation', () => {
        const data = {
          nombre: 'Familia Test',
          personaReferenteId: 10,
        };

        const result = createGrupoFamiliarSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.skipFamilyValidation).toBe(false);
        }
      });

      test('debe rechazar valores no booleanos en skipFamilyValidation', () => {
        const data = {
          nombre: 'Familia Test',
          personaReferenteId: 10,
          skipFamilyValidation: 'true', // String en lugar de boolean
        };

        const result = createGrupoFamiliarSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('validaciones cross-field existentes', () => {
      test('descuento progresivo requiere descuento grupal > 0', () => {
        // Esta validación está en grupoFamiliarFormSchema, no en createGrupoFamiliarSchema
        // Aquí no debería fallar
        const data = {
          nombre: 'Familia Test',
          personaReferenteId: 10,
          descuentoGrupal: 0,
          descuentoProgresivo: true,
        };

        const result = createGrupoFamiliarSchema.safeParse(data);
        expect(result.success).toBe(true); // No hay validación cross-field en este schema
      });
    });
  });

  describe('updateGrupoFamiliarSchema', () => {
    test('debe validar actualización con skipFamilyValidation', () => {
      const data = {
        nombre: 'Familia Actualizada',
        skipFamilyValidation: true,
      };

      const result = updateGrupoFamiliarSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.skipFamilyValidation).toBe(true);
      }
    });

    test('debe validar actualización parcial sin skipFamilyValidation', () => {
      const data = {
        descuentoGrupal: 15,
      };

      const result = updateGrupoFamiliarSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.skipFamilyValidation).toBe(false); // Default
      }
    });
  });

  describe('grupoFamiliarFormSchema', () => {
    test('debe validar formulario con miembros y skipFamilyValidation', () => {
      const data = {
        nombre: 'Familia Completa',
        personaReferenteId: 10,
        descuentoGrupal: 10,
        activo: true,
        facturacionConjunta: false,
        descuentoProgresivo: false,
        limiteCuotas: 0,
        miembros: [15, 20],
        skipFamilyValidation: true,
      };

      const result = grupoFamiliarFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('debe rechazar descuento progresivo sin descuento base', () => {
      const data = {
        nombre: 'Familia Test',
        personaReferenteId: 10,
        descuentoGrupal: 0,
        descuentoProgresivo: true,
      };

      const result = grupoFamiliarFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('descuento grupal base mayor a 0');
      }
    });

    test('debe rechazar límite de cuotas sin descuento', () => {
      const data = {
        nombre: 'Familia Test',
        personaReferenteId: 10,
        descuentoGrupal: 0,
        limiteCuotas: 12,
      };

      const result = grupoFamiliarFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('descuento grupal mayor a 0');
      }
    });
  });

  describe('agregarMiembroSchema', () => {
    test('debe validar agregar miembro con skipFamilyValidation=true', () => {
      const data = {
        grupoId: 5,
        personaId: 42,
        skipFamilyValidation: true,
      };

      const result = agregarMiembroSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.skipFamilyValidation).toBe(true);
      }
    });

    test('debe validar agregar miembro sin skipFamilyValidation (usa default false)', () => {
      const data = {
        grupoId: 5,
        personaId: 42,
      };

      const result = agregarMiembroSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.skipFamilyValidation).toBe(false);
      }
    });

    test('debe rechazar grupoId inválido', () => {
      const data = {
        grupoId: -1,
        personaId: 42,
      };

      const result = agregarMiembroSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('debe rechazar personaId inválido', () => {
      const data = {
        grupoId: 5,
        personaId: 0,
      };

      const result = agregarMiembroSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('actualizarMiembrosSchema', () => {
    test('debe validar actualizar lista de miembros con skipFamilyValidation', () => {
      const data = {
        grupoId: 5,
        miembrosIds: [10, 15, 20, 25],
        skipFamilyValidation: true,
      };

      const result = actualizarMiembrosSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.skipFamilyValidation).toBe(true);
        expect(result.data.miembrosIds).toHaveLength(4);
      }
    });

    test('debe rechazar lista vacía de miembros', () => {
      const data = {
        grupoId: 5,
        miembrosIds: [],
      };

      const result = actualizarMiembrosSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('al menos un miembro');
      }
    });

    test('debe rechazar más de 50 miembros', () => {
      const miembrosIds = Array.from({ length: 51 }, (_, i) => i + 1);
      const data = {
        grupoId: 5,
        miembrosIds,
      };

      const result = actualizarMiembrosSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('50 miembros');
      }
    });

    test('debe rechazar IDs de miembros inválidos', () => {
      const data = {
        grupoId: 5,
        miembrosIds: [10, -5, 20],
      };

      const result = actualizarMiembrosSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('debe usar false como default para skipFamilyValidation', () => {
      const data = {
        grupoId: 5,
        miembrosIds: [10, 15, 20],
      };

      const result = actualizarMiembrosSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.skipFamilyValidation).toBe(false);
      }
    });
  });
});
