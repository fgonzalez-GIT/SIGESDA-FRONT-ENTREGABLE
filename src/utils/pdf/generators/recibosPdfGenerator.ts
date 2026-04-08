/**
 * Recibos PDF Generator
 *
 * Genera PDFs de recibos individuales replicando fielmente el formato de la UI.
 * Utiliza jsPDF y jspdf-autotable para la generación de documentos.
 *
 * Fecha: 13/03/2026
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Recibo } from '@/store/slices/recibosSlice';
import { formatDateLongES } from '@/utils/dateHelpers';
import { generarTituloRecibo } from '@/utils/recibo.helpers';

// Colores del tema (basados en MUI primary)
const COLORS = {
    primary: [33, 150, 243], // RGB de primary.main (#2196F3)
    primaryLight: [227, 242, 253], // RGB de primary.lighter
    secondary: [158, 158, 158], // RGB de text.secondary
    grey: {
        50: [250, 250, 250],
        100: [245, 245, 245],
        300: [224, 224, 224],
        500: [158, 158, 158],
        700: [97, 97, 97],
    },
    success: [76, 175, 80], // RGB de success.main
    warning: [255, 152, 0], // RGB de warning.main
    error: [244, 67, 54], // RGB de error.main
};

// Configuración de página
const PAGE_WIDTH = 595.28; // A4 width in points
const PAGE_HEIGHT = 841.89; // A4 height in points
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

/**
 * Obtiene el color según el estado del recibo
 */
const getEstadoColor = (estado: string): number[] => {
    switch (estado) {
        case 'pagado':
            return COLORS.success;
        case 'vencido':
        case 'cancelado':
            return COLORS.error;
        case 'parcial':
            return COLORS.primary;
        case 'pendiente':
        default:
            return COLORS.warning;
    }
};

/**
 * Formatea un monto a formato de moneda argentina
 */
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
    }).format(amount);
};

/**
 * Capitaliza la primera letra de un string
 */
const capitalize = (str: string): string => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Genera el documento PDF de un recibo (lógica compartida)
 * @param recibo - Objeto Recibo completo
 * @returns Documento jsPDF generado
 */
const generarDocumentoRecibo = (recibo: Recibo): jsPDF => {
    // Crear documento PDF en formato A4 vertical
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
    });

    let yPosition = MARGIN;

    // ========================================================================
    // HEADER: Logo SIGESDA + Número y fechas
    // Layout 60/40: Izquierda ocupa 60% del ancho, Derecha ocupa 40%
    // ========================================================================

    // Calcular anchos: 60% para izquierda, 40% para derecha
    const leftColumnWidth = CONTENT_WIDTH * 0.6; // ~309pt
    const rightColumnStart = MARGIN + leftColumnWidth;

    // Lado izquierdo: Logo y datos de la institución (60% del ancho)
    doc.setFontSize(20);
    doc.setTextColor(...COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('SIGESDA', MARGIN, yPosition);

    yPosition += 20;
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.secondary);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión de Socios y Actividades', MARGIN, yPosition);

    yPosition += 18;
    doc.setFontSize(9);
    doc.text('Dirección: Av. Principal 123', MARGIN, yPosition);
    yPosition += 12;
    doc.text('Ciudad, Provincia (CP)', MARGIN, yPosition);
    yPosition += 12;
    doc.text('Tel: (011) 1234-5678', MARGIN, yPosition);
    yPosition += 12;
    doc.text('Email: info@sigesda.com', MARGIN, yPosition);

    // Lado derecho: RECIBO + Número + Fechas (40% del ancho, alineado a la derecha)
    const rightColumnX = PAGE_WIDTH - MARGIN; // Borde derecho para alineación
    const rightLabelX = rightColumnStart; // Inicio de la columna derecha para labels
    let rightY = MARGIN;

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('RECIBO', rightColumnX, rightY, { align: 'right' });

    rightY += 20;
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.primary);
    doc.text(`N° ${recibo.numero}`, rightColumnX, rightY, { align: 'right' });

    rightY += 25;
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha de Emisión:', rightLabelX, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDateLongES(recibo.fechaEmision), rightColumnX, rightY, { align: 'right' });

    rightY += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha de Vencimiento:', rightLabelX, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDateLongES(recibo.fechaVencimiento), rightColumnX, rightY, { align: 'right' });

    // Chip de estado
    rightY += 20;
    const estadoColor = getEstadoColor(recibo.estado);
    doc.setFillColor(...estadoColor);
    doc.setDrawColor(...estadoColor);
    doc.roundedRect(rightColumnX - 80, rightY - 10, 80, 18, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(capitalize(recibo.estado), rightColumnX - 40, rightY + 2, { align: 'center' });

    yPosition = Math.max(yPosition, rightY) + 30;

    // Línea divisoria
    doc.setDrawColor(...COLORS.grey[300]);
    doc.setLineWidth(1);
    doc.line(MARGIN, yPosition, PAGE_WIDTH - MARGIN, yPosition);

    yPosition += 20;

    // ========================================================================
    // DATOS DEL CLIENTE
    // ========================================================================

    doc.setFontSize(12);
    doc.setTextColor(...COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('Datos del Cliente', MARGIN, yPosition);

    yPosition += 18;

    // Layout de 2 columnas
    const col1X = MARGIN;
    const col2X = MARGIN + (CONTENT_WIDTH / 2);

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    // Columna 1: Nombre
    doc.setFont('helvetica', 'bold');
    doc.text('Nombre:', col1X, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(`${recibo.personaNombre} ${recibo.personaApellido}`, col1X, yPosition + 12);

    // Columna 2: Tipo
    doc.setFont('helvetica', 'bold');
    doc.text('Tipo:', col2X, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(capitalize(recibo.personaTipo), col2X, yPosition + 12);

    yPosition += 30;

    // Segunda fila: Email y Teléfono (si existen)
    if (recibo.personaEmail) {
        doc.setFont('helvetica', 'bold');
        doc.text('Email:', col1X, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(recibo.personaEmail, col1X, yPosition + 12);
    }

    if (recibo.personaTelefono) {
        doc.setFont('helvetica', 'bold');
        doc.text('Teléfono:', col2X, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(recibo.personaTelefono, col2X, yPosition + 12);
    }

    yPosition += (recibo.personaEmail || recibo.personaTelefono) ? 30 : 0;

    // ========================================================================
    // TÍTULO REPRESENTATIVO
    // ========================================================================

    const tituloRepresentativo = generarTituloRecibo(recibo);

    doc.setFillColor(...COLORS.primaryLight);
    doc.roundedRect(MARGIN, yPosition, CONTENT_WIDTH, 40, 3, 3, 'F');

    doc.setFontSize(14);
    doc.setTextColor(...COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(tituloRepresentativo, PAGE_WIDTH / 2, yPosition + 25, { align: 'center' });

    yPosition += 50;

    // ========================================================================
    // DETALLE DE CONCEPTOS (Tabla)
    // ========================================================================

    doc.setFontSize(12);
    doc.setTextColor(...COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalle de Conceptos', MARGIN, yPosition);

    yPosition += 10;

    // Preparar datos de la tabla
    const tableData = recibo.conceptos.map((concepto) => {
        return [
            {
                content: concepto.concepto + (concepto.tipoItem?.nombre ? `\n${concepto.tipoItem.nombre}` : ''),
                styles: { cellWidth: 'auto' },
            },
            concepto.cantidad.toString(),
            formatCurrency(concepto.precio),
            formatCurrency(concepto.subtotal),
        ];
    });

    // @ts-ignore - jspdf-autotable types
    doc.autoTable({
        startY: yPosition,
        head: [['Concepto', 'Cantidad', 'Precio Unit.', 'Subtotal']],
        body: tableData,
        theme: 'grid',
        styles: {
            fontSize: 9,
            cellPadding: 8,
        },
        headStyles: {
            fillColor: COLORS.grey[50],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            lineWidth: 0.5,
            lineColor: COLORS.grey[300],
        },
        bodyStyles: {
            textColor: [0, 0, 0],
            lineWidth: 0.5,
            lineColor: COLORS.grey[300],
        },
        columnStyles: {
            0: { cellWidth: 'auto' }, // Concepto (ancho automático)
            1: { cellWidth: 60, halign: 'center' }, // Cantidad
            2: { cellWidth: 80, halign: 'right' }, // Precio Unit.
            3: { cellWidth: 80, halign: 'right' }, // Subtotal
        },
        margin: { left: MARGIN, right: MARGIN },
    });

    // @ts-ignore
    yPosition = doc.lastAutoTable.finalY + 20;

    // ========================================================================
    // TOTALES
    // ========================================================================

    const totalesX = PAGE_WIDTH - MARGIN - 200;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    // Subtotal
    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal:', totalesX, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(recibo.subtotal), PAGE_WIDTH - MARGIN, yPosition, { align: 'right' });

    // Descuentos (si existen)
    if (recibo.descuentos > 0) {
        yPosition += 15;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.success);
        doc.text('Descuentos:', totalesX, yPosition);
        doc.text(`- ${formatCurrency(recibo.descuentos)}`, PAGE_WIDTH - MARGIN, yPosition, { align: 'right' });
        doc.setTextColor(0, 0, 0);
    }

    // Recargos (si existen)
    if (recibo.recargos > 0) {
        yPosition += 15;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.error);
        doc.text('Recargos:', totalesX, yPosition);
        doc.text(`+ ${formatCurrency(recibo.recargos)}`, PAGE_WIDTH - MARGIN, yPosition, { align: 'right' });
        doc.setTextColor(0, 0, 0);
    }

    yPosition += 15;

    // Línea divisoria antes del total
    doc.setDrawColor(...COLORS.grey[300]);
    doc.setLineWidth(0.5);
    doc.line(totalesX, yPosition, PAGE_WIDTH - MARGIN, yPosition);

    yPosition += 15;

    // TOTAL (destacado)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', totalesX, yPosition);
    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(14);
    doc.text(formatCurrency(recibo.total), PAGE_WIDTH - MARGIN, yPosition, { align: 'right' });

    yPosition += 30;

    // ========================================================================
    // ESTADO DE PAGO
    // ========================================================================

    doc.setFontSize(12);
    doc.setTextColor(...COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('Estado de Pago', MARGIN, yPosition);

    yPosition += 18;

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    // Estado
    doc.setFont('helvetica', 'bold');
    doc.text('Estado:', MARGIN, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(capitalize(recibo.estado), MARGIN + 100, yPosition);

    // Monto Pagado (si existe)
    if (recibo.montoPagado > 0) {
        yPosition += 15;
        doc.setFont('helvetica', 'bold');
        doc.text('Monto Pagado:', MARGIN, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(formatCurrency(recibo.montoPagado), MARGIN + 100, yPosition);
    }

    // Fecha de Pago (si existe)
    if (recibo.fechaPago) {
        yPosition += 15;
        doc.setFont('helvetica', 'bold');
        doc.text('Fecha de Pago:', MARGIN, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(formatDateLongES(recibo.fechaPago), MARGIN + 100, yPosition);
    }

    // Método de Pago (si existe)
    if (recibo.metodoPago) {
        yPosition += 15;
        doc.setFont('helvetica', 'bold');
        doc.text('Método de Pago:', MARGIN, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(capitalize(recibo.metodoPago.replace('_', ' ')), MARGIN + 100, yPosition);
    }

    // Medios de Pago (si existen múltiples)
    if (recibo.mediosPago && recibo.mediosPago.length > 0) {
        yPosition += 20;
        doc.setFont('helvetica', 'bold');
        doc.text('Medios de Pago:', MARGIN, yPosition);
        yPosition += 12;

        recibo.mediosPago.forEach((medio) => {
            doc.setFont('helvetica', 'normal');
            const tipoMedio = capitalize(medio.tipo.replace('_', ' '));
            const importeMedio = formatCurrency(medio.importe);
            doc.text(`• ${tipoMedio}: ${importeMedio}`, MARGIN + 10, yPosition);
            yPosition += 12;
        });
    }

    // Observaciones (si existen)
    if (recibo.observaciones) {
        yPosition += 20;
        doc.setFont('helvetica', 'bold');
        doc.text('Observaciones:', MARGIN, yPosition);
        yPosition += 12;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);

        // Split observaciones en múltiples líneas si es necesario
        const observacionesLines = doc.splitTextToSize(recibo.observaciones, CONTENT_WIDTH - 20);
        doc.text(observacionesLines, MARGIN + 10, yPosition);
        yPosition += observacionesLines.length * 10;
    }

    // ========================================================================
    // FOOTER
    // ========================================================================

    // Footer siempre al final de la página
    const footerY = PAGE_HEIGHT - 50;

    doc.setDrawColor(...COLORS.grey[300]);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, footerY - 10, PAGE_WIDTH - MARGIN, footerY - 10);

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.grey[500]);
    doc.setFont('helvetica', 'normal');

    const footerText = 'SIGESDA - Sistema de Gestión de Socios y Actividades | Tel: (011) 1234-5678 | Email: info@sigesda.com';
    doc.text(footerText, PAGE_WIDTH / 2, footerY, { align: 'center' });

    doc.text(`Fecha de generación: ${formatDateLongES(new Date().toISOString())}`, PAGE_WIDTH / 2, footerY + 12, { align: 'center' });

    // Retornar el documento PDF generado
    return doc;
};

/**
 * Genera el PDF de un recibo y retorna como Blob
 * Útil para exportación masiva (ZIP) o para enviar al backend
 * @param recibo - Objeto Recibo completo
 * @returns Blob del PDF generado
 */
export const generarReciboPdfBlob = (recibo: Recibo): Blob => {
    const doc = generarDocumentoRecibo(recibo);
    return doc.output('blob');
};

/**
 * Genera el PDF de un recibo y descarga automáticamente
 * @param recibo - Objeto Recibo completo
 * @returns Promise que resuelve cuando el PDF está listo
 */
export const generarReciboPdf = async (recibo: Recibo): Promise<void> => {
    const doc = generarDocumentoRecibo(recibo);
    const filename = `recibo-${recibo.numero}.pdf`;
    doc.save(filename);
};
