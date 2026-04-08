import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import {
  School as SchoolIcon,
  AssistantPhoto as AssistantIcon,
  PersonAdd as InvitadoIcon,
  AdminPanelSettings as CoordinadorIcon,
} from '@mui/icons-material';
import { useCatalogosContext } from '../../providers/CatalogosProvider';
import { RolDocente } from '../../types/actividad.types';

interface RolDocenteSelectProps {
  value?: number;
  onChange: (rolId: number) => void;
  error?: string;
  required?: boolean;
  label?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  helperText?: string;
  showDescription?: boolean;
}

// Mapa de iconos según el código del rol
const getRolIcon = (codigo: string) => {
  switch (codigo) {
    case 'PROFESOR':
      return <SchoolIcon fontSize="small" />;
    case 'AYUDANTE':
      return <AssistantIcon fontSize="small" />;
    case 'INVITADO':
      return <InvitadoIcon fontSize="small" />;
    case 'COORDINADOR':
      return <CoordinadorIcon fontSize="small" />;
    default:
      return <SchoolIcon fontSize="small" />;
  }
};

// Mapa de colores para chips
const getRolColor = (codigo: string): "default" | "primary" | "secondary" | "success" | "info" | "warning" | "error" => {
  switch (codigo) {
    case 'PROFESOR':
      return 'primary';
    case 'AYUDANTE':
      return 'info';
    case 'INVITADO':
      return 'secondary';
    case 'COORDINADOR':
      return 'success';
    default:
      return 'default';
  }
};

export const RolDocenteSelect: React.FC<RolDocenteSelectProps> = ({
  value = undefined,
  onChange,
  error,
  required = false,
  label = 'Rol del Docente',
  disabled = false,
  fullWidth = true,
  helperText,
  showDescription = true,
}) => {
  const { catalogos, loading } = useCatalogosContext();

  const rolesDocentes = catalogos?.rolesDocentes || [];

  // Filtrar solo roles activos
  const rolesActivos = rolesDocentes.filter((rol) => rol.activo);

  // Ordenar por campo 'orden'
  const rolesOrdenados = [...rolesActivos].sort((a, b) => a.orden - b.orden);

  const handleChange = (event: any) => {
    onChange(event.target.value);
  };

  return (
    <FormControl
      fullWidth={fullWidth}
      error={!!error}
      disabled={disabled || loading}
      required={required}
    >
      <InputLabel>{label} {required && '*'}</InputLabel>
      <Select
        value={value || ''}
        onChange={handleChange}
        label={`${label} ${required ? '*' : ''}`}
        endAdornment={
          loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <CircularProgress size={20} />
            </Box>
          ) : null
        }
      >
        {/* Opción vacía si no es requerido */}
        {!required && (
          <MenuItem value="">
            <em>Sin rol asignado</em>
          </MenuItem>
        )}

        {/* Lista de roles */}
        {rolesOrdenados.length === 0 && !loading ? (
          <MenuItem value="" disabled>
            <em>No hay roles disponibles</em>
          </MenuItem>
        ) : (
          rolesOrdenados.map((rol) => (
            <MenuItem key={rol.id} value={rol.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                <Box sx={{ color: 'action.active' }}>
                  {getRolIcon(rol.codigo)}
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {rol.nombre}
                    </Typography>
                    <Chip
                      label={rol.codigo}
                      size="small"
                      color={getRolColor(rol.codigo)}
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  </Box>
                  {showDescription && rol.descripcion && (
                    <Typography variant="caption" color="text.secondary">
                      {rol.descripcion}
                    </Typography>
                  )}
                </Box>
              </Box>
            </MenuItem>
          ))
        )}
      </Select>
      {(error || helperText) && (
        <FormHelperText>{error || helperText}</FormHelperText>
      )}
    </FormControl>
  );
};

export default RolDocenteSelect;
