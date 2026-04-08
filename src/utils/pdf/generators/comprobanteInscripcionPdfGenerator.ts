/**
 * Generador de PDF: Comprobante de Inscripción a Actividad
 *
 * Genera un comprobante de inscripción a una actividad con:
 * - Datos del participante
 * - Información de la actividad
 * - Horarios y ubicación
 * - Docente asignado
 * - Costo y forma de pago
 * - Fecha de inscripción
 * - Términos y condiciones
 *
 * Fecha: 13/03/2026
 */

import { BasePdfGenerator } from '../BasePdfGenerator';
import { PDF_CONFIG } from '@/constants/pdfConfig';
import { formatDateES, formatDateLongES } from '@/utils/dateHelpers';
import { formatCurrency } from '../pdfHelpers';

/**
 * Datos de la inscripción
 */
export interface InscripcionData {
    /** ID de la inscripción */
    id: number;
    /** Fecha de inscripción */
    fechaInscripcion: Date | string;
    /** Participante */
    participante: {
        id: number;
        nombre: string;
        apellido: string;
        dni?: string;
        numeroSocio?: number;
        email?: string;
        telefono?: string;
    };
    /** Actividad */
    actividad: {
        id: number;
        nombre: string;
        descripcion?: string;
        categoria?: string;
        diaSemana?: string;
        horaInicio?: string;
        horaFin?: string;
        aula?: string;
        docente?: {
            nombre: string;
            apellido: string;
        };
        costoPorClase?: number;
    };
    /** Estado de la inscripción */
    estado?: 'activa' | 'pendiente' | 'cancelada';
    /** Observaciones */
    observaciones?: string;
}

/**
 * Genera el PDF de Comprobante de Inscripción
 *
 * @param inscripcion - Datos de la inscripción
 */
export const generarComprobanteInscripcionPdf = (inscripcion: InscripcionData): void => {
    const pdf = new BasePdfGenerator();

    // ========================================================================
    // HEADER
    // ========================================================================

    const estadoChip = inscripcion.estado === 'activa'
        ? { label: 'ACTIVA', color: 'success' as const }
        : inscripcion.estado === 'pendiente'
        ? { label: 'PENDIENTE', color: 'warning' as const }
        : { label: 'CANCELADA', color: 'error' as const };

    pdf.addHeader({
        leftTitle: 'COMPROBANTE DE INSCRIPCIÓN',
        rightData: {
            number: `N° ${inscripcion.id}`,
            date: inscripcion.fechaInscripcion,
            status: estadoChip,
        },
    });

    // ========================================================================
    // TÍTULO: ACTIVIDAD
    // ========================================================================

    pdf.addTitleBox({
        title: inscripcion.actividad.nombre,
        backgroundColor: PDF_CONFIG.colors.primaryLight,
        textColor: PDF_CONFIG.colors.primary,
    });

    // ========================================================================
    // SECCIÓN: DATOS DEL PARTICIPANTE
    // ========================================================================

    const datosParticipante: Array<{ label: string; value: string }> = [
        {
            label: 'Participante',
            value: `${inscripcion.participante.nombre} ${inscripcion.participante.apellido}`,
        },
    ];

    if (inscripcion.participante.dni) {
        datosParticipante.push({ label: 'DNI', value: inscripcion.participante.dni });
    }

    if (inscripcion.participante.numeroSocio) {
        datosParticipante.push({
            label: 'N° de Socio',
            value: inscripcion.participante.numeroSocio.toString(),
        });
    }

    if (inscripcion.participante.email) {
        datosParticipante.push({ label: 'Email', value: inscripcion.participante.email });
    }

    if (inscripcion.participante.telefono) {
        datosParticipante.push({ label: 'Teléfono', value: inscripcion.participante.telefono });
    }

    pdf.addSection({
        title: 'Datos del Participante',
        data: datosParticipante,
        columns: 2,
    });

    // ========================================================================
    // SECCIÓN: INFORMACIÓN DE LA ACTIVIDAD
    // ========================================================================

    pdf.ensureSpace(120);
    pdf.addSpace(10);

    const datosActividad: Array<{ label: string; value: string }> = [
        { label: 'Actividad', value: inscripcion.actividad.nombre },
    ];

    if (inscripcion.actividad.categoria) {
        datosActividad.push({ label: 'Categoría', value: inscripcion.actividad.categoria });
    }

    if (inscripcion.actividad.diaSemana) {
        datosActividad.push({ label: 'Día', value: inscripcion.actividad.diaSemana });
    }

    if (inscripcion.actividad.horaInicio && inscripcion.actividad.horaFin) {
        datosActividad.push({
            label: 'Horario',
            value: `${inscripcion.actividad.horaInicio} - ${inscripcion.actividad.horaFin}`,
        });
    }

    if (inscripcion.actividad.aula) {
        datosActividad.push({ label: 'Aula/Lugar', value: inscripcion.actividad.aula });
    }

    if (inscripcion.actividad.docente) {
        datosActividad.push({
            label: 'Docente',
            value: `${inscripcion.actividad.docente.apellido}, ${inscripcion.actividad.docente.nombre}`,
        });
    }

    pdf.addSection({
        title: 'Información de la Actividad',
        data: datosActividad,
        columns: 2,
    });

    // ========================================================================
    // DESCRIPCIÓN DE LA ACTIVIDAD
    // ========================================================================

    if (inscripcion.actividad.descripcion) {
        pdf.ensureSpace(80);
        pdf.addSpace(10);

        pdf.addParagraph('Descripción:', {
            fontSize: PDF_CONFIG.fonts.sizes.small,
            fontStyle: 'bold',
            color: PDF_CONFIG.colors.grey[700],
        });

        pdf.addSpace(5);

        pdf.addParagraph(inscripcion.actividad.descripcion, {
            fontSize: PDF_CONFIG.fonts.sizes.small,
            fontStyle: 'normal',
            color: PDF_CONFIG.colors.black,
        });
    }

    // ========================================================================
    // SECCIÓN: INFORMACIÓN DE COSTOS
    // ========================================================================

    if (inscripcion.actividad.costoPorClase !== undefined) {
        pdf.ensureSpace(80);
        pdf.addSpace(10);
        pdf.addDivider();
        pdf.addSpace(10);

        pdf.addKeyValue(
            'Costo por Clase',
            formatCurrency(inscripcion.actividad.costoPorClase),
            {
                fontSize: PDF_CONFIG.fonts.sizes.body,
                labelWidth: 150,
            }
        );

        pdf.addSpace(5);

        pdf.addParagraph(
            '* El costo se incluirá en la cuota mensual correspondiente.',
            {
                fontSize: PDF_CONFIG.fonts.sizes.caption,
                fontStyle: 'italic',
                color: PDF_CONFIG.colors.grey[500],
            }
        );
    }

    // ========================================================================
    // FECHA DE INSCRIPCIÓN
    // ========================================================================

    pdf.ensureSpace(60);
    pdf.addSpace(10);
    pdf.addDivider();
    pdf.addSpace(10);

    pdf.addKeyValue(
        'Fecha de Inscripción',
        formatDateLongES(
            typeof inscripcion.fechaInscripcion === 'string'
                ? inscripcion.fechaInscripcion
                : inscripcion.fechaInscripcion.toISOString()
        ),
        {
            fontSize: PDF_CONFIG.fonts.sizes.small,
            labelWidth: 150,
        }
    );

    // ========================================================================
    // OBSERVACIONES
    // ========================================================================

    if (inscripcion.observaciones) {
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

        pdf.addParagraph(inscripcion.observaciones, {
            fontSize: PDF_CONFIG.fonts.sizes.small,
            fontStyle: 'normal',
            color: PDF_CONFIG.colors.black,
        });
    }

    // ========================================================================
    // TÉRMINOS Y CONDICIONES
    // ========================================================================

    pdf.ensureSpace(150);
    pdf.addSpace(15);
    pdf.addDivider();
    pdf.addSpace(10);

    pdf.addParagraph('Términos y Condiciones:', {
        fontSize: PDF_CONFIG.fonts.sizes.small,
        fontStyle: 'bold',
        color: PDF_CONFIG.colors.grey[700],
    });

    pdf.addSpace(5);

    const terminos = [
        '• La asistencia a las clases es obligatoria para mantener la inscripción activa.',
        '• En caso de ausencia, se debe notificar con anticipación a la secretaría.',
        '• El costo de la actividad se incluye en la cuota mensual.',
        '• Para cancelar la inscripción, se debe notificar con 30 días de anticipación.',
        '• El participante debe cumplir con las normas de convivencia del establecimiento.',
        '• Se requiere presentar certificado médico de aptitud física para actividades deportivas.',
    ];

    terminos.forEach((termino) => {
        pdf.addParagraph(termino, {
            fontSize: PDF_CONFIG.fonts.sizes.caption,
            fontStyle: 'normal',
            color: PDF_CONFIG.colors.grey[700],
            maxWidth: PDF_CONFIG.content.width - 40,
        });
        pdf.addSpace(3);
    });

    // ========================================================================
    // FIRMAS
    // ========================================================================

    pdf.ensureSpace(100);
    pdf.addSpace(25);

    const participanteNombre = `${inscripcion.participante.nombre} ${inscripcion.participante.apellido}`;

    // Crear dos columnas para firmas
    const firmaY = pdf.getCurrentY();
    const leftX = PDF_CONFIG.page.MARGIN + 50;
    const rightX = PDF_CONFIG.page.WIDTH - PDF_CONFIG.page.MARGIN - 150;

    // Líneas de firma
    const lineaWidth = 120;
    pdf.getDoc().setDrawColor(...PDF_CONFIG.colors.grey[300]);
    pdf.getDoc().setLineWidth(0.5);

    // Firma participante (izquierda)
    pdf.getDoc().line(leftX, firmaY, leftX + lineaWidth, firmaY);
    pdf.getDoc().setFontSize(PDF_CONFIG.fonts.sizes.caption);
    pdf.getDoc().setTextColor(...PDF_CONFIG.colors.grey[700]);
    pdf.getDoc().setFont(PDF_CONFIG.fonts.families.helvetica, 'normal');
    pdf.getDoc().text('Firma del Participante', leftX + lineaWidth / 2, firmaY + 12, {
        align: 'center',
    });
    pdf.getDoc().text(participanteNombre, leftX + lineaWidth / 2, firmaY + 22, {
        align: 'center',
    });

    // Firma autoridad (derecha)
    pdf.getDoc().line(rightX, firmaY, rightX + lineaWidth, firmaY);
    pdf.getDoc().text('Firma y Sello', rightX + lineaWidth / 2, firmaY + 12, {
        align: 'center',
    });
    pdf.getDoc().text(PDF_CONFIG.company.name, rightX + lineaWidth / 2, firmaY + 22, {
        align: 'center',
    });

    pdf.setCurrentY(firmaY + 40);

    // ========================================================================
    // GUARDAR PDF
    // ========================================================================

    const fechaFormateada = formatDateES(inscripcion.fechaInscripcion).replace(/\//g, '-');
    const filename = `comprobante-inscripcion-${inscripcion.id}-${fechaFormateada}`;
    pdf.save(filename);
};
