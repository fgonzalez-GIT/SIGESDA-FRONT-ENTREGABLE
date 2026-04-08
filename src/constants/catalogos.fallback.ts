/**
 * Valores de fallback para catálogos
 * Se utilizan cuando los endpoints del backend no están disponibles
 */

import type { RolDocente } from '../types/actividad.types';

/**
 * Fallback para roles de docentes
 * Se usa cuando /api/catalogos/roles-docentes no está disponible
 */
export const ROLES_DOCENTES_FALLBACK: RolDocente[] = [
  {
    id: 1,
    codigo: 'PROFESOR',
    nombre: 'Profesor',
    descripcion: 'Docente titular de la actividad',
    activo: true,
    orden: 1,
  },
  {
    id: 2,
    codigo: 'AYUDANTE',
    nombre: 'Ayudante',
    descripcion: 'Docente ayudante o asistente',
    activo: true,
    orden: 2,
  },
  {
    id: 3,
    codigo: 'INVITADO',
    nombre: 'Invitado',
    descripcion: 'Docente invitado especial',
    activo: true,
    orden: 3,
  },
];

/**
 * Tipos de parentesco para relaciones familiares
 * Nota: Este tipo debe ser definido o importado desde persona.types.ts
 */
export interface TipoParentesco {
  id: number;
  nombre: string;
  grupo: 'ASCENDENTE' | 'DESCENDENTE' | 'COLATERAL' | 'OTRO';
  esReciprocable: boolean;
  parentescoInverso?: {
    id: number;
    nombre: string;
  };
}

/**
 * Fallback para tipos de parentesco
 * Se usa cuando /api/catalogos/tipos-parentesco no está disponible
 */
export const TIPOS_PARENTESCO_FALLBACK: TipoParentesco[] = [
  {
    id: 1,
    nombre: 'Padre',
    grupo: 'ASCENDENTE',
    esReciprocable: true,
    parentescoInverso: { id: 3, nombre: 'Hijo' },
  },
  {
    id: 2,
    nombre: 'Madre',
    grupo: 'ASCENDENTE',
    esReciprocable: true,
    parentescoInverso: { id: 4, nombre: 'Hija' },
  },
  {
    id: 3,
    nombre: 'Hijo',
    grupo: 'DESCENDENTE',
    esReciprocable: true,
    parentescoInverso: { id: 1, nombre: 'Padre' },
  },
  {
    id: 4,
    nombre: 'Hija',
    grupo: 'DESCENDENTE',
    esReciprocable: true,
    parentescoInverso: { id: 2, nombre: 'Madre' },
  },
  {
    id: 5,
    nombre: 'Cónyuge',
    grupo: 'OTRO',
    esReciprocable: true,
    parentescoInverso: { id: 5, nombre: 'Cónyuge' },
  },
  {
    id: 6,
    nombre: 'Hermano',
    grupo: 'COLATERAL',
    esReciprocable: true,
    parentescoInverso: { id: 7, nombre: 'Hermana' },
  },
  {
    id: 7,
    nombre: 'Hermana',
    grupo: 'COLATERAL',
    esReciprocable: true,
    parentescoInverso: { id: 6, nombre: 'Hermano' },
  },
  {
    id: 8,
    nombre: 'Abuelo',
    grupo: 'ASCENDENTE',
    esReciprocable: true,
    parentescoInverso: { id: 10, nombre: 'Nieto' },
  },
  {
    id: 9,
    nombre: 'Abuela',
    grupo: 'ASCENDENTE',
    esReciprocable: true,
    parentescoInverso: { id: 11, nombre: 'Nieta' },
  },
  {
    id: 10,
    nombre: 'Nieto',
    grupo: 'DESCENDENTE',
    esReciprocable: true,
    parentescoInverso: { id: 8, nombre: 'Abuelo' },
  },
  {
    id: 11,
    nombre: 'Nieta',
    grupo: 'DESCENDENTE',
    esReciprocable: true,
    parentescoInverso: { id: 9, nombre: 'Abuela' },
  },
  {
    id: 12,
    nombre: 'Tío',
    grupo: 'COLATERAL',
    esReciprocable: true,
    parentescoInverso: { id: 14, nombre: 'Sobrino' },
  },
  {
    id: 13,
    nombre: 'Tía',
    grupo: 'COLATERAL',
    esReciprocable: true,
    parentescoInverso: { id: 15, nombre: 'Sobrina' },
  },
  {
    id: 14,
    nombre: 'Sobrino',
    grupo: 'COLATERAL',
    esReciprocable: true,
    parentescoInverso: { id: 12, nombre: 'Tío' },
  },
  {
    id: 15,
    nombre: 'Sobrina',
    grupo: 'COLATERAL',
    esReciprocable: true,
    parentescoInverso: { id: 13, nombre: 'Tía' },
  },
];
