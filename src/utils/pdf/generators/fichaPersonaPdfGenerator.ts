/**
 * Generador de PDF: Ficha de Persona
 *
 * Genera un PDF completo con toda la información de una persona:
 * - Datos personales
 * - Tipos de persona (SOCIO, DOCENTE, etc.)
 * - Contactos
 * - Direcciones
 * - Relaciones familiares
 * - Actividades inscritas
 * - Historial de cuotas
 *
 * Fecha: 13/03/2026
 */

import { BasePdfGenerator } from '../BasePdfGenerator';
import { PDF_CONFIG } from '@/constants/pdfConfig';
import { formatDateES, formatDateLongES } from '@/utils/dateHelpers';
import { formatCurrency, capitalize } from '../pdfHelpers';
import type { Persona } from '@/types/persona.types';

/**
 * Opciones para la generación del PDF de Ficha de Persona
 */
export interface FichaPersonaPdfOptions {
    /** Incluir sección de actividades */
    incluirActividades?: boolean;
    /** Incluir sección de historial de cuotas */
    incluirCuotas?: boolean;
    /** Incluir sección de relaciones familiares */
    incluirFamiliares?: boolean;
    /** Incluir sección de contactos */
    incluirContactos?: boolean;
    /** Incluir sección de direcciones */
    incluirDirecciones?: boolean;
}

/**
 * Genera el PDF de Ficha de Persona
 *
 * @param persona - Datos de la persona
 * @param options - Opciones de generación
 */
export const generarFichaPersonaPdf = async (
    persona: Persona,
    options: FichaPersonaPdfOptions = {}
): Promise<void> => {
    const {
        incluirActividades = true,
        incluirCuotas = true,
        incluirFamiliares = true,
        incluirContactos = true,
        incluirDirecciones = true,
    } = options;

    const pdf = new BasePdfGenerator();

    // ========================================================================
    // HEADER
    // ========================================================================

    // Determinar el tipo principal para el título
    const tipoPrincipal = getTipoPrincipal(persona);
    const numeroIdentificador = persona.numeroSocio || persona.id;

    pdf.addHeader({
        leftTitle: 'FICHA DE PERSONA',
        rightData: {
            number: `N° ${numeroIdentificador}`,
            date: new Date(),
            status: persona.activo
                ? { label: 'ACTIVO', color: 'success' }
                : { label: 'INACTIVO', color: 'error' },
        },
    });

    // ========================================================================
    // TÍTULO: NOMBRE COMPLETO
    // ========================================================================

    pdf.addTitleBox({
        title: `${persona.nombre} ${persona.apellido}`,
    });

    // ========================================================================
    // SECCIÓN: DATOS PERSONALES
    // ========================================================================

    const datosPersonales: Array<{ label: string; value: string }> = [
        { label: 'DNI', value: persona.dni || '-' },
        { label: 'CUIL/CUIT', value: persona.cuil || '-' },
        { label: 'Fecha de Nacimiento', value: persona.fechaNacimiento ? formatDateES(persona.fechaNacimiento) : '-' },
        { label: 'Edad', value: calcularEdad(persona.fechaNacimiento) },
        { label: 'Género', value: persona.genero ? capitalize(persona.genero) : '-' },
        { label: 'Nacionalidad', value: persona.nacionalidad || '-' },
    ];

    pdf.addSection({
        title: 'Datos Personales',
        data: datosPersonales,
        columns: 3,
    });

    // ========================================================================
    // SECCIÓN: TIPOS DE PERSONA
    // ========================================================================

    if (persona.tipos && persona.tipos.length > 0) {
        pdf.ensureSpace(100);

        const datosTipos: Array<{ label: string; value: string }> = [];

        persona.tipos.forEach((tipo) => {
            const tipoNombre = tipo.tipoPersona?.nombre || tipo.tipoPersona?.codigo || 'N/A';
            datosTipos.push({ label: 'Tipo', value: tipoNombre });

            if (tipo.fechaIngreso) {
                datosTipos.push({
                    label: `Ingreso ${tipoNombre}`,
                    value: formatDateES(tipo.fechaIngreso),
                });
            }

            if (tipo.fechaBaja) {
                datosTipos.push({
                    label: `Baja ${tipoNombre}`,
                    value: formatDateES(tipo.fechaBaja),
                });
            }

            // Si es SOCIO, agregar datos específicos
            if (tipo.tipoPersona?.codigo === 'SOCIO' && persona.numeroSocio) {
                datosTipos.push({ label: 'Número de Socio', value: persona.numeroSocio.toString() });
            }

            // Si es DOCENTE, agregar especialidad si existe
            if (tipo.tipoPersona?.codigo === 'DOCENTE' && (persona as any).especialidad) {
                datosTipos.push({ label: 'Especialidad', value: (persona as any).especialidad });
            }
        });

        pdf.addSection({
            title: 'Tipos de Persona',
            data: datosTipos,
            columns: 2,
        });
    }

    // ========================================================================
    // SECCIÓN: CONTACTOS
    // ========================================================================

    if (incluirContactos && persona.contactos && persona.contactos.length > 0) {
        pdf.ensureSpace(150);
        pdf.addSpace(10);

        const headers = ['Tipo', 'Valor', 'Principal', 'Observaciones'];
        const rows = persona.contactos.map((contacto) => [
            contacto.tipoContacto?.nombre || contacto.tipoContacto?.codigo || '-',
            contacto.valor || '-',
            contacto.esPrincipal ? 'Sí' : 'No',
            contacto.observaciones || '-',
        ]);

        pdf.addTable({
            title: 'Contactos',
            headers,
            rows,
            columnStyles: {
                0: { cellWidth: 80, halign: 'left' },
                1: { cellWidth: 'auto', halign: 'left' },
                2: { cellWidth: 70, halign: 'center' },
                3: { cellWidth: 'auto', halign: 'left' },
            },
        });
    }

    // ========================================================================
    // SECCIÓN: DIRECCIONES
    // ========================================================================

    if (incluirDirecciones && persona.direcciones && persona.direcciones.length > 0) {
        pdf.ensureSpace(150);
        pdf.addSpace(10);

        const headers = ['Tipo', 'Dirección Completa', 'Localidad', 'Principal'];
        const rows = persona.direcciones.map((direccion) => {
            const direccionCompleta = [
                direccion.calle,
                direccion.numero,
                direccion.piso ? `Piso ${direccion.piso}` : '',
                direccion.departamento ? `Dto. ${direccion.departamento}` : '',
            ]
                .filter(Boolean)
                .join(' ');

            return [
                direccion.tipoDireccion?.nombre || direccion.tipoDireccion?.codigo || '-',
                direccionCompleta || '-',
                direccion.localidad || '-',
                direccion.esPrincipal ? 'Sí' : 'No',
            ];
        });

        pdf.addTable({
            title: 'Direcciones',
            headers,
            rows,
            columnStyles: {
                0: { cellWidth: 80, halign: 'left' },
                1: { cellWidth: 'auto', halign: 'left' },
                2: { cellWidth: 100, halign: 'left' },
                3: { cellWidth: 60, halign: 'center' },
            },
        });
    }

    // ========================================================================
    // SECCIÓN: RELACIONES FAMILIARES
    // ========================================================================

    if (incluirFamiliares && (persona as any).relaciones && (persona as any).relaciones.length > 0) {
        pdf.ensureSpace(150);
        pdf.addSpace(10);

        const headers = ['Familiar', 'Relación', 'DNI', 'Teléfono'];
        const rows = (persona as any).relaciones.map((rel: any) => [
            `${rel.personaRelacionada?.nombre || ''} ${rel.personaRelacionada?.apellido || ''}`.trim() || '-',
            rel.tipoRelacion?.nombre || rel.tipoRelacion?.codigo || '-',
            rel.personaRelacionada?.dni || '-',
            rel.personaRelacionada?.telefono || '-',
        ]);

        pdf.addTable({
            title: 'Relaciones Familiares',
            headers,
            rows,
            columnStyles: {
                0: { cellWidth: 'auto', halign: 'left' },
                1: { cellWidth: 100, halign: 'left' },
                2: { cellWidth: 80, halign: 'center' },
                3: { cellWidth: 100, halign: 'center' },
            },
        });
    }

    // ========================================================================
    // SECCIÓN: ACTIVIDADES INSCRITAS
    // ========================================================================

    if (incluirActividades && (persona as any).actividades && (persona as any).actividades.length > 0) {
        pdf.ensureSpace(150);
        pdf.addSpace(10);

        const headers = ['Actividad', 'Categoría', 'Día', 'Horario', 'Aula', 'Estado'];
        const rows = (persona as any).actividades.map((act: any) => [
            act.nombre || '-',
            act.categoria?.nombre || '-',
            act.diaSemana?.nombre || '-',
            `${act.horaInicio || '-'} - ${act.horaFin || '-'}`,
            act.aula?.nombre || '-',
            act.activo ? 'Activa' : 'Inactiva',
        ]);

        pdf.addTable({
            title: 'Actividades Inscritas',
            headers,
            rows,
            columnStyles: {
                0: { cellWidth: 'auto', halign: 'left' },
                1: { cellWidth: 80, halign: 'left' },
                2: { cellWidth: 60, halign: 'center' },
                3: { cellWidth: 90, halign: 'center' },
                4: { cellWidth: 70, halign: 'left' },
                5: { cellWidth: 60, halign: 'center' },
            },
        });
    }

    // ========================================================================
    // SECCIÓN: HISTORIAL DE CUOTAS (ÚLTIMAS 12)
    // ========================================================================

    if (incluirCuotas && (persona as any).cuotas && (persona as any).cuotas.length > 0) {
        pdf.ensureSpace(150);
        pdf.addSpace(10);

        // Tomar solo las últimas 12 cuotas
        const cuotasRecientes = (persona as any).cuotas.slice(0, 12);

        const headers = ['Mes/Año', 'Monto', 'Estado', 'F. Vencimiento', 'F. Pago'];
        const rows = cuotasRecientes.map((cuota: any) => [
            `${cuota.mes}/${cuota.anio}`,
            formatCurrency(cuota.monto || 0),
            cuota.pagada ? 'PAGADA' : 'PENDIENTE',
            cuota.fechaVencimiento ? formatDateES(cuota.fechaVencimiento) : '-',
            cuota.fechaPago ? formatDateES(cuota.fechaPago) : '-',
        ]);

        pdf.addTable({
            title: `Historial de Cuotas (Últimas ${cuotasRecientes.length})`,
            headers,
            rows,
            columnStyles: {
                0: { cellWidth: 80, halign: 'center' },
                1: { cellWidth: 90, halign: 'right' },
                2: { cellWidth: 80, halign: 'center' },
                3: { cellWidth: 90, halign: 'center' },
                4: { cellWidth: 90, halign: 'center' },
            },
        });
    }

    // ========================================================================
    // OBSERVACIONES GENERALES
    // ========================================================================

    if (persona.observaciones) {
        pdf.ensureSpace(80);
        pdf.addSpace(10);
        pdf.addDivider();
        pdf.addSpace(10);

        pdf.addParagraph('Observaciones:', {
            fontSize: PDF_CONFIG.fonts.sizes.small,
            fontStyle: 'bold',
            color: PDF_CONFIG.colors.grey[700],
        });

        pdf.addSpace(5);

        pdf.addParagraph(persona.observaciones, {
            fontSize: PDF_CONFIG.fonts.sizes.small,
            fontStyle: 'normal',
            color: PDF_CONFIG.colors.black,
        });
    }

    // ========================================================================
    // GUARDAR PDF
    // ========================================================================

    const filename = `ficha-${persona.dni || persona.id}-${formatDateES(new Date()).replace(/\//g, '-')}`;
    pdf.save(filename);
};

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Determina el tipo principal de persona
 */
const getTipoPrincipal = (persona: Persona): string => {
    if (!persona.tipos || persona.tipos.length === 0) return 'PERSONA';

    // Priorizar SOCIO > DOCENTE > PROVEEDOR > otros
    const prioridades: Record<string, number> = {
        SOCIO: 1,
        DOCENTE: 2,
        PROVEEDOR: 3,
        NO_SOCIO: 4,
    };

    const tipos = persona.tipos
        .map((t) => t.tipoPersona?.codigo || '')
        .filter(Boolean);

    tipos.sort((a, b) => (prioridades[a] || 99) - (prioridades[b] || 99));

    return tipos[0] || 'PERSONA';
};

/**
 * Calcula la edad a partir de la fecha de nacimiento
 */
const calcularEdad = (fechaNacimiento?: string): string => {
    if (!fechaNacimiento) return '-';

    try {
        const hoy = new Date();
        const nacimiento = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();

        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }

        return `${edad} años`;
    } catch {
        return '-';
    }
};
