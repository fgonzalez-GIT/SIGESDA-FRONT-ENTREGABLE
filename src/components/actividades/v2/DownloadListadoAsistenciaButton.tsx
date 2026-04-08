/**
 * Botón de Descarga de Listado de Asistencia
 *
 * Componente que permite descargar un PDF con el listado de asistencia
 * de participantes de una actividad.
 *
 * Características:
 * - Enriquecimiento automático de datos (DNI de participantes)
 * - Generación automática de 8 fechas de clases basadas en horarios
 * - Tabla optimizada: # | Apellido y Nombre | DNI | Fechas de clases
 * - Fallback a catálogos globales si Tipo/Categoría no vienen del backend
 * - Loading state durante la generación
 * - Manejo de errores con notificación al usuario
 *
 * Última actualización: 16/03/2026
 */

import React, { useState } from 'react';
import { Button, CircularProgress, Tooltip } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { generarListadoAsistenciaPdf } from '@/utils/pdf/generators/listadoAsistenciaPdfGenerator';
import { useCatalogosContext } from '@/providers/CatalogosProvider';
import type { Actividad } from '@/types/actividad.types';

/**
 * Props del componente
 */
export interface DownloadListadoAsistenciaButtonProps {
    /** Actividad completa con participantes, horarios y docentes */
    actividad: Actividad;
    /** Variante del botón (default: 'outlined') */
    variant?: 'text' | 'outlined' | 'contained';
    /** Tamaño del botón (default: 'medium') */
    size?: 'small' | 'medium' | 'large';
    /** Texto del botón (default: 'Listado de Asistencia') */
    label?: string;
    /** Mostrar solo icono en pantallas pequeñas (default: false) */
    iconOnly?: boolean;
    /** Callback al completar la generación */
    onSuccess?: () => void;
    /** Callback al ocurrir un error */
    onError?: (error: Error) => void;
}

/**
 * Componente de botón para descargar listado de asistencia
 */
export const DownloadListadoAsistenciaButton: React.FC<DownloadListadoAsistenciaButtonProps> = ({
    actividad,
    variant = 'outlined',
    size = 'medium',
    label = 'Listado de Asistencia',
    iconOnly = false,
    onSuccess,
    onError,
}) => {
    const [loading, setLoading] = useState(false);
    const { catalogos } = useCatalogosContext();

    /**
     * Handler para generar y descargar el PDF
     */
    const handleDownload = async () => {
        try {
            setLoading(true);

            // Obtener nombres de tipo y categoría (con fallback a catálogos si no vienen en la actividad)
            let tipoActividadNombre = actividad.tiposActividades?.nombre;
            let categoriaNombre = actividad.categoriasActividades?.nombre;

            // Si no vienen en la actividad, buscar en los catálogos globales
            if (!tipoActividadNombre && catalogos) {
                const tipo = catalogos.tiposActividades.find((t) => t.id === actividad.tipoActividadId);
                tipoActividadNombre = tipo?.nombre;
            }

            if (!categoriaNombre && catalogos) {
                const categoria = catalogos.categoriasActividades.find((c) => c.id === actividad.categoriaId);
                categoriaNombre = categoria?.nombre;
            }

            // Generar PDF (la función ya maneja el enriquecimiento de datos)
            await generarListadoAsistenciaPdf(actividad, {
                ordenarAlfabeticamente: true,
                soloActivos: true,
                cantidadFechas: 8,
                // Pasar nombres de tipo y categoría
                tipoActividadNombre,
                categoriaNombre,
            });

            // Notificar éxito
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error('Error al generar listado de asistencia:', error);

            // Notificar error
            if (onError && error instanceof Error) {
                onError(error);
            }
        } finally {
            setLoading(false);
        }
    };

    // Tooltip para explicar la funcionalidad
    const tooltipTitle = loading
        ? 'Generando PDF...'
        : 'Descargar listado de asistencia en formato PDF';

    return (
        <Tooltip title={tooltipTitle} arrow>
            <Button
                variant={variant}
                size={size}
                startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
                onClick={handleDownload}
                disabled={loading}
                sx={{
                    minWidth: iconOnly ? 'auto' : undefined,
                    '& .MuiButton-startIcon': {
                        marginRight: iconOnly ? 0 : undefined,
                    },
                }}
            >
                {!iconOnly && (loading ? 'Generando...' : label)}
            </Button>
        </Tooltip>
    );
};

export default DownloadListadoAsistenciaButton;
