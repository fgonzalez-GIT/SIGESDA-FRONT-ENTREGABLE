/**
 * Generador de PDF: Detalle de Cuota Individual
 *
 * Genera un PDF detallado de una cuota específica con:
 * - Datos del socio
 * - Información de la cuota (mes/año, categoría, montos)
 * - Desglose de items (cuota base + actividades)
 * - Descuentos y ajustes aplicados
 * - Información de pago (si está pagada)
 * - Estado y fechas relevantes
 *
 * Fecha: 13/03/2026
 */

import { BasePdfGenerator } from '../BasePdfGenerator';
import { PDF_CONFIG } from '@/constants/pdfConfig';
import { formatDateES, formatDateLongES } from '@/utils/dateHelpers';
import { formatCurrency, capitalize } from '../pdfHelpers';
import type { Cuota } from '@/types/cuota.types';

/**
 * Genera el PDF de Detalle de Cuota
 *
 * @param cuota - Datos completos de la cuota
 */
export const generarDetalleCuotaPdf = (cuota: Cuota): void => {
    const pdf = new BasePdfGenerator();

    // ========================================================================
    // HEADER
    // ========================================================================

    // Determinar estado para el chip
    const estadoChip = cuota.pagada
        ? { label: 'PAGADA', color: 'success' as const }
        : cuota.fechaVencimiento && new Date(cuota.fechaVencimiento) < new Date()
        ? { label: 'VENCIDA', color: 'error' as const }
        : { label: 'PENDIENTE', color: 'warning' as const };

    pdf.addHeader({
        leftTitle: 'DETALLE DE CUOTA',
        rightData: {
            number: `N° ${cuota.id}`,
            date: cuota.fechaGeneracion || new Date(),
            dueDate: cuota.fechaVencimiento,
            status: estadoChip,
        },
    });

    // ========================================================================
    // TÍTULO: PERÍODO DE LA CUOTA
    // ========================================================================

    const nombreMes = obtenerNombreMes(cuota.mes);
    pdf.addTitleBox({
        title: `Cuota ${capitalize(nombreMes)} ${cuota.anio}`,
    });

    // ========================================================================
    // SECCIÓN: DATOS DEL SOCIO
    // ========================================================================

    const datosSocio: Array<{ label: string; value: string }> = [
        { label: 'Socio', value: cuota.socioNombre || '-' },
        { label: 'N° de Socio', value: cuota.numeroSocio?.toString() || '-' },
        { label: 'Categoría', value: cuota.categoriaNombre || '-' },
    ];

    // Agregar DNI si está disponible
    if ((cuota as any).socioDni) {
        datosSocio.push({ label: 'DNI', value: (cuota as any).socioDni });
    }

    pdf.addSection({
        title: 'Datos del Socio',
        data: datosSocio,
        columns: 2,
    });

    // ========================================================================
    // SECCIÓN: INFORMACIÓN DE LA CUOTA
    // ========================================================================

    pdf.ensureSpace(100);

    const datosCuota: Array<{ label: string; value: string }> = [
        { label: 'Período', value: `${capitalize(nombreMes)} ${cuota.anio}` },
        { label: 'Fecha de Generación', value: cuota.fechaGeneracion ? formatDateES(cuota.fechaGeneracion) : '-' },
        { label: 'Fecha de Vencimiento', value: cuota.fechaVencimiento ? formatDateES(cuota.fechaVencimiento) : '-' },
        { label: 'Estado', value: cuota.pagada ? 'PAGADA' : 'PENDIENTE' },
    ];

    if (cuota.pagada && cuota.fechaPago) {
        datosCuota.push({ label: 'Fecha de Pago', value: formatDateES(cuota.fechaPago) });
    }

    pdf.addSection({
        title: 'Información de la Cuota',
        data: datosCuota,
        columns: 2,
    });

    // ========================================================================
    // SECCIÓN: DESGLOSE DE ITEMS
    // ========================================================================

    pdf.ensureSpace(150);
    pdf.addSpace(10);

    if (cuota.items && cuota.items.length > 0) {
        const headers = ['Concepto', 'Tipo', 'Monto'];
        const rows = cuota.items.map((item) => [
            item.concepto || item.tipoItemCuota?.nombre || '-',
            item.tipoItemCuota?.codigo === 'CUOTA_BASE' ? 'Cuota Base' : 'Actividad',
            formatCurrency(item.monto || 0),
        ]);

        // Subtotal antes de descuentos
        const subtotal = cuota.items.reduce((sum, item) => sum + (item.monto || 0), 0);
        rows.push(['', 'Subtotal', formatCurrency(subtotal)]);

        pdf.addTable({
            title: 'Desglose de Conceptos',
            headers,
            rows,
            columnStyles: {
                0: { cellWidth: 'auto', halign: 'left' },
                1: { cellWidth: 100, halign: 'center' },
                2: { cellWidth: 100, halign: 'right' },
            },
        });
    } else {
        // Formato legacy (sin items)
        const headers = ['Concepto', 'Monto'];
        const rows = [
            ['Cuota Base', formatCurrency(cuota.montoBase || 0)],
            ['Actividades', formatCurrency(cuota.montoActividades || 0)],
            ['', ''],
            ['Subtotal', formatCurrency((cuota.montoBase || 0) + (cuota.montoActividades || 0))],
        ];

        pdf.addTable({
            title: 'Desglose de Conceptos',
            headers,
            rows,
            columnStyles: {
                0: { cellWidth: 'auto', halign: 'left' },
                1: { cellWidth: 100, halign: 'right' },
            },
        });
    }

    // ========================================================================
    // SECCIÓN: DESCUENTOS Y AJUSTES
    // ========================================================================

    const tieneDescuentos = (cuota.descuentos && cuota.descuentos.length > 0) ||
                           (cuota.ajustes && cuota.ajustes.length > 0);

    if (tieneDescuentos) {
        pdf.ensureSpace(120);
        pdf.addSpace(10);

        const headers = ['Tipo', 'Descripción', 'Monto'];
        const rows: Array<Array<string>> = [];

        // Descuentos
        if (cuota.descuentos && cuota.descuentos.length > 0) {
            cuota.descuentos.forEach((desc) => {
                rows.push([
                    'Descuento',
                    desc.descripcion || desc.tipo || '-',
                    formatCurrency(-(desc.monto || 0)),
                ]);
            });
        }

        // Ajustes
        if (cuota.ajustes && cuota.ajustes.length > 0) {
            cuota.ajustes.forEach((ajuste) => {
                rows.push([
                    ajuste.tipo === 'incremento' ? 'Incremento' : 'Descuento',
                    ajuste.descripcion || ajuste.motivo || '-',
                    formatCurrency(ajuste.tipo === 'incremento' ? ajuste.monto : -ajuste.monto),
                ]);
            });
        }

        pdf.addTable({
            title: 'Descuentos y Ajustes',
            headers,
            rows,
            columnStyles: {
                0: { cellWidth: 100, halign: 'center' },
                1: { cellWidth: 'auto', halign: 'left' },
                2: { cellWidth: 100, halign: 'right' },
            },
        });
    }

    // ========================================================================
    // SECCIÓN: TOTALES
    // ========================================================================

    pdf.ensureSpace(100);
    pdf.addSpace(10);
    pdf.addDivider();
    pdf.addSpace(10);

    pdf.addKeyValue('Monto Total', formatCurrency(cuota.montoTotal), {
        fontSize: PDF_CONFIG.fonts.sizes.subtitle,
        labelWidth: 150,
    });

    if (cuota.pagada && cuota.montoPagado !== undefined) {
        pdf.addSpace(5);
        pdf.addKeyValue('Monto Pagado', formatCurrency(cuota.montoPagado), {
            fontSize: PDF_CONFIG.fonts.sizes.body,
            labelWidth: 150,
        });

        if (cuota.montoPagado < cuota.montoTotal) {
            const saldo = cuota.montoTotal - cuota.montoPagado;
            pdf.addSpace(5);
            pdf.addKeyValue('Saldo Pendiente', formatCurrency(saldo), {
                fontSize: PDF_CONFIG.fonts.sizes.body,
                labelWidth: 150,
            });
        }
    }

    // ========================================================================
    // SECCIÓN: INFORMACIÓN DE PAGO
    // ========================================================================

    if (cuota.pagada && (cuota as any).medioPago) {
        pdf.ensureSpace(80);
        pdf.addSpace(15);
        pdf.addDivider();
        pdf.addSpace(10);

        const datosPago: Array<{ label: string; value: string }> = [
            { label: 'Medio de Pago', value: (cuota as any).medioPago || '-' },
            { label: 'Fecha de Pago', value: cuota.fechaPago ? formatDateES(cuota.fechaPago) : '-' },
        ];

        if ((cuota as any).numeroComprobante) {
            datosPago.push({ label: 'N° Comprobante', value: (cuota as any).numeroComprobante });
        }

        pdf.addSection({
            title: 'Información de Pago',
            data: datosPago,
            columns: 2,
        });
    }

    // ========================================================================
    // OBSERVACIONES
    // ========================================================================

    if (cuota.observaciones) {
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

        pdf.addParagraph(cuota.observaciones, {
            fontSize: PDF_CONFIG.fonts.sizes.small,
            fontStyle: 'normal',
            color: PDF_CONFIG.colors.black,
        });
    }

    // ========================================================================
    // NOTA AL PIE
    // ========================================================================

    if (!cuota.pagada) {
        pdf.ensureSpace(60);
        pdf.addSpace(15);

        pdf.addParagraph(
            'Este documento es un comprobante de cuota. Para realizar el pago, acérquese a la secretaría o utilice los medios de pago habilitados.',
            {
                fontSize: PDF_CONFIG.fonts.sizes.caption,
                fontStyle: 'italic',
                color: PDF_CONFIG.colors.grey[500],
            }
        );
    }

    // ========================================================================
    // GUARDAR PDF
    // ========================================================================

    const mesFormateado = cuota.mes.toString().padStart(2, '0');
    const filename = `cuota-${cuota.numeroSocio || cuota.id}-${cuota.anio}-${mesFormateado}`;
    pdf.save(filename);
};

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Obtiene el nombre del mes en español
 */
const obtenerNombreMes = (mes: number): string => {
    const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return meses[mes - 1] || `mes ${mes}`;
};
