/**
 * Generador de PDF: Dashboard de Cuotas
 *
 * Genera un reporte PDF del dashboard de cuotas mensuales con:
 * - Métricas generales (recaudación, pendiente, etc.)
 * - Distribución por categoría de socio
 * - Distribución por estado de pago
 * - Tendencias y proyecciones
 *
 * Fecha: 13/03/2026
 */

import { BasePdfGenerator } from '../BasePdfGenerator';
import { PDF_CONFIG } from '@/constants/pdfConfig';
import { formatCurrency, capitalize } from '../pdfHelpers';
import type { DashboardData } from '@/types/cuota.types';

/**
 * Genera el PDF del Dashboard de Cuotas
 *
 * @param data - Datos del dashboard
 */
export const generarDashboardCuotasPdf = (data: DashboardData): void => {
    const pdf = new BasePdfGenerator();

    // ========================================================================
    // HEADER
    // ========================================================================

    pdf.addHeader({
        leftTitle: 'DASHBOARD DE CUOTAS',
        rightData: {
            number: `${data.periodo.nombreMes} ${data.periodo.anio}`,
            date: new Date(),
        },
    });

    // ========================================================================
    // TÍTULO
    // ========================================================================

    pdf.addTitleBox({
        title: `Reporte de Cuotas - ${data.periodo.nombreMes} ${data.periodo.anio}`,
    });

    // ========================================================================
    // SECCIÓN: MÉTRICAS GENERALES
    // ========================================================================

    const metricas = data.metricas;

    pdf.addSection({
        title: 'Métricas Generales',
        data: [
            { label: 'Total Cuotas Generadas', value: metricas.totalCuotas },
            { label: 'Cuotas Pagadas', value: metricas.cuotasPagadas },
            { label: 'Cuotas Pendientes', value: metricas.cuotasPendientes },
            { label: 'Cuotas Vencidas', value: metricas.cuotasVencidas },
            { label: 'Total Recaudado', value: formatCurrency(metricas.totalRecaudado) },
            { label: 'Total Pendiente', value: formatCurrency(metricas.totalPendiente) },
        ],
        columns: 2,
    });

    // ========================================================================
    // SECCIÓN: DISTRIBUCIÓN POR CATEGORÍA
    // ========================================================================

    pdf.ensureSpace(150);
    pdf.addSpace(10);

    const categorias = data.distribucion.porCategoria;
    const categoriasHeaders = ['Categoría', 'Cantidad', 'Monto Total'];
    const categoriasRows = Object.entries(categorias).map(([categoria, datos]) => [
        capitalize(categoria),
        datos.cantidad.toString(),
        formatCurrency(datos.monto),
    ]);

    // Agregar fila de totales
    const totalCantidad = Object.values(categorias).reduce((sum, cat) => sum + cat.cantidad, 0);
    const totalMonto = Object.values(categorias).reduce((sum, cat) => sum + cat.monto, 0);
    categoriasRows.push(['TOTAL', totalCantidad.toString(), formatCurrency(totalMonto)]);

    pdf.addTable({
        title: 'Distribución por Categoría de Socio',
        headers: categoriasHeaders,
        rows: categoriasRows,
        columnStyles: {
            0: { cellWidth: 'auto', halign: 'left' },
            1: { cellWidth: 100, halign: 'center' },
            2: { cellWidth: 120, halign: 'right' },
        },
    });

    // ========================================================================
    // SECCIÓN: DISTRIBUCIÓN POR ESTADO
    // ========================================================================

    pdf.ensureSpace(150);
    pdf.addSpace(10);

    const estados = data.distribucion.porEstado;
    const estadosHeaders = ['Estado', 'Cantidad', 'Monto Total'];
    const estadosRows = Object.entries(estados).map(([estado, datos]) => [
        getEstadoLabel(estado),
        datos.cantidad.toString(),
        formatCurrency(datos.monto),
    ]);

    // Agregar fila de totales
    const totalEstadosCantidad = Object.values(estados).reduce((sum, est) => sum + est.cantidad, 0);
    const totalEstadosMonto = Object.values(estados).reduce((sum, est) => sum + est.monto, 0);
    estadosRows.push(['TOTAL', totalEstadosCantidad.toString(), formatCurrency(totalEstadosMonto)]);

    pdf.addTable({
        title: 'Distribución por Estado de Pago',
        headers: estadosHeaders,
        rows: estadosRows,
        columnStyles: {
            0: { cellWidth: 'auto', halign: 'left' },
            1: { cellWidth: 100, halign: 'center' },
            2: { cellWidth: 120, halign: 'right' },
        },
    });

    // ========================================================================
    // SECCIÓN: TENDENCIAS
    // ========================================================================

    if (data.tendencias) {
        pdf.ensureSpace(100);
        pdf.addSpace(10);
        pdf.addDivider();
        pdf.addSpace(10);

        const variacion = data.tendencias.variacionMesAnterior;
        const proyeccion = data.tendencias.proyeccionRecaudacion;

        pdf.addSection({
            title: 'Tendencias y Proyecciones',
            data: [
                {
                    label: 'Variación vs. Mes Anterior',
                    value: `${variacion >= 0 ? '+' : ''}${variacion.toFixed(2)}%`,
                },
                {
                    label: 'Proyección de Recaudación',
                    value: formatCurrency(proyeccion),
                },
            ],
            columns: 2,
        });
    }

    // ========================================================================
    // SECCIÓN: RESUMEN FINAL
    // ========================================================================

    pdf.ensureSpace(100);
    pdf.addSpace(10);
    pdf.addDivider();
    pdf.addSpace(10);

    const porcentajePago = metricas.totalCuotas > 0
        ? ((metricas.cuotasPagadas / metricas.totalCuotas) * 100).toFixed(2)
        : '0.00';

    const porcentajePendiente = metricas.totalCuotas > 0
        ? ((metricas.cuotasPendientes / metricas.totalCuotas) * 100).toFixed(2)
        : '0.00';

    pdf.addKeyValue('Tasa de Cobro', `${porcentajePago}%`, { fontSize: 11, labelWidth: 150 });
    pdf.addKeyValue('Tasa de Pendientes', `${porcentajePendiente}%`, { fontSize: 11, labelWidth: 150 });

    if (metricas.cuotasVencidas > 0) {
        const porcentajeVencido = ((metricas.cuotasVencidas / metricas.totalCuotas) * 100).toFixed(2);
        pdf.addKeyValue('Tasa de Vencimiento', `${porcentajeVencido}%`, {
            fontSize: 11,
            labelWidth: 150,
        });
    }

    // ========================================================================
    // GUARDAR PDF
    // ========================================================================

    const filename = `dashboard-cuotas-${data.periodo.anio}-${data.periodo.mes.toString().padStart(2, '0')}`;
    pdf.save(filename);
};

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Obtiene la etiqueta legible de un estado
 */
const getEstadoLabel = (estado: string): string => {
    const labels: Record<string, string> = {
        pendiente: 'Pendiente',
        pagado: 'Pagado',
        pagada: 'Pagada',
        vencido: 'Vencido',
        vencida: 'Vencida',
        parcial: 'Pago Parcial',
        cancelado: 'Cancelado',
        cancelada: 'Cancelada',
    };

    return labels[estado.toLowerCase()] || capitalize(estado);
};
