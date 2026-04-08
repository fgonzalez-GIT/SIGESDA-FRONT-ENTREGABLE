import { describe, test, expect } from 'vitest';
import {
  createContactoSchema,
  updateContactoSchema,
  createTipoSocioSchema,
  createTipoDocenteSchema,
  createTipoProveedorSchema,
  createTipoNoSocioSchema,
  createPersonaSchema,
} from '../persona.schema';

describe('Persona Schemas - Validaciones', () => {
  describe('createContactoSchema', () => {
    test('debe validar contacto válido con todos los campos', () => {
      const contacto = {
        tipoContactoId: 1,
        valor: 'test@example.com',
        descripcion: 'Email principal',
        esPrincipal: true,
        observaciones: 'Contacto verificado',
      };

      const result = createContactoSchema.safeParse(contacto);
      expect(result.success).toBe(true);
    });

    test('debe validar contacto con campos mínimos', () => {
      const contacto = {
        tipoContactoId: 1,
        valor: 'test@example.com',
      };

      const result = createContactoSchema.safeParse(contacto);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.esPrincipal).toBe(false); // Default
      }
    });

    test('debe rechazar contacto sin tipoContactoId', () => {
      const contacto = {
        valor: 'test@example.com',
      };

      const result = createContactoSchema.safeParse(contacto);
      expect(result.success).toBe(false);
    });

    test('debe rechazar contacto sin valor', () => {
      const contacto = {
        tipoContactoId: 1,
      };

      const result = createContactoSchema.safeParse(contacto);
      expect(result.success).toBe(false);
    });

    test('debe rechazar tipoContactoId negativo', () => {
      const contacto = {
        tipoContactoId: -1,
        valor: 'test@example.com',
      };

      const result = createContactoSchema.safeParse(contacto);
      expect(result.success).toBe(false);
    });

    test('debe rechazar tipoContactoId cero', () => {
      const contacto = {
        tipoContactoId: 0,
        valor: 'test@example.com',
      };

      const result = createContactoSchema.safeParse(contacto);
      expect(result.success).toBe(false);
    });

    test('debe rechazar valor vacío', () => {
      const contacto = {
        tipoContactoId: 1,
        valor: '',
      };

      const result = createContactoSchema.safeParse(contacto);
      expect(result.success).toBe(false);
    });

    test('debe rechazar valor muy largo', () => {
      const contacto = {
        tipoContactoId: 1,
        valor: 'a'.repeat(201),
      };

      const result = createContactoSchema.safeParse(contacto);
      expect(result.success).toBe(false);
    });
  });

  describe('updateContactoSchema', () => {
    test('debe permitir actualización de un campo', () => {
      const contacto = {
        valor: 'nuevo@example.com',
      };

      const result = updateContactoSchema.safeParse(contacto);
      expect(result.success).toBe(true);
    });

    test('debe permitir actualización de múltiples campos', () => {
      const contacto = {
        tipoContactoId: 2,
        valor: 'nuevo@example.com',
        esPrincipal: true,
        activo: false,
        observaciones: 'Actualizado',
      };

      const result = updateContactoSchema.safeParse(contacto);
      expect(result.success).toBe(true);
    });

    test('debe permitir actualizar solo esPrincipal', () => {
      const contacto = {
        esPrincipal: true,
      };

      const result = updateContactoSchema.safeParse(contacto);
      expect(result.success).toBe(true);
    });

    test('debe permitir actualizar solo activo', () => {
      const contacto = {
        activo: false,
      };

      const result = updateContactoSchema.safeParse(contacto);
      expect(result.success).toBe(true);
    });

    test('debe permitir objeto vacío', () => {
      const contacto = {};

      const result = updateContactoSchema.safeParse(contacto);
      expect(result.success).toBe(true);
    });
  });

  describe('createTipoSocioSchema', () => {
    test('debe validar SOCIO con categoría', () => {
      const tipo = {
        tipoPersonaCodigo: 'SOCIO',
        categoriaId: 'cat-123',
      };

      const result = createTipoSocioSchema.safeParse(tipo);
      expect(result.success).toBe(true);
    });

    test('debe rechazar SOCIO sin categoría', () => {
      const tipo = {
        tipoPersonaCodigo: 'SOCIO',
      };

      const result = createTipoSocioSchema.safeParse(tipo);
      expect(result.success).toBe(false);
    });

    test('debe validar SOCIO con categoría y observaciones', () => {
      const tipo = {
        tipoPersonaCodigo: 'SOCIO',
        categoriaId: 'cat-123',
        observaciones: 'Socio fundador',
      };

      const result = createTipoSocioSchema.safeParse(tipo);
      expect(result.success).toBe(true);
    });
  });

  describe('createTipoDocenteSchema', () => {
    test('debe validar DOCENTE con especialidad y honorarios', () => {
      const tipo = {
        tipoPersonaCodigo: 'DOCENTE',
        especialidadId: 3,
        honorariosPorHora: 5000,
      };

      const result = createTipoDocenteSchema.safeParse(tipo);
      expect(result.success).toBe(true);
    });

    test('debe rechazar DOCENTE sin especialidad', () => {
      const tipo = {
        tipoPersonaCodigo: 'DOCENTE',
        honorariosPorHora: 5000,
      };

      const result = createTipoDocenteSchema.safeParse(tipo);
      expect(result.success).toBe(false);
    });

    test('debe rechazar DOCENTE sin honorarios', () => {
      const tipo = {
        tipoPersonaCodigo: 'DOCENTE',
        especialidadId: 3,
      };

      const result = createTipoDocenteSchema.safeParse(tipo);
      expect(result.success).toBe(false);
    });

    test('debe rechazar honorarios negativos', () => {
      const tipo = {
        tipoPersonaCodigo: 'DOCENTE',
        especialidadId: 3,
        honorariosPorHora: -100,
      };

      const result = createTipoDocenteSchema.safeParse(tipo);
      expect(result.success).toBe(false);
    });

    test('debe rechazar honorarios demasiado altos', () => {
      const tipo = {
        tipoPersonaCodigo: 'DOCENTE',
        especialidadId: 3,
        honorariosPorHora: 2000000,
      };

      const result = createTipoDocenteSchema.safeParse(tipo);
      expect(result.success).toBe(false);
    });

    test('debe rechazar honorarios con más de 2 decimales', () => {
      const tipo = {
        tipoPersonaCodigo: 'DOCENTE',
        especialidadId: 3,
        honorariosPorHora: 5000.123,
      };

      const result = createTipoDocenteSchema.safeParse(tipo);
      expect(result.success).toBe(false);
    });

    test('debe aceptar honorarios con 2 decimales', () => {
      const tipo = {
        tipoPersonaCodigo: 'DOCENTE',
        especialidadId: 3,
        honorariosPorHora: 5000.50,
      };

      const result = createTipoDocenteSchema.safeParse(tipo);
      expect(result.success).toBe(true);
    });
  });

  describe('createTipoProveedorSchema', () => {
    test('debe validar PROVEEDOR con CUIT y razón social', () => {
      const tipo = {
        tipoPersonaCodigo: 'PROVEEDOR',
        cuit: '20123456789',
        razonSocial: 'Test SRL',
      };

      const result = createTipoProveedorSchema.safeParse(tipo);
      expect(result.success).toBe(true);
    });

    test('debe rechazar PROVEEDOR sin CUIT', () => {
      const tipo = {
        tipoPersonaCodigo: 'PROVEEDOR',
        razonSocial: 'Test SRL',
      };

      const result = createTipoProveedorSchema.safeParse(tipo);
      expect(result.success).toBe(false);
    });

    test('debe rechazar PROVEEDOR sin razón social', () => {
      const tipo = {
        tipoPersonaCodigo: 'PROVEEDOR',
        cuit: '20123456789',
      };

      const result = createTipoProveedorSchema.safeParse(tipo);
      expect(result.success).toBe(false);
    });

    test('debe rechazar CUIT con longitud incorrecta', () => {
      const tipo = {
        tipoPersonaCodigo: 'PROVEEDOR',
        cuit: '123',
        razonSocial: 'Test SRL',
      };

      const result = createTipoProveedorSchema.safeParse(tipo);
      expect(result.success).toBe(false);
    });

    test('debe rechazar CUIT con letras', () => {
      const tipo = {
        tipoPersonaCodigo: 'PROVEEDOR',
        cuit: '2012345678a',
        razonSocial: 'Test SRL',
      };

      const result = createTipoProveedorSchema.safeParse(tipo);
      expect(result.success).toBe(false);
    });

    test('debe rechazar CUIT con guiones', () => {
      const tipo = {
        tipoPersonaCodigo: 'PROVEEDOR',
        cuit: '20-12345678-9',
        razonSocial: 'Test SRL',
      };

      const result = createTipoProveedorSchema.safeParse(tipo);
      expect(result.success).toBe(false);
    });

    test('debe rechazar razón social muy corta', () => {
      const tipo = {
        tipoPersonaCodigo: 'PROVEEDOR',
        cuit: '20123456789',
        razonSocial: 'AB',
      };

      const result = createTipoProveedorSchema.safeParse(tipo);
      expect(result.success).toBe(false);
    });
  });

  describe('createTipoNoSocioSchema', () => {
    test('debe validar NO_SOCIO sin campos adicionales', () => {
      const tipo = {
        tipoPersonaCodigo: 'NO_SOCIO',
      };

      const result = createTipoNoSocioSchema.safeParse(tipo);
      expect(result.success).toBe(true);
    });

    test('debe validar NO_SOCIO con observaciones', () => {
      const tipo = {
        tipoPersonaCodigo: 'NO_SOCIO',
        observaciones: 'Persona externa',
      };

      const result = createTipoNoSocioSchema.safeParse(tipo);
      expect(result.success).toBe(true);
    });
  });

  describe('createPersonaSchema', () => {
    test('debe validar persona con datos básicos y un tipo', () => {
      const persona = {
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '12345678',
        tipos: [
          {
            tipoPersonaCodigo: 'NO_SOCIO',
          },
        ],
      };

      const result = createPersonaSchema.safeParse(persona);
      expect(result.success).toBe(true);
    });

    test('debe validar persona con múltiples tipos', () => {
      const persona = {
        nombre: 'Ana',
        apellido: 'García',
        dni: '87654321',
        email: 'ana@example.com',
        tipos: [
          {
            tipoPersonaCodigo: 'SOCIO',
            categoriaId: 'cat-1',
          },
          {
            tipoPersonaCodigo: 'DOCENTE',
            especialidadId: 3,
            honorariosPorHora: 5000,
          },
        ],
      };

      const result = createPersonaSchema.safeParse(persona);
      expect(result.success).toBe(true);
    });

    test('debe validar persona con contactos', () => {
      const persona = {
        nombre: 'Carlos',
        apellido: 'López',
        dni: '11223344',
        tipos: [
          {
            tipoPersonaCodigo: 'NO_SOCIO',
          },
        ],
        contactos: [
          {
            tipoContactoId: 1,
            valor: 'carlos@example.com',
            esPrincipal: true,
          },
        ],
      };

      const result = createPersonaSchema.safeParse(persona);
      expect(result.success).toBe(true);
    });

    test('debe rechazar persona sin tipos', () => {
      const persona = {
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '12345678',
        tipos: [],
      };

      const result = createPersonaSchema.safeParse(persona);
      expect(result.success).toBe(false);
    });

    test('debe rechazar persona sin nombre', () => {
      const persona = {
        apellido: 'Pérez',
        dni: '12345678',
        tipos: [
          {
            tipoPersonaCodigo: 'NO_SOCIO',
          },
        ],
      };

      const result = createPersonaSchema.safeParse(persona);
      expect(result.success).toBe(false);
    });

    test('debe rechazar persona sin apellido', () => {
      const persona = {
        nombre: 'Juan',
        dni: '12345678',
        tipos: [
          {
            tipoPersonaCodigo: 'NO_SOCIO',
          },
        ],
      };

      const result = createPersonaSchema.safeParse(persona);
      expect(result.success).toBe(false);
    });

    test('debe rechazar persona sin DNI', () => {
      const persona = {
        nombre: 'Juan',
        apellido: 'Pérez',
        tipos: [
          {
            tipoPersonaCodigo: 'NO_SOCIO',
          },
        ],
      };

      const result = createPersonaSchema.safeParse(persona);
      expect(result.success).toBe(false);
    });
  });
});
