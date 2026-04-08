/**
 * Generador de PDF: Listado de Asistencia de Participantes a Actividades
 *
 * Genera un listado imprimible de asistencia para una actividad con:
 * - Encabezado con datos de la actividad (Tipo, Categoría, Docente, Horarios)
 * - Tabla optimizada de participantes con fechas de clases futuras
 *   Columnas: # | Apellido y Nombre | DNI | 8 fechas de clases
 * - Fechas generadas automáticamente según los días de horarios de la actividad
 * - Bordes en toda la tabla para marcar asistencias fácilmente
 * - Apellido y Nombre con wrap automático si excede el ancho
 * - Footer con datos de la asociación
 *
 * Última actualización: 16/03/2026
 */

import { BasePdfGenerator } from '../BasePdfGenerator';
import { PDF_CONFIG } from '@/constants/pdfConfig';
import { formatDateLongES, formatTimeES } from '@/utils/dateHelpers';
import { Actividad, formatTime } from '@/types/actividad.types';
import { personasApi } from '@/services/personasApi';

/**
 * Participante enriquecido con DNI
 */
interface ParticipanteEnriquecido {
    id: number;
    personaId: number;
    nombre: string;
    apellido: string;
    dni: string;
    tipo: string;
    fechaInicio: string;
    activa: boolean;
}

/**
 * Opciones de configuración para el listado
 */
export interface ListadoAsistenciaOptions {
    /** Ordenar por apellido (default: true) */
    ordenarAlfabeticamente?: boolean;
    /** Mostrar solo participantes activos (default: true) */
    soloActivos?: boolean;
    /** Cantidad de fechas de clases a mostrar (default: 8, rango: 5-10) */
    cantidadFechas?: number;
    /** Nombre del tipo de actividad (override si backend no lo envía) */
    tipoActividadNombre?: string;
    /** Nombre de la categoría (override si backend no lo envía) */
    categoriaNombre?: string;
}

/**
 * Enriquece los participantes con datos completos incluyendo DNI
 *
 * @param actividad - Actividad con participantes
 * @returns Participantes enriquecidos con DNI
 */
const enriquecerParticipantesConDNI = async (
    actividad: Actividad
): Promise<ParticipanteEnriquecido[]> => {
    const participantes = actividad.participacion_actividades || [];

    if (participantes.length === 0) {
        return [];
    }

    // Obtener datos completos de cada participante en paralelo
    const promesas = participantes.map((p) =>
        personasApi.getById(p.personaId, false) // false = sin relaciones para optimizar
    );

    const resultados = await Promise.allSettled(promesas);

    // Mapear resultados con manejo de errores
    return participantes.map((p, index) => {
        const resultado = resultados[index];
        const personaCompleta = resultado.status === 'fulfilled' ? resultado.value.data : null;

        // Extraer el primer tipo activo del array tipos
        const tipoPersona = personaCompleta?.tipos?.find((t) => t.activo)?.tipoPersona?.codigo || 'N/D';

        return {
            id: p.id,
            personaId: p.personaId,
            nombre: p.personas?.nombre || 'Desconocido',
            apellido: p.personas?.apellido || 'Desconocido',
            dni: personaCompleta?.dni || 'N/D',
            tipo: tipoPersona, // Código del primer tipo activo (SOCIO, NO_SOCIO, etc.)
            fechaInicio: p.fechaInicio,
            activa: p.activa,
        };
    });
};

/**
 * Formatea el DNI con puntos (ej: 12.345.678)
 */
const formatearDNI = (dni: string): string => {
    if (!dni || dni === 'N/D') return dni;

    // Eliminar cualquier formato previo
    const dniLimpio = dni.replace(/\D/g, '');

    // Aplicar formato con puntos
    if (dniLimpio.length <= 6) return dniLimpio;
    if (dniLimpio.length <= 8) {
        return dniLimpio.replace(/(\d{1,2})(\d{3})(\d{3})/, '$1.$2.$3');
    }
    return dniLimpio.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3');
};

/**
 * Genera las próximas fechas de clases basadas en los horarios de la actividad
 *
 * @param actividad - Actividad con horarios activos
 * @param cantidadFechas - Cantidad de fechas a generar (default: 8)
 * @returns Array de fechas formateadas (DD/MM)
 */
const generarFechasDeClases = (actividad: Actividad, cantidadFechas: number = 8): string[] => {
    const fechas: string[] = [];
    const horarios = actividad.horarios_actividades?.filter((h) => h.activo) || [];

    if (horarios.length === 0) {
        // Si no hay horarios, retornar array vacío
        return [];
    }

    // Extraer los días de la semana de los horarios (1=Lunes, 7=Domingo)
    const diasSemanaIds = horarios.map((h) => h.diaSemanaId).sort((a, b) => a - b);

    // Función auxiliar para convertir ID de día semana (1-7) a getDay() (0-6)
    // Backend: 1=Lunes, 7=Domingo
    // JS getDay(): 0=Domingo, 1=Lunes, ..., 6=Sábado
    const idToJsDay = (id: number): number => {
        return id === 7 ? 0 : id; // 7 (Domingo) → 0, resto se mantiene igual
    };

    const diasSemanaJs = diasSemanaIds.map(idToJsDay);

    // Generar fechas futuras
    const hoy = new Date();
    let fechaActual = new Date(hoy);
    let fechasGeneradas = 0;

    // Buscar hasta 60 días en el futuro para encontrar las fechas de clases
    for (let i = 0; i < 60 && fechasGeneradas < cantidadFechas; i++) {
        const diaSemana = fechaActual.getDay();

        // Si este día está en los horarios de la actividad
        if (diasSemanaJs.includes(diaSemana)) {
            const dia = String(fechaActual.getDate()).padStart(2, '0');
            const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
            fechas.push(`${dia}/${mes}`);
            fechasGeneradas++;
        }

        // Avanzar al siguiente día
        fechaActual.setDate(fechaActual.getDate() + 1);
    }

    return fechas;
};

/**
 * Genera el PDF de Listado de Asistencia
 *
 * @param actividad - Actividad completa con participantes, horarios y docentes
 * @param options - Opciones de configuración
 */
export const generarListadoAsistenciaPdf = async (
    actividad: Actividad,
    options: ListadoAsistenciaOptions = {}
): Promise<void> => {
    // Configuración por defecto
    const {
        ordenarAlfabeticamente = true,
        soloActivos = true,
        cantidadFechas = 8,
        tipoActividadNombre,
        categoriaNombre,
    } = options;

    const pdf = new BasePdfGenerator();

    // ========================================================================
    // HEADER
    // ========================================================================

    const estadoLabel =
        actividad.estadosActividades?.nombre || (actividad.activa ? 'Activa' : 'Inactiva');
    const estadoColor = actividad.activa ? 'success' : 'error';

    // Obtener docente responsable
    const docenteResponsable = actividad.docentes_actividades?.find((d) => d.activo);
    const nombreDocente = docenteResponsable
        ? `${docenteResponsable.personas?.apellido}, ${docenteResponsable.personas?.nombre}`
        : 'Sin asignar';

    // Formatear horarios
    const horarios = actividad.horarios_actividades
        ?.filter((h) => h.activo)
        .map((h) => {
            const dia = h.diaSemana?.nombre || 'N/D';
            const inicio = formatTime(h.horaInicio);
            const fin = formatTime(h.horaFin);
            return `${dia} ${inicio}-${fin}`;
        })
        .join(' | ') || 'Sin horarios';

    pdf.addHeader({
        leftTitle: 'LISTADO DE ASISTENCIA',
        rightData: {
            number: `Actividad: ${actividad.codigoActividad}`,
            date: new Date(),
            status: {
                label: estadoLabel.toUpperCase(),
                color: estadoColor as 'success' | 'error',
            },
        },
    });

    // ========================================================================
    // TÍTULO: NOMBRE DE LA ACTIVIDAD
    // ========================================================================

    pdf.addTitleBox({
        title: actividad.nombre,
        backgroundColor: PDF_CONFIG.colors.primaryLight,
        textColor: PDF_CONFIG.colors.primary,
    });

    // ========================================================================
    // SECCIÓN: INFORMACIÓN DE LA ACTIVIDAD (CUSTOM LAYOUT)
    // ========================================================================

    // Preparar valores
    const tipoValue = tipoActividadNombre || actividad.tiposActividades?.nombre || 'N/D';
    const categoriaValue = categoriaNombre || actividad.categoriasActividades?.nombre || 'N/D';
    const inscriptos = actividad._count?.participacion_actividades || 0;
    const cupoValue = actividad.capacidadMaxima ? `${inscriptos} / ${actividad.capacidadMaxima}` : null;

    const doc = pdf.getDoc();
    let yPos = pdf.getCurrentY();

    // Título de la sección
    doc.setFontSize(PDF_CONFIG.section.titleFontSize);
    doc.setTextColor(...PDF_CONFIG.section.titleColor);
    doc.setFont(PDF_CONFIG.fonts.families.helvetica, PDF_CONFIG.fonts.styles.bold);
    doc.text('Información de la Actividad', PDF_CONFIG.page.MARGIN, yPos);
    yPos += PDF_CONFIG.section.marginBottom;

    const rowHeight = 24; // Altura de cada fila (label + valor)
    const anchoDisponible = PDF_CONFIG.content.width;

    // ========================================================================
    // FILA 1: Tipo, Estado, Categoría + Cupo (derecha)
    // ========================================================================

    doc.setFontSize(PDF_CONFIG.fonts.sizes.small);
    doc.setTextColor(...PDF_CONFIG.colors.black);

    const camposIzqFila1 = [
        { label: 'Tipo', value: tipoValue },
        { label: 'Estado', value: estadoLabel },
        { label: 'Categoría', value: categoriaValue },
    ];

    // Distribuir espacio uniformemente para los 3 campos de la izquierda
    const anchoColumnaIzq = anchoDisponible / camposIzqFila1.length;

    // Guardar la posición X de "Estado" para usarla en Fila 2
    const xEstado = PDF_CONFIG.page.MARGIN + anchoColumnaIzq;

    // Renderizar campos izquierdos
    camposIzqFila1.forEach((item, index) => {
        const x = PDF_CONFIG.page.MARGIN + (index * anchoColumnaIzq);

        // Label (negrita)
        doc.setFont(PDF_CONFIG.fonts.families.helvetica, PDF_CONFIG.fonts.styles.bold);
        doc.text(`${item.label}:`, x, yPos);

        // Valor (normal)
        doc.setFont(PDF_CONFIG.fonts.families.helvetica, PDF_CONFIG.fonts.styles.normal);
        doc.text(String(item.value), x, yPos + 12);
    });

    // Renderizar Cupo alineado a la derecha si existe
    if (cupoValue) {
        const xDerecha = PDF_CONFIG.page.WIDTH - PDF_CONFIG.page.MARGIN;

        // Label "Cupo:" alineado a la derecha (el ":" queda en el margen derecho)
        doc.setFont(PDF_CONFIG.fonts.families.helvetica, PDF_CONFIG.fonts.styles.bold);
        doc.text('Cupo:', xDerecha, yPos, { align: 'right' });

        // Valor alineado a la derecha abajo
        doc.setFont(PDF_CONFIG.fonts.families.helvetica, PDF_CONFIG.fonts.styles.normal);
        doc.text(cupoValue, xDerecha, yPos + 12, { align: 'right' });
    }

    yPos += rowHeight + 8; // +8pt de separación entre filas

    // ========================================================================
    // FILA 2: Docente a Cargo, Días y Horarios + Vigencia Desde (derecha)
    // ========================================================================

    const vigenciaDesdeValue = actividad.fechaDesde ? formatDateLongES(actividad.fechaDesde) : null;

    // Docente a Cargo (alineado con Tipo)
    const xDocenteACargo = PDF_CONFIG.page.MARGIN;

    doc.setFont(PDF_CONFIG.fonts.families.helvetica, PDF_CONFIG.fonts.styles.bold);
    doc.text('Docente a Cargo:', xDocenteACargo, yPos);

    doc.setFont(PDF_CONFIG.fonts.families.helvetica, PDF_CONFIG.fonts.styles.normal);
    doc.text(nombreDocente, xDocenteACargo, yPos + 12);

    // Días y Horarios (alineado con Estado de la fila superior)
    doc.setFont(PDF_CONFIG.fonts.families.helvetica, PDF_CONFIG.fonts.styles.bold);
    doc.text('Días y Horarios:', xEstado, yPos);

    doc.setFont(PDF_CONFIG.fonts.families.helvetica, PDF_CONFIG.fonts.styles.normal);
    doc.text(horarios, xEstado, yPos + 12);

    // Renderizar Vigencia Desde alineado a la derecha si existe
    if (vigenciaDesdeValue) {
        const xDerecha = PDF_CONFIG.page.WIDTH - PDF_CONFIG.page.MARGIN;

        // Label "Vigencia Desde:" alineado a la derecha (el ":" queda en el margen derecho)
        doc.setFont(PDF_CONFIG.fonts.families.helvetica, PDF_CONFIG.fonts.styles.bold);
        doc.text('Vigencia Desde:', xDerecha, yPos, { align: 'right' });

        // Valor alineado a la derecha abajo
        doc.setFont(PDF_CONFIG.fonts.families.helvetica, PDF_CONFIG.fonts.styles.normal);
        doc.text(vigenciaDesdeValue, xDerecha, yPos + 12, { align: 'right' });
    }

    yPos += rowHeight + PDF_CONFIG.section.marginTop;

    // Actualizar posición Y en el generador
    pdf.setCurrentY(yPos);

    // ========================================================================
    // ENRIQUECER PARTICIPANTES CON DNI
    // ========================================================================

    pdf.ensureSpace(100);
    pdf.addSpace(10);

    let participantes = await enriquecerParticipantesConDNI(actividad);

    // Filtrar solo activos si se solicita
    if (soloActivos) {
        participantes = participantes.filter((p) => p.activa);
    }

    // Ordenar alfabéticamente por apellido
    if (ordenarAlfabeticamente) {
        participantes.sort((a, b) => {
            const apellidoCompare = a.apellido.localeCompare(b.apellido, 'es-AR');
            if (apellidoCompare !== 0) return apellidoCompare;
            return a.nombre.localeCompare(b.nombre, 'es-AR');
        });
    }

    // ========================================================================
    // TABLA: PARTICIPANTES CON FECHAS DE CLASES
    // ========================================================================

    if (participantes.length === 0) {
        pdf.addParagraph('Sin participantes inscritos', {
            fontSize: PDF_CONFIG.fonts.sizes.body,
            fontStyle: 'italic',
            color: PDF_CONFIG.colors.grey[500],
        });
    } else {
        // Generar fechas de clases basadas en horarios de la actividad
        const fechasClases = generarFechasDeClases(actividad, cantidadFechas);

        // Headers de la tabla: # | Apellido y Nombre | DNI | Fechas...
        const headers = ['#', 'Apellido y Nombre', 'DNI', ...fechasClases];

        // Filas de la tabla
        const rows = participantes.map((p, index) => {
            const fila = [
                (index + 1).toString(),
                `${p.apellido}, ${p.nombre}`, // Unificar apellido y nombre
                formatearDNI(p.dni),
                // Agregar celdas vacías para cada fecha de clase
                ...fechasClases.map(() => ''),
            ];

            return fila;
        });

        // Configuración de estilos de columnas con distribución optimizada
        // Ancho total disponible: ~515pt (CONTENT_WIDTH)
        // Distribución ajustada para evitar wrap en fechas:
        //   - # : 18pt (reducido)
        //   - Apellido y Nombre: 120pt (con wrap si es muy largo)
        //   - DNI: 70pt (reducido)
        //   - Fechas: resto distribuido (mínimo 38pt por fecha para "DD/MM")
        const anchoNumero = 18;
        const anchoApellidoNombre = 120;
        const anchoDNI = 70;
        const anchoUsado = anchoNumero + anchoApellidoNombre + anchoDNI;
        const anchoDisponibleParaFechas = PDF_CONFIG.content.width - anchoUsado;
        const anchoPorFecha = fechasClases.length > 0
            ? Math.max(38, Math.floor(anchoDisponibleParaFechas / fechasClases.length))
            : 38;

        const columnStyles: Record<number, { cellWidth?: number | 'auto'; halign?: 'left' | 'center' | 'right' }> = {
            0: { cellWidth: anchoNumero, halign: 'center' }, // #
            1: { cellWidth: anchoApellidoNombre, halign: 'left' }, // Apellido y Nombre
            2: { cellWidth: anchoDNI, halign: 'center' }, // DNI
        };

        // Agregar estilos para las columnas de fechas (todas iguales)
        fechasClases.forEach((_, idx) => {
            columnStyles[3 + idx] = { cellWidth: anchoPorFecha, halign: 'center' };
        });

        // Estilos personalizados para esta tabla específica
        const customStyles = {
            theme: 'grid' as const,
            styles: {
                fontSize: 8, // Reducido de 9 a 8
                cellPadding: 4, // Reducido de 8 a 4 para comprimir espacios
                overflow: 'linebreak' as const,
                halign: 'left' as const,
                lineWidth: 1, // Aumentado de 0.5 a 1 para bordes más visibles
                lineColor: [100, 100, 100] as [number, number, number], // Gris más oscuro
            },
            headStyles: {
                fillColor: [250, 250, 250] as [number, number, number],
                textColor: [0, 0, 0] as [number, number, number],
                fontStyle: 'bold' as const,
                fontSize: 8, // Reducido de 9 a 8
                cellPadding: 4, // Reducido de 8 a 4
                lineWidth: 1,
                lineColor: [100, 100, 100] as [number, number, number],
                halign: 'center' as const,
            },
            bodyStyles: {
                textColor: [0, 0, 0] as [number, number, number],
                fontSize: 8, // Reducido de 9 a 8
                cellPadding: 4, // Reducido de 8 a 4
                lineWidth: 1,
                lineColor: [100, 100, 100] as [number, number, number],
            },
            alternateRowStyles: {
                fillColor: [250, 250, 250] as [number, number, number],
            },
        };

        pdf.addTable({
            title: `Participantes (${participantes.length})`,
            headers,
            rows,
            columnStyles,
            customStyles,
        });
    }

    // ========================================================================
    // NOTAS AL PIE
    // ========================================================================

    pdf.ensureSpace(80);
    pdf.addSpace(15);
    pdf.addDivider();
    pdf.addSpace(10);

    pdf.addParagraph('Notas:', {
        fontSize: PDF_CONFIG.fonts.sizes.small,
        fontStyle: 'bold',
        color: PDF_CONFIG.colors.grey[700],
    });

    pdf.addSpace(5);

    const notas = [
        '• Este listado debe ser completado en cada clase.',
        '• La asistencia es obligatoria para mantener la inscripción activa.',
        '• En caso de ausencia reiterada, notificar a la secretaría.',
        '• Conservar este documento como registro oficial de asistencias.',
    ];

    notas.forEach((nota) => {
        pdf.addParagraph(nota, {
            fontSize: PDF_CONFIG.fonts.sizes.caption,
            fontStyle: 'normal',
            color: PDF_CONFIG.colors.grey[700],
            maxWidth: PDF_CONFIG.content.width - 40,
        });
        pdf.addSpace(3);
    });

    // ========================================================================
    // GUARDAR PDF
    // ========================================================================

    const fechaEmision = formatDateLongES(new Date().toISOString()).replace(/\s/g, '-');
    const nombreActividad = actividad.nombre
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    const filename = `listado-asistencia-${nombreActividad}-${fechaEmision}`;

    pdf.save(filename);
};
