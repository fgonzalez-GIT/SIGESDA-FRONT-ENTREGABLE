import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { BlockOutlined, ArrowBack, Home } from '@mui/icons-material';
import { useAppSelector } from '@/hooks/redux';
import { selectUser } from '@/store/slices/authSlice';
import { getRoleLabel } from '@/utils/auth.utils';

/**
 * Página 403 - No Autorizado
 * Se muestra cuando un usuario intenta acceder a una ruta para la que no tiene permisos
 */
export const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={6}
          sx={{
            p: 6,
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          {/* Icon */}
          <BlockOutlined
            sx={{
              fontSize: 100,
              color: 'error.main',
              mb: 3,
            }}
          />

          {/* Error Code */}
          <Typography variant="h1" component="h1" gutterBottom fontWeight="bold" color="error.main">
            403
          </Typography>

          {/* Title */}
          <Typography variant="h4" component="h2" gutterBottom fontWeight="medium">
            Acceso Denegado
          </Typography>

          {/* Description */}
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            No tienes permisos para acceder a esta página.
          </Typography>

          {user && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Tu rol actual es: <strong>{getRoleLabel(user.rol)}</strong>
            </Typography>
          )}

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
            >
              Volver
            </Button>
            <Button
              variant="contained"
              startIcon={<Home />}
              onClick={() => navigate('/dashboard')}
            >
              Ir al Inicio
            </Button>
          </Box>

          {/* Additional Info */}
          <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              Si crees que esto es un error, contacta al administrador del sistema.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
