/**
 * Generador de PDF: Certificado de Socio
 *
 * Genera un certificado formal que acredita la condición de socio con:
 * - Diseño formal y oficial
 * - Datos del socio
 * - Número de socio
 * - Fecha de ingreso
 * - Categoría actual
 * - Estado (activo/inactivo)
 * - Validez del certificado
 * - Firma y sello
 *
 * Fecha: 13/03/2026
 */

import { BasePdfGenerator } from '../BasePdfGenerator';
import { PDF_CONFIG } from '@/constants/pdfConfig';
import { formatDateES, formatDateLongES } from '@/utils/dateHelpers';
import { capitalize } from '../pdfHelpers';

/**
 * Datos del socio para el certificado
 */
export interface SocioCertificadoData {
    /** ID del socio */
    id: number;
    /** Nombre */
    nombre: string;
    /** Apellido */
    apellido: string;
    /** DNI */
    dni?: string;
    /** Número de socio */
    numeroSocio: number;
    /** Fecha de ingreso */
    fechaIngreso: Date | string;
    /** Categoría actual */
    categoria?: {
        nombre: string;
        codigo: string;
    };
    /** Estado actual */
    activo: boolean;
    /** Observaciones adicionales */
    observaciones?: string;
}

/**
 * Opciones para el certificado
 */
export interface CertificadoOptions {
    /** Motivo del certificado (ej: "para presentar ante autoridades") */
    motivo?: string;
    /** Validez en días (default: 30) */
    validezDias?: number;
    /** Incluir sello de agua */
    incluirMarcaAgua?: boolean;
}

/**
 * Genera el PDF de Certificado de Socio
 *
 * @param socio - Datos del socio
 * @param options - Opciones del certificado
 */
export const generarCertificadoSocioPdf = (
    socio: SocioCertificadoData,
    options: CertificadoOptions = {}
): void => {
    const {
        motivo = 'para fines que estime convenientes',
        validezDias = 30,
        incluirMarcaAgua = true,
    } = options;

    const pdf = new BasePdfGenerator();

    // ========================================================================
    // HEADER (SIN LAYOUT 60/40, MÁS FORMAL)
    // ========================================================================

    const doc = pdf.getDoc();

    // Logo y nombre de la institución (centrado)
    doc.setFontSize(PDF_CONFIG.fonts.sizes.display);
    doc.setTextColor(...PDF_CONFIG.colors.primary);
    doc.setFont(PDF_CONFIG.fonts.families.helvetica, 'bold');
    doc.text(
        PDF_CONFIG.company.name,
        PDF_CONFIG.page.WIDTH / 2,
        PDF_CONFIG.page.MARGIN + 10,
        { align: 'center' }
    );

    // Nombre completo de la institución
    doc.setFontSize(PDF_CONFIG.fonts.sizes.body);
    doc.setTextColor(...PDF_CONFIG.colors.secondary);
    doc.setFont(PDF_CONFIG.fonts.families.helvetica, 'normal');
    doc.text(
        PDF_CONFIG.company.fullName,
        PDF_CONFIG.page.WIDTH / 2,
        PDF_CONFIG.page.MARGIN + 30,
        { align: 'center' }
    );

    // Línea decorativa
    doc.setDrawColor(...PDF_CONFIG.colors.primary);
    doc.setLineWidth(2);
    doc.line(
        PDF_CONFIG.page.MARGIN + 100,
        PDF_CONFIG.page.MARGIN + 45,
        PDF_CONFIG.page.WIDTH - PDF_CONFIG.page.MARGIN - 100,
        PDF_CONFIG.page.MARGIN + 45
    );

    let yPos = PDF_CONFIG.page.MARGIN + 70;

    // ========================================================================
    // TÍTULO: CERTIFICADO
    // ========================================================================

    doc.setFontSize(PDF_CONFIG.fonts.sizes.display + 4);
    doc.setTextColor(...PDF_CONFIG.colors.black);
    doc.setFont(PDF_CONFIG.fonts.families.helvetica, 'bold');
    doc.text('CERTIFICADO DE SOCIO', PDF_CONFIG.page.WIDTH / 2, yPos, { align: 'center' });

    yPos += 30;

    // Número de certificado (fecha + número de socio)
    const numeroCertificado = `${new Date().getFullYear()}-${socio.numeroSocio.toString().padStart(6, '0')}`;
    doc.setFontSize(PDF_CONFIG.fonts.sizes.small);
    doc.setTextColor(...PDF_CONFIG.colors.grey[500]);
    doc.setFont(PDF_CONFIG.fonts.families.helvetica, 'normal');
    doc.text(`Certificado N° ${numeroCertificado}`, PDF_CONFIG.page.WIDTH / 2, yPos, {
        align: 'center',
    });

    yPos += 40;

    // ========================================================================
    // CUERPO DEL CERTIFICADO
    // ========================================================================

    const margenTexto = PDF_CONFIG.page.MARGIN + 60;
    const anchoTexto = PDF_CONFIG.page.WIDTH - 2 * margenTexto;

    // Párrafo introductorio
    doc.setFontSize(PDF_CONFIG.fonts.sizes.body);
    doc.setTextColor(...PDF_CONFIG.colors.black);
    doc.setFont(PDF_CONFIG.fonts.families.helvetica, 'normal');

    const textoIntro = `El ${PDF_CONFIG.company.name} certifica que:`;
    doc.text(textoIntro, PDF_CONFIG.page.WIDTH / 2, yPos, { align: 'center' });

    yPos += 30;

    // Nombre del socio (destacado)
    doc.setFontSize(PDF_CONFIG.fonts.sizes.subtitle + 2);
    doc.setFont(PDF_CONFIG.fonts.families.helvetica, 'bold');
    doc.setTextColor(...PDF_CONFIG.colors.primary);
    const nombreCompleto = `${socio.nombre.toUpperCase()} ${socio.apellido.toUpperCase()}`;
    doc.text(nombreCompleto, PDF_CONFIG.page.WIDTH / 2, yPos, { align: 'center' });

    yPos += 25;

    // DNI
    doc.setFontSize(PDF_CONFIG.fonts.sizes.body);
    doc.setTextColor(...PDF_CONFIG.colors.black);
    doc.setFont(PDF_CONFIG.fonts.families.helvetica, 'normal');
    if (socio.dni) {
        doc.text(`DNI N° ${socio.dni}`, PDF_CONFIG.page.WIDTH / 2, yPos, { align: 'center' });
        yPos += 20;
    }

    // Texto principal
    yPos += 10;

    const textoPrincipal = [
        `Es socio ${socio.activo ? 'activo' : 'inactivo'} de esta institución bajo el número de socio`,
        `${socio.numeroSocio}, desde el ${formatDateLongES(socio.fechaIngreso)}.`,
        '',
    ];

    if (socio.categoria) {
        textoPrincipal.push(
            `Pertenece a la categoría: ${socio.categoria.nombre}.`
        );
        textoPrincipal.push('');
    }

    textoPrincipal.push(
        `Se extiende el presente certificado ${motivo}, a solicitud del interesado.`
    );

    doc.setFont(PDF_CONFIG.fonts.families.helvetica, 'normal');
    textoPrincipal.forEach((linea) => {
        const lines = doc.splitTextToSize(linea, anchoTexto);
        lines.forEach((line: string) => {
            doc.text(line, PDF_CONFIG.page.WIDTH / 2, yPos, { align: 'center' });
            yPos += 15;
        });
    });

    // ========================================================================
    // LUGAR Y FECHA DE EMISIÓN
    // ========================================================================

    yPos += 20;

    const fechaEmision = new Date();
    const lugarFecha = `${PDF_CONFIG.company.city}, ${formatDateLongES(fechaEmision.toISOString())}`;
    doc.text(lugarFecha, PDF_CONFIG.page.WIDTH / 2, yPos, { align: 'center' });

    // ========================================================================
    // VALIDEZ DEL CERTIFICADO
    // ========================================================================

    yPos += 30;

    const fechaVencimiento = new Date(fechaEmision);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + validezDias);

    doc.setFontSize(PDF_CONFIG.fonts.sizes.caption);
    doc.setTextColor(...PDF_CONFIG.colors.grey[500]);
    doc.setFont(PDF_CONFIG.fonts.families.helvetica, 'italic');
    doc.text(
        `Válido hasta: ${formatDateLongES(fechaVencimiento.toISOString())}`,
        PDF_CONFIG.page.WIDTH / 2,
        yPos,
        { align: 'center' }
    );

    // ========================================================================
    // FIRMA Y SELLO
    // ========================================================================

    yPos = PDF_CONFIG.page.HEIGHT - PDF_CONFIG.footer.bottomMargin - 120;

    // Área de firma
    const firmaWidth = 180;
    const firmaX = (PDF_CONFIG.page.WIDTH - firmaWidth) / 2;

    // Línea de firma
    doc.setDrawColor(...PDF_CONFIG.colors.grey[300]);
    doc.setLineWidth(0.5);
    doc.line(firmaX, yPos, firmaX + firmaWidth, yPos);

    // Texto bajo la firma
    doc.setFontSize(PDF_CONFIG.fonts.sizes.small);
    doc.setTextColor(...PDF_CONFIG.colors.black);
    doc.setFont(PDF_CONFIG.fonts.families.helvetica, 'normal');
    doc.text('Firma y Sello', firmaX + firmaWidth / 2, yPos + 12, { align: 'center' });

    doc.setFontSize(PDF_CONFIG.fonts.sizes.small);
    doc.setFont(PDF_CONFIG.fonts.families.helvetica, 'bold');
    doc.text(PDF_CONFIG.company.name, firmaX + firmaWidth / 2, yPos + 24, {
        align: 'center',
    });

    doc.setFont(PDF_CONFIG.fonts.families.helvetica, 'normal');
    doc.text('Secretaría', firmaX + firmaWidth / 2, yPos + 36, { align: 'center' });

    // ========================================================================
    // MARCA DE AGUA (OPCIONAL)
    // ========================================================================

    if (incluirMarcaAgua) {
        doc.setTextColor(...PDF_CONFIG.colors.grey[100]);
        doc.setFontSize(60);
        doc.setFont(PDF_CONFIG.fonts.families.helvetica, 'bold');

        // Rotar y agregar marca de agua
        const centerX = PDF_CONFIG.page.WIDTH / 2;
        const centerY = PDF_CONFIG.page.HEIGHT / 2;

        doc.saveGraphicsState();
        doc.setGState(new (doc as any).GState({ opacity: 0.1 }));

        // Texto en diagonal
        const angle = -45;
        const radians = (angle * Math.PI) / 180;

        doc.text(PDF_CONFIG.company.name, centerX, centerY, {
            align: 'center',
            angle: angle,
        });

        doc.restoreGraphicsState();
    }

    // ========================================================================
    // PIE DE PÁGINA CON INFORMACIÓN DE CONTACTO
    // ========================================================================

    const footerY = PDF_CONFIG.page.HEIGHT - PDF_CONFIG.footer.bottomMargin + 10;

    doc.setFontSize(PDF_CONFIG.fonts.sizes.caption);
    doc.setTextColor(...PDF_CONFIG.colors.grey[500]);
    doc.setFont(PDF_CONFIG.fonts.families.helvetica, 'normal');

    const contactInfo = [
        PDF_CONFIG.company.address,
        `Tel: ${PDF_CONFIG.company.phone} | Email: ${PDF_CONFIG.company.email}`,
    ];

    contactInfo.forEach((info, index) => {
        doc.text(info, PDF_CONFIG.page.WIDTH / 2, footerY + index * 10, { align: 'center' });
    });

    // ========================================================================
    // GUARDAR PDF
    // ========================================================================

    pdf.setCurrentY(yPos);

    const filename = `certificado-socio-${socio.numeroSocio}-${formatDateES(new Date()).replace(/\//g, '-')}`;
    pdf.save(filename);
};
