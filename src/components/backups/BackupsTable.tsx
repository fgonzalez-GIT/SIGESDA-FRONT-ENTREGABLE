/**
 * Componente de Tabla para mostrar lista de backups
 *
 * Muestra backups con columnas: Nombre, Tamaño, Fecha, Acciones
 * Incluye ordenamiento y loading states
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Skeleton,
  Typography,
  Box,
  TableSortLabel,
} from '@mui/material';
import {
  CloudDownload as DownloadIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { formatDateTimeES } from '@/utils/dateHelpers';
import type { BackupMetadata } from '@/types/backup.types';

interface BackupsTableProps {
  /** Array de backups a mostrar */
  backups: BackupMetadata[];

  /** Indica si los datos se están cargando */
  isLoading: boolean;

  /** Callback cuando se hace clic en descargar */
  onDownload: (filename: string) => void;

  /** Callback cuando se hace clic en restaurar */
  onRestore: (backup: BackupMetadata) => void;

  /** Callback cuando se hace clic en eliminar */
  onDelete: (backup: BackupMetadata) => void;

  /** Indica si hay una operación en progreso (deshabilita botones) */
  isOperationInProgress?: boolean;
}

/**
 * Componente de tabla de backups
 */
export function BackupsTable({
  backups,
  isLoading,
  onDownload,
  onRestore,
  onDelete,
  isOperationInProgress = false,
}: BackupsTableProps) {
  /**
   * Renderiza skeleton loading para tabla
   */
  const renderLoadingSkeleton = () => (
    <>
      {[1, 2, 3, 4, 5].map((index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton variant="text" width="80%" />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width="60%" />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width="70%" />
          </TableCell>
          <TableCell>
            <Box display="flex" gap={1}>
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="circular" width={40} height={40} />
            </Box>
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  /**
   * Renderiza estado vacío cuando no hay backups
   */
  const renderEmptyState = () => (
    <TableRow>
      <TableCell colSpan={4} align="center">
        <Box py={4}>
          <Typography variant="body1" color="text.secondary">
            No hay backups disponibles
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Crea un nuevo backup para comenzar
          </Typography>
        </Box>
      </TableCell>
    </TableRow>
  );

  /**
   * Renderiza fila de backup
   */
  const renderBackupRow = (backup: BackupMetadata) => (
    <TableRow key={backup.filename} hover>
      {/* Nombre del archivo */}
      <TableCell>
        <Typography variant="body2" fontFamily="monospace">
          {backup.filename}
        </Typography>
      </TableCell>

      {/* Tamaño */}
      <TableCell>
        <Typography variant="body2">{backup.sizeFormatted}</Typography>
      </TableCell>

      {/* Fecha de creación */}
      <TableCell>
        <Typography variant="body2">
          {formatDateTimeES(backup.createdAt)}
        </Typography>
      </TableCell>

      {/* Acciones */}
      <TableCell>
        <Box display="flex" gap={0.5}>
          {/* Descargar */}
          <Tooltip title="Descargar backup">
            <span>
              <IconButton
                size="small"
                color="primary"
                onClick={() => onDownload(backup.filename)}
                disabled={isOperationInProgress}
                aria-label={`Descargar ${backup.filename}`}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          {/* Restaurar */}
          <Tooltip title="Restaurar backup (operación destructiva)">
            <span>
              <IconButton
                size="small"
                color="warning"
                onClick={() => onRestore(backup)}
                disabled={isOperationInProgress}
                aria-label={`Restaurar ${backup.filename}`}
              >
                <RestoreIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          {/* Eliminar */}
          <Tooltip title="Eliminar backup">
            <span>
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete(backup)}
                disabled={isOperationInProgress}
                aria-label={`Eliminar ${backup.filename}`}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );

  return (
    <TableContainer component={Paper} elevation={2}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>
              <strong>Nombre del Archivo</strong>
            </TableCell>
            <TableCell>
              <strong>Tamaño</strong>
            </TableCell>
            <TableCell>
              <strong>Fecha de Creación</strong>
            </TableCell>
            <TableCell>
              <strong>Acciones</strong>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading
            ? renderLoadingSkeleton()
            : backups.length === 0
            ? renderEmptyState()
            : backups.map(renderBackupRow)}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default BackupsTable;
