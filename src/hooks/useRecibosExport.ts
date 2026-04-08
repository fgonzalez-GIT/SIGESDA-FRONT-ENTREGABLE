import { useState, useCallback } from 'react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { recibosService } from '@/services/recibosService';
import { Recibo, RecibosFilters } from '@/store/slices/recibosSlice';
import { ExportProgressState } from '@/components/Recibos/ExportProgressDialog';
import { ExportFormat } from '@/components/Recibos/ExportMenuButton';
import { generarListadoRecibosPdf } from '@/utils/pdf/generators/listadoRecibosPdfGenerator';
import { generarReciboPdfBlob } from '@/utils/pdf/generators/recibosPdfGenerator';

interface UseRecibosExportReturn {
  progress: ExportProgressState;
  exportToCSV: (filtros: RecibosFilters) => Promise<void>;
  exportToExcel: (filtros: RecibosFilters) => Promise<void>;
  exportToPdfListado: (recibos: Recibo[], filtros: RecibosFilters) => Promise<void>;
  exportToPdfZip: (recibos: Recibo[], filtros: RecibosFilters) => Promise<void>;
  resetProgress: () => void;
}

const initialProgress: ExportProgressState = {
  open: false,
  format: '',
  progress: 0,
  total: 0,
  message: '',
  status: 'processing',
};

export const useRecibosExport = (): UseRecibosExportReturn => {
  const [progress, setProgress] = useState<ExportProgressState>(initialProgress);

  const resetProgress = useCallback(() => {
    setProgress(initialProgress);
  }, []);

  const updateProgress = useCallback((updates: Partial<ExportProgressState>) => {
    setProgress((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Exportar a CSV usando endpoint backend
   */
  const exportToCSV = useCallback(async (filtros: RecibosFilters) => {
    try {
      setProgress({
        open: true,
        format: 'csv',
        progress: 0,
        total: 0,
        message: 'Preparando exportación a CSV...',
        status: 'processing',
      });

      const blob = await recibosService.exportarRecibos(filtros, 'csv');

      updateProgress({
        message: 'Descargando archivo CSV...',
      });

      // Generar nombre de archivo con timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `recibos_${timestamp}.csv`;

      saveAs(blob, filename);

      setProgress({
        open: true,
        format: 'csv',
        progress: 1,
        total: 1,
        message: `Archivo ${filename} descargado exitosamente`,
        status: 'success',
      });
    } catch (error: any) {
      console.error('Error al exportar CSV:', error);
      setProgress({
        open: true,
        format: 'csv',
        progress: 0,
        total: 0,
        message: 'Error al exportar a CSV',
        status: 'error',
        error: error?.response?.data?.message || error.message || 'Error desconocido',
      });
    }
  }, [updateProgress]);

  /**
   * Exportar a Excel usando endpoint backend
   */
  const exportToExcel = useCallback(async (filtros: RecibosFilters) => {
    try {
      setProgress({
        open: true,
        format: 'excel',
        progress: 0,
        total: 0,
        message: 'Preparando exportación a Excel...',
        status: 'processing',
      });

      const blob = await recibosService.exportarRecibos(filtros, 'excel');

      updateProgress({
        message: 'Descargando archivo Excel...',
      });

      // Generar nombre de archivo con timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `recibos_${timestamp}.xlsx`;

      saveAs(blob, filename);

      setProgress({
        open: true,
        format: 'excel',
        progress: 1,
        total: 1,
        message: `Archivo ${filename} descargado exitosamente`,
        status: 'success',
      });
    } catch (error: any) {
      console.error('Error al exportar Excel:', error);
      setProgress({
        open: true,
        format: 'excel',
        progress: 0,
        total: 0,
        message: 'Error al exportar a Excel',
        status: 'error',
        error: error?.response?.data?.message || error.message || 'Error desconocido',
      });
    }
  }, [updateProgress]);

  /**
   * Exportar a PDF Listado usando generador local
   */
  const exportToPdfListado = useCallback(async (recibos: Recibo[], filtros: RecibosFilters) => {
    try {
      setProgress({
        open: true,
        format: 'pdf-listado',
        progress: 0,
        total: recibos.length,
        message: 'Generando reporte PDF...',
        status: 'processing',
      });

      // Limitar a 500 recibos para evitar PDFs muy grandes
      if (recibos.length > 500) {
        setProgress({
          open: true,
          format: 'pdf-listado',
          progress: 0,
          total: 0,
          message: 'Demasiados recibos',
          status: 'error',
          error: `Se encontraron ${recibos.length} recibos. El límite es 500. Por favor, aplique filtros más específicos.`,
        });
        return;
      }

      updateProgress({
        progress: Math.floor(recibos.length * 0.5),
        message: 'Procesando datos...',
      });

      // Generar nombre de archivo con timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `listado_recibos_${timestamp}.pdf`;

      // Generar PDF usando generador local
      generarListadoRecibosPdf(recibos, filtros, filename);

      setProgress({
        open: true,
        format: 'pdf-listado',
        progress: recibos.length,
        total: recibos.length,
        message: `Archivo ${filename} generado exitosamente`,
        status: 'success',
      });
    } catch (error: any) {
      console.error('Error al exportar PDF listado:', error);
      setProgress({
        open: true,
        format: 'pdf-listado',
        progress: 0,
        total: 0,
        message: 'Error al generar PDF listado',
        status: 'error',
        error: error?.message || 'Error desconocido',
      });
    }
  }, [updateProgress]);

  /**
   * Exportar PDFs individuales empaquetados en ZIP
   *
   * Los PDFs se generan LOCALMENTE usando generarReciboPdfBlob() del frontend.
   * Anteriormente usaba recibosService.getPdfBlob() que obtenía PDFs del backend,
   * pero este tenía bugs (ej: "Subtotal: $undefined") y diseño inconsistente.
   *
   * Características:
   * - Genera PDFs en lotes de 5 (paralelización)
   * - Límite: 200 recibos máximo
   * - Muestra progreso en tiempo real
   * - Descarga automática del archivo ZIP
   *
   * @see generarReciboPdfBlob() en src/utils/pdf/generators/recibosPdfGenerator.ts
   * @param recibos - Array de recibos a exportar
   * @param filtros - Filtros aplicados (no se usa actualmente, para futura referencia)
   */
  const exportToPdfZip = useCallback(async (recibos: Recibo[], filtros: RecibosFilters) => {
    try {
      const total = recibos.length;

      if (total === 0) {
        setProgress({
          open: true,
          format: 'pdf-zip',
          progress: 0,
          total: 0,
          message: 'No hay recibos para exportar',
          status: 'error',
          error: 'No se encontraron recibos con los filtros aplicados',
        });
        return;
      }

      // Limitar a 200 recibos para evitar problemas de memoria
      if (total > 200) {
        setProgress({
          open: true,
          format: 'pdf-zip',
          progress: 0,
          total: 0,
          message: 'Demasiados recibos',
          status: 'error',
          error: `Se encontraron ${total} recibos. El límite es 200. Por favor, aplique filtros más específicos.`,
        });
        return;
      }

      setProgress({
        open: true,
        format: 'pdf-zip',
        progress: 0,
        total,
        message: 'Iniciando generación de PDFs individuales...',
        status: 'processing',
      });

      const zip = new JSZip();
      const batchSize = 5; // Procesar 5 PDFs a la vez
      let processed = 0;

      // Procesar en lotes
      for (let i = 0; i < recibos.length; i += batchSize) {
        const batch = recibos.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (recibo) => {
            try {
              // ========================================================================
              // GENERACIÓN LOCAL DE PDF (Actualizado 2026-03-20)
              // ========================================================================
              // Usar generador local del frontend en lugar del backend (getPdfBlob)
              // Razones del cambio:
              //   1. Bug corregido: Backend mostraba "Subtotal: $undefined"
              //   2. Consistencia: Mismo diseño profesional que el modal de detalle
              //   3. Performance: Generación instantánea sin llamadas HTTP
              //   4. Offline: Funciona sin dependencia del backend
              // Ver: src/utils/pdf/generators/recibosPdfGenerator.ts
              // ========================================================================
              const blob = generarReciboPdfBlob(recibo);

              // Generar nombre de archivo único
              const filename = `recibo_${recibo.numero}_${recibo.personaNombre}_${recibo.personaApellido}.pdf`
                .replace(/\s+/g, '_')
                .replace(/[^a-zA-Z0-9_.-]/g, '');

              // Agregar al ZIP
              zip.file(filename, blob);

              processed++;
              updateProgress({
                progress: processed,
                message: `Procesando recibo ${processed} de ${total}: ${recibo.numero}`,
              });
            } catch (error) {
              console.error(`Error al procesar recibo ${recibo.numero}:`, error);
              // Continuar con los demás aunque uno falle
            }
          })
        );
      }

      updateProgress({
        message: 'Empaquetando archivos en ZIP...',
      });

      // Generar ZIP
      const zipBlob = await zip.generateAsync(
        { type: 'blob' },
        (metadata) => {
          updateProgress({
            message: `Comprimiendo: ${Math.round(metadata.percent)}%`,
          });
        }
      );

      // Descargar ZIP
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `recibos_individuales_${timestamp}.zip`;

      saveAs(zipBlob, filename);

      setProgress({
        open: true,
        format: 'pdf-zip',
        progress: processed,
        total,
        message: `${processed} de ${total} recibos empaquetados exitosamente en ${filename}`,
        status: 'success',
      });
    } catch (error: any) {
      console.error('Error al exportar PDFs en ZIP:', error);
      setProgress({
        open: true,
        format: 'pdf-zip',
        progress: 0,
        total: recibos.length,
        message: 'Error al generar ZIP de PDFs',
        status: 'error',
        error: error?.message || 'Error desconocido',
      });
    }
  }, [updateProgress]);

  return {
    progress,
    exportToCSV,
    exportToExcel,
    exportToPdfListado,
    exportToPdfZip,
    resetProgress,
  };
};
