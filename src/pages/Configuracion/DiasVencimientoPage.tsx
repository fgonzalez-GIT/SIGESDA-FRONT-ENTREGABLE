/**
 * Página de Configuración de Días de Vencimiento
 *
 * Permite configurar los días de vencimiento para:
 * - Cuotas mensuales de socios
 * - Pagos de actividades para no socios
 *
 * Esta configuración determina qué día del mes se consideran vencidos
 * los pagos generados en el sistema.
 */

import React from 'react';
import { Box, Alert, Typography, Paper } from '@mui/material';
import { CalendarToday } from '@mui/icons-material';
import { SeccionPaginaTitulo } from '@/components/common/SeccionPaginaTitulo';
import { DiasVencimientoConfig } from '@/components/configuracion';

/**
 * Página dedicada a la gestión de días de vencimiento
 */
const DiasVencimientoPage: React.FC = () => {
  return (
    <Box>
      {/* Header con breadcrumbs */}
      <SeccionPaginaTitulo
        titulo="Días de Vencimiento"
        subtitulo="Configura los días del mes en que vencen los pagos de cuotas y actividades"
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Configuración', href: '/configuracion' },
          { label: 'Días de Vencimiento' },
        ]}
      />

      {/* Información contextual */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>
          <strong>Importante:</strong> Los días de vencimiento establecidos aquí se aplicarán automáticamente
          a todos los recibos y pagos generados <strong>después</strong> de realizar el cambio.
        </Typography>
        <Typography variant="body2">
          Los recibos y pagos ya existentes mantendrán su fecha de vencimiento original.
          El rango permitido es de 1 a 28 para evitar problemas con meses de febrero.
        </Typography>
      </Alert>

      {/* Sección de ayuda */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <CalendarToday color="primary" />
          <Typography variant="subtitle1" fontWeight="bold">
            ¿Qué significan estos campos?
          </Typography>
        </Box>
        <Box component="ul" sx={{ m: 0, pl: 3 }}>
          <li>
            <Typography variant="body2">
              <strong>Día de Vencimiento de Cuota:</strong> Define qué día del mes vencen las cuotas
              mensuales para los SOCIOS del club.
            </Typography>
          </li>
          <li>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Día de Vencimiento de Pago de Actividad:</strong> Define qué día del mes vencen
              los pagos de actividades para NO_SOCIOS (personas que pagan por actividad).
            </Typography>
          </li>
        </Box>
      </Paper>

      {/* Componente de configuración */}
      <DiasVencimientoConfig />
    </Box>
  );
};

export default DiasVencimientoPage;
