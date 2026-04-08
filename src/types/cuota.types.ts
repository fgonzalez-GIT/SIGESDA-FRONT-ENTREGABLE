import { Persona, PersonaTipo, TipoPersona, CategoriaSocio as CategoriaSocioEntity } from './persona.types';

// Enums and Types
export type CategoriaSocio = 'ACTIVO' | 'ESTUDIANTE' | 'JUBILADO' | 'VITALICIO' | 'BENEFACTOR';

export type EstadoRecibo = 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'ANULADO';

export type CategoriaItemCodigo = 'BASE' | 'ACTIVIDAD' | 'DESCUENTO' | 'RECARGO' | 'ADICIONAL';

export type TipoAjusteCuota =
    | 'DESCUENTO_FIJO'
    | 'DESCUENTO_PORCENTAJE'
    | 'RECARGO_FIJO'
    | 'RECARGO_PORCENTAJE'
    | 'MONTO_FIJO_TOTAL';

export type AplicaA = 'TOTAL_CUOTA' | 'BASE' | 'ACTIVIDADES' | 'ITEMS_ESPECIFICOS';

export type TipoExencion = 'TOTAL' | 'PARCIAL';

export type EstadoExencion =
    | 'PENDIENTE_APROBACION'
    | 'APROBADA'
    | 'VIGENTE'
    | 'VENCIDA'
    | 'REVOCADA'
    | 'RECHAZADA';

export type MotivoExencion =
    | 'BECA'
    | 'SOCIO_FUNDADOR'
    | 'SOCIO_HONORARIO'
    | 'SITUACION_ECONOMICA'
    | 'MERITO_ACADEMICO'
    | 'COLABORACION_INSTITUCIONAL'
    | 'EMERGENCIA_FAMILIAR'
    | 'OTRO';

// V2: Códigos de categorías de ítems (más completo que CategoriaItemCodigo)
export type CategoriaItemCuotaCodigo =
    | 'BASE'
    | 'ACTIVIDAD'
    | 'DESCUENTO'
    | 'RECARGO'
    | 'AJUSTE'
    | 'ADICIONAL';

// V2: Tipos de persona Architecture V2
export type TipoPersonaCodigo = 'SOCIO' | 'NO_SOCIO' | 'DOCENTE' | 'PROVEEDOR';

// V2: Categorías de socio (códigos)
export type CategoriaSocioCodigo =
    | 'ACTIVO'
    | 'ESTUDIANTE'
    | 'ADHERENTE'
    | 'VITALICIO'
    | 'HONORARIO'
    | 'JUBILADO'
    | 'BENEFACTOR';

// Interfaces

/**
 * V2: Categoría de ítem de cuota (completa desde backend)
 */
export interface CategoriaItem {
    id: number;
    codigo: CategoriaItemCuotaCodigo;
    nombre: string;
    descripcion: string;
    icono: string;
    color: string;
    activo: boolean;
    orden: number;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * V2: DTO de receptor con tipos[] (Architecture V2)
 * Este DTO reemplaza el uso directo de Persona en contexto de cuotas
 */
export interface ReceptorCuotaDTO {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
    numeroSocio: number | null;
    email?: string | null;
    telefono?: string | null;
    // NUEVO V2: Architecture V2 - tipos activos de la persona
    tipos: PersonaTipo[];
    // LEGACY: mantener por compatibilidad temporal (deprecated)
    categoria?: string | null;
}

/**
 * V2: Tipo de ítem de cuota (completo desde backend)
 */
export interface TipoItemCuota {
    id: number;
    codigo: string;
    nombre: string;
    descripcion: string;
    categoriaItemId: number;
    esCalculado: boolean;
    formula: Record<string, any> | null;
    activo: boolean;
    orden: number;
    configurable: boolean;
    createdAt?: string;
    updatedAt?: string;
    // Relación
    categoriaItem: CategoriaItem;
}

/**
 * V2: Ítem de cuota
 * Los montos vienen como string (Decimal) desde el backend
 */
export interface ItemCuota {
    id: number;
    cuotaId: number;
    tipoItemId: number;
    concepto: string;
    monto: string; // V2: Decimal as string (puede ser negativo para descuentos)
    cantidad: string; // V2: Decimal as string
    porcentaje?: string | null; // V2: Decimal as string
    esAutomatico: boolean;
    esEditable: boolean;
    observaciones?: string | null;
    metadata?: Record<string, any> | null;
    createdAt: string;
    updatedAt: string;
    // Relación
    tipoItem: TipoItemCuota;
}

export interface MedioPago {
    id: number;
    nombre: string;
    // Add other relevant fields if needed
}

/**
 * V2: Recibo con receptor usando ReceptorCuotaDTO (incluye tipos[])
 */
export interface Recibo {
    id: number;
    numero: string;
    tipo: 'CUOTA' | 'VENTA' | 'DONACION' | 'OTRO' | 'ACTIVIDAD';
    receptorId: number;
    emisorId?: number | null;
    importe: string; // V2: Decimal as string
    concepto: string;
    fecha: string; // ISO Date
    fechaVencimiento?: string | null; // ISO Date
    estado: EstadoRecibo;
    observaciones?: string | null;
    createdAt: string; // ISO Date
    updatedAt: string; // ISO Date
    // V2: Usar ReceptorCuotaDTO con tipos[]
    receptor: ReceptorCuotaDTO;
    emisor?: ReceptorCuotaDTO | null;
    mediosPago: MedioPago[];
}

/**
 * V2: Cuota con relaciones completas
 * El backend siempre incluye recibo, items y categoria populated
 */
export interface Cuota {
    id: number;
    reciboId: number;
    mes: number;
    anio: number;
    categoriaId: number;

    // V2: DEPRECATED - Los campos montoBase y montoActividades pueden venir
    // del backend pero deben ser ignorados. Usar items[] para cálculos.
    montoBase?: string | null; // DEPRECATED
    montoActividades?: string | null; // DEPRECATED

    // V2: Monto total (calculado desde items[])
    montoTotal: string; // Decimal as string

    createdAt: string; // ISO 8601
    updatedAt: string; // ISO 8601

    // V2: Relaciones siempre populated por el backend
    recibo: Recibo;
    items: ItemCuota[];
    categoria: CategoriaSocioEntity;
}

/**
 * V2: Helper type para totales de cuota calculados desde items[]
 */
export interface TotalesCuota {
    base: number;
    actividades: number;
    descuentos: number;
    recargos: number;
    ajustes: number;
    total: number;
}

/**
 * V2: Desglose de ítems de cuota por categoría
 */
export interface DesgloseItemsResponse {
    base: ItemCuota[];
    actividades: ItemCuota[];
    descuentos: ItemCuota[];
    recargos: ItemCuota[];
    ajustes: ItemCuota[];
    totales: TotalesCuota;
}

/**
 * V2: Helper type para items agrupados por código de categoría
 */
export type ItemsPorCategoria = Record<CategoriaItemCuotaCodigo, ItemCuota[]>;

/**
 * V2: Helper type para tipo de persona activo
 */
export type TipoPersonaActivo = PersonaTipo & {
    tipoPersona: TipoPersona;
    categoria: CategoriaSocioEntity | null;
};

export interface AjusteCuotaSocio {
    id: number;
    personaId: number;
    tipoAjuste: TipoAjusteCuota;
    valor: number;
    concepto: string;
    motivo?: string;
    fechaInicio: string; // ISO Date
    fechaFin?: string | null; // ISO Date
    aplicaA: AplicaA;
    itemsAfectados?: number[];
    activo: boolean;
    createdAt: string; // ISO Date
    updatedAt: string; // ISO Date
}

export interface ExencionCuota {
    id: number;
    personaId: number;
    tipoExencion: TipoExencion;
    motivoExencion: MotivoExencion;
    porcentaje: number;
    fechaInicio: string; // ISO Date
    fechaFin?: string; // ISO Date
    estado: EstadoExencion;
    justificacion: string;
    documentacionAdjunta?: string;
    observaciones?: string;
    aprobadoPor?: string;
    rechazadoPor?: string;
    createdAt: string; // ISO Date
    updatedAt: string; // ISO Date
}

// Reporting DTOs based on the guide

export interface DashboardMetric {
    totalCuotas: number;
    totalRecaudado: number;
    totalPendiente: number;
    tasaCobro: number;
    promedioMonto: number;
    totalDescuentos: number;
}

export interface DashboardData {
    periodo: {
        mes: number;
        anio: number;
        nombreMes: string;
    };
    metricas: DashboardMetric;
    distribucion: {
        porCategoria: Record<CategoriaSocio, { cantidad: number; monto: number }>;
        porEstado: Record<EstadoRecibo, { cantidad: number; monto: number }>;
    };
    tendencias: {
        variacionMesAnterior: number;
        proyeccionRecaudacion: number;
    };
}

// API Request/Response DTOs

export interface CrearCuotaRequest {
    reciboId: number;
    categoriaId: number;
    mes: number;
    anio: number;
    montoBase?: number | null; // V2: deprecated (calculado desde items)
    montoActividades?: number | null; // V2: deprecated (calculado desde items)
    montoTotal: number;
}

export interface GenerarCuotasRequest {
    mes: number;
    anio: number;
    categoriaIds?: number[];
    aplicarDescuentos: boolean;
    aplicarMotorReglas: boolean;
    incluirInactivos: boolean;
    soloNuevas: boolean;
    observaciones?: string;
}

export interface RegenerarCuotasRequest {
    mes: number;
    anio: number;
    categoriaId?: number;
    personaId?: number;
    aplicarAjustes?: boolean;
    aplicarExenciones?: boolean;
    aplicarDescuentos?: boolean;
    confirmarRegeneracion: true;
}

export interface GeneracionCuotasResponse {
    generated: number;
    errors: any[];
    cuotas: any[]; // Define specific type if needed
    resumenDescuentos: {
        totalSociosConDescuento: number;
        montoTotalDescuentos: number;
        reglasAplicadas: Record<string, number>;
    };
}

export interface SocioDetalle {
    id: number;
    nombre: string;
    numeroSocio: number | null;
    categoria: CategoriaSocioEntity;
    montoBase: number;
    montoActividades: number;
    montoTotal: number;
}

export interface ValidacionGeneracionResponse {
    puedeGenerar: boolean;
    sociosPendientes: number;
    cuotasExistentes: number;
    detallesSocios: SocioDetalle[];
    warnings?: string[];
    sociosSinCategoria?: number;
    sociosInactivos?: number;
    totales?: {
        montoBase: number;
        montoActividades: number;
        montoTotal: number;
    };
}

export interface RecalcularCuotaRequest {
    aplicarAjustes: boolean;
    aplicarExenciones: boolean;
    aplicarDescuentos: boolean;
}

export interface CambioValor {
    antes: number;
    despues: number;
    diferencia: number;
}

export interface RecalculoResponse {
    cuotaOriginal: Cuota;
    cuotaRecalculada: Cuota;
    cambios: {
        montoBase: CambioValor;
        montoActividades: CambioValor;
        montoTotal: CambioValor;
        ajustesAplicados: any[];
        exencionesAplicadas: any[];
    };
}

export interface CrearAjusteRequest {
    personaId: number;
    tipoAjuste: TipoAjusteCuota;
    valor: number;
    concepto: string;
    motivo?: string | null;
    fechaInicio: string;
    fechaFin?: string | null;
    aplicaA: AplicaA;
    itemsAfectados?: number[];
    activo: boolean;
}

export interface SolicitarExencionRequest {
    personaId: number;
    tipoExencion: TipoExencion;
    motivoExencion: MotivoExencion;
    porcentaje: number;
    fechaInicio: string;
    fechaFin: string;
    justificacion: string;
    documentacionAdjunta?: string;
    observaciones?: string;
}

export interface AprobarExencionRequest {
    aprobadoPor: string;
    observacionesAprobacion?: string;
}

export interface RechazarExencionRequest {
    rechazadoPor: string;
    motivoRechazo: string;
}

export interface RevocarExencionRequest {
    motivoRevocacion: string;
    usuario: string;
}
