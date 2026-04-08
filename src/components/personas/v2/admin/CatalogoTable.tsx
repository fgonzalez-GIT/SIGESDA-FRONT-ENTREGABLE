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
  Chip,
  Typography,
  Box,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

export interface CatalogoColumn<T> {
  id: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface CatalogoTableProps<T> {
  items: T[];
  columns: CatalogoColumn<T>[];
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onReorder?: (items: T[]) => void;
  loading?: boolean;
  emptyMessage?: string;
  showActions?: boolean;
  showDragHandle?: boolean;
}

/**
 * Tabla genérica y reutilizable para administración de catálogos
 * Soporta edición, eliminación y reordenamiento
 *
 * Optimizado con React.memo para evitar re-renders innecesarios
 */
function CatalogoTableComponent<T extends { id: number | string; activo?: boolean }>({
  items,
  columns,
  onView,
  onEdit,
  onDelete,
  onReorder,
  loading = false,
  emptyMessage = 'No hay elementos para mostrar',
  showActions = true,
  showDragHandle = false,
}: CatalogoTableProps<T>) {
  const handleView = (item: T) => {
    if (onView) {
      onView(item);
    }
  };

  const handleEdit = (item: T) => {
    if (onEdit) {
      onEdit(item);
    }
  };

  const handleDelete = (item: T) => {
    if (onDelete) {
      onDelete(item);
    }
  };

  const renderCellContent = (item: T, column: CatalogoColumn<T>) => {
    // Si hay render personalizado, usarlo
    if (column.render) {
      return column.render(item);
    }

    // Obtener el valor del campo
    const value = item[column.id as keyof T];

    // Si es el campo activo, renderizar como chip
    if (column.id === 'activo' && typeof value === 'boolean') {
      return (
        <Chip
          label={value ? 'Activo' : 'Inactivo'}
          color={value ? 'success' : 'default'}
          size="small"
        />
      );
    }

    // Renderizar el valor tal cual
    return value as React.ReactNode;
  };

  if (items.length === 0 && !loading) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {showDragHandle && (
              <TableCell width="50px" align="center">
                <DragIcon fontSize="small" />
              </TableCell>
            )}
            {columns.map((column) => (
              <TableCell
                key={String(column.id)}
                align={column.align || 'left'}
                sx={{ fontWeight: 600, width: column.width }}
              >
                {column.label}
              </TableCell>
            ))}
            {showActions && (
              <TableCell align="center" width="150px" sx={{ fontWeight: 600 }}>
                Acciones
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              hover
              sx={{
                '&:last-child td, &:last-child th': { border: 0 },
                opacity: item.activo === false ? 0.6 : 1,
              }}
            >
              {showDragHandle && (
                <TableCell align="center">
                  <IconButton size="small" sx={{ cursor: 'grab' }}>
                    <DragIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell key={String(column.id)} align={column.align || 'left'}>
                  {renderCellContent(item, column)}
                </TableCell>
              ))}
              {showActions && (
                <TableCell align="center">
                  <Box display="flex" gap={1} justifyContent="center">
                    {onView && (
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => handleView(item)}
                        title="Ver detalles"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    )}
                    {onEdit && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(item)}
                        title="Editar"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {onDelete && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(item)}
                        title="Eliminar"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// Exportar versión memoizada para evitar re-renders cuando el padre cambia estado no relacionado
export const CatalogoTable = React.memo(CatalogoTableComponent) as typeof CatalogoTableComponent;
