/**
 * PDF Helpers
 *
 * Funciones auxiliares reutilizables para la generación de PDFs.
 * Proporciona métodos para formatear headers, footers, tablas, secciones,
 * y otros elementos comunes en todos los documentos PDF del sistema.
 *
 * Fecha: 13/03/2026
 */

import jsPDF from 'jspdf';
import { PDF_CONFIG, getHeaderWidths, getFooterY } from '@/constants/pdfConfig';
import { formatDateLongES } from '@/utils/dateHelpers';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

/**
 * Configuración para el header de un PDF
 */
export interface HeaderConfig {
    /** Título para el lado izquierdo (ej: "RECIBO", "FICHA DE PERSONA") */
    leftTitle?: string;
    /** Datos para el lado derecho */
    rightData: {
        /** Número de documento (ej: "N° 00006607") */
        number: string;
        /** Fecha de emisión */
        date: Date | string;
        /** Fecha de vencimiento (opcional) */
        dueDate?: Date | string;
        /** Estado del documento (opcional, para chip de color) */
        status?: {
            label: string;
            color: 'success' | 'warning' | 'error' | 'info' | 'primary';
        };
    };
}

/**
 * Configuración para una sección de contenido
 */
export interface SectionConfig {
    /** Título de la sección */
    title: string;
    /** Datos de la sección en formato clave-valor */
    data: Array<{ label: string; value: string | number }>;
    /** Número de columnas para el layout */
    columns?: 2 | 3;
}

/**
 * Configuración para una tabla
 */
export interface TableConfig {
    /** Título de la tabla (opcional) */
    title?: string;
    /** Encabezados de columnas */
    headers: string[];
    /** Datos de las filas */
    rows: Array<Array<string | number>>;
    /** Configuración de columnas (anchos, alineación) */
    columnStyles?: Record<number, {
        cellWidth?: number | 'auto';
        halign?: 'left' | 'center' | 'right';
    }>;
    /** Estilos personalizados para override de la configuración global */
    customStyles?: {
        theme?: 'striped' | 'grid' | 'plain';
        styles?: {
            fontSize?: number;
            cellPadding?: number;
            overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden';
            halign?: 'left' | 'center' | 'right';
            lineWidth?: number;
            lineColor?: [number, number, number];
        };
        headStyles?: {
            fillColor?: [number, number, number];
            textColor?: [number, number, number];
            fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
            lineWidth?: number;
            lineColor?: [number, number, number];
            halign?: 'left' | 'center' | 'right';
            fontSize?: number;
            cellPadding?: number;
        };
        bodyStyles?: {
            textColor?: [number, number, number];
            lineWidth?: number;
            lineColor?: [number, number, number];
            fontSize?: number;
            cellPadding?: number;
        };
        alternateRowStyles?: {
            fillColor?: [number, number, number];
        };
    };
}

/**
 * Configuración para una caja de título destacado
 */
export interface TitleBoxConfig {
    /** Texto del título */
    title: string;
    /** Color de fondo personalizado (opcional) */
    backgroundColor?: [number, number, number];
    /** Color del texto personalizado (opcional) */
    textColor?: [number, number, number];
}

// ============================================================================
// FORMATEO DE MONEDA Y FECHAS
// ============================================================================

/**
 * Formatea un número como moneda argentina (ARS)
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
    }).format(amount);
};

/**
 * Capitaliza la primera letra de un string
 */
export const capitalize = (str: string): string => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Formatea una fecha para usar en PDFs
 */
export const formatPdfDate = (date: Date | string): string => {
    if (typeof date === 'string') {
        return formatDateLongES(date);
    }
    return formatDateLongES(date.toISOString());
};

// ============================================================================
// MAPEO DE COLORES DE ESTADO
// ============================================================================

/**
 * Obtiene el color RGB según el tipo de estado
 */
export const getStatusColor = (status: 'success' | 'warning' | 'error' | 'info' | 'primary'): [number, number, number] => {
    const colorMap = {
        success: PDF_CONFIG.colors.success,
        warning: PDF_CONFIG.colors.warning,
        error: PDF_CONFIG.colors.error,
        info: PDF_CONFIG.colors.info,
        primary: PDF_CONFIG.colors.primary,
    };
    return colorMap[status];
};

// ============================================================================
// GENERACIÓN DE HEADER
// ============================================================================

/**
 * Genera el header estándar para documentos PDF
 * Layout 60/40: Izquierda (logo + empresa) | Derecha (número + fechas)
 *
 * @param doc - Instancia de jsPDF
 * @param config - Configuración del header
 * @returns Posición Y después del header
 */
export const addPdfHeader = (doc: jsPDF, config: HeaderConfig): number => {
    const { leftTitle, rightData } = config;
    const headerWidths = getHeaderWidths();
    let yPosition = PDF_CONFIG.page.MARGIN;

    // ========================================================================
    // LADO IZQUIERDO: Logo y datos de la empresa (60%)
    // ========================================================================

    // Logo SIGESDA
    doc.setFontSize(PDF_CONFIG.fonts.sizes.title);
    doc.setTextColor(...PDF_CONFIG.colors.primary);
    doc.setFont(PDF_CONFIG.fonts.families.helvetica, PDF_CONFIG.fonts.styles.bold);
    doc.text(PDF_CONFIG.company.name, PDF_CONFIG.page.MARGIN, yPosition);

    yPosition += 20;

    // Subtítulo
    doc.setFontSize(PDF_CONFIG.fonts.sizes.body);
    doc.setTextColor(...PDF_CONFIG.colors.secondary);
    doc.setFont(PDF_CONFIG.fonts.families.helvetica, PDF_CONFIG.fonts.styles.normal);
    doc.text(PDF_CONFIG.company.fullName, PDF_CONFIG.page.MARGIN, yPosition);

    yPosition += 18;

    // Datos de contacto
    doc.setFontSize(PDF_CONFIG.fonts.sizes.small);
    doc.text(`Dirección: ${PDF_CONFIG.company.address}`, PDF_CONFIG.page.MARGIN, yPosition);
    yPosition += 12;
    doc.text(PDF_CONFIG.company.city, PDF_CONFIG.page.MARGIN, yPosition);
    yPosition += 12;
    doc.text(`Tel: ${PDF_CONFIG.company.phone}`, PDF_CONFIG.page.MARGIN, yPosition);
    yPosition += 12;
    doc.text(`Email: ${PDF_CONFIG.company.email}`, PDF_CONFIG.page.MARGIN, yPosition);

    // ========================================================================
    // LADO DERECHO: Datos del documento (40%)
    // ========================================================================

    const rightColumnX = PDF_CONFIG.page.WIDTH - PDF_CONFIG.page.MARGIN;
    const rightLabelX = headerWidths.rightStart;
    let rightY = PDF_CONFIG.page.MARGIN;

    // Título del documento (si se proporciona)
    if (leftTitle) {
        doc.setFontSize(PDF_CONFIG.fonts.sizes.subtitle);
        doc.setTextColor(...PDF_CONFIG.colors.black);
        doc.setFont(PDF_CONFIG.fonts.families.helvetica, PDF_CONFIG.fonts.styles.bold);
        doc.text(leftTitle, rightColumnX, rightY, { align: 'right' });
        rightY += 20;
    }

    // Número del documento
    doc.setFontSize(PDF_CONFIG.fonts.sizes.subtitle);
    doc.setTextColor(...PDF_CONFIG.colors.primary);
    doc.text(rightData.number, rightColumnX, rightY, { align: 'right' });
    rightY += 25;

    // Fecha de emisión
    doc.setFontSize(PDF_CONFIG.fonts.sizes.small);
    doc.setTextColor(...PDF_CONFIG.colors.black);
    doc.setFont(PDF_CONFIG.fonts.families.helvetica, PDF_CONFIG.fonts.styles.bold);
    doc.text('Fecha de Emisión:', rightLabelX, rightY);
    doc.setFont(PDF_CONFIG.fonts.families.helvetica, PDF_CONFIG.fonts.styles.normal);
    doc.text(formatPdfDate(rightData.date), rightColumnX, rightY, { align: 'right' });
    rightY += 15;

    // Fecha de vencimiento (si existe)
    if (rightData.dueDate) {
        doc.setFont(PDF_CONFIG.fonts.families.helvetica, PDF_CONFIG.fonts.styles.bold);
        doc.text('Fecha de Vencimiento:', rightLabelX, rightY);
        doc.setFont(PDF_CONFIG.fonts.families.helvetica, PDF_CONFIG.fonts.styles.normal);
        doc.text(formatPdfDate(rightData.dueDate), rightColumnX, rightY, { align: 'right' });
        rightY += 15;
    }

    // Chip de estado (si existe)
    if (rightData.status) {
        rightY += 5;
        const chipWidth = 80;
        const chipHeight = 18;
        const chipX = rightColumnX - chipWidth;
        const chipY = rightY - 10;

        const statusColor = getStatusColor(rightData.status.color);
        doc.setFillColor(...statusColor);
        doc.setDrawColor(...statusColor);
        doc.roundedRect(chipX, chipY, chipWidth, chipHeight, 3, 3, 'F');

        doc.setTextColor(...PDF_CONFIG.colors.white);
        doc.setFontSize(PDF_CONFIG.fonts.sizes.caption);
        doc.setFont(PDF_CONFIG.fonts.families.helvetica, PDF_CONFIG.fonts.styles.bold);
        doc.text(rightData.status.label, rightColumnX - (chipWidth / 2), chipY + 12, { align: 'center' });
        rightY += 15;
    }

    // Calcular posición Y final (la más baja entre izquierda y derecha)
    const finalY = Math.max(yPosition, rightY) + PDF_CONFIG.header.marginBottom;

    // Línea divisoria
    doc.setDrawColor(...PDF_CONFIG.colors.grey[300]);
    doc.setLineWidth(1);
    doc.line(PDF_CONFIG.page.MARGIN, finalY, PDF_CONFIG.page.WIDTH - PDF_CONFIG.page.MARGIN, finalY);

    return finalY + 20;
};

// ============================================================================
// GENERACIÓN DE TÍTULO DESTACADO
// ============================================================================

/**
 * Genera una caja de título destacado (ej: "Cuota Socio - Marzo 2026")
 *
 * @param doc - Instancia de jsPDF
 * @param yPosition - Posición Y actual
 * @param config - Configuración del título
 * @returns Nueva posición Y después del título
 */
export const addTitleBox = (doc: jsPDF, yPosition: number, config: TitleBoxConfig): number => {
    const backgroundColor = config.backgroundColor || PDF_CONFIG.titleBox.backgroundColor;
    const textColor = config.textColor || PDF_CONFIG.titleBox.textColor;

    // Dibujar caja de fondo
    doc.setFillColor(...backgroundColor);
    doc.roundedRect(
        PDF_CONFIG.page.MARGIN,
        yPosition,
        PDF_CONFIG.content.width,
        PDF_CONFIG.titleBox.height,
        PDF_CONFIG.titleBox.borderRadius,
        PDF_CONFIG.titleBox.borderRadius,
        'F'
    );

    // Texto centrado
    doc.setFontSize(PDF_CONFIG.titleBox.fontSize);
    doc.setTextColor(...textColor);
    doc.setFont(PDF_CONFIG.fonts.families.helvetica, PDF_CONFIG.titleBox.fontStyle);
    doc.text(
        config.title,
        PDF_CONFIG.page.WIDTH / 2,
        yPosition + (PDF_CONFIG.titleBox.height / 2) + 5,
        { align: 'center' }
    );

    return yPosition + PDF_CONFIG.titleBox.height + PDF_CONFIG.section.marginTop;
};

// ============================================================================
// GENERACIÓN DE SECCIONES
// ============================================================================

/**
 * Genera una sección de contenido con datos clave-valor
 *
 * @param doc - Instancia de jsPDF
 * @param yPosition - Posición Y actual
 * @param config - Configuración de la sección
 * @returns Nueva posición Y después de la sección
 */
export const addSection = (doc: jsPDF, yPosition: number, config: SectionConfig): number => {
    const { title, data, columns = 2 } = config;

    // Título de la sección
    doc.setFontSize(PDF_CONFIG.section.titleFontSize);
    doc.setTextColor(...PDF_CONFIG.section.titleColor);
    doc.setFont(PDF_CONFIG.fonts.families.helvetica, PDF_CONFIG.fonts.styles.bold);
    doc.text(title, PDF_CONFIG.page.MARGIN, yPosition);

    yPosition += PDF_CONFIG.section.marginBottom;

    // Calcular anchos de columnas
    const columnWidth = PDF_CONFIG.content.width / columns;
    const rowHeight = 24; // Altura de cada fila (label + valor)

    doc.setFontSize(PDF_CONFIG.fonts.sizes.small);
    doc.setTextColor(...PDF_CONFIG.colors.black);

    // Organizar datos en filas y columnas
    data.forEach((item, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);
        const x = PDF_CONFIG.page.MARGIN + (col * columnWidth);
        const y = yPosition + (row * rowHeight);

        // Label (negrita)
        doc.setFont(PDF_CONFIG.fonts.families.helvetica, PDF_CONFIG.fonts.styles.bold);
        doc.text(`${item.label}:`, x, y);

        // Valor (normal)
        doc.setFont(PDF_CONFIG.fonts.families.helvetica, PDF_CONFIG.fonts.styles.normal);
        doc.text(String(item.value), x, y + 12);
    });

    // Calcular nueva posición Y
    const rows = Math.ceil(data.length / columns);
    return yPosition + (rows * rowHeight) + PDF_CONFIG.section.marginTop;
};

// ============================================================================
// GENERACIÓN DE FOOTER
// ============================================================================

/**
 * Genera el footer estándar para documentos PDF
 *
 * @param doc - Instancia de jsPDF
 */
export const addPdfFooter = (doc: jsPDF): void => {
    const footerY = getFooterY();

    // Línea divisoria
    doc.setDrawColor(...PDF_CONFIG.footer.dividerColor);
    doc.setLineWidth(PDF_CONFIG.footer.dividerWidth);
    doc.line(
        PDF_CONFIG.page.MARGIN,
        footerY - 10,
        PDF_CONFIG.page.WIDTH - PDF_CONFIG.page.MARGIN,
        footerY - 10
    );

    // Texto del footer
    doc.setFontSize(PDF_CONFIG.footer.fontSize);
    doc.setTextColor(...PDF_CONFIG.footer.textColor);
    doc.setFont(PDF_CONFIG.fonts.families.helvetica, PDF_CONFIG.fonts.styles.normal);

    const footerText = `${PDF_CONFIG.company.name} - ${PDF_CONFIG.company.fullName} | Tel: ${PDF_CONFIG.company.phone} | Email: ${PDF_CONFIG.company.email}`;
    doc.text(footerText, PDF_CONFIG.page.WIDTH / 2, footerY, { align: 'center' });

    // Fecha de generación
    const generationDate = `Fecha de generación: ${formatPdfDate(new Date())}`;
    doc.text(generationDate, PDF_CONFIG.page.WIDTH / 2, footerY + 12, { align: 'center' });
};
