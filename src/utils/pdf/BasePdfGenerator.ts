/**
 * Base PDF Generator
 *
 * Clase base para la generación de PDFs en todo el sistema SIGESDA.
 * Proporciona métodos reutilizables para crear headers, footers, secciones,
 * tablas y otros elementos comunes, garantizando consistencia visual.
 *
 * Uso:
 * ```typescript
 * const pdf = new BasePdfGenerator();
 * pdf.addHeader({ rightData: { number: '001', date: new Date() } });
 * pdf.addTitleBox({ title: 'Mi Documento' });
 * pdf.addSection({ title: 'Datos', data: [...] });
 * pdf.save('mi-documento.pdf');
 * ```
 *
 * Fecha: 13/03/2026
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { PDF_CONFIG } from '@/constants/pdfConfig';
import {
    addPdfHeader,
    addTitleBox,
    addSection,
    addPdfFooter,
    HeaderConfig,
    TitleBoxConfig,
    SectionConfig,
    TableConfig,
} from './pdfHelpers';

/**
 * Clase base para generación de PDFs
 */
export class BasePdfGenerator {
    /** Instancia de jsPDF */
    protected doc: jsPDF;

    /** Posición Y actual en el documento */
    protected yPosition: number;

    /** Indica si se ha agregado el header */
    protected hasHeader: boolean;

    /** Indica si se ha agregado el footer */
    protected hasFooter: boolean;

    /**
     * Constructor
     * @param orientation - Orientación del documento
     */
    constructor(orientation: 'portrait' | 'landscape' = 'portrait') {
        this.doc = new jsPDF({
            orientation,
            unit: PDF_CONFIG.page.UNIT,
            format: PDF_CONFIG.page.FORMAT,
        });

        this.yPosition = PDF_CONFIG.page.MARGIN;
        this.hasHeader = false;
        this.hasFooter = false;
    }

    // ========================================================================
    // MÉTODOS PÚBLICOS: HEADER Y FOOTER
    // ========================================================================

    /**
     * Agrega el header estándar al documento
     * @param config - Configuración del header
     * @returns Instancia actual para encadenamiento
     */
    public addHeader(config: HeaderConfig): this {
        this.yPosition = addPdfHeader(this.doc, config);
        this.hasHeader = true;
        return this;
    }

    /**
     * Agrega el footer estándar al documento
     * @returns Instancia actual para encadenamiento
     */
    public addFooter(): this {
        addPdfFooter(this.doc);
        this.hasFooter = true;
        return this;
    }

    // ========================================================================
    // MÉTODOS PÚBLICOS: CONTENIDO
    // ========================================================================

    /**
     * Agrega una caja de título destacado
     * @param config - Configuración del título
     * @returns Instancia actual para encadenamiento
     */
    public addTitleBox(config: TitleBoxConfig): this {
        this.yPosition = addTitleBox(this.doc, this.yPosition, config);
        return this;
    }

    /**
     * Agrega una sección de contenido con datos clave-valor
     * @param config - Configuración de la sección
     * @returns Instancia actual para encadenamiento
     */
    public addSection(config: SectionConfig): this {
        this.yPosition = addSection(this.doc, this.yPosition, config);
        return this;
    }

    /**
     * Agrega una tabla al documento usando jspdf-autotable
     * @param config - Configuración de la tabla
     * @returns Instancia actual para encadenamiento
     */
    public addTable(config: TableConfig): this {
        const { title, headers, rows, columnStyles, customStyles } = config;

        // Título de la tabla (opcional)
        if (title) {
            this.doc.setFontSize(PDF_CONFIG.section.titleFontSize);
            this.doc.setTextColor(...PDF_CONFIG.section.titleColor);
            this.doc.setFont(
                PDF_CONFIG.fonts.families.helvetica,
                PDF_CONFIG.fonts.styles.bold
            );
            this.doc.text(title, PDF_CONFIG.page.MARGIN, this.yPosition);
            this.yPosition += 10;
        }

        // Merge custom styles with default config (custom styles override defaults)
        const finalStyles = customStyles?.styles
            ? { ...PDF_CONFIG.table.styles, ...customStyles.styles }
            : PDF_CONFIG.table.styles;
        const finalHeadStyles = customStyles?.headStyles
            ? { ...PDF_CONFIG.table.headStyles, ...customStyles.headStyles }
            : PDF_CONFIG.table.headStyles;
        const finalBodyStyles = customStyles?.bodyStyles
            ? { ...PDF_CONFIG.table.bodyStyles, ...customStyles.bodyStyles }
            : PDF_CONFIG.table.bodyStyles;

        // Generar tabla
        // @ts-ignore - jspdf-autotable types
        this.doc.autoTable({
            startY: this.yPosition,
            head: [headers],
            body: rows,
            theme: customStyles?.theme || PDF_CONFIG.table.theme,
            styles: finalStyles,
            headStyles: finalHeadStyles,
            bodyStyles: finalBodyStyles,
            alternateRowStyles: customStyles?.alternateRowStyles || PDF_CONFIG.table.alternateRowStyles,
            margin: PDF_CONFIG.table.margin,
            columnStyles: columnStyles || {},
        });

        // Actualizar posición Y después de la tabla
        // @ts-ignore
        this.yPosition = this.doc.lastAutoTable.finalY + PDF_CONFIG.section.marginTop;

        return this;
    }

    /**
     * Agrega un párrafo de texto con wrap automático
     * @param text - Texto a agregar
     * @param options - Opciones de estilo
     * @returns Instancia actual para encadenamiento
     */
    public addParagraph(
        text: string,
        options: {
            fontSize?: number;
            fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
            color?: [number, number, number];
            maxWidth?: number;
        } = {}
    ): this {
        const {
            fontSize = PDF_CONFIG.fonts.sizes.body,
            fontStyle = 'normal',
            color = PDF_CONFIG.colors.black,
            maxWidth = PDF_CONFIG.content.width - 20,
        } = options;

        this.doc.setFontSize(fontSize);
        this.doc.setFont(PDF_CONFIG.fonts.families.helvetica, fontStyle);
        this.doc.setTextColor(...color);

        const lines = this.doc.splitTextToSize(text, maxWidth);
        this.doc.text(lines, PDF_CONFIG.page.MARGIN + 10, this.yPosition);

        this.yPosition += lines.length * (fontSize * 1.2);
        return this;
    }

    /**
     * Agrega un espacio vertical
     * @param space - Cantidad de puntos de espacio
     * @returns Instancia actual para encadenamiento
     */
    public addSpace(space: number = 20): this {
        this.yPosition += space;
        return this;
    }

    /**
     * Agrega una línea divisoria horizontal
     * @param options - Opciones de la línea
     * @returns Instancia actual para encadenamiento
     */
    public addDivider(
        options: {
            color?: [number, number, number];
            width?: number;
            marginTop?: number;
            marginBottom?: number;
        } = {}
    ): this {
        const {
            color = PDF_CONFIG.colors.grey[300],
            width = 0.5,
            marginTop = 10,
            marginBottom = 10,
        } = options;

        this.yPosition += marginTop;

        this.doc.setDrawColor(...color);
        this.doc.setLineWidth(width);
        this.doc.line(
            PDF_CONFIG.page.MARGIN,
            this.yPosition,
            PDF_CONFIG.page.WIDTH - PDF_CONFIG.page.MARGIN,
            this.yPosition
        );

        this.yPosition += marginBottom;
        return this;
    }

    /**
     * Agrega un item de clave-valor en una línea
     * @param label - Etiqueta (negrita)
     * @param value - Valor (normal)
     * @param options - Opciones de posición
     * @returns Instancia actual para encadenamiento
     */
    public addKeyValue(
        label: string,
        value: string | number,
        options: {
            fontSize?: number;
            labelWidth?: number;
            xPosition?: number;
        } = {}
    ): this {
        const {
            fontSize = PDF_CONFIG.fonts.sizes.small,
            labelWidth = 100,
            xPosition = PDF_CONFIG.page.MARGIN,
        } = options;

        this.doc.setFontSize(fontSize);

        // Label (negrita)
        this.doc.setFont(PDF_CONFIG.fonts.families.helvetica, 'bold');
        this.doc.setTextColor(...PDF_CONFIG.colors.black);
        this.doc.text(`${label}:`, xPosition, this.yPosition);

        // Valor (normal)
        this.doc.setFont(PDF_CONFIG.fonts.families.helvetica, 'normal');
        this.doc.text(String(value), xPosition + labelWidth, this.yPosition);

        this.yPosition += 15;
        return this;
    }

    // ========================================================================
    // MÉTODOS PÚBLICOS: CONTROL DE PÁGINA
    // ========================================================================

    /**
     * Agrega una nueva página al documento
     * @returns Instancia actual para encadenamiento
     */
    public addPage(): this {
        this.doc.addPage();
        this.yPosition = PDF_CONFIG.page.MARGIN;
        return this;
    }

    /**
     * Verifica si hay espacio suficiente en la página actual
     * @param requiredSpace - Espacio requerido en puntos
     * @returns true si hay espacio, false si no
     */
    public hasSpaceFor(requiredSpace: number): boolean {
        const footerSpace = this.hasFooter ? PDF_CONFIG.footer.height + 20 : 0;
        const availableSpace = PDF_CONFIG.page.HEIGHT - this.yPosition - footerSpace;
        return availableSpace >= requiredSpace;
    }

    /**
     * Agrega una nueva página si no hay espacio suficiente
     * @param requiredSpace - Espacio requerido
     * @returns Instancia actual para encadenamiento
     */
    public ensureSpace(requiredSpace: number): this {
        if (!this.hasSpaceFor(requiredSpace)) {
            this.addPage();
        }
        return this;
    }

    // ========================================================================
    // MÉTODOS PÚBLICOS: GETTERS
    // ========================================================================

    /**
     * Obtiene la instancia de jsPDF para acceso directo
     * @returns Instancia de jsPDF
     */
    public getDoc(): jsPDF {
        return this.doc;
    }

    /**
     * Obtiene la posición Y actual
     * @returns Posición Y en puntos
     */
    public getCurrentY(): number {
        return this.yPosition;
    }

    /**
     * Establece la posición Y actual
     * @param y - Nueva posición Y
     * @returns Instancia actual para encadenamiento
     */
    public setCurrentY(y: number): this {
        this.yPosition = y;
        return this;
    }

    // ========================================================================
    // MÉTODOS PÚBLICOS: GUARDADO Y EXPORTACIÓN
    // ========================================================================

    /**
     * Guarda el PDF con el nombre especificado
     * @param filename - Nombre del archivo (sin extensión .pdf)
     */
    public save(filename: string): void {
        // Agregar footer si no se ha agregado
        if (!this.hasFooter) {
            this.addFooter();
        }

        // Asegurar que el nombre termine en .pdf
        const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

        this.doc.save(finalFilename);
    }

    /**
     * Obtiene el PDF como blob para descarga o envío
     * @returns Blob del PDF
     */
    public getBlob(): Blob {
        // Agregar footer si no se ha agregado
        if (!this.hasFooter) {
            this.addFooter();
        }

        return this.doc.output('blob');
    }

    /**
     * Obtiene el PDF como data URL
     * @returns Data URL del PDF
     */
    public getDataUrl(): string {
        // Agregar footer si no se ha agregado
        if (!this.hasFooter) {
            this.addFooter();
        }

        return this.doc.output('dataurlstring');
    }

    /**
     * Abre el PDF en una nueva ventana del navegador
     */
    public preview(): void {
        // Agregar footer si no se ha agregado
        if (!this.hasFooter) {
            this.addFooter();
        }

        const blob = this.doc.output('blob');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    }
}

// Exportar tipo para TypeScript
export type PdfGenerator = BasePdfGenerator;
