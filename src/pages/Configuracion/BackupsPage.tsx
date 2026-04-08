/**
 * Página principal del Sistema de Backups
 *
 * Permite a los administradores:
 * - Listar backups existentes
 * - Crear nuevos backups
 * - Descargar backups
 * - Restaurar backups (operación destructiva)
 * - Eliminar backups
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Backup as BackupIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useBackups, useBackupActions } from '@/hooks/useBackups';
import { BackupsTable } from '@/components/backups/BackupsTable';
import { CreateBackupDialog } from '@/components/backups/CreateBackupDialog';
import { RestoreConfirmDialog } from '@/components/backups/RestoreConfirmDialog';
import { ImportBackupDialog } from '@/components/backups/ImportBackupDialog';
import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog';
import { useAppDispatch } from '@/hooks/redux';
import { showNotification } from '@/store/slices/uiSlice';
import type { BackupMetadata } from '@/types/backup.types';

/**
 * Página de Gestión de Backups
 */
export function BackupsPage() {
  const dispatch = useAppDispatch();

  // Hooks para datos y acciones
  const { backups, isLoading, error: listError, meta, refresh } = useBackups({
    limit: 50,
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const {
    createBackup,
    downloadBackup,
    restoreBackup,
    restoreBackupFromFile,
    deleteBackup,
    isCreating,
    isDownloading,
    isRestoring,
    isDeleting,
    error: actionError,
  } = useBackupActions();

  // Estados locales para diálogos
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupMetadata | null>(
    null
  );

  /**
   * Maneja la creación de un nuevo backup
   */
  const handleCreateBackup = async () => {
    const result = await createBackup();

    if (result) {
      dispatch(
        showNotification({
          message: `Backup creado exitosamente: ${result.filename} (${result.size})`,
          severity: 'success',
        })
      );
      setShowCreateDialog(false);
      await refresh(); // Refrescar lista
    } else if (actionError) {
      dispatch(
        showNotification({
          message: `Error creando backup: ${actionError}`,
          severity: 'error',
        })
      );
    }
  };

  /**
   * Maneja la descarga de un backup
   */
  const handleDownloadBackup = async (filename: string) => {
    const success = await downloadBackup(filename);

    if (success) {
      dispatch(
        showNotification({
          message: `Backup descargado: ${filename}`,
          severity: 'success',
        })
      );
    } else if (actionError) {
      dispatch(
        showNotification({
          message: `Error descargando backup: ${actionError}`,
          severity: 'error',
        })
      );
    }
  };

  /**
   * Abre el diálogo de confirmación para restaurar
   */
  const handleRestoreClick = (backup: BackupMetadata) => {
    setSelectedBackup(backup);
    setShowRestoreDialog(true);
  };

  /**
   * Maneja la restauración de un backup
   */
  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    const success = await restoreBackup(selectedBackup.filename);

    if (success) {
      dispatch(
        showNotification({
          message: `Base de datos restaurada exitosamente desde: ${selectedBackup.filename}`,
          severity: 'success',
        })
      );
      setShowRestoreDialog(false);
      setSelectedBackup(null);

      // Opcional: Recargar la aplicación después de restore
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else if (actionError) {
      dispatch(
        showNotification({
          message: `Error restaurando backup: ${actionError}`,
          severity: 'error',
        })
      );
      setShowRestoreDialog(false);
    }
  };

  /**
   * Abre el diálogo de confirmación para eliminar
   */
  const handleDeleteClick = (backup: BackupMetadata) => {
    setSelectedBackup(backup);
    setShowDeleteDialog(true);
  };

  /**
   * Maneja la eliminación de un backup
   */
  const handleDeleteBackup = async () => {
    if (!selectedBackup) return;

    const success = await deleteBackup(selectedBackup.filename);

    if (success) {
      dispatch(
        showNotification({
          message: `Backup eliminado: ${selectedBackup.filename}`,
          severity: 'success',
        })
      );
      setShowDeleteDialog(false);
      setSelectedBackup(null);
      await refresh(); // Refrescar lista
    } else if (actionError) {
      dispatch(
        showNotification({
          message: `Error eliminando backup: ${actionError}`,
          severity: 'error',
        })
      );
    }
  };

  /**
   * Maneja la importación de un backup desde archivo
   */
  const handleImportBackup = async (file: File) => {
    const success = await restoreBackupFromFile(file);

    if (success) {
      dispatch(
        showNotification({
          message: `Backup importado y restaurado exitosamente: ${file.name}`,
          severity: 'success',
        })
      );
      setShowImportDialog(false);

      // Recargar la aplicación después de restore
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else if (actionError) {
      dispatch(
        showNotification({
          message: `Error importando backup: ${actionError}`,
          severity: 'error',
        })
      );
      setShowImportDialog(false);
    }
  };

  /**
   * Indica si hay alguna operación en progreso
   */
  const isOperationInProgress =
    isCreating || isDownloading || isRestoring || isDeleting;

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <StorageIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Backups del Sistema
          </Typography>
        </Box>

        <Box display="flex" gap={1}>
          <Tooltip title="Refrescar lista de backups">
            <IconButton
              onClick={refresh}
              disabled={isLoading || isOperationInProgress}
              color="primary"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<BackupIcon />}
            onClick={() => setShowCreateDialog(true)}
            disabled={isLoading || isOperationInProgress}
          >
            Crear Nuevo Backup
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<CloudUploadIcon />}
            onClick={() => setShowImportDialog(true)}
            disabled={isLoading || isOperationInProgress}
          >
            Importar Backup
          </Button>
        </Box>
      </Box>

      {/* Descripción */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Los backups son snapshots completos de la base de datos PostgreSQL.
          Puede crear, descargar, restaurar o eliminar backups desde esta
          sección.
          <strong>
            {' '}
            Importante: La restauración es una operación destructiva que
            reemplaza todos los datos actuales.
          </strong>
        </Typography>
      </Alert>

      {/* Error de lista */}
      {listError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error cargando backups: {listError}
        </Alert>
      )}

      {/* Error de acciones */}
      {actionError && !isOperationInProgress && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {actionError}
        </Alert>
      )}

      {/* Estadísticas */}
      {meta && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total de Backups
                </Typography>
                <Typography variant="h4">{meta.total}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Tamaño Total
                </Typography>
                <Typography variant="h4">{meta.totalSizeFormatted}</Typography>
              </CardContent>
            </Card>
          </Grid>

          {meta.newestBackup && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Backup Más Reciente
                  </Typography>
                  <Typography variant="body1" fontFamily="monospace">
                    {meta.newestBackup.filename}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {meta.newestBackup.sizeFormatted}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {meta.oldestBackup && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Backup Más Antiguo
                  </Typography>
                  <Typography variant="body1" fontFamily="monospace">
                    {meta.oldestBackup.filename}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {meta.oldestBackup.sizeFormatted}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Tabla de backups */}
      <BackupsTable
        backups={backups}
        isLoading={isLoading}
        onDownload={handleDownloadBackup}
        onRestore={handleRestoreClick}
        onDelete={handleDeleteClick}
        isOperationInProgress={isOperationInProgress}
      />

      {/* Diálogo: Crear Backup */}
      <CreateBackupDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onConfirm={handleCreateBackup}
        isLoading={isCreating}
      />

      {/* Diálogo: Restaurar Backup */}
      <RestoreConfirmDialog
        open={showRestoreDialog}
        onClose={() => {
          setShowRestoreDialog(false);
          setSelectedBackup(null);
        }}
        onConfirm={handleRestoreBackup}
        backup={selectedBackup}
        isLoading={isRestoring}
      />

      {/* Diálogo: Importar Backup */}
      <ImportBackupDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onConfirm={handleImportBackup}
        isLoading={isRestoring}
      />

      {/* Diálogo: Eliminar Backup */}
      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedBackup(null);
        }}
        onConfirm={handleDeleteBackup}
        title="Eliminar Backup"
        message="¿Está seguro que desea eliminar este backup?"
        itemName={selectedBackup?.filename || ''}
        loading={isDeleting}
      />
    </Box>
  );
}

export default BackupsPage;
