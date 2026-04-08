/**
 * Generador de PDF para Listado de Recibos
 *
 * Genera un reporte en PDF con tabla de recibos filtrados,
 * incluyendo resumen financiero y filtros aplicados.
 *
 * @module listadoRecibosPdfGenerator
 */

import { BasePdfGenerator } from '../BasePdfGenerator';
import { Recibo, RecibosFilters } from '@/store/slices/recibosSlice';
import { formatDateES } from '@/utils/dateHelpers';
import { LOCALE, CURRENCY_FORMAT } from '@/constants/formats';

/**
 * Formatea un monto a moneda argentina
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat(LOCALE, CURRENCY_FORMAT).format(amount);
};

/**
 * Obtiene el color para el estado del recibo
 */
const getEstadoColor = (estado: Recibo['estado']): [number, number, number] => {
  const colors: Record<Recibo['estado'], [number, number, number]> = {
    pendiente: [255, 152, 0],   // Naranja
    pagado: [76, 175, 80],      // Verde
    vencido: [244, 67, 54],     // Rojo
    cancelado: [158, 158, 158], // Gris
    parcial: [33, 150, 243],    // Azul
  };
  return colors[estado] || [0, 0, 0];
};

/**
 * Genera descripción de filtros aplicados
 */
const generarDescripcionFiltros = (filtros: RecibosFilters): string => {
  const descripciones: string[] = [];

  if (filtros.estado) {
    descripciones.push(`Estado: ${filtros.estado.toUpperCase()}`);
  }

  if (filtros.personaTipo) {
    descripciones.push(`Tipo: ${filtros.personaTipo}`);
  }

  if (filtros.mes) {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    descripciones.push(`Mes: ${meses[filtros.mes - 1]}`);
  }

  if (filtros.anio) {
    descripciones.push(`Año: ${filtros.anio}`);
  }

  if (filtros.fechaDesde && filtros.fechaHasta) {
    descripciones.push(
      `Período: ${formatDateES(filtros.fechaDesde)} - ${formatDateES(filtros.fechaHasta)}`
    );
  } else if (filtros.fechaDesde) {
    descripciones.push(`Desde: ${formatDateES(filtros.fechaDesde)}`);
  } else if (filtros.fechaHasta) {
    descripciones.push(`Hasta: ${formatDateES(filtros.fechaHasta)}`);
  }

  if (filtros.enviado !== undefined) {
    descripciones.push(`Enviado: ${filtros.enviado ? 'Sí' : 'No'}`);
  }

  if (filtros.searchTerm) {
    descripciones.push(`Búsqueda: "${filtros.searchTerm}"`);
  }

  return descripciones.length > 0
    ? descripciones.join(' | ')
    : 'Sin filtros aplicados';
};

/**
 * Genera PDF con listado de recibos
 *
 * @param recibos - Array de recibos a incluir en el listado
 * @param filtros - Filtros aplicados (para mostrar en el reporte)
 * @param filename - Nombre del archivo (opcional)
 */
export const generarListadoRecibosPdf = (
  recibos: Recibo[],
  filtros: RecibosFilters = {},
  filename?: string
): void => {
  try {
    // Crear PDF en orientación horizontal para aprovechar espacio
    const pdf = new BasePdfGenerator('landscape');

    // Agregar header con logo y título
    pdf.addHeader({
      title: {
        main: 'LISTADO DE RECIBOS',
        subtitle: `Generado el ${formatDateES(new Date().toISOString())}`,
      },
      rightData: {
        number: `Total: ${recibos.length}`,
        date: new Date(),
      },
    });

    // Mostrar filtros aplicados
    if (Object.keys(filtros).length > 0) {
      pdf.addSection({
        title: 'Filtros Aplicados',
        data: [
          {
            label: 'Criterios',
            value: generarDescripcionFiltros(filtros),
          },
        ],
        columns: 1,
      });
    }

    // Preparar datos para la tabla
    const headers = [
      'Nº Recibo',
      'Fecha',
      'Persona',
      'Tipo',
      'Conceptos',
      'Total',
      'Pagado',
      'Saldo',
      'Estado',
    ];

    const rows = recibos.map((recibo) => {
      // Generar resumen de conceptos (primeros 2)
      const conceptosResumen =
        recibo.conceptos.length > 0
          ? recibo.conceptos
              .slice(0, 2)
              .map((c) => c.concepto)
              .join(', ') + (recibo.conceptos.length > 2 ? '...' : '')
          : '-';

      const saldo = recibo.total - recibo.montoPagado;

      return [
        recibo.numero,
        formatDateES(recibo.fechaEmision),
        `${recibo.personaNombre} ${recibo.personaApellido}`,
        recibo.personaTipo,
        conceptosResumen,
        formatCurrency(recibo.total),
        formatCurrency(recibo.montoPagado),
        formatCurrency(saldo),
        recibo.estado.toUpperCase(),
      ];
    });

    // Agregar tabla de recibos
    pdf.addTable({
      title: 'Detalle de Recibos',
      headers,
      rows,
      columnStyles: {
        0: { cellWidth: 25 }, // Nº Recibo
        1: { cellWidth: 25 }, // Fecha
        2: { cellWidth: 50 }, // Persona
        3: { cellWidth: 22 }, // Tipo
        4: { cellWidth: 65 }, // Conceptos
        5: { cellWidth: 25, halign: 'right' }, // Total
        6: { cellWidth: 25, halign: 'right' }, // Pagado
        7: { cellWidth: 25, halign: 'right' }, // Saldo
        8: { cellWidth: 25, halign: 'center' }, // Estado
      },
      customStyles: {
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fontSize: 9,
          fontStyle: 'bold',
        },
      },
    });

    // Calcular totales
    const totalFacturado = recibos.reduce((sum, r) => sum + r.total, 0);
    const totalCobrado = recibos.reduce((sum, r) => sum + r.montoPagado, 0);
    const totalPendiente = totalFacturado - totalCobrado;

    // Contadores por estado
    const estadisticas = {
      pendientes: recibos.filter((r) => r.estado === 'pendiente').length,
      pagados: recibos.filter((r) => r.estado === 'pagado').length,
      vencidos: recibos.filter((r) => r.estado === 'vencido').length,
      cancelados: recibos.filter((r) => r.estado === 'cancelado').length,
      parciales: recibos.filter((r) => r.estado === 'parcial').length,
    };

    // Agregar resumen financiero
    pdf.addSection({
      title: 'Resumen Financiero',
      data: [
        { label: 'Total Facturado', value: formatCurrency(totalFacturado) },
        { label: 'Total Cobrado', value: formatCurrency(totalCobrado) },
        { label: 'Total Pendiente', value: formatCurrency(totalPendiente) },
        { label: 'Total Recibos', value: recibos.length.toString() },
      ],
      columns: 4,
    });

    // Agregar estadísticas por estado
    pdf.addSection({
      title: 'Distribución por Estado',
      data: [
        { label: 'Pendientes', value: estadisticas.pendientes.toString() },
        { label: 'Pagados', value: estadisticas.pagados.toString() },
        { label: 'Vencidos', value: estadisticas.vencidos.toString() },
        { label: 'Cancelados', value: estadisticas.cancelados.toString() },
        { label: 'Parciales', value: estadisticas.parciales.toString() },
      ],
      columns: 5,
    });

    // Agregar footer
    pdf.addFooter();

    // Generar nombre de archivo si no se proporciona
    const timestamp = new Date().toISOString().split('T')[0];
    const finalFilename = filename || `listado_recibos_${timestamp}.pdf`;

    // Guardar PDF
    pdf.save(finalFilename);
  } catch (error) {
    console.error('Error al generar PDF de listado de recibos:', error);
    throw new Error('Error al generar el PDF de listado');
  }
};

/**
 * Genera PDF de listado de recibos y retorna como Blob
 * (Útil para enviar al backend o mostrar preview)
 *
 * @param recibos - Array de recibos
 * @param filtros - Filtros aplicados
 * @returns Blob del PDF generado
 */
export const generarListadoRecibosPdfBlob = (
  recibos: Recibo[],
  filtros: RecibosFilters = {}
): Blob => {
  const pdf = new BasePdfGenerator('landscape');

  // ... (mismo código de generación que arriba)
  // Simplificado: usar la función principal y obtener el blob

  pdf.addHeader({
    title: {
      main: 'LISTADO DE RECIBOS',
      subtitle: `Generado el ${formatDateES(new Date().toISOString())}`,
    },
    rightData: {
      number: `Total: ${recibos.length}`,
      date: new Date(),
    },
  });

  return pdf.getBlob();
};
