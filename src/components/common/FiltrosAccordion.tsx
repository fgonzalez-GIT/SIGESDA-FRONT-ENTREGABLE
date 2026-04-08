import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Button,
  Chip,
  Typography,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

export interface FiltrosAccordionProps {
  /**
   * Estado de expansión del accordion
   */
  expanded: boolean;

  /**
   * Callback cuando se expande/colapsa el accordion
   */
  onToggle: () => void;

  /**
   * Número de filtros activos (se muestra en un chip)
   */
  activeCount?: number;

  /**
   * Callback cuando se presiona el botón "Limpiar Filtros"
   */
  onClearFilters?: () => void;

  /**
   * Contenido del accordion (los filtros propiamente dichos)
   */
  children: React.ReactNode;

  /**
   * Texto personalizado para el título
   * @default "Filtros de Búsqueda"
   */
  title?: string;

  /**
   * Deshabilitar el accordion
   * @default false
   */
  disabled?: boolean;

  /**
   * Mostrar el botón "Limpiar Filtros"
   * @default true
   */
  showClearButton?: boolean;
}

/**
 * Componente accordion estandarizado para filtros de búsqueda.
 *
 * Proporciona una interfaz consistente para mostrar/ocultar filtros
 * con contador de filtros activos y botón para limpiar.
 *
 * @example
 * ```tsx
 * <FiltrosAccordion
 *   expanded={showFilters}
 *   onToggle={() => setShowFilters(!showFilters)}
 *   activeCount={2}
 *   onClearFilters={handleClearFilters}
 * >
 *   <Grid container spacing={2}>
 *     <Grid size={{ xs: 12, sm: 6 }}>
 *       <TextField label="Búsqueda" />
 *     </Grid>
 *   </Grid>
 * </FiltrosAccordion>
 * ```
 */
export const FiltrosAccordion: React.FC<FiltrosAccordionProps> = ({
  expanded,
  onToggle,
  activeCount = 0,
  onClearFilters,
  children,
  title = 'Filtros de Búsqueda',
  disabled = false,
  showClearButton = true,
}) => {
  const handleClearClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Evitar que se colapse el accordion
    if (onClearFilters) {
      onClearFilters();
    }
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={onToggle}
      disabled={disabled}
      sx={{ mb: 3 }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="filtros-content"
        id="filtros-header"
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          pr={2}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <FilterListIcon color="primary" />
            <Typography variant="h6">{title}</Typography>
            {activeCount > 0 && (
              <Chip
                label={activeCount}
                size="small"
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </Box>

          {showClearButton && activeCount > 0 && (
            <Box
              component="span"
              onClick={handleClearClick}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: 'error.main',
                cursor: 'pointer',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'background-color 0.2s',
                '&:hover': {
                  backgroundColor: 'error.lighter',
                },
              }}
            >
              <ClearIcon fontSize="small" />
              <Typography variant="button" fontSize="inherit" textTransform="none">
                Limpiar
              </Typography>
            </Box>
          )}
        </Box>
      </AccordionSummary>

      <AccordionDetails>
        <Box sx={{ pt: 1 }}>
          {children}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default FiltrosAccordion;
