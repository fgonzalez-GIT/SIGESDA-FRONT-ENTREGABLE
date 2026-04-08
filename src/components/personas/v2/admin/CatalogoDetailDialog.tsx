import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

export interface CatalogoDetailField {
  label: string;
  render: (item: any) => React.ReactNode;
  span?: number; // Grid size (1-12), default 12
}

export interface CatalogoDetailDialogProps<T> {
  open: boolean;
  onClose: () => void;
  title: string;
  item: T | null;
  fields: CatalogoDetailField[];
  loading?: boolean;
}

/**
 * Diálogo genérico de solo lectura para visualizar detalles de catálogos
 * Muestra campos en formato Grid con renderizado personalizado
 */
export function CatalogoDetailDialog<T extends Record<string, any>>({
  open,
  onClose,
  title,
  item,
  fields,
  loading = false,
}: CatalogoDetailDialogProps<T>) {
  if (!item && !loading) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{title}</Typography>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {loading ? (
          <Box p={3} textAlign="center">
            <Typography color="text.secondary">Cargando...</Typography>
          </Box>
        ) : item ? (
          <Grid container spacing={2} sx={{ pt: 2 }}>
            {fields.map((field, index) => {
              const span = field.span || 12;
              const gridProps: any = { item: true, xs: span };
              return (
              <Grid {...gridProps} key={index}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}
                  >
                    {field.label}
                  </Typography>
                  <Typography variant="body2" component="div">
                    {field.render(item)}
                  </Typography>
                </Box>
              </Grid>
              );
            })}
          </Grid>
        ) : (
          <Box p={3} textAlign="center">
            <Typography color="text.secondary">No hay datos para mostrar</Typography>
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions>
        <Button onClick={onClose} startIcon={<CloseIcon />}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Helper para renderizar chips de estado activo/inactivo
 */
export const renderEstadoChip = (activo: boolean) => (
  <Chip
    label={activo ? 'Activo' : 'Inactivo'}
    color={activo ? 'success' : 'default'}
    size="small"
  />
);

/**
 * Helper para renderizar valores con fallback
 */
export const renderValueOrEmpty = (value: any, empty: string = '-') => {
  return value !== null && value !== undefined && value !== '' ? value : empty;
};

/**
 * Helper para renderizar fechas en formato legible
 */
export const renderFecha = (fecha: string | null | undefined) => {
  if (!fecha) return '-';
  try {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return fecha;
  }
};

/**
 * Helper para renderizar booleanos como Sí/No
 */
export const renderBoolean = (value: boolean) => {
  return value ? 'Sí' : 'No';
};
