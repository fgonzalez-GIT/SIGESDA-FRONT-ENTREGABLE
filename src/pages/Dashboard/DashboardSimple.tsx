import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
} from '@mui/material';

const DashboardSimple: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Bienvenido al Sistema de Gestión de Socios y Actividades (SIGESDA)
      </Typography>

      <Stack spacing={3} sx={{ mt: 3 }}>
        <Box display="flex" gap={3} flexWrap="wrap">
          <Paper
            sx={{
              p: 3,
              minWidth: 250,
              flex: 1,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Total Socios
            </Typography>
            <Typography variant="h3">
              150
            </Typography>
          </Paper>

          <Paper
            sx={{
              p: 3,
              minWidth: 250,
              flex: 1,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Actividades Activas
            </Typography>
            <Typography variant="h3">
              8
            </Typography>
          </Paper>

          <Paper
            sx={{
              p: 3,
              minWidth: 250,
              flex: 1,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Docentes
            </Typography>
            <Typography variant="h3">
              12
            </Typography>
          </Paper>

          <Paper
            sx={{
              p: 3,
              minWidth: 250,
              flex: 1,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Estudiantes
            </Typography>
            <Typography variant="h3">
              85
            </Typography>
          </Paper>
        </Box>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Estado de Funcionalidades
          </Typography>
          <Stack spacing={2}>
            <Typography variant="body1" color="success.main">
              ✅ Gestión de Personas (Completado)
            </Typography>
            <Typography variant="body1" color="success.main">
              ✅ Gestión de Actividades (Completado)
            </Typography>
            <Typography variant="body1" color="success.main">
              ✅ Gestión de Aulas (Completado)
            </Typography>
            <Typography variant="body1" color="text.secondary">
              🔄 Dashboard Principal (En desarrollo)
            </Typography>
            <Typography variant="body1" color="text.secondary">
              ⏳ Gestión de Cuotas (Pendiente)
            </Typography>
            <Typography variant="body1" color="text.secondary">
              ⏳ Gestión de Recibos (Pendiente)
            </Typography>
            <Typography variant="body1" color="text.secondary">
              ⏳ Gestión de Medios de Pago (Pendiente)
            </Typography>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Estado del Sistema
          </Typography>
          <Typography variant="body1" color="success.main">
            ✅ Sistema operativo - Módulos de Personas, Actividades y Aulas funcionales
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            **FASE 2 - Semana 3 COMPLETADA**: Módulos Actividades y Aulas implementados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Próximo: Dashboard Principal con métricas (Semana 4)
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
};

export default DashboardSimple;