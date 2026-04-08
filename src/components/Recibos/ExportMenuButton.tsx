import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Download,
  TableChart,
  Description,
  PictureAsPdf,
  FolderZip,
} from '@mui/icons-material';

export type ExportFormat = 'csv' | 'excel' | 'pdf-listado' | 'pdf-zip';

interface ExportMenuButtonProps {
  onExport: (format: ExportFormat) => void;
  disabled?: boolean;
  loading?: boolean;
}

export const ExportMenuButton: React.FC<ExportMenuButtonProps> = ({
  onExport,
  disabled = false,
  loading = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExport = (format: ExportFormat) => {
    handleClose();
    onExport(format);
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<Download />}
        onClick={handleClick}
        disabled={disabled || loading}
        aria-controls={open ? 'export-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        Exportar
      </Button>
      <Menu
        id="export-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'export-button',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleExport('csv')}>
          <ListItemIcon>
            <Description fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Exportar CSV"
            secondary="Archivo de texto separado por comas"
          />
        </MenuItem>
        <MenuItem onClick={() => handleExport('excel')}>
          <ListItemIcon>
            <TableChart fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Exportar Excel"
            secondary="Workbook con múltiples hojas"
          />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleExport('pdf-listado')}>
          <ListItemIcon>
            <PictureAsPdf fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="PDF Listado"
            secondary="Reporte unificado en PDF"
          />
        </MenuItem>
        <MenuItem onClick={() => handleExport('pdf-zip')}>
          <ListItemIcon>
            <FolderZip fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="PDFs Individuales (ZIP)"
            secondary="Recibos separados empaquetados"
          />
        </MenuItem>
      </Menu>
    </>
  );
};
