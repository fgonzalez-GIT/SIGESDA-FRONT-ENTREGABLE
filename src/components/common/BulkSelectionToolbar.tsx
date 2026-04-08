import { Toolbar, Typography, IconButton, Tooltip, Chip, Box } from '@mui/material';
import { Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';

interface BulkSelectionToolbarProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  maxSelection?: number;
}

/**
 * Toolbar para mostrar selección múltiple y botones de acción
 * Se muestra encima de las tablas cuando hay registros seleccionados
 * @see /SIGESDA-BACKEND/docs/API_BULK_DELETE.md
 */
export const BulkSelectionToolbar: React.FC<BulkSelectionToolbarProps> = ({
  selectedCount,
  onBulkDelete,
  onClearSelection,
  maxSelection = 100
}) => {
  const isOverLimit = selectedCount > maxSelection;

  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        bgcolor: (theme) =>
          isOverLimit
            ? theme.palette.error.light
            : theme.palette.primary.light,
        color: (theme) =>
          isOverLimit
            ? theme.palette.error.contrastText
            : theme.palette.primary.contrastText,
        borderRadius: 1,
        mb: 2,
      }}
    >
      <Box sx={{ flex: '1 1 100%' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            label={selectedCount}
            color={isOverLimit ? 'error' : 'primary'}
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
          <Typography variant="subtitle1" component="div">
            {selectedCount === 1 ? 'registro seleccionado' : 'registros seleccionados'}
          </Typography>
        </Box>
        {isOverLimit && (
          <Typography variant="caption" color="error.dark" display="block" sx={{ mt: 0.5 }}>
            ⚠ Máximo {maxSelection} registros permitidos. Deselecciona {selectedCount - maxSelection} registro(s).
          </Typography>
        )}
      </Box>

      <Tooltip title="Eliminar seleccionados">
        <span>
          <IconButton
            onClick={onBulkDelete}
            disabled={selectedCount === 0 || isOverLimit}
            color="inherit"
            aria-label="eliminar seleccionados"
          >
            <DeleteIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Limpiar selección">
        <IconButton onClick={onClearSelection} color="inherit" aria-label="limpiar selección">
          <CloseIcon />
        </IconButton>
      </Tooltip>
    </Toolbar>
  );
};
