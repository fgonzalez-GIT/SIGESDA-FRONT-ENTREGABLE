import { describe, test, expect } from 'vitest';
import {
  personaTieneTipo,
  getTiposActivos,
  getCodigosTiposActivos,
  getContactoPrincipalPorTipo,
  getEmailPrincipal,
  getTelefonoPrincipal,
  getCelularPrincipal,
  getWhatsAppPrincipal,
  getNombreCompleto,
  isValidCuit,
  isValidDni,
} from '../persona.types';
import type { Persona, TipoContacto } from '../persona.types';

describe('Persona Types - Helpers', () => {
  // Mock de TipoContacto
  const tipoContactoEmail: TipoContacto = {
    id: 1,
    codigo: 'EMAIL',
    nombre: 'Email',
    activo: true,
    orden: 1,
  };

  const tipoContactoTelefono: TipoContacto = {
    id: 2,
    codigo: 'TELEFONO',
    nombre: 'Teléfono',
    activo: true,
    orden: 2,
  };

  const tipoContactoCelular: TipoContacto = {
    id: 3,
    codigo: 'CELULAR',
    nombre: 'Celular',
    activo: true,
    orden: 3,
  };

  const tipoContactoWhatsApp: TipoContacto = {
    id: 4,
    codigo: 'WHATSAPP',
    nombre: 'WhatsApp',
    activo: true,
    orden: 4,
  };

  // Mock de persona con tipos y contactos
  const personaMock: Persona = {
    id: 1,
    nombre: 'Juan',
    apellido: 'Pérez',
    dni: '12345678',
    activo: true,
    estado: 'ACTIVO',
    tipos: [
      {
        id: 1,
        personaId: 1,
        tipoPersonaId: 1,
        tipoPersonaCodigo: 'SOCIO',
        activo: true,
        categoriaId: 1,
        fechaAsignacion: '2024-01-01',
      },
      {
        id: 2,
        personaId: 1,
        tipoPersonaId: 2,
        tipoPersonaCodigo: 'DOCENTE',
        activo: true,
        especialidadId: 3,
        fechaAsignacion: '2024-01-01',
      },
      {
        id: 3,
        personaId: 1,
        tipoPersonaId: 3,
        tipoPersonaCodigo: 'PROVEEDOR',
        activo: false,
        cuit: '20123456789',
        razonSocial: 'Test SRL' as any,
        fechaAsignacion: '2024-01-01',
      },
    ],
    contactos: [
      {
        id: 1,
        personaId: 1,
        tipoContactoId: 1,
        valor: 'juan@example.com',
        principal: true,
        activo: true,
        tipoContacto: tipoContactoEmail,
      },
      {
        id: 2,
        personaId: 1,
        tipoContactoId: 2,
        valor: '1234567890',
        principal: true,
        activo: true,
        tipoContacto: tipoContactoTelefono,
      },
      {
        id: 3,
        personaId: 1,
        tipoContactoId: 3,
        valor: '0987654321',
        principal: false,
        activo: true,
        tipoContacto: tipoContactoCelular,
      },
      {
        id: 4,
        personaId: 1,
        tipoContactoId: 4,
        valor: '1155667788',
        principal: true,
        activo: true,
        tipoContacto: tipoContactoWhatsApp,
      },
    ],
  };

  describe('personaTieneTipo', () => {
    test('debe retornar true si la persona tiene el tipo activo', () => {
      expect(personaTieneTipo(personaMock, 'SOCIO')).toBe(true);
      expect(personaTieneTipo(personaMock, 'DOCENTE')).toBe(true);
    });

    test('debe retornar false si el tipo está inactivo', () => {
      expect(personaTieneTipo(personaMock, 'PROVEEDOR')).toBe(false);
    });

    test('debe retornar false si la persona no tiene el tipo', () => {
      expect(personaTieneTipo(personaMock, 'NO_SOCIO')).toBe(false);
    });

    test('debe retornar false si no hay tipos', () => {
      const personaSinTipos: Persona = {
        ...personaMock,
        tipos: undefined,
      };
      expect(personaTieneTipo(personaSinTipos, 'SOCIO')).toBe(false);
    });
  });

  describe('getTiposActivos', () => {
    test('debe retornar solo los tipos activos', () => {
      const tiposActivos = getTiposActivos(personaMock);
      expect(tiposActivos).toHaveLength(2);
      expect(tiposActivos.every(t => t.activo)).toBe(true);
    });

    test('debe retornar array vacío si no hay tipos', () => {
      const personaSinTipos: Persona = {
        ...personaMock,
        tipos: undefined,
      };
      expect(getTiposActivos(personaSinTipos)).toEqual([]);
    });
  });

  describe('getCodigosTiposActivos', () => {
    test('debe retornar array de códigos de tipos activos', () => {
      const codigos = getCodigosTiposActivos(personaMock);
      expect(codigos).toEqual(['SOCIO', 'DOCENTE']);
    });

    test('debe retornar array vacío si no hay tipos activos', () => {
      const personaSinTiposActivos: Persona = {
        ...personaMock,
        tipos: [
          {
            id: 3,
            personaId: 1,
            tipoPersonaId: 3,
            tipoPersonaCodigo: 'PROVEEDOR',
            activo: false,
            cuit: '20123456789',
            razonSocial: 'Test SRL' as any,
            fechaAsignacion: '2024-01-01',
          },
        ],
      };
      expect(getCodigosTiposActivos(personaSinTiposActivos)).toEqual([]);
    });
  });

  describe('getContactoPrincipalPorTipo', () => {
    test('debe retornar el contacto principal del tipo especificado', () => {
      const email = getContactoPrincipalPorTipo(personaMock, 'EMAIL');
      expect(email?.valor).toBe('juan@example.com');

      const telefono = getContactoPrincipalPorTipo(personaMock, 'TELEFONO');
      expect(telefono?.valor).toBe('1234567890');
    });

    test('debe retornar null si no hay contacto principal de ese tipo', () => {
      const celular = getContactoPrincipalPorTipo(personaMock, 'CELULAR');
      expect(celular).toBeNull();
    });

    test('debe retornar null si no hay contactos', () => {
      const personaSinContactos: Persona = {
        ...personaMock,
        contactos: undefined,
      };
      const email = getContactoPrincipalPorTipo(personaSinContactos, 'EMAIL');
      expect(email).toBeNull();
    });
  });

  describe('getEmailPrincipal', () => {
    test('debe retornar el email principal', () => {
      const email = getEmailPrincipal(personaMock);
      expect(email).toBe('juan@example.com');
    });

    test('debe retornar null si no hay email', () => {
      const personaSinEmail: Persona = {
        ...personaMock,
        contactos: [],
      };
      expect(getEmailPrincipal(personaSinEmail)).toBeNull();
    });
  });

  describe('getTelefonoPrincipal', () => {
    test('debe retornar el teléfono principal', () => {
      const telefono = getTelefonoPrincipal(personaMock);
      expect(telefono).toBe('1234567890');
    });

    test('debe retornar null si no hay teléfono', () => {
      const personaSinTelefono: Persona = {
        ...personaMock,
        contactos: [
          {
            id: 1,
            personaId: 1,
            tipoContactoId: 1,
            valor: 'juan@example.com',
            principal: true,
            activo: true,
            tipoContacto: tipoContactoEmail,
          },
        ],
      };
      expect(getTelefonoPrincipal(personaSinTelefono)).toBeNull();
    });
  });

  describe('getCelularPrincipal', () => {
    test('debe retornar null si el celular no es principal', () => {
      const celular = getCelularPrincipal(personaMock);
      expect(celular).toBeNull();
    });

    test('debe retornar el celular si es principal', () => {
      const personaConCelularPrincipal: Persona = {
        ...personaMock,
        contactos: [
          {
            id: 3,
            personaId: 1,
            tipoContactoId: 3,
            valor: '0987654321',
            principal: true,
            activo: true,
            tipoContacto: tipoContactoCelular,
          },
        ],
      };
      expect(getCelularPrincipal(personaConCelularPrincipal)).toBe('0987654321');
    });
  });

  describe('getWhatsAppPrincipal', () => {
    test('debe retornar el WhatsApp principal', () => {
      const whatsapp = getWhatsAppPrincipal(personaMock);
      expect(whatsapp).toBe('1155667788');
    });
  });

  describe('getNombreCompleto', () => {
    test('debe formatear nombre completo correctamente', () => {
      const nombreCompleto = getNombreCompleto(personaMock);
      expect(nombreCompleto).toBe('Pérez, Juan');
    });

    test('debe manejar nombres con espacios', () => {
      const persona: Persona = {
        ...personaMock,
        nombre: 'Juan Carlos',
        apellido: 'Pérez González',
      };
      expect(getNombreCompleto(persona)).toBe('Pérez González, Juan Carlos');
    });
  });

  describe('isValidCuit', () => {
    test('debe validar CUIT de 11 dígitos', () => {
      expect(isValidCuit('20123456789')).toBe(true);
      expect(isValidCuit('12345678901')).toBe(true);
      expect(isValidCuit('27987654321')).toBe(true);
    });

    test('debe rechazar CUIT con longitud incorrecta', () => {
      expect(isValidCuit('123456789')).toBe(false);    // Muy corto
      expect(isValidCuit('201234567890')).toBe(false); // Muy largo
      expect(isValidCuit('1234567')).toBe(false);      // Muy corto
    });

    test('debe rechazar CUIT con caracteres no numéricos', () => {
      expect(isValidCuit('2012345678a')).toBe(false);  // Con letras
      expect(isValidCuit('20-12345678-9')).toBe(false);// Con guiones
      expect(isValidCuit('20 12345678 9')).toBe(false);// Con espacios
    });

    test('debe rechazar string vacío', () => {
      expect(isValidCuit('')).toBe(false);
    });
  });

  describe('isValidDni', () => {
    test('debe validar DNI de 7 dígitos', () => {
      expect(isValidDni('1234567')).toBe(true);
      expect(isValidDni('9876543')).toBe(true);
    });

    test('debe validar DNI de 8 dígitos', () => {
      expect(isValidDni('12345678')).toBe(true);
      expect(isValidDni('98765432')).toBe(true);
    });

    test('debe rechazar DNI con longitud incorrecta', () => {
      expect(isValidDni('123456')).toBe(false);   // Muy corto
      expect(isValidDni('123456789')).toBe(false); // Muy largo
      expect(isValidDni('12345')).toBe(false);    // Muy corto
    });

    test('debe rechazar DNI con caracteres no numéricos', () => {
      expect(isValidDni('1234567a')).toBe(false);  // Con letras
      expect(isValidDni('12.345.678')).toBe(false);// Con puntos
      expect(isValidDni('12 345 678')).toBe(false);// Con espacios
    });

    test('debe rechazar string vacío', () => {
      expect(isValidDni('')).toBe(false);
    });
  });
});
