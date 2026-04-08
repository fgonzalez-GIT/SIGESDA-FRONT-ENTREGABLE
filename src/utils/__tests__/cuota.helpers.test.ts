/**
 * Tests para cuota.helpers.ts
 * Objetivo: Coverage 80%+ de funciones críticas
 */

import { describe, it, expect } from 'vitest';
import {
    getTipoPersonaActivo,
    esSocioActivo,
    getCategoriaSocio,
    agruparItemsPorCategoria,
    calcularTotalesCuota,
    getItemsPorCategoria,
    tieneDescuentos,
    tieneRecargos,
    formatearPeriodoCuota,
    getNombreCompletoReceptor,
    decimalToNumber,
    crearDesgloseCompleto,
} from '../cuota.helpers';
import { Cuota, ReceptorCuotaDTO, ItemCuota, CategoriaItemCuotaCodigo } from '@/types/cuota.types';

// ============================================================================
// MOCKS
// ============================================================================

const mockReceptorSocio: ReceptorCuotaDTO = {
    id: 1,
    nombre: 'Juan',
    apellido: 'Pérez',
    dni: '12345678',
    numeroSocio: 100,
    tipos: [
        {
            id: 1,
            personaId: 1,
            tipoPersonaId: 2,
            activo: true,
            fechaAsignacion: '2026-01-01',
            fechaDesasignacion: null,
            categoriaId: 2,
            numeroSocio: null,
            fechaIngreso: null,
            fechaBaja: null,
            motivoBaja: null,
            especialidadId: null,
            honorariosPorHora: null,
            cuit: null,
            observaciones: null,
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
            razonSocialId: null,
            tipoPersona: {
                id: 2,
                codigo: 'SOCIO',
                nombre: 'Socio',
                descripcion: 'Socio del club',
                activo: true,
                orden: 1,
                requiresCategoria: true,
                requiresEspecialidad: false,
                requiresCuit: false,
                createdAt: '2026-01-01',
                updatedAt: '2026-01-01',
            },
            categoria: {
                id: 2,
                codigo: 'ESTUDIANTE',
                nombre: 'Estudiante',
                descripcion: 'Socio estudiante',
                montoCuota: '5000',
                descuento: '20',
                activa: true,
                orden: 3,
                createdAt: '2026-01-01',
                updatedAt: '2026-01-01',
            },
        },
    ],
};

const mockReceptorNoSocio: ReceptorCuotaDTO = {
    id: 2,
    nombre: 'María',
    apellido: 'González',
    dni: '87654321',
    numeroSocio: null,
    tipos: [
        {
            id: 2,
            personaId: 2,
            tipoPersonaId: 3,
            activo: true,
            fechaAsignacion: '2026-01-01',
            fechaDesasignacion: null,
            categoriaId: null,
            numeroSocio: null,
            fechaIngreso: null,
            fechaBaja: null,
            motivoBaja: null,
            especialidadId: null,
            honorariosPorHora: null,
            cuit: null,
            observaciones: null,
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
            razonSocialId: null,
            tipoPersona: {
                id: 3,
                codigo: 'NO_SOCIO',
                nombre: 'No Socio',
                descripcion: 'Persona no asociada',
                activo: true,
                orden: 2,
                requiresCategoria: false,
                requiresEspecialidad: false,
                requiresCuit: false,
                createdAt: '2026-01-01',
                updatedAt: '2026-01-01',
            },
            categoria: null,
        },
    ],
};

const mockItemBase: ItemCuota = {
    id: 1,
    cuotaId: 1,
    tipoItemId: 1,
    concepto: 'Cuota base Estudiante',
    monto: '5000',
    cantidad: '1',
    porcentaje: null,
    esAutomatico: true,
    esEditable: false,
    observaciones: null,
    metadata: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    tipoItem: {
        id: 1,
        codigo: 'CUOTA_BASE_SOCIO',
        nombre: 'Cuota Base Socio',
        descripcion: 'Cuota mensual base',
        categoriaItemId: 1,
        esCalculado: true,
        formula: null,
        activo: true,
        orden: 1,
        configurable: true,
        categoriaItem: {
            id: 1,
            codigo: 'BASE',
            nombre: 'Cuota Base',
            descripcion: 'Base',
            icono: '💰',
            color: 'blue',
            activo: true,
            orden: 1,
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
        },
    },
};

const mockItemActividad: ItemCuota = {
    ...mockItemBase,
    id: 2,
    tipoItemId: 3,
    concepto: 'Actividad: Guitarra',
    monto: '2500',
    tipoItem: {
        ...mockItemBase.tipoItem,
        id: 3,
        codigo: 'ACTIVIDAD_INDIVIDUAL',
        categoriaItemId: 2,
        categoriaItem: {
            id: 2,
            codigo: 'ACTIVIDAD',
            nombre: 'Actividad',
            descripcion: 'Act',
            icono: '🎵',
            color: 'green',
            activo: true,
            orden: 2,
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
        },
    },
};

const mockItemDescuento: ItemCuota = {
    ...mockItemBase,
    id: 3,
    tipoItemId: 4,
    concepto: 'Descuento Familiar',
    monto: '-300',
    porcentaje: '15',
    tipoItem: {
        ...mockItemBase.tipoItem,
        id: 4,
        codigo: 'DESCUENTO_FAMILIAR',
        categoriaItemId: 3,
        categoriaItem: {
            id: 3,
            codigo: 'DESCUENTO',
            nombre: 'Descuento',
            descripcion: 'Desc',
            icono: '🎁',
            color: 'orange',
            activo: true,
            orden: 3,
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
        },
    },
};

const mockCuota: Cuota = {
    id: 1,
    reciboId: 1,
    mes: 2,
    anio: 2026,
    categoriaId: 2,
    montoBase: null,
    montoActividades: null,
    montoTotal: '7200',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    recibo: {
        id: 1,
        numero: '00001',
        tipo: 'CUOTA',
        receptorId: 1,
        emisorId: null,
        importe: '7200',
        concepto: 'Cuota Febrero 2026',
        fecha: '2026-01-01',
        fechaVencimiento: '2026-03-15',
        estado: 'PENDIENTE',
        observaciones: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        receptor: mockReceptorSocio,
        emisor: null,
        mediosPago: [],
    },
    categoria: {
        id: 2,
        codigo: 'ESTUDIANTE',
        nombre: 'Estudiante',
        descripcion: 'Socio estudiante',
        montoCuota: '5000',
        descuento: '20',
        activa: true,
        orden: 3,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
    },
    items: [mockItemBase, mockItemActividad, mockItemDescuento],
};

// ============================================================================
// TESTS
// ============================================================================

describe('cuota.helpers', () => {
    describe('getTipoPersonaActivo', () => {
        it('debe retornar el primer tipo activo de un socio', () => {
            const tipo = getTipoPersonaActivo(mockReceptorSocio);
            expect(tipo).toBeDefined();
            expect(tipo?.tipoPersona.codigo).toBe('SOCIO');
            expect(tipo?.categoria?.nombre).toBe('Estudiante');
        });

        it('debe retornar el tipo NO_SOCIO correctamente', () => {
            const tipo = getTipoPersonaActivo(mockReceptorNoSocio);
            expect(tipo).toBeDefined();
            expect(tipo?.tipoPersona.codigo).toBe('NO_SOCIO');
            expect(tipo?.categoria).toBeNull();
        });

        it('debe retornar null si no hay tipos', () => {
            const receptorSinTipos: ReceptorCuotaDTO = {
                ...mockReceptorSocio,
                tipos: [],
            };
            const tipo = getTipoPersonaActivo(receptorSinTipos);
            expect(tipo).toBeNull();
        });
    });

    describe('esSocioActivo', () => {
        it('debe retornar true para un socio activo', () => {
            expect(esSocioActivo(mockReceptorSocio)).toBe(true);
        });

        it('debe retornar false para un no socio', () => {
            expect(esSocioActivo(mockReceptorNoSocio)).toBe(false);
        });

        it('debe retornar false si no hay tipos', () => {
            const receptorSinTipos: ReceptorCuotaDTO = {
                ...mockReceptorSocio,
                tipos: [],
            };
            expect(esSocioActivo(receptorSinTipos)).toBe(false);
        });
    });

    describe('getCategoriaSocio', () => {
        it('debe retornar la categoría de un socio', () => {
            const categoria = getCategoriaSocio(mockReceptorSocio);
            expect(categoria).toBeDefined();
            expect(categoria?.nombre).toBe('Estudiante');
            expect(categoria?.codigo).toBe('ESTUDIANTE');
        });

        it('debe retornar null para un no socio', () => {
            const categoria = getCategoriaSocio(mockReceptorNoSocio);
            expect(categoria).toBeNull();
        });
    });

    describe('agruparItemsPorCategoria', () => {
        it('debe agrupar ítems por categoría correctamente', () => {
            const agrupados = agruparItemsPorCategoria(mockCuota.items);
            expect(agrupados.BASE).toBeDefined();
            expect(agrupados.BASE?.length).toBe(1);
            expect(agrupados.ACTIVIDAD).toBeDefined();
            expect(agrupados.ACTIVIDAD?.length).toBe(1);
            expect(agrupados.DESCUENTO).toBeDefined();
            expect(agrupados.DESCUENTO?.length).toBe(1);
        });

        it('debe retornar objeto vacío para array vacío', () => {
            const agrupados = agruparItemsPorCategoria([]);
            expect(Object.keys(agrupados).length).toBe(0);
        });
    });

    describe('calcularTotalesCuota', () => {
        it('debe calcular totales correctamente desde items', () => {
            const totales = calcularTotalesCuota(mockCuota);
            expect(totales.base).toBe(5000);
            expect(totales.actividades).toBe(2500);
            expect(totales.descuentos).toBe(300); // Valor absoluto
            expect(totales.recargos).toBe(0);
            expect(totales.total).toBe(7200);
        });

        it('debe manejar cuota sin items', () => {
            const cuotaSinItems = { ...mockCuota, items: [] };
            const totales = calcularTotalesCuota(cuotaSinItems);
            expect(totales.base).toBe(0);
            expect(totales.actividades).toBe(0);
            expect(totales.descuentos).toBe(0);
            expect(totales.total).toBe(7200); // Total viene del campo montoTotal
        });
    });

    describe('getItemsPorCategoria', () => {
        it('debe filtrar ítems por categoría BASE', () => {
            const items = getItemsPorCategoria(mockCuota, 'BASE');
            expect(items.length).toBe(1);
            expect(items[0].concepto).toBe('Cuota base Estudiante');
        });

        it('debe filtrar ítems por categoría ACTIVIDAD', () => {
            const items = getItemsPorCategoria(mockCuota, 'ACTIVIDAD');
            expect(items.length).toBe(1);
            expect(items[0].concepto).toBe('Actividad: Guitarra');
        });

        it('debe retornar array vacío si no hay ítems de esa categoría', () => {
            const items = getItemsPorCategoria(mockCuota, 'RECARGO');
            expect(items.length).toBe(0);
        });
    });

    describe('tieneDescuentos', () => {
        it('debe retornar true si tiene descuentos', () => {
            expect(tieneDescuentos(mockCuota)).toBe(true);
        });

        it('debe retornar false si no tiene descuentos', () => {
            const cuotaSinDescuentos = {
                ...mockCuota,
                items: [mockItemBase, mockItemActividad],
            };
            expect(tieneDescuentos(cuotaSinDescuentos)).toBe(false);
        });
    });

    describe('tieneRecargos', () => {
        it('debe retornar false si no tiene recargos', () => {
            expect(tieneRecargos(mockCuota)).toBe(false);
        });

        it('debe retornar true si tiene recargos', () => {
            const mockItemRecargo: ItemCuota = {
                ...mockItemBase,
                id: 4,
                concepto: 'Recargo por mora',
                monto: '500',
                tipoItem: {
                    ...mockItemBase.tipoItem,
                    categoriaItem: {
                        ...mockItemBase.tipoItem.categoriaItem,
                        codigo: 'RECARGO',
                    },
                },
            };
            const cuotaConRecargo = {
                ...mockCuota,
                items: [...mockCuota.items, mockItemRecargo],
            };
            expect(tieneRecargos(cuotaConRecargo)).toBe(true);
        });
    });

    describe('formatearPeriodoCuota', () => {
        it('debe formatear el período correctamente', () => {
            expect(formatearPeriodoCuota(mockCuota)).toBe('Febrero 2026');
        });

        it('debe formatear enero correctamente', () => {
            const cuotaEnero = { ...mockCuota, mes: 1 };
            expect(formatearPeriodoCuota(cuotaEnero)).toBe('Enero 2026');
        });

        it('debe formatear diciembre correctamente', () => {
            const cuotaDiciembre = { ...mockCuota, mes: 12 };
            expect(formatearPeriodoCuota(cuotaDiciembre)).toBe('Diciembre 2026');
        });
    });

    describe('getNombreCompletoReceptor', () => {
        it('debe retornar nombre completo en formato "Apellido, Nombre"', () => {
            expect(getNombreCompletoReceptor(mockCuota)).toBe('Pérez, Juan');
        });
    });

    describe('decimalToNumber', () => {
        it('debe convertir string decimal a número', () => {
            expect(decimalToNumber('5000.50')).toBe(5000.5);
            expect(decimalToNumber('100')).toBe(100);
            expect(decimalToNumber('-300.99')).toBe(-300.99);
        });

        it('debe retornar 0 para null o undefined', () => {
            expect(decimalToNumber(null)).toBe(0);
            expect(decimalToNumber(undefined)).toBe(0);
        });

        it('debe retornar el número tal cual si ya es number', () => {
            expect(decimalToNumber(5000)).toBe(5000);
            expect(decimalToNumber(-300.99)).toBe(-300.99);
        });

        it('debe retornar 0 para strings inválidos', () => {
            expect(decimalToNumber('invalid')).toBe(0);
            expect(decimalToNumber('')).toBe(0);
        });
    });

    describe('crearDesgloseCompleto', () => {
        it('debe crear desglose completo con ítems agrupados y totales', () => {
            const desglose = crearDesgloseCompleto(mockCuota);

            expect(desglose.base.length).toBe(1);
            expect(desglose.actividades.length).toBe(1);
            expect(desglose.descuentos.length).toBe(1);
            expect(desglose.recargos.length).toBe(0);

            expect(desglose.totales.base).toBe(5000);
            expect(desglose.totales.actividades).toBe(2500);
            expect(desglose.totales.descuentos).toBe(300);
            expect(desglose.totales.total).toBe(7200);
        });

        it('debe manejar cuota sin items', () => {
            const cuotaSinItems = { ...mockCuota, items: [] };
            const desglose = crearDesgloseCompleto(cuotaSinItems);

            expect(desglose.base.length).toBe(0);
            expect(desglose.actividades.length).toBe(0);
            expect(desglose.descuentos.length).toBe(0);
            expect(desglose.totales.total).toBe(7200);
        });
    });
});
