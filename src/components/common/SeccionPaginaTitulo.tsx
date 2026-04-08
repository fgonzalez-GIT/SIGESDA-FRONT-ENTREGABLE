import React from 'react';
import { Box, Typography, Breadcrumbs, Link, SxProps, Theme } from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';

export interface BreadcrumbItem {
  /**
   * Texto a mostrar
   */
  label: string;

  /**
   * URL de navegación (opcional, si no se provee es solo texto)
   */
  href?: string;

  /**
   * Callback al hacer clic (alternativa a href)
   */
  onClick?: () => void;
}

export interface SeccionPaginaTituloProps {
  /**
   * Título principal de la página
   */
  titulo: string;

  /**
   * Subtítulo opcional (descripción de la sección)
   */
  subtitulo?: string;

  /**
   * Breadcrumbs de navegación
   */
  breadcrumbs?: BreadcrumbItem[];

  /**
   * Acciones personalizadas (botones, etc.) que se muestran a la derecha
   */
  actions?: React.ReactNode;

  /**
   * Sx adicional para el contenedor principal
   */
  sx?: SxProps<Theme>;

  /**
   * Mostrar divider inferior
   * @default true
   */
  showDivider?: boolean;
}

/**
 * Componente header estandarizado para páginas.
 *
 * Proporciona un header consistente con título, subtítulo opcional,
 * breadcrumbs de navegación y área de acciones.
 *
 * @example
 * ```tsx
 * <SeccionPaginaTitulo
 *   titulo="Categorías de Socios"
 *   subtitulo="Gestión de categorías y cuotas asociadas"
 *   breadcrumbs={[
 *     { label: 'Inicio', href: '/' },
 *     { label: 'Categorías' }
 *   ]}
 *   actions={
 *     <Button variant="contained" startIcon={<Add />}>
 *       Nueva Categoría
 *     </Button>
 *   }
 * />
 * ```
 */
export const SeccionPaginaTitulo: React.FC<SeccionPaginaTituloProps> = ({
  titulo,
  subtitulo,
  breadcrumbs,
  actions,
  sx,
  showDivider = true,
}) => {
  return (
    <Box
      sx={{
        mb: 3,
        pb: showDivider ? 2 : 0,
        borderBottom: showDivider ? 1 : 0,
        borderColor: 'divider',
        ...sx,
      }}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
          sx={{ mb: 1 }}
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            if (isLast) {
              return (
                <Typography key={index} color="text.primary" variant="body2">
                  {crumb.label}
                </Typography>
              );
            }

            if (crumb.href) {
              return (
                <Link
                  key={index}
                  underline="hover"
                  color="inherit"
                  href={crumb.href}
                  sx={{ cursor: 'pointer' }}
                >
                  {crumb.label}
                </Link>
              );
            }

            if (crumb.onClick) {
              return (
                <Link
                  key={index}
                  underline="hover"
                  color="inherit"
                  onClick={crumb.onClick}
                  sx={{ cursor: 'pointer' }}
                >
                  {crumb.label}
                </Link>
              );
            }

            return (
              <Typography key={index} color="text.secondary" variant="body2">
                {crumb.label}
              </Typography>
            );
          })}
        </Breadcrumbs>
      )}

      {/* Header principal con título y acciones */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        flexWrap="wrap"
        gap={2}
      >
        <Box flex={1}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom={!!subtitulo}
            sx={{ fontWeight: 600 }}
          >
            {titulo}
          </Typography>
          {subtitulo && (
            <Typography variant="body1" color="text.secondary">
              {subtitulo}
            </Typography>
          )}
        </Box>

        {/* Acciones (botones, etc.) */}
        {actions && (
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            sx={{
              flexShrink: 0,
            }}
          >
            {actions}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SeccionPaginaTitulo;
