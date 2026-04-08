/**
 * Generador de PDF: Listado de Actividades
 *
 * Genera un PDF con el listado completo de actividades organizadas por:
 * - Vista general (todas las actividades)
 * - Agrupadas por categoría
 * - Agrupadas por día de la semana
 * - Horarios y ubicaciones
 * - Docentes asignados
 * - Información de inscripción
 *
 * Fecha: 13/03/2026
 */

import { BasePdfGenerator } from '../BasePdfGenerator';
import { PDF_CONFIG } from '@/constants/pdfConfig';
import { formatDateES } from '@/utils/dateHelpers';
import { formatCurrency, capitalize } from '../pdfHelpers';

/**
 * Tipo de actividad con información completa
 */
export interface ActividadListado {
    id: number;
    nombre: string;
    descripcion?: string;
    categoria?: {
        id: number;
        nombre: string;
        codigo: string;
    };
    diaSemana?: {
        id: number;
        nombre: string;
    };
    horaInicio?: string;
    horaFin?: string;
    aula?: {
        id: number;
        nombre: string;
        capacidad?: number;
    };
    docente?: {
        id: number;
        nombre: string;
        apellido: string;
    };
    cupoMaximo?: number;
    inscriptos?: number;
    costoPorClase?: number;
    activo?: boolean;
    observaciones?: string;
}

/**
 * Opciones para el listado de actividades
 */
export interface ListadoActividadesOptions {
    /** Agrupar por categoría */
    agruparPorCategoria?: boolean;
    /** Agrupar por día de la semana */
    agruparPorDia?: boolean;
    /** Incluir solo actividades activas */
    soloActivas?: boolean;
    /** Incluir descripción de actividades */
    incluirDescripcion?: boolean;
    /** Incluir información de inscripción */
    incluirInscripcion?: boolean;
    /** Título personalizado */
    titulo?: string;
}

/**
 * Genera el PDF de Listado de Actividades
 *
 * @param actividades - Array de actividades
 * @param options - Opciones de generación
 */
export const generarListadoActividadesPdf = (
    actividades: ActividadListado[],
    options: ListadoActividadesOptions = {}
): void => {
    const {
        agruparPorCategoria = false,
        agruparPorDia = false,
        soloActivas = false,
        incluirDescripcion = false,
        incluirInscripcion = true,
        titulo = 'Listado de Actividades',
    } = options;

    const pdf = new BasePdfGenerator();

    // Filtrar actividades si es necesario
    let actividadesFiltradas = [...actividades];
    if (soloActivas) {
        actividadesFiltradas = actividadesFiltradas.filter((a) => a.activo !== false);
    }

    // ========================================================================
    // HEADER
    // ========================================================================

    pdf.addHeader({
        leftTitle: 'ACTIVIDADES',
        rightData: {
            number: `Total: ${actividadesFiltradas.length}`,
            date: new Date(),
        },
    });

    // ========================================================================
    // TÍTULO
    // ========================================================================

    const subtitulo = soloActivas ? ' (Solo Activas)' : '';
    pdf.addTitleBox({
        title: `${titulo}${subtitulo}`,
    });

    // ========================================================================
    // ESTADÍSTICAS GENERALES
    // ========================================================================

    const estadisticas = calcularEstadisticas(actividadesFiltradas);

    pdf.addSection({
        title: 'Resumen General',
        data: [
            { label: 'Total de Actividades', value: estadisticas.total },
            { label: 'Actividades Activas', value: estadisticas.activas },
            { label: 'Total de Inscriptos', value: estadisticas.totalInscriptos },
            { label: 'Capacidad Total', value: estadisticas.capacidadTotal },
            { label: 'Ocupación Promedio', value: `${estadisticas.ocupacionPromedio}%` },
        ],
        columns: 3,
    });

    // ========================================================================
    // LISTADO DE ACTIVIDADES
    // ========================================================================

    if (agruparPorCategoria) {
        generarListadoPorCategoria(pdf, actividadesFiltradas, incluirDescripcion, incluirInscripcion);
    } else if (agruparPorDia) {
        generarListadoPorDia(pdf, actividadesFiltradas, incluirDescripcion, incluirInscripcion);
    } else {
        generarListadoGeneral(pdf, actividadesFiltradas, incluirDescripcion, incluirInscripcion);
    }

    // ========================================================================
    // GUARDAR PDF
    // ========================================================================

    const fechaActual = formatDateES(new Date()).replace(/\//g, '-');
    const filename = `listado-actividades-${fechaActual}`;
    pdf.save(filename);
};

// ============================================================================
// FUNCIONES DE GENERACIÓN DE LISTADOS
// ============================================================================

/**
 * Genera listado general (sin agrupación)
 */
const generarListadoGeneral = (
    pdf: BasePdfGenerator,
    actividades: ActividadListado[],
    incluirDescripcion: boolean,
    incluirInscripcion: boolean
): void => {
    pdf.ensureSpace(150);
    pdf.addSpace(10);

    const headers = ['Actividad', 'Día', 'Horario', 'Aula', 'Docente'];
    if (incluirInscripcion) {
        headers.push('Inscriptos');
    }

    const rows = actividades.map((act) => {
        const row = [
            act.nombre || '-',
            act.diaSemana?.nombre || '-',
            formatearHorario(act.horaInicio, act.horaFin),
            act.aula?.nombre || '-',
            act.docente ? `${act.docente.apellido}, ${act.docente.nombre}` : '-',
        ];

        if (incluirInscripcion) {
            const inscriptos = act.inscriptos || 0;
            const cupo = act.cupoMaximo || 0;
            row.push(cupo > 0 ? `${inscriptos}/${cupo}` : inscriptos.toString());
        }

        return row;
    });

    const columnStyles: any = {
        0: { cellWidth: 'auto', halign: 'left' },
        1: { cellWidth: 70, halign: 'center' },
        2: { cellWidth: 90, halign: 'center' },
        3: { cellWidth: 80, halign: 'left' },
        4: { cellWidth: 'auto', halign: 'left' },
    };

    if (incluirInscripcion) {
        columnStyles[5] = { cellWidth: 70, halign: 'center' };
    }

    pdf.addTable({
        title: 'Todas las Actividades',
        headers,
        rows,
        columnStyles,
    });
};

/**
 * Genera listado agrupado por categoría
 */
const generarListadoPorCategoria = (
    pdf: BasePdfGenerator,
    actividades: ActividadListado[],
    incluirDescripcion: boolean,
    incluirInscripcion: boolean
): void => {
    // Agrupar actividades por categoría
    const porCategoria = new Map<string, ActividadListado[]>();

    actividades.forEach((act) => {
        const categoriaNombre = act.categoria?.nombre || 'Sin Categoría';
        if (!porCategoria.has(categoriaNombre)) {
            porCategoria.set(categoriaNombre, []);
        }
        porCategoria.get(categoriaNombre)!.push(act);
    });

    // Ordenar categorías alfabéticamente
    const categoriasOrdenadas = Array.from(porCategoria.keys()).sort();

    categoriasOrdenadas.forEach((categoria, index) => {
        if (index > 0) {
            pdf.ensureSpace(150);
            pdf.addSpace(15);
        }

        const actividadesCategoria = porCategoria.get(categoria)!;

        const headers = ['Actividad', 'Día', 'Horario', 'Aula', 'Docente'];
        if (incluirInscripcion) {
            headers.push('Inscriptos');
        }

        const rows = actividadesCategoria.map((act) => {
            const row = [
                act.nombre || '-',
                act.diaSemana?.nombre || '-',
                formatearHorario(act.horaInicio, act.horaFin),
                act.aula?.nombre || '-',
                act.docente ? `${act.docente.apellido}, ${act.docente.nombre}` : '-',
            ];

            if (incluirInscripcion) {
                const inscriptos = act.inscriptos || 0;
                const cupo = act.cupoMaximo || 0;
                row.push(cupo > 0 ? `${inscriptos}/${cupo}` : inscriptos.toString());
            }

            return row;
        });

        const columnStyles: any = {
            0: { cellWidth: 'auto', halign: 'left' },
            1: { cellWidth: 70, halign: 'center' },
            2: { cellWidth: 90, halign: 'center' },
            3: { cellWidth: 80, halign: 'left' },
            4: { cellWidth: 'auto', halign: 'left' },
        };

        if (incluirInscripcion) {
            columnStyles[5] = { cellWidth: 70, halign: 'center' };
        }

        pdf.addTable({
            title: `${categoria} (${actividadesCategoria.length} actividades)`,
            headers,
            rows,
            columnStyles,
        });
    });
};

/**
 * Genera listado agrupado por día de la semana
 */
const generarListadoPorDia = (
    pdf: BasePdfGenerator,
    actividades: ActividadListado[],
    incluirDescripcion: boolean,
    incluirInscripcion: boolean
): void => {
    // Agrupar actividades por día
    const porDia = new Map<string, ActividadListado[]>();

    actividades.forEach((act) => {
        const diaNombre = act.diaSemana?.nombre || 'Sin Día Asignado';
        if (!porDia.has(diaNombre)) {
            porDia.set(diaNombre, []);
        }
        porDia.get(diaNombre)!.push(act);
    });

    // Ordenar días según orden lógico
    const ordenDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo', 'Sin Día Asignado'];
    const diasOrdenados = ordenDias.filter((dia) => porDia.has(dia));

    diasOrdenados.forEach((dia, index) => {
        if (index > 0) {
            pdf.ensureSpace(150);
            pdf.addSpace(15);
        }

        const actividadesDia = porDia.get(dia)!;

        // Ordenar por hora de inicio
        actividadesDia.sort((a, b) => {
            const horaA = a.horaInicio || '00:00';
            const horaB = b.horaInicio || '00:00';
            return horaA.localeCompare(horaB);
        });

        const headers = ['Hora', 'Actividad', 'Aula', 'Docente'];
        if (incluirInscripcion) {
            headers.push('Inscriptos');
        }

        const rows = actividadesDia.map((act) => {
            const row = [
                formatearHorario(act.horaInicio, act.horaFin),
                act.nombre || '-',
                act.aula?.nombre || '-',
                act.docente ? `${act.docente.apellido}, ${act.docente.nombre}` : '-',
            ];

            if (incluirInscripcion) {
                const inscriptos = act.inscriptos || 0;
                const cupo = act.cupoMaximo || 0;
                row.push(cupo > 0 ? `${inscriptos}/${cupo}` : inscriptos.toString());
            }

            return row;
        });

        const columnStyles: any = {
            0: { cellWidth: 90, halign: 'center' },
            1: { cellWidth: 'auto', halign: 'left' },
            2: { cellWidth: 80, halign: 'left' },
            3: { cellWidth: 'auto', halign: 'left' },
        };

        if (incluirInscripcion) {
            columnStyles[4] = { cellWidth: 70, halign: 'center' };
        }

        pdf.addTable({
            title: `${dia} (${actividadesDia.length} actividades)`,
            headers,
            rows,
            columnStyles,
        });
    });
};

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Formatea horario de inicio y fin
 */
const formatearHorario = (inicio?: string, fin?: string): string => {
    if (!inicio && !fin) return '-';
    if (!fin) return inicio || '-';
    if (!inicio) return fin;
    return `${inicio} - ${fin}`;
};

/**
 * Calcula estadísticas generales
 */
const calcularEstadisticas = (actividades: ActividadListado[]) => {
    const total = actividades.length;
    const activas = actividades.filter((a) => a.activo !== false).length;
    const totalInscriptos = actividades.reduce((sum, a) => sum + (a.inscriptos || 0), 0);
    const capacidadTotal = actividades.reduce((sum, a) => sum + (a.cupoMaximo || 0), 0);

    const ocupacionPromedio = capacidadTotal > 0
        ? Math.round((totalInscriptos / capacidadTotal) * 100)
        : 0;

    return {
        total,
        activas,
        totalInscriptos,
        capacidadTotal,
        ocupacionPromedio,
    };
};
